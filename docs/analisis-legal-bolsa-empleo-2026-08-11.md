# Bolsa de trabajo en el portal farmapro — análisis legal y diseño recomendado

> Fecha: 11-08-2026 · Sesión Cowork · Estado: ANÁLISIS para decisión de Francesc
> Pregunta: ¿puede el portal albergar una bolsa de trabajo cumpliendo la legislación vigente, y cuál es la mejor forma de hacerlo, sabiendo que el candidato tipo es un empleado cuyo acceso al portal lo paga su titular actual?

---

## 1. Conclusión ejecutiva

**Sí, es viable legalmente**, y sin necesidad de constituirse en agencia de colocación, siempre que la bolsa sea un **tablón automatizado de ofertas con candidatura confidencial** y farmapro no haga selección ni valoración de candidatos. El obstáculo real no es la ley: es el que tú mismo detectaste — la privacidad del candidato frente al titular que paga la suscripción. Y ese problema **no se arregla con avisos legales: se arregla con arquitectura**, desacoplando por completo el lado candidato de las cuentas del portal.

La recomendación en una frase: **ofertas dentro del ecosistema (las publica la farmacia con plan), candidaturas FUERA del sistema de cuentas del portal** (formulario público con email personal, visible solo para la farmacia que publica, con borrado automático). Así el empleado nunca necesita el acceso que paga su jefe, y su jefe no puede ver nada ni aunque quisiera.

---

## 2. Marco legal vigente (verificado agosto 2026)

### 2.1 ¿Necesita farmapro ser agencia de colocación? NO (con una línea roja clara)

- La **Ley 3/2023, de Empleo** (art. 3) define la intermediación laboral como el conjunto de acciones de prospección, captación, puesta en contacto y **selección** destinadas a casar oferta y demanda, y añade un criterio decisivo: *"para que se considere intermediación o colocación laboral, el conjunto de acciones descritas no debe llevarse a cabo exclusivamente por medios automatizados"*.
- Traducción práctica: **un tablón donde la farmacia publica su oferta y el candidato se apunta, y todo fluye de forma automática sin que farmapro valore perfiles, filtre, recomiende o preseleccione, NO es intermediación laboral** y por tanto no exige régimen de agencia de colocación.
- El **RD 1796/2010** (agencias de colocación) sigue vigente; desde la reforma de 2014 (RDL 8/2014 / Ley 18/2014) el requisito ya no es autorización sino **declaración responsable** ante el SEPE o la comunidad autónoma. Es un trámite telemático y gratuito, pero arrastra obligaciones (suministro de datos al Sistema Nacional de Empleo, memoria anual, garantía de igualdad).
- **Línea roja**: en el momento en que farmapro haga *matching* activo, criba de CVs, recomendación de candidatos a farmacias o "te buscamos personal", pasa a ser intermediación → declaración responsable obligatoria. Ejercer intermediación sin ella es infracción **muy grave** de la LISOS. Mientras la bolsa sea tablón puro, fuera de peligro.
- Obligación que conviene autoimponerse desde el día 1 aunque no seamos agencia: **gratuidad total para el candidato**. Cobrar al trabajador por acceder a ofertas o candidatarse está prohibido para las agencias y sería indefendible ética y comercialmente para farmapro. Esto refuerza tu intuición: el candidato no puede necesitar un plan de pago.

### 2.2 Protección de datos (RGPD + LOPDGDD, criterio AEPD)

La guía de la AEPD «La protección de datos en las relaciones laborales» fija el criterio para selección de personal:

- **Base jurídica**: la candidatura NO necesita consentimiento; se ampara en el **art. 6.1.b RGPD** (medidas precontractuales a petición del interesado — el candidato se presenta voluntariamente a una oferta).
- **Roles**: la **farmacia que publica es la responsable del tratamiento** de las candidaturas a su oferta (es quien decide para qué: contratar). **farmapro es encargado del tratamiento** (art. 28 RGPD): pone la plataforma. Hace falta un contrato/cláusula de encargo — se resuelve con un anexo a las condiciones del plan que la farmacia acepta al activar la publicación de ofertas.
- **Conservación**: cerrado el proceso, desaparece la base jurídica → los datos del candidato no contratado se **suprimen**, salvo consentimiento expreso del candidato para permanecer en una bolsa. Recomendación operativa: borrado automático 30 días tras el cierre de la oferta, sin excepciones en la v1 (no montar "CV-teca" persistente: es donde viven los riesgos).
- **Deber de información** (art. 13 RGPD): cláusula clara en el formulario de candidatura: quién es responsable (la farmacia X), para qué, cuánto tiempo, derechos.
- **Minimización**: pedir solo lo necesario — nombre, contacto personal, experiencia/titulación, CV opcional. Sin foto obligatoria, sin DNI, jamás datos de salud. Cuanto menos se recoge, menos hay que proteger.
- **Confidencialidad como medida de seguridad (art. 32 RGPD)**: en este caso concreto, "medidas técnicas apropiadas al riesgo" significa literalmente que **ningún titular pueda ver candidaturas que no sean a SU oferta**. El riesgo identificado (el jefe actual descubre que su empleado se postula) es exactamente el tipo de daño que el RGPD obliga a prevenir por diseño (art. 25, privacidad desde el diseño).

