# Plan de lanzamiento del portal farmapro · 30 días · 2026-07-02

> Objetivo declarado: 1.000 suscriptores de pago recurrente en 30 días.
> Activos: lista Clientify ~7.000 (apertura ~20%), web farmapro.es con tráfico propio, redes, newsletter quincenal,
> presupuesto de anuncios 300 €. Este plan sustituye y completa los docs previos (pricing CERRADO, plan de contenido,
> propuestas 19-06), que siguen vigentes en lo suyo.

---

## 1. La verdad de los números (antes de nada)

Me pediste honestidad: **1.000 de pago en 30 días con estos activos no va a pasar**, y conviene saber por qué
para no quemar la lista persiguiéndolo.

- **Mercado total**: en España hay **22.273 farmacias** (CGCOF 2025). 1.000 de pago = convertir al 4,5% de TODAS
  las farmacias del país en un mes. Ninguna herramienta del sector ha hecho eso jamás.
- **La lista**: 7.000 contactos con 20% de apertura. Una secuencia de lanzamiento bien hecha alcanza al 45-55% de la
  lista en 30 días (~3.500 personas). Benchmarks B2B: 2-4% de clic por envío, 2,5% de conversión media de campaña.
  Registros GRATIS esperables desde email: **350-550**. De gratis a pago en el primer mes (benchmark freemium 2-5%,
  con oferta fundador y buen onboarding 10-20% de los registros activos): **40-110 pagos desde la lista**.
- **Los 300 € de ads**: el CPL de un registro B2B en Meta ronda 30-80 $ en frío. En frío, 300 € son 5-10 registros.
  Solo tienen sentido en **retargeting** (lista + visitantes web), donde pueden dar 20-40 registros y 3-8 pagos.
- **Coste real de 1.000 clientes por ads**: con CAC realista de 200-500 € en este nicho, serían 200.000-500.000 €.

**Escenarios honestos a 30 días** (pagos acumulados):

| Escenario | Registros gratis | De pago | Comentario |
|---|---|---|---|
| Base | 350-450 | **60-90** | Ejecutando solo email + orgánico |
| Bueno | 450-600 | **100-150** | Se agota el tramo fundador (100 plazas) |
| Excepcional | 700+ | 200+ | Requiere que algo "prenda" (webinar masivo, prensa, un partner) |

**La buena noticia**: vuestra oferta de lanzamiento está diseñada para 100 plazas. Agotar el tramo fundador en 30 días
ES el lanzamiento perfecto, crea la prueba social y la escalera de precios para ir a por los 1.000.
**Los 1.000 son un objetivo a 9-12 meses** y el vehículo NO es el email ni los ads: son los **partners** (sección 7).

---

## 2. Ajustes a la oferta antes de lanzar (crítica al pricing actual)

El pricing cerrado (Gratis / Plus 19,90 / Equipo 49, 100 plazas de por vida) es bueno. Tres mejoras:

1. **Contador de plazas REAL desde cero.** El `spotsTaken=95` hardcodeado es publicidad engañosa y desperdicia
   la mejor palanca del lanzamiento: ver el contador SUBIR de verdad ("37 de 100 plazas ocupadas") es prueba social
   auténtica y crea urgencia creciente. Mostrar aviso "últimas plazas" solo cuando queden ≤15 de verdad.
2. **Definir YA el tramo 2 (escalera de precios).** Al agotarse las 100 fundador, no saltar de golpe a 39/79:
   tramo "early" de 150-200 plazas a **24,90 / 59 €** (también de por vida o por 12 meses, a decidir). Esto permite
   seguir vendiendo con urgencia después del tramo fundador y hace creíble el precio regular. Anunciarlo desde el
   principio ("cuando se acaben, el precio sube a 24,90") multiplica la conversión del tramo 1.
3. **Sin permanencia, cancela cuando quieras** bien visible. En este sector la desconfianza a suscribirse es alta;
   la reversibilidad baja la fricción más que cualquier descuento. (Stripe Billing Portal ya lo permite.)

El gancho de venta es **IAFarma** (textos, respuestas a reseñas de Google e imágenes para redes): es la única pieza
que un titular no encuentra gratis en YouTube. Los cursos y la comunidad sostienen la retención; IAFarma vende.
Toda la campaña lidera con IAFarma y el ahorro de tiempo, no con "formación".

---

## 3. Semana 0 (3-9 julio): dejar el portal listo

Del informe `portal-revision-lanzamiento-2026-07-02.md`:

