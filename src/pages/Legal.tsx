import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/** Fecha de última actualización de los 4 textos legales del portal. Súbela si cambias contenido. */
const ULTIMA_ACTUALIZACION = '16 de julio de 2026';

const linkCls = 'font-medium text-foreground underline underline-offset-2 hover:text-primary';

// ---------------------------------------------------------------------------
// Chrome compartido: página PÚBLICA sin sidebar, mismo patrón que
// ReboticaBasesLegales (cabecera con vuelta + logo, funciona sin login).
// ---------------------------------------------------------------------------
interface LegalShellProps {
  title: string;
  intro?: string;
  children: React.ReactNode;
}

const LegalShell = ({ title, intro, children }: LegalShellProps) => (
  <div className="min-h-screen bg-background">
    <header className="border-b bg-white/70 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
        <img src="/logo-farmapro.svg" alt="farmapro" className="h-6" />
      </div>
    </header>

    <div className="container mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
      {intro && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{intro}</p>}

      <div className="mt-8">{children}</div>

      <p className="mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Última actualización: {ULTIMA_ACTUALIZACION}
      </p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Bloques tipográficos reutilizables. El portal no tiene activo el plugin
// @tailwindcss/typography (no está en tailwind.config.ts), así que en vez de
// `prose` se estilan h2/h3/p/ul explícitamente con los tokens del canon
// (text-foreground / text-muted-foreground, sin colores crudos).
// ---------------------------------------------------------------------------
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-8 text-lg font-semibold text-foreground first:mt-0">{children}</h2>
);
const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mt-5 text-base font-semibold text-foreground">{children}</h3>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</p>
);
const Ul = ({ children }: { children: React.ReactNode }) => (
  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">{children}</ul>
);