### 2.3 Contenido de las ofertas

- **No discriminación**: las ofertas no pueden discriminar por edad, sexo, etc. La discriminación en el acceso al empleo es infracción **muy grave** (LISOS). Como plataforma conviene un checklist de moderación antes de publicar (rechazar "chica joven para mostrador").
- **Transparencia retributiva**: la **Directiva (UE) 2023/970** obliga a informar al candidato de la retribución inicial o su banda antes de la entrevista y prohíbe preguntar por el historial salarial. El plazo de transposición venció el **7-06-2026 y España aún no la ha transpuesto** (en tramitación por decreto, agosto 2026 — verificado en prensa especializada). Recomendación: **banda salarial obligatoria en las ofertas desde el día 1**. Cumplimiento anticipado de lo que viene, y de paso las ofertas con sueldo visible convierten mucho mejor — diferencial real frente a los tablones de los COF.
- **LSSI-CE**: condiciones del servicio de bolsa en el aviso legal del portal (identificación del prestador, reglas de uso). Trámite menor.

---

## 3. El problema ético: por qué el diseño estándar estaba mal y cómo se invierte

El diseño "natural" (la bolsa como una sección más del portal, con las cuentas existentes) es exactamente el que no funciona:

1. El empleado accede con una plaza que paga su titular → **el titular financia la fuga de su propio equipo** y además la relación de cuentas (equipo → titular) crea la posibilidad técnica de cruzar datos. Aunque nunca se enseñara nada, el candidato racional no se fía: bolsa muerta.
2. Cualquier "base de datos de candidatos consultable" agrava ambos problemas y además acerca farmapro a la intermediación (§2.1).

La inversión del diseño: **la bolsa no es una funcionalidad para empleados del portal; es una funcionalidad para farmacias que contratan, con un canal de entrada público y anónimo para cualquier profesional del sector**. El candidato no necesita ser usuario del portal, ni serlo le aporta nada en este flujo. Con eso:

- El dilema "acceso pagado por el jefe" desaparece: no hay acceso que necesitar.
- La audiencia B2B se mantiene (regla 15-07-2026): quien recibe el servicio y el mensaje comercial es la farmacia titular; el candidato es un profesional del sector que usa un formulario público, como respondería a un anuncio.
- Ventaja extra: las ofertas públicas en farmapro.es son contenido indexable (SEO local "trabajo técnico de farmacia Zaragoza") y un imán de leads B2B — farmacias que llegan buscando personal y descubren farmapro.

---

## 4. Modelos posibles y recomendación

| Modelo | Descripción | Legal | Ético | Veredicto |
|---|---|---|---|---|
| **A. Tablón público + candidatura confidencial** | Ofertas públicas en farmapro.es/empleo (las publica la farmacia con plan desde el portal). Candidatura por formulario público, sin cuenta, con email personal. Solo la ve la farmacia anunciante. | Sin requisito de agencia. RGPD sencillo (encargo + borrado automático) | El candidato nunca toca el portal ni necesita plan | **RECOMENDADO** |
| B. Bolsa interna con cuentas candidato gratuitas separadas | Como A pero el candidato crea una cuenta gratuita en el portal con email personal | Igual que A | Mejor que el statu quo, pero reintroduce cuentas y con ellas la sombra de trazabilidad; más fricción para candidatarse | Posible v2, no para lanzar |
| C. CV-teca consultable por titulares | Los candidatos suben su perfil y las farmacias buscan | Roza intermediación; conservación indefinida; máximo riesgo AEPD | El peor: exposición pasiva del empleado | **Descartar** |

### Cómo aterriza el modelo A en vuestro stack (portal Lovable + Supabase)

