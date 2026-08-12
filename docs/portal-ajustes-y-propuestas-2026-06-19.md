# Ajustes hechos + propuestas pendientes · 2026-06-19

## A) Hecho en esta tanda (entra en el push)
- **Puntos**: unificado todo a `user_points` (dashboard, Retos, leaderboard y badges muestran el mismo total).
- **Precios**: textos corregidos, IVA incluido, botones "Hazte Plus / Activar Equipo".
- **Card de curso**: portada más contenida (mayor que recursos, no enorme).
- **Eventos**: portada de marca por tipo (sin fotos de stock).
- **Insignias**: skeleton de carga.

## B) Mis respuestas a tus preguntas
1. **Card de curso, ¿imagen o lo que hay?** → Mi opinión sincera: **lo que hay (color + icono por categoría)**. Es consistente, se escanea de un vistazo, escala a cualquier curso sin gestionar imágenes y evita justo el problema de las "fotos de portátiles" que no te gustaron en eventos. Imagen real solo merece la pena si es específica y de calidad; genéricas, restan. Ya lo dejé un poco más pequeño para diferenciarlo de recursos.
2. **Recursos premium, ¿etiqueta o restringido?** → **Restringido de verdad**: solo los planes de pago/admin pueden descargarlos; al gratis le sale aviso + CTA a Precios. No es solo una etiqueta.

## C) Propuestas (decides y lo implemento)

### 1. IAFarma — campos fijos + responder reseñas de Google
- **Campos fijos** (nombre de la farmacia, localidad, tono): guardarlos en el **perfil del usuario** (editables en Ajustes), y que IAFarma los use por defecto sin pedirlos cada vez. Un botón "ajustar" para cambiarlos puntualmente. → Necesita 2-3 campos nuevos en `profiles` + un pequeño formulario en Perfil/IAFarma.
- **Responder reseñas de Google** (sobre todo las malas): nuevo modo de IAFarma "Responder reseña" — pegas la reseña y genera una respuesta profesional, empática y **sin abrir hilo** (cierra, no invita a réplica, no admite culpas legales, deriva a privado/teléfono). Prompt específico con buenas prácticas de atención al cliente y deontología.
- Esfuerzo: medio. Muy alto valor percibido. Lo monto cuando me digas.

### 2. Promociones (nueva vía: ofertas de laboratorios/partners)
**Valor**: ofertas/descuentos exclusivos de laboratorios y distribuidoras → ahorro real para la farmacia → más razón para estar en farmapro. **Monetización** posible:
- **Destacado de pago**: el laboratorio paga por aparecer destacado.
- **Comisión por lead/canje**: cobras por cada farmacia que activa una promo.
- **Cuota de partner**: el laboratorio paga por publicar sus campañas.
- **Patrocinio/co-marketing**: secciones y webinars patrocinados (enlaza con eventos).
- **Afiliación**: comisión por compras vía enlaces a distribuidoras.
**Cómo lanzarlo / conseguir partners**: piloto con 2-3 laboratorios/cooperativas conocidos; usar el volumen de farmacias como argumento ("llega a X farmacias"); primeras campañas gratis para sembrar; vía colegios/cooperativas.
**Mientras no esté**: ocultar la sección (igual que Empleo y Farmacias) y, si quieres, dejar un **"Próximamente"** con captación de interés ("¿te interesaría recibir ofertas de laboratorios?"). → Puedo ocultarla y poner el teaser ya.

### 3. Anti-pillaje del primer mes gratis (misma farmacia, cuentas nuevas)
Cómo detectarlo/limitarlo (combinables):
- **Identificador de farmacia**: pedir CIF/NIF de la farmacia o nº de colegiado en el registro → 1 periodo gratis por farmacia, no por email.
- **Normalizar nombre+dirección** de la farmacia y agrupar.
- **Dominio de email** corporativo / mismo dominio.
- **Señales técnicas**: IP, huella de dispositivo (con aviso RGPD).
- **Tarjeta** al activar prueba (sin cobro): el mismo método de pago no repite prueba (lo hace Stripe de serie).
Recomendación: vincular la prueba a **CIF/colegiado de la farmacia** (lo más limpio en este sector) + tarjeta en el momento de "probar de pago". Lo aterrizo cuando definamos el registro.

### 4. Facturación (lo que viste vacío en Perfil siendo admin)
- Como **admin no tienes suscripción**, por eso no ves plan ni facturación — es lo esperado; esa sección aparece para usuarios de pago.
- **Recomendación**: **Stripe Billing Portal** para autogestión (cambiar tarjeta, cancelar, ver/descargar recibos) — ya existe la edge function `customer-portal`, solo hay que enlazar "Gestionar suscripción" en Perfil. Y **Holded** para la **factura fiscal con IVA** (ya tenéis Stripe→Holded sincronizado; la factura legal la emite y envía Holded). Es lo estándar y lo que ya tenéis medio montado. Todo esto se cierra junto con Stripe.

## D) Pendientes finales (como acordamos)
- **Stripe** (cobro real) + **notificaciones**.
- Implementar lo que apruebes de C (IAFarma reseñas/campos fijos, Promociones, anti-pillaje).
