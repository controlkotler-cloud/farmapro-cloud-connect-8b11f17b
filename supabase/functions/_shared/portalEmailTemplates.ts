// =====================================================================
// Registry de plantillas de email transaccional del portal farmapro.
// Cada plantilla devuelve { subject, html, text }. Sin dependencias de
// React: templates literales para máxima estabilidad en edge-runtime.
//
// Marca:
//  - "farmapro" siempre en minúsculas.
//  - Castellano de España (vosotros). Sin emojis.
//  - Firma: "El equipo de farmapro".
//  - Footer legal RGPD: responsable Mkpro Kotler SL.
//  - Estilos inline sobre fondo blanco. Verde canónico #88C835 solo en CTA.
// =====================================================================

export type PortalTemplateName =
  | 'bienvenida'
  | 'fin-prueba'
  | 'past-due'
  | 'equipo-invitacion'
  | 'equipo-plaza-activada'
  | 'rebotica-premio-ganado'
  | 'rebotica-premio-caduca'
  | 'rebotica-baul-ganador'
  | 'rebotica-gordo-ganador'
  | 'rebotica-aviso-calendario-interno';

export interface PortalTemplateData {
  // Comunes
  nombre?: string;
  // fin-prueba
  aviso?: 'primero' | 'ultimo';
  diasRestantes?: number;
  // equipo-invitacion
  invitadoPor?: string;
  inviteUrl?: string;
  caducidadDias?: number;
  // equipo-plaza-activada
  miembroNombre?: string;
  miembroEmail?: string;
  plazasOcupadas?: number;
  plazasTotal?: number;
  // rebotica-premio-ganado / caduca
  premioTitulo?: string;
  premioDescripcion?: string;
  esPartner?: boolean;
  expiresAt?: string;   // ISO
  horasRestantes?: number;
  canjeUrl?: string;
  // rebotica-baul-ganador
  mes?: string;
  temporada?: string;
  // rebotica-aviso-calendario-interno
  tipoSorteo?: 'baul' | 'gordo';
  ganadorEmail?: string;
  ganadorNombre?: string;
  ganadorFarmacia?: string;
  periodo?: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const APP_URL = Deno.env.get('APP_URL') ?? 'https://portal.farmapro.es';

// --------------------------------------------------------------------- layout

function layout(opts: { previewText: string; bodyHtml: string; hideFooter?: boolean }): string {
  const footer = opts.hideFooter
    ? ''
    : `<tr>
              <td style="padding:20px 32px 28px 32px;border-top:1px solid #ecebe6;font-size:11px;line-height:1.5;color:#6b6f68;">
                Este correo se envía en relación con tu cuenta en el portal farmapro. Responsable del tratamiento: <strong>Mkpro Kotler SL</strong> (B99554446), somos@farmapro.es. Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, portabilidad y limitación escribiendo a esa dirección. Más información en <a href="${APP_URL}/legal" style="color:#3a5f16;text-decoration:underline;">${APP_URL}/legal</a>.
              </td>
            </tr>`;
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>farmapro</title>
  </head>
  <body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Manrope,Arial,sans-serif;color:#1a1f1a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.previewText)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #ecebe6;border-radius:12px;">
            <tr>
              <td style="padding:28px 32px 8px 32px;">
                <div style="font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#1a1f1a;">farmapro</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 28px 32px;font-size:15px;line-height:1.55;color:#1a1f1a;">
                ${opts.bodyHtml}
                <p style="margin:28px 0 0 0;font-size:14px;color:#1a1f1a;">
                  Un saludo,<br/>
                  El equipo de farmapro
                </p>
              </td>
            </tr>
            ${footer}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<p style="margin:24px 0;">
    <a href="${href}" style="display:inline-block;background:#3a5f16;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:999px;">${escapeHtml(label)}</a>
  </p>`;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function textFooter(): string {
  return `\n\nUn saludo,\nEl equipo de farmapro\n\n--\nResponsable del tratamiento: Mkpro Kotler SL. Contacto: somos@farmapro.es. Más información: ${APP_URL}/legal`;
}

function fmtFecha(iso?: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

// --------------------------------------------------------------------- render

export function renderPortalTemplate(
  name: PortalTemplateName,
  data: PortalTemplateData = {},
): RenderedEmail {
  const nombre = (data.nombre ?? '').trim();
  const saludo = nombre ? `Hola ${escapeHtml(nombre)},` : 'Hola,';

  switch (name) {
    case 'bienvenida': {
      const subject = 'Bienvenido/a al portal farmapro';
      const html = layout({
        previewText: 'Tu cuenta ya está lista. Estos son tus primeros pasos.',
        bodyHtml: `
          <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Bienvenido/a a farmapro</h1>
          <p style="margin:0 0 12px 0;">${saludo}</p>
          <p style="margin:0 0 12px 0;">Tu cuenta ya está activa. Durante los próximos 30 días tienes acceso a formación, recursos, comunidad, IAFarma y la Rebotica para ver cómo trabajamos.</p>
          <p style="margin:0 0 12px 0;">Para arrancar bien te recomendamos:</p>
          <ul style="margin:0 0 12px 20px;padding:0;">
            <li>Completa tu perfil y añade los datos de tu farmacia.</li>
            <li>Elige el primer curso o recurso que te resuelva algo hoy.</li>
            <li>Preséntate en la comunidad si te apetece.</li>
          </ul>
          ${ctaButton(`${APP_URL}/dashboard`, 'Entrar en el portal')}
          <p style="margin:16px 0 0 0;font-size:13px;color:#6b6f68;">Si tienes cualquier duda, respóndenos a este mismo correo.</p>
        `,
      });
      const text = `${saludo}\n\nTu cuenta en el portal farmapro ya está activa. Durante los próximos 30 días tienes acceso a formación, recursos, comunidad, IAFarma y la Rebotica para ver cómo trabajamos.\n\nPara arrancar bien te recomendamos:\n- Completa tu perfil y añade los datos de tu farmacia.\n- Elige el primer curso o recurso que te resuelva algo hoy.\n- Preséntate en la comunidad si te apetece.\n\nEntra en el portal: ${APP_URL}/dashboard\n\nSi tienes cualquier duda, respóndenos a este mismo correo.${textFooter()}`;
      return { subject, html, text };
    }

    case 'fin-prueba': {
      const esUltimo = data.aviso === 'ultimo';
      const dias = data.diasRestantes ?? (esUltimo ? 2 : 7);
      const subject = esUltimo
        ? 'Tu prueba del portal farmapro termina en 2 días'
        : 'A tu prueba del portal farmapro le quedan una semana';
      const html = layout({
        previewText: esUltimo
          ? 'Último aviso antes de que se bloquee el acceso.'
          : 'Aún estás a tiempo de decidir cómo continuar.',
        bodyHtml: `
          <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;letter-spacing:-0.02em;">${esUltimo ? 'Último aviso: tu prueba termina en breve' : 'Tu prueba se acerca al final'}</h1>
          <p style="margin:0 0 12px 0;">${saludo}</p>
          <p style="margin:0 0 12px 0;">${esUltimo
            ? `En unos ${dias} días tu periodo de prueba llegará al final. Pasada esa fecha seguirás pudiendo ver el catálogo, pero el contenido quedará bloqueado hasta que actives un plan.`
            : `A tu periodo de prueba en el portal farmapro le quedan aproximadamente ${dias} días. Es buen momento para decidir cómo quieres continuar.`}
          </p>
          <p style="margin:0 0 12px 0;">Puedes elegir entre el plan Plus (para ti) o el plan Equipo (para toda la farmacia, hasta 10 personas), con precio fundador mientras queden plazas.</p>
          ${ctaButton(`${APP_URL}/precios`, 'Ver planes y activar')}
          <p style="margin:16px 0 0 0;font-size:13px;color:#6b6f68;">Si prefieres seguir con la cuenta gratuita, no tienes que hacer nada.</p>
        `,
      });
      const text = `${saludo}\n\n${esUltimo
        ? `En unos ${dias} días tu periodo de prueba en el portal farmapro llegará al final. Pasada esa fecha seguirás pudiendo ver el catálogo, pero el contenido quedará bloqueado hasta que actives un plan.`
        : `A tu periodo de prueba en el portal farmapro le quedan aproximadamente ${dias} días. Es buen momento para decidir cómo quieres continuar.`}\n\nPuedes elegir entre el plan Plus (para ti) o el plan Equipo (hasta 10 personas), con precio fundador mientras queden plazas.\n\nVer planes: ${APP_URL}/precios\n\nSi prefieres seguir con la cuenta gratuita, no tienes que hacer nada.${textFooter()}`;
      return { subject, html, text };
    }

    case 'past-due': {
      const subject = 'No hemos podido cobrar tu suscripción al portal farmapro';
      const html = layout({
        previewText: 'Actualiza tu método de pago para no perder el acceso.',
        bodyHtml: `
          <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Problema con tu pago</h1>
          <p style="margin:0 0 12px 0;">${saludo}</p>
          <p style="margin:0 0 12px 0;">Hemos intentado cobrar tu suscripción al portal farmapro y el cargo no ha llegado a buen puerto. Puede ser una caducidad de tarjeta, un límite del banco o un rechazo puntual.</p>
          <p style="margin:0 0 12px 0;">Para no perder el acceso, actualiza tu método de pago desde tu perfil. El intento se repetirá automáticamente en cuanto la tarjeta esté al día.</p>
          ${ctaButton(`${APP_URL}/perfil?tab=facturacion`, 'Actualizar método de pago')}
          <p style="margin:16px 0 0 0;font-size:13px;color:#6b6f68;">Si crees que se trata de un error o necesitas una factura, respóndenos a este correo.</p>
        `,
      });
      const text = `${saludo}\n\nHemos intentado cobrar tu suscripción al portal farmapro y el cargo no ha llegado a buen puerto. Puede ser una caducidad de tarjeta, un límite del banco o un rechazo puntual.\n\nPara no perder el acceso, actualiza tu método de pago desde tu perfil. El intento se repetirá automáticamente en cuanto la tarjeta esté al día.\n\nActualizar método de pago: ${APP_URL}/perfil?tab=facturacion\n\nSi crees que se trata de un error o necesitas una factura, respóndenos a este correo.${textFooter()}`;
      return { subject, html, text };
    }

    case 'equipo-invitacion': {
      const invitadoPor = (data.invitadoPor ?? '').trim() || 'Tu farmacia';
      const url = data.inviteUrl ?? `${APP_URL}/invitation`;
      const caducidad = data.caducidadDias ?? 14;
      const subject = `${invitadoPor} te invita al portal farmapro`;
      const html = layout({
        previewText: `${invitadoPor} te ha reservado una plaza en el portal farmapro.`,
        bodyHtml: `
          <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Tienes una plaza en el portal farmapro</h1>
          <p style="margin:0 0 12px 0;">Hola,</p>
          <p style="margin:0 0 12px 0;"><strong>${escapeHtml(invitadoPor)}</strong> te ha reservado una plaza en el portal farmapro para formarte junto al resto de tu equipo.</p>
          <p style="margin:0 0 12px 0;">Para activarla, crea tu cuenta con <strong>este mismo email</strong> desde el enlace de abajo. La invitación caduca en ${caducidad} días.</p>
          ${ctaButton(url, 'Activar mi plaza')}
          <p style="margin:16px 0 0 0;font-size:13px;color:#6b6f68;">Si el botón no funciona, copia y pega esta dirección en tu navegador:<br/><span style="word-break:break-all;color:#3a5f16;">${escapeHtml(url)}</span></p>
          <p style="margin:20px 0 0 0;padding:12px 14px;background:#f6f4ec;border:1px solid #ecebe6;border-radius:8px;font-size:13px;color:#3a3f3a;">
            <strong>Transparencia:</strong> al unirte, el titular verá tu progreso formativo (cursos y evaluaciones) y tu última actividad en el portal. Tu actividad en la comunidad, IAFarma y la Rebotica es privada.
          </p>
        `,
      });
      const text = `Hola,\n\n${invitadoPor} te ha reservado una plaza en el portal farmapro para formarte junto al resto de tu equipo.\n\nPara activarla, crea tu cuenta con ESTE MISMO email desde el enlace de abajo. La invitación caduca en ${caducidad} días.\n\n${url}\n\nTransparencia: al unirte, el titular verá tu progreso formativo (cursos y evaluaciones) y tu última actividad en el portal. Tu actividad en la comunidad, IAFarma y la Rebotica es privada.${textFooter()}`;
      return { subject, html, text };
    }

    case 'equipo-plaza-activada': {
      const miembro = (data.miembroNombre ?? '').trim() || (data.miembroEmail ?? '').trim() || 'Un miembro de tu equipo';
      const ocupadas = data.plazasOcupadas ?? 0;
      const total = data.plazasTotal ?? 10;
      const subject = `${miembro} ha activado su plaza en el portal farmapro`;
      const html = layout({
        previewText: `${miembro} se ha unido a tu equipo. ${ocupadas} de ${total} personas.`,
        bodyHtml: `
          <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Nueva plaza activada</h1>
          <p style="margin:0 0 12px 0;">${saludo}</p>
          <p style="margin:0 0 12px 0;"><strong>${escapeHtml(miembro)}</strong> ha activado su plaza y ya forma parte de tu equipo en el portal farmapro.</p>
          <p style="margin:0 0 12px 0;">Ahora mismo tienes <strong>${ocupadas} de ${total}</strong> personas en tu equipo.</p>
          ${ctaButton(`${APP_URL}/perfil?tab=equipo`, 'Ver mi equipo')}
        `,
      });
      const text = `${saludo}\n\n${miembro} ha activado su plaza y ya forma parte de tu equipo en el portal farmapro.\n\nAhora mismo tienes ${ocupadas} de ${total} personas en tu equipo.\n\nVer mi equipo: ${APP_URL}/perfil?tab=equipo${textFooter()}`;
      return { subject, html, text };
    }

    case 'rebotica-premio-ganado': {
      const titulo = (data.premioTitulo ?? '').trim() || 'tu premio de la Rebotica';
      const descripcion = (data.premioDescripcion ?? '').trim();
      const url = data.canjeUrl ?? `${APP_URL}/rebotica`;
      const caducaTxt = fmtFecha(data.expiresAt);
      const subject = `Has ganado ${titulo} en la Rebotica`;
      const html = layout({
        previewText: `${titulo} — instrucciones de canje dentro.`,
        bodyHtml: `
          <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Has ganado un premio en la Rebotica</h1>
          <p style="margin:0 0 12px 0;">${saludo}</p>
          <p style="margin:0 0 12px 0;">Al abrir tu cajón te ha tocado: <strong>${escapeHtml(titulo)}</strong>.</p>
          ${descripcion ? `<p style="margin:0 0 12px 0;">${escapeHtml(descripcion)}</p>` : ''}
          ${caducaTxt ? `<p style="margin:0 0 12px 0;">Podrás canjearlo hasta el <strong>${escapeHtml(caducaTxt)}</strong>.</p>` : ''}
          ${ctaButton(url, 'Ir a mi premio')}
          <p style="margin:16px 0 0 0;font-size:13px;color:#6b6f68;">Si el enlace no funciona, entra en el portal y abre la sección Rebotica desde el menú.</p>
        `,
      });
      const text = `${saludo}\n\nAl abrir tu cajón en la Rebotica te ha tocado: ${titulo}.\n${descripcion ? descripcion + '\n' : ''}${caducaTxt ? `Podrás canjearlo hasta el ${caducaTxt}.\n` : ''}\nIr a tu premio: ${url}${textFooter()}`;
      return { subject, html, text };
    }

    case 'rebotica-premio-caduca': {
      const titulo = (data.premioTitulo ?? '').trim() || 'tu premio de la Rebotica';
      const url = data.canjeUrl ?? `${APP_URL}/rebotica`;
      const horas = data.horasRestantes ?? 48;
      const subject = `Tu premio en la Rebotica caduca pronto`;
      const html = layout({
        previewText: `Te quedan menos de ${horas} horas para canjear ${titulo}.`,
        bodyHtml: `
          <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Aún puedes canjear tu premio</h1>
          <p style="margin:0 0 12px 0;">${saludo}</p>
          <p style="margin:0 0 12px 0;">Te quedan menos de <strong>${horas} horas</strong> para canjear <strong>${escapeHtml(titulo)}</strong> antes de que caduque.</p>
          ${ctaButton(url, 'Canjear ahora')}
        `,
      });
      const text = `${saludo}\n\nTe quedan menos de ${horas} horas para canjear ${titulo} antes de que caduque.\n\nCanjear ahora: ${url}${textFooter()}`;
      return { subject, html, text };
    }

    case 'rebotica-baul-ganador': {
      const mes = (data.mes ?? '').trim();
      const subject = 'Has ganado El Baúl de la Rebotica';
      const html = layout({
        previewText: 'El Baúl es tuyo. Necesitamos la dirección de envío de la farmacia.',
        bodyHtml: `
          <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Enhorabuena: te ha tocado El Baúl</h1>
          <p style="margin:0 0 12px 0;">${saludo}</p>
          <p style="margin:0 0 12px 0;">El Baúl de la Rebotica${mes ? ` de ${escapeHtml(mes)}` : ''} es una caja que preparamos con productos y sorpresas seleccionadas para tu farmacia. No sabrás qué lleva hasta que la abras.</p>
          <p style="margin:0 0 12px 0;">Para enviártelo, <strong>respóndenos a este correo</strong> con la dirección de envío de la farmacia (nombre de la farmacia, calle, código postal, ciudad y persona de contacto).</p>
          <p style="margin:16px 0 0 0;font-size:13px;color:#6b6f68;">En cuanto tengamos la dirección, te confirmamos fecha de envío.</p>
        `,
      });
      const text = `${saludo}\n\nHas ganado El Baúl de la Rebotica${mes ? ` de ${mes}` : ''}: una caja que preparamos con productos y sorpresas seleccionadas para tu farmacia.\n\nPara enviártelo, responde a este correo con la dirección de envío de la farmacia (nombre de la farmacia, calle, código postal, ciudad y persona de contacto).\n\nEn cuanto tengamos la dirección, te confirmamos fecha de envío.${textFooter()}`;
      return { subject, html, text };
    }

    case 'rebotica-gordo-ganador': {
      // Tono sobrio, SIN detalles ni asunto revelador.
      const subject = 'Enhorabuena, tenemos algo que contarte';
      const html = layout({
        previewText: 'Nos gustaría llamarte para explicártelo en persona.',
        bodyHtml: `
          <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Enhorabuena</h1>
          <p style="margin:0 0 12px 0;">${saludo}</p>
          <p style="margin:0 0 12px 0;">Has ganado el premio grande de la temporada de la Rebotica.</p>
          <p style="margin:0 0 12px 0;">Alejandro (director de farmapro) tiene que llamarte para explicártelo en persona. Respóndenos a este correo con:</p>
          <ul style="margin:0 0 12px 20px;padding:0;">
            <li>Un número de móvil de contacto.</li>
            <li>La franja horaria en la que te va bien recibir la llamada.</li>
          </ul>
          <p style="margin:16px 0 0 0;font-size:13px;color:#6b6f68;">No guardamos tu teléfono en el portal: lo usamos únicamente para esta llamada.</p>
        `,
      });
      const text = `${saludo}\n\nHas ganado el premio grande de la temporada de la Rebotica.\n\nAlejandro (director de farmapro) tiene que llamarte para explicártelo en persona. Respóndenos a este correo con:\n- Un número de móvil de contacto.\n- La franja horaria en la que te va bien recibir la llamada.\n\nNo guardamos tu teléfono en el portal: lo usamos únicamente para esta llamada.${textFooter()}`;
      return { subject, html, text };
    }

    case 'rebotica-aviso-calendario-interno': {
      // Aviso interno para alejandro@mkpro.es (cc: control@mkpro.es). Sin footer legal RGPD ni baja.
      const tipo = data.tipoSorteo === 'gordo' ? 'EL GORDO' : 'EL BAÚL';
      const email = (data.ganadorEmail ?? '').trim();
      const nombre = (data.ganadorNombre ?? '').trim() || '(sin nombre)';
      const farmacia = (data.ganadorFarmacia ?? '').trim() || '(sin farmacia)';
      const temporada = (data.temporada ?? '').trim();
      const periodo = (data.periodo ?? '').trim();
      const premio = (data.premioTitulo ?? '').trim() || '(sin detallar)';
      const subject = `[Rebotica] Adjudicado ${tipo} — ${email || nombre}`;
      const html = layout({
        hideFooter: true,
        previewText: `Adjudicado ${tipo} a ${email || nombre}.`,
        bodyHtml: `
          <h1 style="margin:0 0 16px 0;font-size:20px;font-weight:700;letter-spacing:-0.02em;">Adjudicado ${tipo}</h1>
          <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:4px 12px 4px 0;color:#6b6f68;">Ganador</td><td style="padding:4px 0;"><strong>${escapeHtml(nombre)}</strong></td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#6b6f68;">Email</td><td style="padding:4px 0;">${escapeHtml(email)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#6b6f68;">Farmacia</td><td style="padding:4px 0;">${escapeHtml(farmacia)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#6b6f68;">Temporada</td><td style="padding:4px 0;">${escapeHtml(temporada)}</td></tr>
            ${periodo ? `<tr><td style="padding:4px 12px 4px 0;color:#6b6f68;">Periodo</td><td style="padding:4px 0;">${escapeHtml(periodo)}</td></tr>` : ''}
            <tr><td style="padding:4px 12px 4px 0;color:#6b6f68;">Premio</td><td style="padding:4px 0;">${escapeHtml(premio)}</td></tr>
          </table>
          <p style="margin:20px 0 0 0;font-size:13px;color:#6b6f68;">Aviso interno automático — no se envía enlace de baja.</p>
        `,
      });
      const text = `Adjudicado ${tipo}\n\nGanador: ${nombre}\nEmail: ${email}\nFarmacia: ${farmacia}\nTemporada: ${temporada}${periodo ? '\nPeriodo: ' + periodo : ''}\nPremio: ${premio}\n\nAviso interno automático.`;
      return { subject, html, text };
    }
  }
}