// ---------------------------------------------------------------------------
// Aviso legal — casi calcado del de farmapro-direct (misma empresa, mismos
// datos registrales), cambiando el sitio (portal.farmapro.es) y el objeto
// (portal de formación y comunidad con suscripciones).
// ---------------------------------------------------------------------------
export const AvisoLegal = () => (
  <LegalShell
    title="Aviso legal"
    intro="El presente Aviso Legal regula el acceso, la navegación y el uso de portal.farmapro.es (en adelante, el «Portal»), el portal de formación y comunidad con suscripciones de farmapro dirigido a profesionales del sector farmacéutico."
  >
    <H2>1. Derecho de la información</H2>
    <P>
      En cumplimiento con el deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de
      julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico, le informamos que el
      Portal es titularidad de la sociedad <strong className="font-semibold text-foreground">Mkpro Kotler SL</strong>,
      sociedad mercantil constituida de acuerdo con la legislación española, provista con CIF B99554446, con
      domicilio en C/ Ibón de Astún 17, 50011 Zaragoza, e inscrita en el R.M. de Zaragoza – 19/08/2019 – Libro
      4423 – Folio 67 – Hoja Z-65918 (en adelante, «LA EMPRESA»).
    </P>
    <P>
      Puede ponerse en contacto con nosotros en la dirección de correo electrónico{' '}
      <a href="mailto:entra@farmapro.es" className={linkCls}>entra@farmapro.es</a> o, si lo prefiere, a través
      del teléfono <a href="tel:+34655769731" className={linkCls}>+34 655 769 731</a>.
    </P>

    <H2>2. Usuarios</H2>
    <P>
      El acceso y/o uso al Portal le atribuye la condición de Usuario, y acepta, desde dicho acceso y/o uso, el
      presente Aviso Legal y, en su caso, los cambios efectuados en el mismo. El acceso a determinados
      contenidos y funcionalidades del Portal (formación, recursos, comunidad, retos, empleo, IAFarma y demás
      módulos) requiere registro previo y, en su caso, una suscripción de pago activa.
    </P>
    <P>
      El acceso a los planes de pago del Portal se contrata y se cobra a través de Stripe. Las condiciones de
      cada plan (precio, periodicidad y funcionalidades incluidas) se muestran en la página de precios del
      Portal en el momento de la contratación.
    </P>

    <H2>3. Uso del Portal por parte de los usuarios</H2>
    <P>
      El Portal puede proporcionar acceso a cursos, recursos descargables, foros de comunidad, retos,
      contenido generado con inteligencia artificial (IAFarma) y demás textos, gráficos, diseños, códigos,
      software, fotografías, vídeos, bases de datos, imágenes e informaciones (en adelante, «Contenidos»)
      pertenecientes a LA EMPRESA o a terceros a los que el Usuario puede tener acceso.
    </P>
    <P>
      El Usuario asume la responsabilidad del uso del Portal. Dicha responsabilidad se extiende al registro
      que, en su caso, sea necesario para acceder a los Contenidos del Portal.
    </P>
    <P>
      El Usuario se compromete a hacer un uso adecuado de los Contenidos ofrecidos a través del Portal y, con
      carácter enunciativo pero no limitativo, a no emplearlos para (i) incurrir en actividades ilícitas,
      ilegales o contrarias a la buena fe y al orden público; (ii) provocar daños en los sistemas físicos y
      lógicos del titular del Portal, de sus proveedores o de terceras personas; (iii) introducir o difundir
      en la red virus informáticos o cualesquiera otros sistemas físicos o lógicos que sean susceptibles de
      provocar los daños anteriormente mencionados.
    </P>

    <H2>4. Propiedad intelectual del Portal</H2>
    <P>
      Todos los derechos sobre el Contenido, diseño y código fuente de este Portal y, en especial, con
      carácter enunciativo pero no limitativo, todos los derechos sobre los cursos y materiales formativos,
      fotografías, imágenes, textos, logotipos, diseños, marcas, nombres comerciales, datos que se incluyen en
      el Portal y cualesquiera otros derechos de propiedad intelectual e industrial son titularidad de LA
      EMPRESA, o bien de terceros que han autorizado expresamente a LA EMPRESA para la utilización de los
      mismos en su Portal.
    </P>
    <P>
      Por ello, y en virtud de lo dispuesto en el Real Decreto Legislativo 1/1996, de 12 de abril, por el que
      se aprueba el texto refundido de la Ley de Propiedad Intelectual, así como en la Ley 17/2001, de 7 de
      diciembre, de Marcas, queda expresamente prohibida la reproducción, transmisión, adaptación, traducción,
      distribución, comunicación pública, incluida su modalidad de puesta a disposición, de la totalidad o
      parte de los Contenidos del Portal, en cualquier soporte y por cualquier medio técnico, salvo
      autorización expresa otorgada por escrito por parte de LA EMPRESA.
    </P>
    <P>
      LA EMPRESA no concede ninguna licencia o autorización de uso de ninguna clase sobre sus derechos de
      propiedad intelectual e industrial o sobre cualquier otra propiedad o derecho relacionado con el Portal,
      y en ningún caso se entenderá que el acceso y navegación de los Usuarios implica una renuncia,
      transmisión, licencia o cesión total ni parcial de dichos derechos por parte de LA EMPRESA.
    </P>
    <P>
      Cualquier uso de esos contenidos no autorizado previamente por parte de LA EMPRESA será considerado un
      incumplimiento grave de los derechos de propiedad intelectual o industrial y dará lugar a las
      responsabilidades legalmente establecidas.
    </P>

    <H2>5. Responsabilidad y garantías</H2>
    <P>
      LA EMPRESA declara que ha adoptado las medidas necesarias que, dentro de sus posibilidades y el estado
      de la tecnología, permitan el correcto funcionamiento de su Portal así como la ausencia de virus y
      componentes dañinos. Sin embargo, LA EMPRESA no puede hacerse responsable de: (a) la continuidad y
      disponibilidad de los Contenidos; (b) la ausencia de errores en dichos Contenidos ni la corrección de
      cualquier defecto que pudiera ocurrir; (c) la ausencia de virus y/o demás componentes dañinos; (d) los
      daños o perjuicios que cause cualquier persona que vulnere los sistemas de seguridad de LA EMPRESA.
    </P>
    <P>
      LA EMPRESA podrá suspender temporalmente y sin previo aviso la accesibilidad al Portal con motivo de
      operaciones de mantenimiento, reparación, actualización o mejora. No obstante, siempre que las
      circunstancias lo permitan, LA EMPRESA comunicará al Usuario, con antelación suficiente, la fecha
      prevista para la suspensión de los contenidos.
    </P>
    <P>
      LA EMPRESA no se responsabiliza del uso que los usuarios puedan hacer de los Contenidos incluidos en el
      Portal. En consecuencia, LA EMPRESA no garantiza que el uso que los usuarios puedan hacer de los
      Contenidos que en su caso se incluyan en el Portal se ajusten al presente Aviso Legal, ni que lo hagan de
      forma diligente.
    </P>

    <H2>6. Hipervínculos</H2>
    <P>
      El Portal puede contener hipervínculos que permitan al Usuario acceder a páginas web de terceros. LA
      EMPRESA no asume ninguna responsabilidad por el contenido, informaciones o servicios que pudieran
      aparecer en dichos sitios, que se entenderán ofrecidos exclusivamente con carácter informativo por parte
      de LA EMPRESA, y que en ningún caso implican relación, aceptación o respaldo alguno entre LA EMPRESA y
      las personas o entidades titulares de tales contenidos o titulares de los sitios donde se encuentren.
    </P>

    <H2>7. Publicación de comentarios y opiniones en el Portal</H2>
    <P>
      En la Comunidad, los Retos y demás espacios de interacción del Portal, los usuarios declaran expresamente
      que todos los contenidos que publiquen son de su propiedad exclusiva, o bien que cuentan con la
      autorización expresa de los titulares de los mismos, haciéndose los usuarios exclusivamente responsables
      en caso de que dichos contenidos vulneren los derechos de terceros.
    </P>
    <P>
      Los usuarios deberán tener en cuenta que tales comentarios y opiniones no deberán contener expresiones
      que no sean aptas para todos los públicos, ni deben incorporar contenidos indecorosos o que no se
      consideren apropiados o que hieran la sensibilidad general.
    </P>
    <P>En particular, el Portal no permitirá:</P>
    <Ul>
      <li>
        <strong className="font-semibold text-foreground">Publicaciones discriminatorias:</strong> en ningún
        caso se permitirán publicaciones que vayan en contra de un particular y que vulneren los principios del
        derecho al honor, a la intimidad personal y familiar, a la propia imagen y a la dignidad de la persona.
        Se prohíbe cualquier tipo de publicación discriminatoria por motivos de raza, sexo, religión, opinión,
        nacionalidad, discapacidad o cualquier otra circunstancia personal o social.
      </li>
      <li>
        <strong className="font-semibold text-foreground">Contenido degradante:</strong> no están permitidas
        aquellas publicaciones que sean intimidantes, amenazantes, degradantes o que de cualquier manera
        promuevan la violencia contra una persona o un colectivo determinado.
      </li>
      <li>
        <strong className="font-semibold text-foreground">Contenidos publicitarios:</strong> no está permitido
        utilizar el Portal como medio para realizar publicidad, promoción de negocios, marcas o elementos
        personales, así como obtener direcciones de e-mail a las que posteriormente poder remitir
        comunicaciones de carácter comercial no solicitadas.
      </li>
      <li>
        <strong className="font-semibold text-foreground">Contenidos que promuevan conductas autolesivas:</strong>{' '}
        se prohíbe todo tipo de publicaciones que promuevan el consumo de sustancias estupefacientes, así como
        aquellas que tengan como objetivo incitar a trastornos alimenticios y a la autolesión.
      </li>
    </Ul>
    <P>
      LA EMPRESA se reserva el derecho de eliminar cualquier comentario y opinión que pudiera incorporar alguno
      de los contenidos mencionados anteriormente. Asimismo, LA EMPRESA se reserva la posibilidad de limitar el
      acceso del usuario que hubiese incumplido lo dispuesto en este apartado.
    </P>
    <P>
      Asimismo, le informamos que los usuarios que publiquen contenidos en el Portal otorgan a LA EMPRESA una
      licencia de carácter universal, sin restricciones y gratuita, para el uso, distribución, comunicación
      pública, adaptación y reproducción de dichos contenidos. A través de dicha licencia, LA EMPRESA podrá
      transformar, adaptar y, en definitiva, utilizar los contenidos para el correcto funcionamiento del
      Portal.
    </P>

    <H2>8. Modificaciones</H2>
    <P>
      Las condiciones del presente Aviso Legal estarán vigentes hasta que sean modificadas, pudiendo LA EMPRESA
      efectuar estos cambios, que serán comunicados al Usuario.
    </P>
    <P>
      LA EMPRESA podrá suprimir, añadir o cambiar tanto los Contenidos como la forma en la que los mismos
      aparezcan localizados o presentados. Se entienden como vigentes las condiciones que estén publicadas en
      el momento en el que el usuario acceda al Portal de LA EMPRESA.
    </P>

    <H2>9. Legislación aplicable y jurisdicción</H2>
    <P>
      Los presentes Términos y Condiciones están sometidos a la legislación española. En caso de conflicto, las
      partes se someten a los Juzgados y Tribunales correspondientes al domicilio de LA EMPRESA, salvo que la
      ley prevea expresamente otra jurisdicción.
    </P>
  </LegalShell>
);

