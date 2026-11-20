// =====================================================================
// Compra sin cuenta previa (Black Friday, 20-11-2026).
// Quien llega del anuncio paga primero en Stripe y la cuenta del portal se
// crea con el correo que puso en el pago. La usan:
// - stripe-webhook (checkout.session.completed) para enlazar la suscripción;
// - create-checkout (accion 'acceso-compra') para dejarle dentro al volver.
// Las dos pueden llegar a la vez: createUser falla si el otro ya lo creó y
// entonces se vuelve a buscar. La marca `alta_por_compra` (id de la sesión de
// Stripe) dice si la cuenta nació de ESTE pago: solo así se entra sin
// contraseña. Si el correo ya tenía cuenta, entra con su contraseña.
// =====================================================================

export interface DatosCompra {
  email: string;
  nombre?: string | null;
  cif?: string | null;
  sessionId: string;
}

function escaparIlike(s: string) {
  return s.replace(/[\\%_]/g, (c) => '\\' + c);
}

async function buscarPorEmail(admin: any, email: string): Promise<string | null> {
  const { data } = await admin
    .from('profiles')
    .select('id')
    .ilike('email', escaparIlike(email))
    .limit(1);
  return (data?.[0]?.id as string | undefined) ?? null;
}

export async function asegurarUsuarioCompra(
  admin: any,
  d: DatosCompra,
): Promise<{ userId: string; creado: boolean }> {
  const email = d.email.trim().toLowerCase();
  const existente = await buscarPorEmail(admin, email);
  if (existente) return { userId: existente, creado: false };

  const { data, error } = await admin.auth.admin.createUser({
    email,
    // Pagar con ese correo vale como confirmación: no se le hace confirmar
    // nada antes de entrar. handle_new_user crea el perfil y manda la
    // bienvenida al venir ya confirmado.
    email_confirm: true,
    user_metadata: {
      ...(d.nombre ? { full_name: d.nombre } : {}),
      ...(d.cif ? { cif: d.cif } : {}),
      alta_por_compra: d.sessionId,
      utm_campaign: 'bf-plus-2026',
      landing_page: '/black-friday',
    },
  });
  if (data?.user?.id) return { userId: data.user.id, creado: true };

  // Carrera con la otra función: ya existe.
  const tras = await buscarPorEmail(admin, email);
  if (tras) return { userId: tras, creado: false };
  throw new Error(`createUser failed for compra ${d.sessionId}: ${error?.message ?? 'sin usuario'}`);
}

export async function nacioDeEstaCompra(admin: any, userId: string, sessionId: string) {
  const { data } = await admin.auth.admin.getUserById(userId);
  return data?.user?.user_metadata?.alta_por_compra === sessionId;
}
