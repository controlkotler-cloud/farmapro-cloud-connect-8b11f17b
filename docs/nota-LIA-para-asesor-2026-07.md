# Nota para el asesor · Evaluación de interés legítimo (LIA) y flujo de consentimiento

> Mkpro Kotler SL (marca farmapro) · 10-07-2026 · Preparada para revisión del asesor de protección de datos.
> Objeto: (1) validar la base jurídica de las comunicaciones a la base histórica de contactos,
> (2) revisar el nuevo flujo de consentimiento del portal, (3) tres consultas concretas al final.

## 1 · El tratamiento

Envío de una newsletter profesional quincenal (contenido de gestión y marketing para titulares de farmacia) y comunicaciones comerciales de los servicios de la agencia, por email, a una base de unos 7.600 profesionales del sector farmacéutico español. Único dato tratado en la plataforma de envío: la dirección de email (los nombres no se importaron por calidad del dato). Plataforma de envío: Mailrelay (CIPEX SISTEMAS, S.L., proveedor español); CRM: Clientify.

## 2 · Origen de la base y hechos relevantes

- Base construida con dos importaciones (febrero y agosto de 2025) de contactos profesionales del sector, más captación web propia con doble check desde 2025 (goteo menor).
- Es una audiencia B2B: aproximadamente el 78% de los emails tiene señal directa de farmacia (dominios propios de farmacia, redes profesionales del sector, buzones de colegios oficiales).
- Comportamiento real en 12 envíos (últimos 3 meses): 32% de apertura media, 0 quejas de spam, bajas del 0,07-0,27% por envío. Es una base que interactúa, no una lista fría.
- Mecanismo de baja en cada envío; la baja es permanente (lista de supresión sticky: una resincronización no reactiva a nadie).
- Solo 82 contactos tienen la casilla de consentimiento marcada en el CRM. DECISIÓN tomada: NO marcar esa casilla en bloque (la inactividad no es consentimiento y marcarla en masa fabricaría una evidencia falsa a efectos del art. 7.1 RGPD).

## 3 · Base jurídica propuesta para la base histórica

**Interés legítimo (art. 6.1.f RGPD) + art. 21.2 LSSI**, con esta ponderación:

- **Finalidad legítima**: marketing directo a profesionales de nuestro propio sector de actividad (el considerando 47 RGPD reconoce el marketing directo como posible interés legítimo).
- **Necesidad**: el email es el canal proporcionado y habitual en comunicación B2B profesional; el dato tratado es mínimo (email profesional).
- **Ponderación**: destinatarios profesionales (no consumidores) en su rol de titulares/gestores de farmacia; contenido de valor sectorial (formación y gestión, no presión comercial: la newsletter no vende directamente); frecuencia contenida (quincenal); expectativa razonable de recibir información profesional de su sector; baja en un clic en cada envío con supresión permanente; los indicadores de 3 meses (32% apertura, 0 quejas) apoyan que la comunicación no es indeseada.
- **Garantías adicionales**: no se ceden datos a terceros; los partners del programa de recompensas JAMÁS reciben la lista (solo datos del ganador de un premio, con opt-in explícito capturado en el canje y solo para la entrega).

## 4 · El flujo nuevo: consentimiento explícito por goteo (portal)

Desde el lanzamiento del portal (10-09-2026), la estrategia es migrar la base a consentimiento explícito documentado:

- El registro del portal exige **doble check no premarcado**: (a) política de privacidad y (b) comunicaciones comerciales.
- Cada aceptación se registra en una tabla de evidencia (`consent_ledger`) con: versión literal del texto aceptado, fecha y hora, origen (registro, canje, reto, descargable) y usuario. Prueba a efectos del art. 7.1 RGPD.
- Objetivo interno: 30% de la base con consentimiento explícito en 90 días. La base histórica sin consentimiento sigue bajo interés legítimo hasta su conversión o baja.

Textos actuales del registro (v1, 10-07-2026), para tu revisión:

1. "He leído y acepto la política de privacidad. Responsable: Mkpro Kotler SL. Finalidad: gestionar tu cuenta del portal farmapro."
2. "Acepto recibir comunicaciones del sector de farmapro (newsletter quincenal, novedades del portal y ofertas de servicios). Puedes darte de baja en cualquier momento."

## 5 · Consultas concretas para ti

1. **¿Validas la LIA del apartado 3** para seguir enviando a la base histórica mientras se convierte por goteo? ¿Algún ajuste de redacción o garantía adicional?
2. **Checkbox comercial obligatorio**: en los formularios de la web y en el registro del portal, el check de comunicaciones comerciales es OBLIGATORIO, bajo la lógica de intercambio por valor (el acceso gratuito al portal y los recursos son la contraprestación de las comunicaciones). ¿Lo ves defendible frente al requisito de consentimiento libre (art. 7.4 RGPD) en este contexto B2B, o recomiendas hacerlo opcional en alguno de los dos sitios?
3. **Encargado de tratamiento**: vamos a operar todo el envío con Mailrelay. ¿Nos confirmas qué DPA/anexo de encargo hay que firmar con ellos y si su condición de proveedor español/UE te parece suficiente sin más análisis de transferencias?

Cualquier cambio que indiques se aplica en días (los textos del consentimiento están versionados: un cambio de texto genera versión nueva en la evidencia).