// ---------------------------------------------------------------------------
// Política de privacidad — mismo responsable y misma base legal que direct,
// pero con los tratamientos REALES del portal (cuenta, consentimientos con
// fecha/versión, Stripe, Mailrelay, Rebotica, ARCO+).
// ---------------------------------------------------------------------------
export const PoliticaPrivacidad = () => (
  <LegalShell
    title="Política de privacidad"
    intro="Cómo tratamos los datos personales de tu cuenta, tu suscripción y tu participación en el portal de farmapro (portal.farmapro.es)."
  >
    <H2>1. ¿Cuál es la empresa responsable del tratamiento de tus datos?</H2>
    <P>
      La empresa responsable del tratamiento de sus datos es{' '}
      <strong className="font-semibold text-foreground">Mkpro Kotler SL</strong> (en adelante, «MKPRO») con CIF
      B99554446, con domicilio en Calle Ibón de Astún 17, 50011 Zaragoza, España, e inscrita en el R.M. de
      Zaragoza – 19/08/2019 – Libro 4423 – Folio 67 – Hoja Z-65918.
    </P>
    <P>
      La presente Política de Privacidad regula el registro y el uso del portal de formación y comunidad
      portal.farmapro.es (en adelante, el «Portal»), dirigido a profesionales del sector farmacéutico, que
      MKPRO pone a disposición de sus Usuarios.
    </P>

    <H2>2. ¿Qué datos tratamos y para qué?</H2>
    <H3>Cuenta y registro</H3>
    <P>
      Al crear tu cuenta recogemos tu email, tu contraseña (almacenada de forma cifrada), tu nombre completo y,
      si los facilitas, el nombre de tu farmacia y tu cargo. El CIF/NIF de tu farmacia es obligatorio: lo usamos
      para validar tu farmacia y para limitar a una la prueba gratuita por farmacia. Con estos datos gestionamos
      tu cuenta y te damos acceso a los contenidos y funcionalidades del Portal (formación, recursos, comunidad,
      retos, empleo, farmacias, IAFarma y Mi Farmacia).
    </P>
    <H3>Consentimientos del registro</H3>
    <P>
      En el formulario de alta te pedimos que marques expresamente, sin ninguna casilla premarcada, dos
      consentimientos: (i) esta Política de Privacidad y (ii) el envío de comunicaciones del sector (newsletter
      quincenal, novedades del Portal y ofertas de servicios). Guardamos un registro de cada consentimiento con
      la fecha, la dirección IP, el origen de la solicitud y la versión exacta del texto que aceptaste, como
      evidencia conforme al artículo 7.1 del RGPD.
    </P>
    <H3>Suscripciones y pagos</H3>
    <P>
      Si contratas un plan de pago, el cobro lo gestiona Stripe como pasarela de pago. El Portal no almacena en
      ningún caso los datos de tu tarjeta: los trata Stripe conforme a sus propias políticas de privacidad y
      seguridad. Para emitir la factura de tu suscripción o de los packs adicionales usamos Holded.
    </P>
    <H3>Comunicaciones</H3>
    <P>
      Usamos tu email para enviarte las comunicaciones necesarias para el servicio (confirmación de cuenta,
      avisos, invitaciones de equipo) y, solo si diste tu consentimiento comercial, la newsletter y
      comunicaciones del sector. El envío técnico de estos correos lo realiza Mailrelay (CIPSA / iPZ Marketing)
      como encargado del tratamiento, por cuenta y siguiendo instrucciones de MKPRO.
    </P>
    <H3>La Rebotica</H3>
    <P>
      Si participas en las campañas de La Rebotica, tratamos los datos de tu cuenta y el resultado de tu
      participación (cajón elegido y premio asignado) para gestionar la mecánica y hacerte llegar el premio.
      Estos tratamientos se rigen, además, por las{' '}
      <Link to="/rebotica/bases-legales" className={linkCls}>Bases legales de la Rebotica</Link>. Si el canje de
      un premio requiere compartir tus datos con un partner externo a farmapro, te pediremos entonces un
      consentimiento adicional y específico, nunca premarcado.
    </P>
    <H3>Soporte</H3>
    <P>
      Si nos escribes a soporte@farmapro.es o a través de cualquier otro canal de contacto del Portal, tratamos
      los datos que nos facilites (tu email y el contenido de tu consulta) exclusivamente para poder
      responderte.
    </P>

    <H2>3. ¿Por qué estamos legitimados para tratar tus datos?</H2>
    <P>
      MKPRO trata tus datos sobre la base de: (i) la ejecución de la relación de servicio con el Portal (crear
      y mantener tu cuenta, prestarte el plan contratado y facturarlo); (ii) tu consentimiento explícito, para
      las comunicaciones comerciales, el perfilado con fines estadísticos y tu participación en La Rebotica; y
      (iii) el interés legítimo de responder a las consultas de soporte que nos envíes.
    </P>
    <P>
      El Usuario podrá retirar su consentimiento en cualquier momento escribiendo a{' '}
      <a href="mailto:entra@farmapro.es" className={linkCls}>entra@farmapro.es</a>, sin que ello afecte a la
      licitud del tratamiento basado en el consentimiento previo a su retirada, ni a los tratamientos necesarios
      para prestarte el servicio contratado.
    </P>
    <P>
      Si aceptas las cookies de análisis y de marketing en el banner de cookies del Portal, tus datos de
      navegación podrán asociarse a identificadores online (cookies, IDs de sesión) para elaborar estadísticas
      de uso del Portal y medir la eficacia de nuestras comunicaciones. Puedes ver el detalle de estas cookies y
      revocar tu consentimiento en cualquier momento en la{' '}
      <Link to="/politica-cookies" className={linkCls}>Política de Cookies</Link>.
    </P>

    <H2>4. Veracidad y calidad de los datos facilitados por los usuarios</H2>
    <P>
      El Usuario garantiza que los datos personales facilitados son exactos y veraces y se hace responsable de
      comunicar a MKPRO cualquier modificación de los mismos.
    </P>
    <P>
      El Usuario responderá, en cualquier caso, de la veracidad de los datos facilitados, reservándose MKPRO el
      derecho a excluir del Portal a todo Usuario que haya facilitado datos falsos, sin perjuicio de las demás
      acciones que procedan en Derecho.
    </P>

    <H2>5. Conservación de los datos</H2>
    <P>
      MKPRO conservará tus datos personales mientras mantengas la cuenta activa en el Portal y mientras sea
      necesario para las finalidades para las que se recogieron. Si te das de baja o cancelas tu suscripción,
      MKPRO podrá mantener la información bloqueada durante los plazos legalmente establecidos, por ejemplo a
      efectos fiscales y contables de las facturas emitidas.
    </P>

    <H2>6. Derechos de los usuarios</H2>
    <P>
      El Usuario tiene derecho a (i) acceder a sus datos personales, así como a (ii) solicitar la rectificación
      de los datos inexactos o incompletos o, en su caso, (iii) solicitar su supresión, (iv) solicitar la
      limitación del tratamiento de sus datos, (v) oponerse al tratamiento de sus datos, (vi) ejercer el derecho
      al olvido y (vii) solicitar su portabilidad.
    </P>
    <P>
      Usted podrá ejercitar, en cualquier momento, sus derechos en la dirección de e-mail{' '}
      <a href="mailto:entra@farmapro.es" className={linkCls}>entra@farmapro.es</a>, o bien por correo ordinario
      dirigido a la dirección facilitada en el apartado 1 de esta Política de Privacidad. Para ejercer dichos
      derechos será necesario que adjunte una fotocopia de su Documento Nacional de Identidad o cualquier otro
      medio válido en Derecho.
    </P>
    <P>
      Los Usuarios podrán retirar el consentimiento prestado para el envío de la newsletter o información
      comercial en cualquier momento, escribiendo a entra@farmapro.es o usando el enlace de baja de cualquier
      comunicación, sin que ello afecte al resto de servicios del Portal.
    </P>
    <P>
      Sin perjuicio de cualquier otro recurso administrativo o acción judicial, los Usuarios tendrán derecho a
      presentar una reclamación ante una Autoridad de Control, en el Estado miembro en el que tenga su
      residencia habitual, lugar de trabajo o lugar de la supuesta infracción, en caso de que considere que el
      tratamiento de sus datos personales no es adecuado a la normativa, así como en el caso de no ver
      satisfecho el ejercicio de sus derechos.
    </P>

    <H2>7. Medidas de seguridad de los datos</H2>
    <P>
      MKPRO mantiene los niveles de seguridad de protección de datos personales conforme a la normativa
      aplicable y ha establecido todos los medios técnicos a su alcance para evitar la pérdida, mal uso,
      alteración, acceso no autorizado y robo de los datos que el Interesado facilite a través del Portal, sin
      perjuicio de informarle de que las medidas de seguridad en Internet no son inexpugnables.
    </P>
    <P>
      MKPRO se compromete a cumplir con el deber de secreto y confidencialidad respecto de los datos personales
      de acuerdo con la legislación aplicable.
    </P>

    <H2>8. Preguntas</H2>
    <P>
      Si tiene alguna pregunta sobre esta Política de Privacidad o el tratamiento de sus datos, rogamos que se
      ponga en contacto con nosotros mediante correo electrónico dirigido al Delegado de Protección de Datos en
      la siguiente dirección: <a href="mailto:entra@farmapro.es" className={linkCls}>entra@farmapro.es</a>. Para
      cuestiones de tu cuenta, un curso o un pago, escríbenos mejor a{' '}
      <Link to="/contacto-soporte" className={linkCls}>Contacto y soporte</Link>.
    </P>

    <H2>9. Aceptación y consentimiento</H2>
    <P>
      El Usuario declara haber sido informado de las condiciones sobre protección de datos personales,
      aceptando y consintiendo el tratamiento de los mismos por parte de MKPRO, en la forma y para las
      finalidades indicadas en la presente Política de Privacidad.
    </P>
  </LegalShell>
);

