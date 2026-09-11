# -*- coding: utf-8 -*-
# Descargable del PORTAL (no de Impulso): "El test de los 3 segundos".
# Acompaña al curso fp-mk-escaparate-primer-vendedor, publicado el 14-09-2026.
# Clonado del patrón N26/N27, pero con la marca del portal en portada y pie.

from pathlib import Path

PLANTILLA = Path("/Users/francescfernandez/farmapro/impulso/06-tecnico/plantilla-descargable")
white = (PLANTILLA / "logo-white-base64.txt").read_text().strip()
dark = (PLANTILLA / "logo-dark-base64.txt").read_text().strip()
css_design = (PLANTILLA / "descargable-styles.css").read_text(encoding="utf-8").strip()

DOC = "El test de los 3 segundos · portal farmapro"

def foot(num, doc=DOC):
    return (f'<div class="pg-foot"><div class="brand-mini"><img class="logo-img dark" src="{dark}" '
            f'alt="farmapro"><span class="sep">|</span><span class="doc">{doc}</span></div>'
            f'<div class="pgnum">{num}</div></div>')

L = "_______________________________________________"
LM = "____________________________"   # tablas de 3 columnas
LT = "______________________"         # tabla del test (4 columnas)
BOX = '<span class="box"></span>'

P = []

# 1 · PORTADA
P.append(f'''<article class="page cover">
  <div class="tab"></div><div class="dot-right"></div><div class="dot-left"></div>
  <div class="pattern-1"></div><div class="pattern-2"></div>
  <div class="inner">
    <div class="top-label">portal farmapro · Ficha de trabajo · Formación</div>
    <div class="title-block">
      <h1>El test de<br>los 3 segundos</h1>
      <p class="subtitle">Averigua qué dice hoy tu escaparate y móntalo para que haga entrar</p>
    </div>
    <div class="brand">
      <img class="logo-img white" src="{white}" alt="farmapro" style="width:400px;height:400px;margin:0;">
      <div class="pill">PORTAL</div>
    </div>
  </div>
</article>''')

# 2 · CÓMO USARLA + ÍNDICE
toc = [
  ("01","El test de los 3 segundos","Qué entienden cinco personas de fuera en un vistazo","03"),
  ("02","Tu mensaje central","Las tres preguntas que lo definen, y el sitio para escribirlo","04"),
  ("03","La rejilla 40/30/30","Cómo repartir el espacio del escaparate sin saber diseño","06"),
  ("04","La revisión de montaje","Dieciséis comprobaciones antes de dar por bueno el cambio","07"),
  ("05","El año en cuatro montajes","Fechas, temas y la hoja de medición a treinta días","09"),
]
toc_html = "".join(f'<li><span class="num">{n}</span><div class="t"><b>{t}</b><span>{s}</span></div><span class="pgr">{p}</span></li>' for n,t,s,p in toc)
P.append(f'''<article class="page content"><div class="body">
  <h2 class="eyebrow-title">Cómo usar esta ficha</h2>
  <h1 class="page-title">Imprímela y sal <em>a la acera</em>.</h1>
  <p class="lead">Acompaña al curso <b>"Convierte tu escaparate en el primer vendedor de tu farmacia"</b> del portal farmapro. No es una guía para leer: es una ficha para rellenar a mano, con la farmacia delante. Cada apartado corresponde a un módulo del curso y se resuelve en diez minutos. Donde veas una línea en blanco va lo que es tuyo.</p>
  <div class="callout"><b>Antes de empezar, haz la foto.</b> Frontal, desde la acera de enfrente, con el móvil en horizontal y a la altura de tus ojos. Sin buscar el mejor ángulo. Esa foto es tu punto de partida y la vas a usar en tres de los cinco apartados. Repite la misma foto de noche: la diferencia entre las dos suele ser el hallazgo más rentable de todo el ejercicio.</div>
  <ul class="toc-list">{toc_html}</ul>
  <div class="phase"><h4><span class="tag">Recuerda</span> Esto no se hace solo</h4>
  <p>El test del apartado 01 exige cinco personas que no trabajen contigo. Tu equipo conoce demasiado bien la farmacia y ya no puede verla con ojos nuevos. Familiares, un cliente de confianza y el del bar de enfrente valen perfectamente.</p></div>
  </div>{foot("02")}</article>''')