- [ ] Verificar/arreglar C1 (políticas SELECT de `profiles`) y C2 (`clientify-sync`). **Bloqueantes.**
- [ ] Conectar Stripe con el checklist del informe (enum, prices, webhook, check-subscription, PlanTab).
- [ ] A2: que el gratis tenga de verdad sus 2 textos + 1 imagen IAFarma (es la demo que convierte).
- [ ] A8: contador de plazas real.
- [ ] Probar 1 generación de imagen en vivo (cambio de hoy de Lovable a Gemini 3.1).
- [ ] Confirmar contenido sembrado y visible: 6+ cursos publicados con quiz, ~30 recursos, eventos 12 meses,
      3-4 categorías de foro con 6-8 hilos sembrados (cuentas de Laura/Alejandro/admin).
- [ ] Prueba end-to-end como usuario nuevo: registro con CIF → onboarding → curso → IAFarma → precios → pago test
      → factura Holded → email de confirmación.
- [ ] Notificaciones mínimas viables: email de bienvenida + aviso "tu prueba termina en X días" (día 23 y 28).
      Sin esto, el gratis caduca en silencio y se pierde la conversión.

## 4. El motor: email a la lista de 7.000 (coste 0 €)

**Segmentar primero en Clientify** (esto duplica el rendimiento sin gastar nada):
- **Segmento A, calientes (~1.400-2.000)**: han abierto algo en los últimos 90 días. Reciben TODO.
- **Segmento B, fríos (~5.000)**: sin aperturas recientes. Reciben 3 envíos con asuntos de reactivación; si no abren
  ninguno, se dejan descansar (proteger la entregabilidad vale más que 2 clics).
- **Segmento C, leads comerciales C1-C4 + clientes de servicios**: trato personal, email firmado por Alejandro en "yo",
  incluso llamada. Son los pagos más probables de todo el plan.

**Secuencia (8 envíos en 4 semanas, tandas para redactar en sesiones aparte):**

| # | Día | A quién | Contenido |
|---|---|---|---|
| E1 | Lun S1 | A | Teaser: "hemos construido algo para vosotros" + 1 imagen de IAFarma real. Sin link de compra. Responde a este email y entra en la lista de acceso anticipado |
| E2 | Jue S1 | A + respuestas E1 | **Acceso anticipado 48h**: solo ellos pueden coger plaza fundador antes de abrir |
| E3 | Lun S2 | Toda la lista | **Apertura oficial**: qué es el portal, precio fundador, contador real de plazas |
| E4 | Jue S2 | Toda la lista | Caso de uso: "responder a una reseña mala de Google en 20 segundos" (vídeo/gif de IAFarma) |
| E5 | Lun S3 | Toda la lista | Invitación al **webinar de lanzamiento** (jueves S3) |
| E6 | Vie S3 | Toda la lista | Replay del webinar + testimonios primeros usuarios + "quedan X plazas" (real) |
| E7 | Mar S4 | Aperturas sin compra | Objeciones: precio/tiempo/"otra suscripción más" + sin permanencia + garantía |
| E8 | Jue S4 | Aperturas sin compra | Last call fundador: 72h o cambio de tramo (verdad demostrable) |

Reglas: castellano de España, sin raya larga, firma editorial Laura para valor y Alejandro para venta,
footer RGPD literal de siempre, copia local de cada HTML enviado (política Clientify).

## 5. Orgánico (coste 0 €)

- **Calendario editorial existente como altavoz**: N23 (jueves S2) con el portal como "complemento" del número;
  la serie comercial dedica **C5 íntegra al portal**. No romper la cadencia, aprovecharla.
- **Webinar de lanzamiento en directo** (jueves S3, Alejandro): "3 herramientas de IA para tu farmacia en 45 min",
  demo en vivo de IAFarma, oferta fundador al final. El primer evento "nuestro" del calendario de eventos ya sembrado.
- **Blog + SEO**: 1 post "herramientas de IA para farmacias" apuntando al portal (la línea SEO ya tiene la
  infraestructura; keyword de demanda latente, pero el post sirve también para los emails y redes).
- **Redes (LinkedIn farmaprooficial + Instagram farmapro.oficial)**: 3 posts/semana durante el mes: demo IAFarma
  en vídeo, contador de plazas, testimonios. Vídeo corto de Alejandro (patrón del calendario de lunes).
- **Prensa sectorial gratis**: nota de prensa a Diariofarma, Correo Farmacéutico, El Global, Farmaventas
  ("nace el primer portal de formación y comunidad con IA para farmacias"). Una sola publicación amortiza el mes.