// ---------------------------------------------------------------------------
// Política de cookies — misma estructura/base jurídica que direct, con las
// categorías REALES del CookieManager del portal (useCookieConsent +
// CookieBanner + analytics.ts): necesarias, analíticas, marketing y
// preferencias. Ni más, ni menos.
// ---------------------------------------------------------------------------
export const PoliticaCookies = () => (
  <LegalShell
    title="Política de cookies"
    intro="Información sobre las cookies y tecnologías similares que utiliza portal.farmapro.es, conforme al artículo 22.2 de la LSSI y al Reglamento (UE) 2016/679 (RGPD)."
  >
    <H2>1. ¿Qué son las cookies?</H2>
    <P>
      Una cookie es un pequeño fichero de texto que un sitio web almacena en el navegador del Usuario al
      visitarlo. Las cookies permiten que el sitio recuerde sus acciones y preferencias (como el inicio de
      sesión o la configuración de visualización) durante un periodo de tiempo, para que no tenga que volver a
      configurarlas cada vez que regrese o navegue de una página a otra. El Portal también utiliza tecnologías
      de almacenamiento similares, como el <em>localStorage</em> del navegador.
    </P>

    <H2>2. Titular y responsable</H2>
    <P>
      El responsable del tratamiento de los datos obtenidos a través de cookies es{' '}
      <strong className="font-semibold text-foreground">Mkpro Kotler SL</strong> (CIF B99554446), con domicilio
      en C/ Ibón de Astún 17, 50011 Zaragoza. Contacto:{' '}
      <a href="mailto:entra@farmapro.es" className={linkCls}>entra@farmapro.es</a>.
    </P>

    <H2>3. Categorías de cookies utilizadas en el Portal</H2>
    <P>
      El banner de cookies del Portal distingue cuatro categorías. A continuación se detalla, para cada una, qué
      guarda realmente hoy el Portal:
    </P>

    <H3>3.1. Necesarias o técnicas (exentas de consentimiento)</H3>
    <P>
      Permiten el funcionamiento básico del Portal: iniciar sesión, mantener tu progreso y prestarte los
      servicios que solicitas. No requieren tu consentimiento conforme al art. 22.2 LSSI.
    </P>
    <Ul>
      <li>
        <strong className="font-semibold text-foreground">farmapro_cookie_consent</strong> y{' '}
        <strong className="font-semibold text-foreground">farmapro_cookie_preferences</strong> — guardan tu
        decisión sobre este mismo banner de cookies. Tipo: almacenamiento local (<em>localStorage</em>) propio.
      </li>
      <li>
        <strong className="font-semibold text-foreground">Sesión del Portal</strong> (claves con prefijo{' '}
        <em>sb-</em>, gestionadas por Supabase / Lovable Cloud) — mantienen tu sesión iniciada tras el login.
        Tipo: almacenamiento local propio. Duración: hasta que cierres sesión o el token caduque.
      </li>
      <li>
        <strong className="font-semibold text-foreground">sidebar:state</strong> — recuerda si el menú lateral
        del Portal está abierto o cerrado. Tipo: cookie técnica propia. Duración: 7 días.
      </li>
      <li>
        <strong className="font-semibold text-foreground">Progreso de cursos y ajustes de IAFarma</strong> —
        guardan en tu navegador los módulos que ya has completado y tus últimos ajustes de generación de
        imágenes, para que no tengas que repetirlos. Tipo: almacenamiento local propio.
      </li>
      <li>
        <strong className="font-semibold text-foreground">Contexto de participación en La Rebotica</strong> —
        recuerda temporalmente el cajón elegido en la campaña activa. Tipo: almacenamiento local propio.
      </li>
      <li>
        <strong className="font-semibold text-foreground">farmapro_utm_first</strong> y{' '}
        <strong className="font-semibold text-foreground">farmapro_utm_last</strong> — guardan de forma propia
        (primera parte) el canal por el que llegaste al Portal (utm_source, utm_medium, utm_campaign...). No
        dependen de cookies de terceros.
      </li>
    </Ul>

    <H3>3.2. Analíticas (requieren tu consentimiento)</H3>
    <P>
      Si aceptas esta categoría, se activa <strong className="font-semibold text-foreground">Google Analytics 4</strong>{' '}
      para medir el uso del Portal (páginas vistas, eventos como el registro completado). Las cookies habituales
      de este servicio son <em>_ga</em>, <em>_ga_*</em> y <em>_gid</em>, con una duración entre la sesión y los
      24 meses. A fecha de esta actualización, la medición está integrada en el código del Portal pero pendiente
      de activar (falta configurar el identificador de medición); en cuanto se active seguirá dependiendo de tu
      consentimiento igual que hoy.
    </P>

    <H3>3.3. Marketing (requieren tu consentimiento)</H3>
    <P>
      Si aceptas esta categoría, se activa el{' '}
      <strong className="font-semibold text-foreground">píxel de Meta</strong> (Facebook) para medir conversiones
      (por ejemplo, un registro completado) y la eficacia de nuestras campañas. A fecha de esta actualización,
      está integrado en el código del Portal pero pendiente de activar (falta configurar el identificador del
      píxel); en cuanto se active seguirá dependiendo de tu consentimiento igual que hoy.
    </P>

    <H3>3.4. Preferencias (requieren tu consentimiento)</H3>
    <P>
      Categoría reservada para futuras funciones de personalización de tu experiencia en el Portal. Hoy no
      activa ninguna cookie adicional a las necesarias descritas en el punto 3.1; si en el futuro se usa para
      algo más, se actualizará esta política.
    </P>

    <H2>4. Base jurídica</H2>
    <P>
      La instalación de cookies no estrictamente necesarias se realiza únicamente con el consentimiento del
      Usuario, de conformidad con el artículo 22.2 de la Ley 34/2002 (LSSI) y los artículos 6.1.a) y 7 del RGPD.
      Las cookies técnicas se amparan en el interés legítimo de prestar el servicio solicitado.
    </P>

    <H2>5. Gestión y revocación del consentimiento</H2>
    <P>
      Puedes aceptar todas, rechazar las no necesarias o personalizarlas categoría a categoría desde el banner
      que aparece la primera vez que entras en el Portal. Una vez has dado una respuesta, verás un icono con
      forma de cookie en la esquina inferior derecha de la pantalla: pulsándolo puedes reabrir esta
      configuración y cambiar tu decisión cuando quieras.
    </P>
    <P>
      Adicionalmente, puedes configurar tu navegador para bloquear o eliminar las cookies ya instaladas.
      Encontrarás instrucciones detalladas en la ayuda de los principales navegadores: Google Chrome, Mozilla
      Firefox, Safari, Microsoft Edge y Opera.
    </P>

    <H2>6. Consecuencias de no aceptar las cookies</H2>
    <P>
      Rechazar las cookies no necesarias no impide navegar por el Portal ni usar tu cuenta, tus cursos o tu
      suscripción, que dependen únicamente de las cookies técnicas. Únicamente se limitarán la medición
      estadística y, en su caso, la medición de marketing.
    </P>

    <H2>7. Modificaciones</H2>
    <P>
      farmapro podrá modificar esta Política de Cookies para adaptarla a cambios normativos o al uso de nuevas
      tecnologías. Se recomienda al Usuario revisarla periódicamente.
    </P>

    <H2>8. Contacto</H2>
    <P>
      Para cualquier consulta sobre esta política puede escribir a{' '}
      <a href="mailto:entra@farmapro.es" className={linkCls}>entra@farmapro.es</a>.
    </P>
  </LegalShell>
);

