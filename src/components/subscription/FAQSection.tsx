
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const FAQSection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Preguntas Frecuentes</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="trial" className="bg-white rounded-lg px-6">
            <AccordionTrigger className="text-left">¿Cómo funciona el período de prueba gratuito?</AccordionTrigger>
            <AccordionContent>
              Al registrarte, disfrutarás de 30 días completos con acceso total a todo el contenido del Portal farmapro. Podrás explorar todas las secciones, descargar recursos, participar en la comunidad y comprobar por ti mismo el valor que aporta. Si decides que no es para ti, puedes cancelar en cualquier momento antes de que finalice el período de prueba y no se te cobrará nada.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="change-plan" className="bg-white rounded-lg px-6">
            <AccordionTrigger className="text-left">¿Puedo cambiar de plan después de suscribirme?</AccordionTrigger>
            <AccordionContent>
              Sí, puedes actualizar o cambiar tu plan en cualquier momento. Si cambias a un plan superior, la diferencia se prorrateará por el tiempo restante de tu suscripción actual. Si cambias a un plan inferior, el nuevo precio se aplicará en tu próxima renovación.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="content-updates" className="bg-white rounded-lg px-6">
            <AccordionTrigger className="text-left">¿Con qué frecuencia se actualiza el contenido?</AccordionTrigger>
            <AccordionContent>
              Añadimos nuevo contenido semanalmente. Cada mes incorporamos al menos un nuevo curso o serie completa, 5-10 nuevos recursos descargables, y actualizamos las herramientas digitales con nuevas funcionalidades. Además, el contenido existente se revisa y actualiza regularmente para garantizar que siempre esté al día con las últimas tendencias y normativas.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="team-access" className="bg-white rounded-lg px-6">
            <AccordionTrigger className="text-left">¿Cómo puedo compartir el acceso con mi equipo?</AccordionTrigger>
            <AccordionContent>
              Con el Plan Premium Farmacia, puedes invitar hasta 5 miembros de tu equipo que recibirán sus propias credenciales de acceso. Cada miembro tendrá su perfil personalizado y podrá seguir su propio progreso en cursos y guardar sus recursos favoritos, pero compartirán la cuota de la suscripción.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="download-resources" className="bg-white rounded-lg px-6">
            <AccordionTrigger className="text-left">¿Puedo descargar los recursos para usarlos en mi farmacia?</AccordionTrigger>
            <AccordionContent>
              Absolutamente. Todos los recursos están diseñados para ser descargados, personalizados y utilizados en tu farmacia. Las plantillas, protocolos, y demás materiales pueden adaptarse con tu logo y datos específicos para su implementación inmediata.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="spanish-content" className="bg-white rounded-lg px-6">
            <AccordionTrigger className="text-left">¿El contenido está adaptado a la normativa española?</AccordionTrigger>
            <AccordionContent>
              Sí, todo el contenido del Portal farmapro está específicamente creado para el contexto farmacéutico español. Tanto los aspectos legales, regulatorios, como las estrategias de mercado y gestión están adaptados a la realidad específica de las farmacias en España, incluyendo actualizaciones cuando la normativa cambia.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
};