- **Referral desde el día 1 (versión manual)**: "invita a un compañero titular; si se suscribe, os regalamos
  un pack de 20 imágenes a los dos". Se gestiona a mano el primer mes, se automatiza después.
- **Firma de email** de todo el equipo Mkpro con línea "Nuevo: portal farmapro" + link.

## 6. Los 300 € de anuncios (dónde, cómo y cuánto)

Con 300 € NO se prospecta en frío: se **remata** a quien ya os conoce.

| Partida | Importe | Qué | Cuándo |
|---|---|---|---|
| Retargeting Meta (FB+IG) | 200 € | Custom audience: lista de 7.000 subida a Meta (matchea ~50-60%) + visitantes web por píxel. Creativos: demo IAFarma en vídeo 15s + contador de plazas. Objetivo: registro gratis. CPL objetivo < 5 € | Semanas 2-4, ~10 €/día |
| Lookalike test | 100 € | Lookalike 1-3% de la lista, solo España, intereses farmacia/salud. Mismo creativo ganador del retargeting | Semanas 3-4, ~7 €/día |

- Google Ads NO con este presupuesto: las keywords del nicho tienen volumen mínimo (informe SEO: "marketing para
  farmacias" 40/mes) y el CPC se comería el presupuesto sin masa crítica.
- Requisito previo: píxel de Meta instalado en farmapro.es y el portal, y evento de conversión "registro".
- Resultado esperable: 20-40 registros extra, 3-8 pagos. Su función real es **frecuencia**: que quien abrió el email
  vuelva a ver el portal 5 veces esa semana.
- Si el retargeting da CPL < 3 €, considerar ampliar presupuesto (decisión tuya con datos, no antes).

## 7. La rampa real hacia 1.000 (día 31 en adelante)

Los 1.000 salen de acuerdos B2B2C, no de emails ni ads. Un solo acuerdo puede valer más que toda la campaña:

1. **Cooperativas y distribuidoras** (Bidafarma, Hefame, Fedefarma, Cofares...): miles de farmacias socias cada una.
   Oferta: el portal como beneficio para sus socios (precio por volumen o co-marketing). El deck de partner se
   prepara en la semana 4 con los datos REALES del lanzamiento ("X farmacias se registraron en 30 días").
2. **Colegios de farmacéuticos** (52 COF): formación bonificada/acreditada para colegiados. Empezar por 2-3 colegios
   donde ya tengáis clientes.
3. **Laboratorios como partners de Promociones** (ya diseñado en propuestas 19-06): ellos aportan ofertas, vosotros
   audiencia; su fuerza comercial visita 22.000 farmacias y puede recomendar el portal.
4. **Plan Equipo como cuña B2B**: 1 venta Equipo = hasta 10 usuarios. Para el objetivo 1.000, vender 100 Equipos
   es más alcanzable que 1.000 Plus.
5. **Bolsa de empleo + plan Estudiante** (aparcado en el pricing): amplía el mercado de 22.273 farmacias a
   **81.000+ farmacéuticos colegiados** y crea el efecto red que ninguna herramienta del sector tiene.

Hito propuesto: 100 fundadores (mes 1) → 250 (mes 3, tramo early + primer partner) → 500 (mes 6) → 1.000 (mes 9-12).

## 8. KPIs del mes (medir cada lunes en la sesión de revisión)

| KPI | Semana 1 | Semana 2 | Semana 3 | Semana 4 |
|---|---|---|---|---|
| Registros gratis acumulados | 60 | 180 | 350 | 450+ |
| De pago acumulados | 5 (early access) | 30 | 65 | 100 (fundador agotado) |
| Apertura secuencia (seg. A) | >30% | >28% | >25% | >25% |
| CPL retargeting | — | <5 € | <5 € | <4 € |
| Churn/impagos | 0 | <2% | <2% | <3% |

Si en la semana 2 los pagos van por debajo de 15: revisar precio percibido (¿probar 14,90 en el tramo early?),
reforzar demo de IAFarma en la home y adelantar el webinar. El plan se corrige con datos, no se abandona.

## 9. Checklist go-live (resumen)

- [ ] Fixes C1+C2 + Stripe end-to-end + contador real (semana 0)
- [ ] Notificaciones bienvenida + fin de prueba
- [ ] Contenido verificado en vivo (cursos, recursos, eventos, foro sembrado)
- [ ] Segmentación Clientify A/B/C + secuencia E1-E8 redactada (tandas)
- [ ] Píxel Meta + audiencias + 2 creativos vídeo
- [ ] Webinar programado + página de registro
- [ ] Nota de prensa redactada y enviada
- [ ] Tramo 2 de precios decidido y en plans.ts

---

# ADENDA · 2026-07-02 · Decisiones tras revisión de Francesc

## A. Contador de plazas: condicional, nunca en vacío

Correcto: un contador en 3/100 el día 2 mata la oferta. Solución en 3 fases:
1. **Fase silenciosa (early access, E1-E2)**: la web muestra "Oferta de lanzamiento: 100 plazas fundador a precio
   de por vida", SIN "quedan X". Las primeras altas llegan del acceso anticipado y de los clientes actuales.
2. **Fase contador (desde ~20-25 plazas ocupadas reales)**: se activa "X de 100 plazas ocupadas" (ocupadas, no
   restantes: en la primera mitad la cifra que crece vende más que la que decrece).
3. **Fase urgencia (≤15 restantes)**: cambia a "quedan X plazas" + aviso en emails.
Implementación: `spotsTaken` real + un umbral `showCounterFrom` en plans.ts. Solo cuentan altas de pago reales.

## B. Píxel de Meta: qué es y cómo lo montamos (no necesitas saber hacerlo)

- **Qué haremos**: crear el píxel en Meta Events Manager (5 min, lo haces tú con guía o juntos por navegador),
  y yo/Claude Code metemos el snippet en `index.html` de farmapro-direct y del portal (ambos repos son nuestros;
  el Worker no interfiere). Eventos: `PageView` (automático), `Lead` (formularios web) y `CompleteRegistration`
  (registro del portal).
- **Requisito RGPD**: el píxel usa cookies → hace falta **banner de consentimiento** previo (AEPD). Hay que
  comprobar si farmapro.es tiene banner; si no, se monta a la vez (media jornada). Sin consentimiento, el píxel
  no puede dispararse.
- Sesión propuesta: "montar medición" (píxel + banner + GA4 + UTMs), 1 sesión técnica.

## C. Medición completa: qué se registra hoy y qué falta

| Qué | ¿Lo tenemos? | Acción |
|---|---|---|
| Aperturas y clics de email por contacto | SÍ (Clientify lo registra por contacto) | Solo usarlo: segmentos A/B salen de ahí |
| Visitas web y origen | NO verificado | Instalar GA4 (o similar) en farmapro.es y portal |
| Retargeting | NO | Píxel Meta (punto B) |
| **Qué canal trajo cada alta y cada pago** | NO | La pieza clave: UTMs en TODOS los enlaces (email/redes/ads/news) + guardar `utm_source/medium/campaign` en el registro del portal (columna en profiles o tabla `signup_attribution`). Así cada pago tiene origen |
| Uso del portal (quién entra, qué usa) | Parcial (user_points, ai_image_usage) | Suficiente para v1; panel semanal el lunes |

Regla desde ya: **ningún enlace sale sin UTM**. Preparo la convención de nombres cuando montemos la medición.

## D. IAFarma imagen: prompt comercial + créditos

**Diagnóstico del código actual** (`ai-generate-image` + `ImageWorkspace`): el prompt del servidor fuerza contexto
"pharmaceutical/medical" y **prohíbe todo texto en la imagen**; la UI precarga "Escaparate de farmacia en X".
Resultado: imágenes clínicas, sin titular, inservibles como cartel o promo. Justo lo contrario del caso de uso real.

**Propuesta de rediseño (tanda propia, UI Cowork + prompt vía Lovable):**
1. La UI deja de ser un textarea libre y pasa a **4 plantillas de pieza**: Promo de producto/categoría ·
   Cartel de servicio · Post de campaña estacional · Story de oferta. Campos: qué se promociona, **texto que debe
   aparecer** (titular corto + opcional precio/descuento, máx ~8 palabras, se renderiza LITERAL), formato
   (1:1 post / 9:16 story / 4:5 feed / A4 cartel) y tono (usa los defaults de farmacia ya guardados).
2. Prompt de servidor nuevo, orientado a **retail/parafarmacia** (no "medical"): pieza de marketing para farmacia
   española, estética luminosa y comercial, composición con espacio para el titular, texto del usuario literal y
   sin faltas. Guardrails que se mantienen: sin marcas ni envases reales de medicamentos, sin claims de salud,
   sin personas reconocibles; categorías genéricas (solar, dermo, vitaminas) sí.
3. **Gemini 3.1 flash image renderiza texto bien**; es la elección correcta para carteles. Probar 3-4 generaciones
   de validación (promo solar, cartel SPD, story descuento) antes de lanzar: la imagen gratis del trial es la demo
   que convierte o espanta.
4. **Renombrar a créditos en toda la UX**: "1 crédito = 1 imagen". Gratis: 1 crédito/mes. Plus/Equipo: 1/mes +
   packs (+20 = 4,99 · +50 = 9,99 · +100 = 16,99, ya cerrados). **Recarga automática opt-in** ("cuando te quedes
   sin créditos, recargamos el pack de 20"): con Stripe guardando el método de pago es un cargo off-session; se
   monta en fase 2, en el lanzamiento la recarga es manual con 1 clic. El backend ya habla en créditos
   (`consume_image_credit`), es coherente.

## E. Retención: ¿el contenido actual aguanta el precio? Cadencia de novedades

Honesto: el contenido actual (6 cursos MVP + ~32 recursos + eventos) **justifica la entrada pero no la
permanencia más allá de 2-3 meses** por sí solo. Lo que sostiene la cuota es la combinación: IAFarma (uso
recurrente mensual), eventos en directo y goteo constante de novedades. Cadencia mínima comprometida:

| Pieza | Cadencia | De dónde sale |
|---|---|---|
| Recursos descargables | 2-4/mes | GRATIS: el pipeline Impulso ya produce 1 PDF + complemento cada quincena → al portal |
| Cursos nuevos | 1-2/mes | Reciclando newsletters N1-N28 en formato curso (el material ya existe) + 1 original/mes |
| Evento en directo | 1/mes | Webinar de Alejandro (el calendario de eventos ya los tiene sembrados) |
| Foro | dinamización semanal | 1 hilo/semana del equipo + responder todo en <24h el primer trimestre |

Es decir: el coste marginal de alimentar el portal es bajo porque Impulso ya genera la materia prima. El plan
Equipo necesita además valor propio en el roadmap (visibilidad del titular sobre el progreso de su equipo, retos
de equipo): anotarlo para el trimestre 1, no para el lanzamiento.

## F. Partners: enfoque corregido

- **Colegio de Zaragoza**: proponer la charla (autoridad + grabación reutilizable como contenido), pero SIN
  captación local: la pieza vale por la marca y el vídeo. Captación activa del portal: resto de España.
- **Clientes actuales de la agencia**: FUERA de la secuencia de venta (excluirlos del segmento en Clientify).
  Oferta privada, personal, firmada por Alejandro: **3 meses de Equipo gratis + 50% de por vida después
  (39,50 €/mes)**, a cambio de feedback y testimonio con nombre y provincia. No es descuento público, es
  beneficio de cliente. Nos dan las primeras altas (contador), los testimonios de E6 y casos reales.
- **Apotheka, SDM y plusfarma** (valor, no comisión). Lo que les ofrecemos es un regalo que ELLOS hacen a sus
  clientes, con su marca delante:
  1. **Código co-branded**: "2 meses de Plus gratis, cortesía de [partner]" (cupo limitado, ej. 100 códigos).
     Ellos regalan valor real sin coste; nosotros ganamos usuarios que al mes 3 deciden si pagan. Win-win limpio.
  2. **Webinar co-brandeado**: su tema + nuestra plataforma, invitan a su cartera.
  3. (Fase 2) Contenido patrocinado: un curso o guía "con la colaboración de [partner]".
  Necesitamos de ellos: 1 email a su base o su comercial mencionándolo. Se les prepara el kit (email + creatividad).
- **El contacto del distribuidor**: mismo modelo de código co-branded pero con cupo mayor; activarlo en la
  semana 4 con los datos del lanzamiento en la mano ("X farmacias registradas el primer mes").

## G. Cadencia de emails corregida (los jueves son de Impulso/Comercial)

Los jueves quedan intactos para la cadencia editorial (N/C alternos), que además lleva un módulo del portal.
La secuencia de lanzamiento va en **martes y viernes**:

| # | Día | A quién |
|---|---|---|
| E1 | Mar S1 | Segmento A · teaser + acceso anticipado |
| E2 | Vie S1 | A + respuestas · early access 48h |
| E3 | Mar S2 | Toda la lista · apertura oficial |
| E4 | Vie S2 | Toda la lista · caso de uso IAFarma |
| E5 | Mar S3 | Toda la lista · invitación webinar |
| E6 | Vie S3 | Toda la lista · replay + testimonios + contador |
| E7 | Mar S4 | Aperturas sin compra · objeciones |
| E8 | Vie S4 | Aperturas sin compra · last call fundador |

El jueves de por medio, la news correspondiente (N/C) menciona el portal sin duplicar la venta. El segmento B
(fríos) recibe solo E3, E5 y E8.