1. **Publicación**: nueva sección "Empleo" en el portal para titulares con plan (Plus/Equipo). Formulario de oferta con campos cerrados: puesto, jornada, provincia/localidad, **banda salarial obligatoria**, requisitos, fecha de cierre. Estado borrador → revisión antidiscriminación (checklist, puede ser semiautomática) → publicada.
2. **Difusión**: página pública `farmapro.es/empleo` (o subruta pública del portal) con las ofertas activas. Sin login para ver ni para candidatarse. Prerender del Worker SEO como el blog.
3. **Candidatura**: formulario público → fila en tabla `empleo_candidaturas` + CV en bucket privado (signed URL caducable). Aviso en el propio formulario: *"Usa tu email personal, nunca el de tu farmacia. Tu candidatura solo la verá la farmacia que publica esta oferta. El resto de farmacias, incluida la tuya, no puede ver nada."* Esa frase, visible, es la que hace que la bolsa se use.
4. **Entrega**: la farmacia anunciante ve sus candidaturas en su panel (RLS: `farmacia_id` de la oferta y nadie más — mismo patrón de RLS estricta que ya usáis en la Rebotica) + email de aviso vía `send-portal-email` (plantilla nueva en el registry).
5. **Retención**: cron diario (como `fin-prueba` 09:15 UTC) que suprime candidaturas y CVs a los 30 días del cierre de la oferta. Consentimientos e información art. 13 registrados en `consent_ledger`, que ya existe.
6. **Cero cruce**: `empleo_candidaturas` no tiene FK a usuarios del portal. Ni siquiera se intenta saber si el candidato es usuario. Lo que no se enlaza no se puede filtrar.
7. **Textos legales** (una tanda de redacción): cláusula art. 13 del formulario, política de privacidad de la bolsa, anexo de encargo de tratamiento a las condiciones del plan, checklist de moderación de ofertas, y alta del tratamiento en el registro de actividades de Mkpro.

### Encaje comercial

La bolsa es un **beneficio del plan del titular** (publicar ofertas ilimitadas/al mes), no un producto para candidatos. Es un argumento de venta potente — la falta de personal es dolor real del sector — y monetiza al que ya paga, sin cobrar jamás al trabajador (§2.1). Opción futura: oferta suelta de pago para farmacias sin plan (puerta de entrada al portal).

---

## 5. Qué NO hacer (resumen de riesgos)

- No montar base de CVs persistente ni buscador de candidatos (riesgo AEPD + roza intermediación).
- No hacer criba, recomendación ni "te presentamos 3 candidatos" sin antes presentar declaración responsable de agencia de colocación.
- No vincular candidaturas a cuentas del portal ni loguear nada que permita cruzar candidato ↔ farmacia empleadora actual.
- No publicar ofertas sin filtro antidiscriminación ni sin banda salarial.
- No cobrar nunca nada al candidato.

---

## 6. Fuentes

- Ley 3/2023, de 28 de febrero, de Empleo — definición de intermediación laboral (art. 3) y agencias de colocación: [BOE-A-2023-5365](https://www.boe.es/buscar/act.php?id=BOE-A-2023-5365)
- RD 1796/2010, agencias de colocación (vigente, régimen de declaración responsable desde 2014): [BOE-A-2010-20151](https://www.boe.es/buscar/act.php?id=BOE-A-2010-20151)
- AEPD, «La protección de datos en las relaciones laborales» — selección de personal, base 6.1.b, conservación, roles: [aepd.es](https://www.aepd.es/documento/la-proteccion-de-datos-en-las-relaciones-laborales.pdf) · [nota de prensa](https://www.aepd.es/prensa-y-comunicacion/notas-de-prensa/aepd-publica-guia-pd-y-relaciones-laborales)
- Ministerio de Trabajo, guía laboral — agencias de colocación: [mites.gob.es](https://www.mites.gob.es/es/guia/texto/guia_1/contenidos/guia_1_3_3.htm)
- SEPE — agencias de colocación y obligaciones: [sepe.es](https://www.sepe.es/HomeSepe/en/encontrar-trabajo/agencias-colocacion.html) · [obligaciones SISPE (PDF)](https://www.sistemanacionalempleo.es/HomeSne/dam/sne/pdf/agencias/SISPE_Obligaciones_de_las_AC.pdf)
- Declaración responsable (trámite autonómico, ejemplo): [Gobierno de Canarias](https://sede.gobiernodecanarias.org/sede/tramites/7416) · [Castilla-La Mancha](https://empleoyformacion.castillalamancha.es/empresas/empleo/como-constituir-agencia-colocacion)
- Directiva (UE) 2023/970 de transparencia retributiva — plazo vencido 7-06-2026, España sin transponer a agosto 2026: [Iberley](https://www.iberley.es/revista/la-directiva-ue-2023-970-un-nuevo-umbral-exigencia-igualdad-retributiva-partir-7-junio-2026-1569) · [rrhhdigital 08-06-2026](https://www.rrhhdigital.com/secciones/legal/797519/la-directiva-de-transparencia-retributiva-el-plazo-vencio-ayer-y-espana-aun-no-la-ha-traspuesto/) · [moncloa.com 07-08-2026](https://www.moncloa.com/2026/08/07/transparencia-salarial-espana-multa-bruselas-3411735/)

> Nota: esto es un análisis de trabajo, no asesoramiento jurídico. Antes de lanzar, conviene que un laboralista revise los textos legales finales (coste bajo: es una revisión, no una redacción desde cero).