// ---------------------------------------------------------------------------
// Contacto y soporte — página sencilla y cálida, sin jerga legal.
// ---------------------------------------------------------------------------
export const ContactoSoporte = () => (
  <LegalShell
    title="Contacto y soporte"
    intro="¿Tienes un problema con tu cuenta, un curso o un pago del Portal? Escríbenos y te ayudamos."
  >
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mail className="h-5 w-5 text-primary" />
          soporte@farmapro.es
        </CardTitle>
        <CardDescription>
          Es el mismo correo de soporte que ya usamos en la página de precios. Te contestamos desde ahí.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="rounded-full">
          <a href="mailto:soporte@farmapro.es">Escribir un email</a>
        </Button>
      </CardContent>
    </Card>

    <H2>Qué incluir en tu mensaje</H2>
    <Ul>
      <li>El email con el que tienes la cuenta en el Portal.</li>
      <li>Qué estabas haciendo y qué ha pasado (el error exacto, si lo hay).</li>
      <li>Una captura de pantalla, si puedes hacerla.</li>
    </Ul>

    <H2>Plazo de respuesta</H2>
    <P>Te respondemos lo antes posible, normalmente en 1-2 días laborables.</P>

    <H2>Otras consultas</H2>
    <P>
      Para ejercer tus derechos de protección de datos (acceso, rectificación, supresión y demás) escribe a{' '}
      <a href="mailto:entra@farmapro.es" className={linkCls}>entra@farmapro.es</a>; el detalle está en la{' '}
      <Link to="/politica-privacidad" className={linkCls}>Política de Privacidad</Link>. Para dudas sobre
      premios de La Rebotica, consulta sus{' '}
      <Link to="/rebotica/bases-legales" className={linkCls}>Bases legales</Link>.
    </P>
  </LegalShell>
);