# 3 · EL TEST
filas_test = "".join(
  f'<tr><td><b>Persona {i}</b></td><td>{LT}</td><td>{LT}</td><td>{BOX} Sí &nbsp; {BOX} No</td></tr>'
  for i in range(1,6)
)
P.append(f'''<article class="page content"><div class="body">
  <h2 class="eyebrow-title">01 · El diagnóstico</h2>
  <h1 class="page-title">Qué entiende <em>quien pasa de largo</em>.</h1>
  <p class="lead">Enseña la foto de tu escaparate durante tres segundos exactos, retírala y haz las tres preguntas. No des ninguna pista, no expliques nada y no te justifiques: la primera respuesta, aunque duela, es la que vale.</p>
  <table class="ds"><thead><tr><th>El guion</th><th>Cómo hacerlo</th></tr></thead><tbody>
    <tr><td><b>El tiempo</b></td><td>Tres segundos con el móvil a la vista y luego lo giras. Cronométralo de verdad: a ojo siempre se alarga.</td></tr>
    <tr><td><b>La pregunta 1</b></td><td>¿Qué tipo de farmacia dirías que es?</td></tr>
    <tr><td><b>La pregunta 2</b></td><td>¿En qué te parece que están especializados?</td></tr>
    <tr><td><b>La pregunta 3</b></td><td>¿Entrarías a preguntar por algo que te preocupa? Sí o no.</td></tr>
  </tbody></table>
  <table class="ds" style="table-layout:fixed"><colgroup><col style="width:14%"><col style="width:30%"><col style="width:30%"><col style="width:26%"></colgroup><thead><tr><th>Quién</th><th>Qué tipo de farmacia</th><th>Qué especialización</th><th>¿Entraría?</th></tr></thead>
  <tbody>{filas_test}</tbody></table>
  <div class="callout"><b>Cómo leer el resultado.</b> Si las cinco respuestas coinciden y describen lo que tú querías transmitir, tu escaparate ya funciona y este ejercicio te lo confirma. Si coinciden pero describen otra cosa, tienes un mensaje claro pero equivocado. Y si no coinciden entre sí, es la situación más habitual: tu escaparate no está diciendo una cosa, está diciendo cinco.</div>
  </div>{foot("03")}</article>''')

# 4 · MENSAJE CENTRAL (las tres preguntas)
P.append(f'''<article class="page content"><div class="body">
  <h2 class="eyebrow-title">02 · La decisión</h2>
  <h1 class="page-title">Una idea, <em>no cinco</em>.</h1>
  <p class="lead">Si tu escaparate solo puede transmitir una cosa en tres segundos, más vale que la elijas tú. Contesta por escrito, con frases cortas. Diez minutos bastan.</p>
  <div class="tpl"><div class="hd"><span>Pregunta 1</span><span class="ch">¿En qué eres mejor que la farmacia de al lado?</span></div>
  <div class="bd">No lo que te gustaría. Lo que ya es verdad hoy.

{L}
{L}</div></div>
  <div class="tpl"><div class="hd"><span>Pregunta 2</span><span class="ch">¿A quién quieres ver entrar más a menudo?</span></div>
  <div class="bd">Piensa en una persona real que ya es clienta tuya y que te gustaría multiplicar.

{L}
{L}</div></div>
  <div class="tpl"><div class="hd"><span>Pregunta 3</span><span class="ch">¿Qué le preocupa a esa persona en esta época del año?</span></div>
  <div class="bd">La estación manda: en septiembre no preocupa lo mismo que en abril.

{L}
{L}</div></div>
  <div class="tpl"><div class="hd"><span>Tu mensaje central</span><span class="ch">Seis palabras como máximo</span></div>
  <div class="bd">Escríbelo cuando hayas contestado las tres preguntas de arriba. La página siguiente te dice si la frase que has puesto dice algo o no dice nada.

{L}</div></div>
  </div>{foot("04")}</article>''')

