import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { REBOTICA_NEXT_OPENING } from '@/lib/rebotica';

const SECTIONS = [
  {
    title: '1. Organizador',
    body: 'La Rebotica es una mecánica de fidelización organizada por farmapro (Mkpro), dirigida a profesionales del sector farmacéutico registrados en el portal portal.farmapro.es. No tiene coste de participación ni exige ninguna compra.',
  },
  {
    title: '2. Participantes',
    body: 'Puede participar cualquier persona mayor de edad vinculada al sector farmacéutico que se registre gratuitamente en el portal. Elegir un cajón no requiere cuenta; abrirlo sí, porque cada premio queda vinculado a una cuenta real (evita que dos personas reclamen el mismo premio).',
  },
  {
    title: '3. Mecánica',
    body: 'En cada campaña (quincenal) se publica una cajonera con varios cajones. Elegir un cajón es gratuito y no altera en ningún caso las probabilidades de premio: la elección es una forma de participar, no una jugada. El resultado se calcula en nuestros servidores, de forma ponderada según el stock real disponible en ese momento, y queda asignado de forma inmediata y definitiva al abrir el cajón. Cada participante puede abrir un cajón por campaña.',
  },
  {
    title: '4. Premios',
    body: 'El catálogo de premios de cada campaña se publica en la propia página de la Rebotica mientras esté activa. Los premios son siempre un regalo completo, sin condiciones de compra asociadas: la Rebotica regala, nunca descuenta. Ningún premio tiene contenido sanitario ni relacionado con la dispensación de medicamentos, en línea con el código deontológico farmacéutico.',
  },
  {
    title: '5. Caducidad y canje',
    body: 'Cada premio indica su plazo de caducidad en el momento de abrir el cajón (orientativamente entre 7 y 14 días). Pasado ese plazo sin canjear, el premio se pierde sin derecho a compensación. Los premios no son acumulables entre sí ni canjeables por dinero.',
  },
  {
    title: '6. Protección de datos',
    body: 'Los datos tratados son los del registro en el portal (email y los que el participante facilite voluntariamente). La base legal es el consentimiento explícito otorgado en el registro, con doble comprobación (aviso legal / RGPD y comunicaciones comerciales) y registro de la versión de texto aceptada, fecha, origen e IP. Si un premio implica la participación de un partner, el traslado de datos a ese partner exige un consentimiento adicional y específico, nunca premarcado, solicitado únicamente en el momento del canje. farmapro nunca vende ni cede datos a partners sin ese consentimiento expreso. Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a somos@farmapro.es.',
  },
  {
    title: '7. Modificación y cancelación',
    body: 'farmapro se reserva el derecho a modificar estas bases o cancelar una campaña por causas justificadas (técnicas, de disponibilidad de premios o de fuerza mayor), publicando el cambio en esta misma página con antelación razonable siempre que sea posible.',
  },
  {
    title: '8. Legislación aplicable',
    body: 'Estas bases se rigen por la legislación española. Cualquier controversia se someterá a los juzgados y tribunales que correspondan según la normativa de protección de consumidores y usuarios aplicable.',
  },
  {
    title: '9. Contacto',
    body: 'Para cualquier duda sobre esta mecánica, escribe a somos@farmapro.es.',
  },
];

export default function ReboticaBasesLegales() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/rebotica" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Volver a la Rebotica
          </Link>
          <img src="/lovable-uploads/logo_farmapro.svg" alt="farmapro" className="h-6" />
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-14">
        <h1 className="text-3xl font-bold">Bases legales de la Rebotica</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Próxima apertura de campaña: {REBOTICA_NEXT_OPENING.dateLabel}. Estas bases aplican a todas
          las campañas de la Rebotica mientras no se indique lo contrario en una campaña concreta.
        </p>

        <div className="mt-8 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
