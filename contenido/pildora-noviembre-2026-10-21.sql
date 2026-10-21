-- ============================================================================
-- Píldora de noviembre 2026 (21-10-2026): 17-C «La reunión de 15 minutos».
--
-- Vídeo: Drive 176TrOnAz98LXGaeCwNs2mNkmoQBy8ACx, recortado en 75,45 s (justo
-- al acabar la cortinilla de farmapro, antes de la marca de CapCut) y subido
-- a Bunny 748005 como f1d5ff9e-d5ac-43b6-b25d-807d85720064.
-- Se inserta SIN PUBLICAR: Francesc la revisa y se publica con el UPDATE del
-- final. Idempotente por slug.
-- Ángulo: el vídeo propone la reunión semanal como alternativa al grupo de
-- WhatsApp, con guion fijo de 3 puntos. Encaja en el bloque «Un equipo que
-- funciona» (N31-N32).
-- ============================================================================

INSERT INTO public.courses
  (slug, title, description, category, difficulty, duration_hours, duration_minutes,
   instructor, is_premium, is_published, is_featured, order_index, total_lessons,
   cover_concept, cover_icon, course_modules)
VALUES
(
  'fp-pildora-reunion-15-minutos',
  'La reunión de 15 minutos que sustituye al grupo de WhatsApp',
  'Si lo importante de tu farmacia se cuenta en el grupo de WhatsApp, a las once de la noche y entre memes, tu equipo se entera a medias. Una reunión semanal de 15 minutos, siempre el mismo día y con tres puntos fijos, lo arregla.',
  'liderazgo', 'principiante', 0, 8,
  'Alejandro Tellería', true, false, false, 111, 1,
  '15 MINUTOS', 'Users',
  jsonb_build_array(jsonb_build_object(
    'id', 'fp-pildora-reunion-15-minutos-l1',
    'title', 'Quince minutos, día fijo y tres puntos',
    'duration', '8',
    'video_url', 'https://iframe.mediadelivery.net/embed/748005/f1d5ff9e-d5ac-43b6-b25d-807d85720064',
    'downloadable_resources', jsonb_build_array(
      jsonb_build_object('resource_id', 'a293d192-344d-410e-80f9-2297de302109',
        'title', 'Plantilla de guion para reuniones de equipo', 'type', 'docx',
        'url', '/recursos/plantilla-reuniones-equipo.docx')),
    'content', $html$
<h3>El problema</h3>
<p>En muchas farmacias, todo lo importante pasa por el grupo de WhatsApp del equipo: que cambia la promoción, que alguien cambia el turno, que una compañera está de baja. Llega cuando llega, a veces a las once de la noche, mezclado con fotos y bromas, y cada persona lo lee (o no) cuando puede.</p>
<p>El resultado es un equipo que se entera a medias. Unos lo vieron, otros no, y nadie sabe con seguridad qué es lo prioritario esta semana. El grupo sirve para avisos rápidos, pero no sirve para que todo el mundo juegue al mismo juego.</p>

<h3>Por qué pasa</h3>
<p>El grupo es cómodo: no obliga a parar el mostrador ni a juntar a nadie. Pero precisamente por eso no deja huella. Un mensaje se pierde entre otros veinte, nadie confirma que lo ha entendido y lo que se dice por escrito suena más frío de lo que se diría en persona.</p>
<p>Y cuando sí se intenta reunir al equipo, la reunión se alarga, no tiene guion y acaba siendo una lista de quejas. Después de dos así, nadie quiere repetir.</p>

<h3>El método: 15 minutos, día fijo y tres puntos</h3>
<p><strong>1. Siempre el mismo día y a la misma hora.</strong> Elige el momento más tranquilo de la semana y no lo muevas. De pie si hace falta. Lo que la hace funcionar es la costumbre, no la duración.</p>
<p><strong>2. Qué pasó la semana pasada.</strong> Un repaso corto de lo que cambió o de lo que conviene saber: turnos, promociones, incidencias. Lo que hoy va al grupo, se cuenta aquí.</p>
<p><strong>3. Un caso que salió perfecto, contado por quien lo hizo.</strong> Una venta bien aconsejada, un cliente que volvió, un problema bien resuelto. Lo cuenta su protagonista, no el titular. Es el punto que más une al equipo.</p>
<p><strong>4. El foco de esta semana.</strong> Una sola cosa en la que todo el mundo va a fijarse hasta la próxima reunión. Nada más. Y a los 15 minutos, se acaba.</p>
<p>El grupo de WhatsApp no desaparece: sigue valiendo para lo urgente. Lo que cambia es que lo importante ya tiene su sitio.</p>

<h3>El ejercicio de la semana</h3>
<p>Convoca la primera esta semana. Ponle día y hora fijos, apúntala en un sitio visible y usa la plantilla de guion para no salirte de los tres puntos. Ten paciencia: al cabo de unas semanas, la gente empezará a llegar con cosas apuntadas. Esa es la señal de que la reunión se queda.</p>

<h3>Errores frecuentes</h3>
<ul>
<li><strong>Dejar que se alargue:</strong> en cuanto pasa de 15 minutos, deja de ser sostenible. Corta a la hora y lo que quede, a la semana siguiente.</li>
<li><strong>Cambiarla de día cada semana:</strong> sin día fijo no hay costumbre. Si un día no se puede, se salta, pero no se mueve.</li>
<li><strong>Que hable solo el titular:</strong> el caso de la semana lo cuenta quien lo hizo. Si siempre habla la misma persona, el resto deja de escuchar.</li>
</ul>
$html$
  ))
)
ON CONFLICT (slug) DO NOTHING;

-- Publicar (tras el visto bueno de Francesc):
-- UPDATE public.courses SET is_published = true WHERE slug = 'fp-pildora-reunion-15-minutos';