# 5 · LA FRASE: QUÉ DICE ALGO Y QUÉ NO
P.append(f'''<article class="page content"><div class="body">
  <h2 class="eyebrow-title">02 · La decisión</h2>
  <h1 class="page-title">Una frase que <em>diga algo</em>.</h1>
  <p class="lead">Casi todas las farmacias escriben en el cristal la misma frase, y por eso ninguna se distingue. La columna de la izquierda se puede comprobar: un cliente sabe si es verdad o no. La de la derecha la puede firmar cualquiera.</p>
  <table class="ds"><thead><tr><th>Dicen algo</th><th>No dicen nada</th></tr></thead><tbody>
    <tr><td>Especialistas en piel sensible</td><td>Tu farmacia de confianza</td></tr>
    <tr><td>Aquí te explicamos tu tratamiento</td><td>Salud y bienestar</td></tr>
    <tr><td>Tu farmacia para los primeros años</td><td>Siempre a tu servicio</td></tr>
    <tr><td>Expertos en descanso y sueño</td><td>Calidad y profesionalidad</td></tr>
  </tbody></table>
  <div class="callout"><b>La condición que más se incumple:</b> el mensaje tiene que sostenerse cuando el cliente entra. Prometer especialización en el cristal sin nadie formado detrás del mostrador decepciona más que no prometer nada.</div>
  <div class="tpl"><div class="hd"><span>La prueba de la farmacia de al lado</span><span class="ch">Un minuto</span></div>
  <div class="bd">Escribe tu frase y pregúntate si la farmacia más cercana podría poner exactamente la misma en su cristal. Si la respuesta es sí, todavía no es tu mensaje: vuelve a la pregunta 1 de la página anterior.

Mi frase: {L}
{BOX} La de al lado podría ponerla igual &nbsp;&nbsp; {BOX} Solo puedo ponerla yo</div></div>
  <div class="phase"><h4><span class="tag">Después</span> Dónde va esta frase</h4>
  <p>La frase que hayas elegido manda en todo lo que viene a continuación: es la que ocupa el bloque del 40% de la página siguiente, la que decide qué producto hace de protagonista y la que se comprueba desde diez metros en la revisión de montaje.</p></div>
  </div>{foot("05")}</article>''')

# 6 · REJILLA 40/30/30
P.append(f'''<article class="page content"><div class="body">
  <h2 class="eyebrow-title">03 · El reparto</h2>
  <h1 class="page-title">La rejilla <em>40/30/30</em>.</h1>
  <p class="lead">Imprime esta página, pon al lado la foto de tu escaparate y reparte lo que hay hoy en los tres bloques. Vas a ver enseguida cuál te falta. Casi siempre es el tercero.</p>
  <div class="tpl"><div class="hd"><span>40% · El protagonista</span><span class="ch">Centro, a la altura de los ojos</span></div>
  <div class="bd">Tu mensaje central y el producto o servicio que mejor lo representa. Un único protagonista, con espacio libre alrededor.

Mi mensaje: {L}
Mi producto protagonista: {L}</div></div>
  <div class="tpl"><div class="hd"><span>30% · Lo complementario</span><span class="ch">Tres o cuatro referencias, no doce</span></div>
  <div class="bd">Lo que acompaña al protagonista y tiene sentido en esta época. Complementario es lo que al cliente le encaja que esté junto, no lo que es del mismo proveedor.

1. {L}
2. {L}
3. {L}</div></div>
  <div class="tpl"><div class="hd"><span>30% · Quién eres y qué pides</span><span class="ch">El bloque que casi todos se saltan</span></div>
  <div class="bd">Tus servicios, escritos de forma legible, y una llamada a la acción concreta que invite a preguntar hoy.

Servicios que quiero visibles: {L}
Mi llamada a la acción: {L}</div></div>
  <table class="ds"><thead><tr><th>La altura</th><th>Quién lo ve</th></tr></thead><tbody>
    <tr><td><b>Por encima de 1,80 m</b></td><td>Prácticamente nadie. Nadie levanta la cabeza al pasar.</td></tr>
    <tr><td><b>Entre 1,30 y 1,60 m</b></td><td>Todo el mundo, sin esfuerzo. Aquí va el bloque del 40%.</td></tr>
    <tr><td><b>Por debajo de 1 m</b></td><td>Muy poca gente. Nunca pongas aquí lo que más te interesa mover.</td></tr>
  </tbody></table>
  </div>{foot("06")}</article>''')

# 7 y 8 · CHECKLIST DE MONTAJE (repartida en dos páginas)
checks_a = [
  ("El mensaje se lee desde diez metros","Letras de 10 cm de alto como mínimo"),
  ("Hay un único protagonista claro","Con espacio libre alrededor"),
  ("Como máximo dos tipos de letra","Y colores de tu identidad, no del laboratorio"),
  ("No hay folios A4 pegados en el cristal","Cada papel resta fuerza al mensaje"),
  ("El bloque principal está a la altura de los ojos","Entre 1,30 y 1,60 m"),
  ("Hay al menos tres alturas distintas","Peanas, cajas forradas o soportes escalonados"),
  ("El suelo del escaparate está despejado","Sin cajas vacías ni soportes de repuesto"),
  ("Se ve bien desde los tres lados","De frente, viniendo por la derecha y por la izquierda"),
]
checks_b = [
  ("Hay un foco dirigido al bloque del 40%","La luz general no basta"),
  ("El escaparate se ve más luminoso que la calle","Compruébalo de noche, no de día"),
  ("Ningún foco convierte el cristal en espejo","Se corrige con el ángulo, no con la potencia"),
  ("Se ve bien con el sol de frente","Los reflejos cambian según la hora"),
  ("Los envases no están amarilleados por el sol","Usa envases vacíos o de exposición"),
  ("Hay un elemento vivo o que cambia cada semana","Lo estático deja de mirarse a las pocas semanas"),
  ("Si hay plantas, están vivas","Una planta seca dice lo contrario de lo que buscas"),
  ("La llamada a la acción pide algo concreto","No vale \"te esperamos dentro\""),
]
def filas(lista):
    return "".join(f'<tr><td><b>{t}</b><br><span style="color:var(--muted);font-size:11px">{s}</span></td><td>{BOX}</td></tr>' for t,s in lista)

P.append(f'''<article class="page content"><div class="body">
  <h2 class="eyebrow-title">04 · La revisión</h2>
  <h1 class="page-title">Ocho comprobaciones de <em>mensaje y montaje</em>.</h1>
  <p class="lead">Repásalas con el escaparate ya montado y desde la acera, nunca desde dentro. Estas ocho son las del mensaje y la colocación: si falla una, el cliente que pasa no llega a entender qué le estás contando.</p>
  <table class="checklist"><thead><tr><th>Qué se comprueba</th><th>Hecho</th></tr></thead><tbody>{filas(checks_a)}</tbody></table>
  </div>{foot("07")}</article>''')

P.append(f'''<article class="page content"><div class="body">
  <h2 class="eyebrow-title">04 · La revisión</h2>
  <h1 class="page-title">Ocho comprobaciones de <em>luz y vida</em>.</h1>
  <p class="lead">Si falla alguna de las cuatro primeras, que son las de iluminación, empieza por ahí: es el arreglo más barato y el que más se nota. Las cuatro últimas son las que mantienen el escaparate vivo entre montaje y montaje.</p>
  <table class="checklist"><thead><tr><th>Qué se comprueba</th><th>Hecho</th></tr></thead><tbody>{filas(checks_b)}</tbody></table>
  <div class="callout"><b>Dieciséis casillas, una sola regla.</b> No des el montaje por bueno con casillas sin marcar. Lo que queda sin marcar hoy es exactamente lo que la semana que viene te hará pensar que el escaparate no funciona.</div>
  </div>{foot("08")}</article>''')

# 9 · CALENDARIO DE MONTAJES
P.append(f'''<article class="page content"><div class="body">
  <h2 class="eyebrow-title">05 · El año</h2>
  <h1 class="page-title">Cuatro montajes <em>con fecha puesta</em>.</h1>
  <p class="lead">Cuatro cambios al año es el punto de equilibrio entre el trabajo que da y el efecto que tiene. Apunta las fechas en el calendario ahora, con un aviso una semana antes para preparar materiales.</p>
  <table class="ds"><thead><tr><th>Temporada</th><th>Tema, tono y fecha de montaje</th></tr></thead><tbody>
    <tr><td><b>Primavera</b></td><td>Renovación y preparación del buen tiempo. Verdes y tonos claros. Montaje: principios de marzo. Mi fecha: {L}</td></tr>
    <tr><td><b>Verano</b></td><td>Protección solar y viaje. Azules y blancos. Montaje: finales de mayo. Mi fecha: {L}</td></tr>
    <tr><td><b>Otoño</b></td><td>Vuelta a la rutina, al colegio y al trabajo. Naranjas y tonos cálidos. Montaje: principios de septiembre. Mi fecha: {L}</td></tr>
    <tr><td><b>Invierno</b></td><td>Cuidado en los meses fríos y regalo de Navidad. Rojos y tonos profundos. Montaje: finales de noviembre. Mi fecha: {L}</td></tr>
  </tbody></table>
  <div class="phase"><h4><span class="tag">El aviso</span> La semana de antes</h4>
  <p>El montaje se cae siempre por lo mismo: llega la fecha y no hay materiales. Pon en el calendario un segundo aviso siete días antes de cada una de las cuatro fechas y dedícalo solo a reunir lo que vas a necesitar: vinilos, peanas, envases de exposición y el cartel con la llamada a la acción.</p></div>
  <div class="tpl"><div class="hd"><span>Quién lo monta</span><span class="ch">Con nombre, no "el equipo"</span></div>
  <div class="bd">Persona responsable del montaje: {L}
Quién revisa las dieciséis comprobaciones: {L}</div></div>
  </div>{foot("09")}</article>''')

# 10 · HOJA DE MEDICIÓN
P.append(f'''<article class="page content"><div class="body">
  <h2 class="eyebrow-title">05 · El año</h2>
  <h1 class="page-title">La hoja de <em>medición</em>.</h1>
  <p class="lead">Medir un escaparate no exige ningún programa ni ningún sensor. Tres indicadores y esta tabla bastan. Anota la columna de la izquierda dos semanas antes del cambio y la de la derecha dos semanas después, sin cambiar nada más en ese tiempo.</p>
  <table class="ds" style="table-layout:fixed"><colgroup><col style="width:26%"><col style="width:37%"><col style="width:37%"></colgroup><thead><tr><th>Indicador</th><th>Antes del cambio</th><th>Después del cambio</th></tr></thead><tbody>
    <tr><td><b>Entradas en franja fija</b><br><span style="color:var(--muted);font-size:11px">Media hora que se repite, dos semanas antes y dos después</span></td><td>{LM}</td><td>{LM}</td></tr>
    <tr><td><b>Consultas sobre lo expuesto</b><br><span style="color:var(--muted);font-size:11px">Una raya en un papel cada vez que alguien pregunta</span></td><td>{LM}</td><td>{LM}</td></tr>
    <tr><td><b>Unidades del producto protagonista</b><br><span style="color:var(--muted);font-size:11px">Cuatro semanas antes contra cuatro semanas después</span></td><td>{LM}</td><td>{LM}</td></tr>
  </tbody></table>
  <div class="callout"><b>Cómo interpretarlo.</b> Si los tres suben, repite la fórmula. Si solo sube el tercero, el escaparate vende producto pero no atrae gente nueva: revisa el mensaje. Si no se mueve ninguno, el problema casi siempre está en la legibilidad desde la acera, no en el producto que elegiste.</div>
  </div>{foot("10")}</article>''')

# 11 · CONTRAPORTADA
P.append(f'''<article class="page cover back">
  <div class="tab"></div><div class="dot-left"></div>
  <div class="inner">
    <div class="lockup"><img class="logo-img white" src="{white}" alt="farmapro" style="width:300px;height:300px;margin:0;"></div>
    <h2>Esta ficha es del <em>portal farmapro</em>:</h2>
    <p>Acompaña al curso "Convierte tu escaparate en el primer vendedor de tu farmacia", en el área de Formación del portal. Ahí tienes el método completo en cinco módulos, el cuestionario para fijarlo y el resto de formaciones y descargables para titulares.</p>
    <p>Entra en <span class="mail">portal.farmapro.es</span></p>
    <div class="copy">© <em>portal farmapro</em> | Todos los derechos reservados</div>
    <div class="contact">605 87 57 01 &nbsp;|&nbsp; somos@farmapro.es<br>farmapro.es &nbsp;|&nbsp; @farmapro.oficial</div>
  </div>
</article>''')

paginas = "".join(p.strip() for p in P)
html = f'''<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>El test de los 3 segundos · portal farmapro</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
{css_design}
</style></head><body>{paginas}<script>(async()=>{{try{{if(document.fonts&&document.fonts.ready)await document.fonts.ready;}}catch(e){{}}}})();</script></body></html>'''

out = Path(__file__).parent / "test-3-segundos-escaparate.html"
out.write_text(html, encoding="utf-8")
print(f"Generado: {out}")
print(f"Tamaño: {len(html)/1024:.0f} KB · {len(P)} páginas")
