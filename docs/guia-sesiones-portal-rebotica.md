# Guía de sesiones · portal + Rebotica

> Cómo pedir cada trabajo, dónde, con qué modelo y en qué orden. Escrita 2026-07-09.
> **Restricción que manda: vacaciones de Francesc del 17-07 al 10-08**; equipo escalonado en agosto; todos operativos la última semana de agosto. D-day: jueves 10-09.
> **Principio del sprint: todo lo que te necesita a TI ocurre antes del 17-07; todo lo demás queda en borrador para validar a tu vuelta (11-08), con margen hasta el teaser de N26 (20-08).**

## 1 · Reglas rápidas

**Cómo se arranca CUALQUIER sesión** (da igual Cowork o Code): una frase basta, las skills y el CLAUDE.md hacen el resto:
> "Lee el CLAUDE.md raíz y la ficha de la Rebotica. Tanda: [lo que toque]."

**Cómo se cierra**: no cierres tú nada; toda sesión debe ejecutar la **CODA DE CIERRE del CLAUDE.md raíz** (actualizar tareas de Notion afectadas con evidencia + ESTADO-PRODUCCION si es editorial + ficha de memoria + resumen). Los prompts A-H de esta guía se consideran TODOS terminados en esa coda aunque no la repitan literalmente. Si una sesión no la hace sola, la última orden es:
> "Ejecuta la coda de cierre del CLAUDE.md raíz y dime qué queda."

**Qué modelo usar:**

| Modelo | Cuándo | Por qué |
|---|---|---|
| **Sonnet 5 + skill** | TODO lo tandeable: SQL ya especificada, UI con spec, píldoras, emails, posts, informes, quincenas | Las skills llevan el conocimiento; el modelo solo ejecuta. Rápido y barato |
| **Opus 4.8 / Fable 5** | Primeras veces con decisión: prueba Mailrelay (go/no-go), cambios de spec, problemas raros de deploy | Criterio y diagnóstico valen más que velocidad |

**Dónde:**

| | Cowork | Claude Code |
|---|---|---|
| Redacción (emails, píldoras, posts, informes), UI en código, navegador, Google Calendar, organización | ✓ | |
| Prueba y operación de Mailrelay (API), git pull/push, PDFs (Chrome headless), MCP Clientify, scripts locales | | ✓ |

## 2 · Las sesiones, una a una (prompt literal para copiar)

### A · Prueba Mailrelay (Claude Code · Opus/Fable · SIN skill, va por ficha)
Prerequisito TUYO: cuenta gratuita en mailrelay.com + verificar dominio remitente (te dará registros DNS, como hicimos con Clientify) + generar API key (Configuración → API).
> "Lee el CLAUDE.md raíz y la ficha de la Rebotica (sección Mailrelay). Prueba end-to-end según el plan §8 con esta API key: [KEY] y cuenta [subdominio]. Grupo de prueba, 20 contactos con sync, campaña con nuestro HTML real de N22, send_test a control@mkpro.es, lee stats, prueba un webhook. Informe go/no-go y deja el estado escrito."

### B · SQL tanda 1 (Cowork o Code · Sonnet 5 · skill rebotica-tecnica)
> "Tanda SQL de la Rebotica: prepara la tanda 1 completa (esquema §2.1 del plan + consent_ledger + vista v_rebotica_dashboard), idempotente, en un solo fichero listo para que yo lo ejecute en el SQL editor."

Después TÚ la ejecutas (10 min) y respondes "ejecutada" para que quede verificada.

### C · UI cajonera + landing de lanzamiento (Cowork · Sonnet 5 · skill rebotica-tecnica)
Spec visual = la demo eOnbox (v3) para la skin partner y cajonera clásica por defecto.
> "Tanda UI de la Rebotica: página /rebotica con la cajonera (spec del plan §2.3, referencia visual demo-eonbox-rebotica.html) + landing de lanzamiento con planes y contador fundador. Commits al repo del portal; el push lo hago yo desde el Mac." 

(El push y `git pull --rebase` en el Mac: o lo haces tú o una sesión de Claude Code con "sincroniza el repo del portal".)

### D · Prompt Lovable backend Rebotica (Cowork · Sonnet 5 · skill rebotica-tecnica)
> "Prepara el prompt ÚNICO para Lovable con el backend de la Rebotica (open-reward, redeem-reward, cron, templates según plan §2.2). Enséñamelo antes de enviarlo."
Lo revisas, dices "envíalo" (va por el conector, gasta créditos) y la sesión verifica el deploy después.

### E · Stripe del portal (Lovable · prompt nº 2 del reparto 02-07)
> "Recupera el prompt nº 2 de portal-reparto-tareas-2026-07-02.md, actualízalo si hace falta y enséñamelo para enviarlo a Lovable."
**CRÍTICO ANTES DEL 17-07: tu pago en modo test** (tarjeta 4242) cuando esté desplegado: eres el único que puede.

### F · Contenido en tandas (Cowork · Sonnet 5 · skills rebotica-contenido y rebotica-quincena)
Pueden correr aunque estés fuera si alguien las lanza; quedan en borrador para tu validación del 11-08.
> "Tanda de contenido Rebotica: las 8 primeras píldoras con quiz (propón la lista de N de origen primero)."
> "Tanda: estructura completa del reto de 21 días."
> "Prepara la quincena: emails del D-day + teasers N26/N27 + RE + posts, en borrador."

### G · Outreach partners (Alejandro · antes del 17-07 si puede)
Materiales listos: dossier PDF (te falta el Cmd+P), demo eOnbox, plantillas en `dossier-partner-rebotica/outreach-partners.md`. Email warm a Apotheka y plusfarma; las llamadas, si no caen esta semana, a la vuelta (hay margen: primer cajón patrocinado es el 24-09).

### H · Informes y quincenas recurrentes (post-lanzamiento · Sonnet 5 · skill rebotica-quincena)
> "Prepara la quincena [n] del cajón" · "Informe del partner de la quincena [n]".

## 3 · Tu sprint personal antes de vacaciones (9-16 julio)

| Día | Tú (poco y crítico) | Claude/Lovable (en paralelo) |
|---|---|---|
| Jue 9 - Vie 10 | Cuenta Mailrelay + DNS + API key (20 min) · PDF dossier Cmd+P (5 min) · logo Apotheka si lo tienes | Sesión B (SQL tanda 1) lista para ti |
| Vie 10 - Lun 13 | Ejecutar SQL tanda 1 (10 min) | Sesión A (prueba Mailrelay) · Sesión C (UI + landing) |
| Lun 13 - Mar 14 | OK al prompt Lovable backend (5 min) | Sesión D enviada + verificada · Sesión E preparada |
| Mar 14 - Mié 15 | OK al prompt Stripe + **pago test** (15 min) | Sesión F tanda 1 (píldoras + emails borrador) |
| Mié 15 - Jue 16 | Prueba tú mismo el flujo: email test → cajón → registro → premio (10 min) · email al equipo (ya redactado) | Cierre: estado escrito + calendario Google actualizado |

Si algo se cae del sprint, que sea contenido (se recupera en agosto), nunca: Mailrelay key, SQL, Stripe test. Eso solo puedes tú.

## 4 · Mientras estás fuera (17-07 → 10-08)

**Cómo se crea el contenido (aclarado 09-07):** nadie escribe a mano; una sesión con la skill produce FICHEROS de borrador en la carpeta (1 frase la dispara, la skill lleva la receta entera: fuentes N1-N21, estructura, reglas, dónde guardar). "Borrador" = cortafuegos: cargar al portal es SQL que ejecutas tú y los envíos pasan por tu OK; nada se escapa solo.

Tres vías reales para producir sin ti:
1. **La buena (doctrina de antelación): disparar las tandas F antes del 17-07** y marcharte con todo en borrador. Coste para ti: la frase + validar la lista propuesta (minutos por tanda).
2. **Tareas programadas**: se puede dejar programado que las tandas restantes se ejecuten solas en fechas concretas (p. ej. lunes 21-07 y 28-07) y los borradores te esperen.
3. Alejandro/Laura SOLO si trabajan sobre esta misma carpeta (el proyecto vive en el Mac de Francesc); sin ese acceso montado, esta vía no cuenta.

- Nada te va a pinchar: sin avisos durante las vacaciones.
- Todo queda en `portal-plan-rebotica-maestro.md` (tablero) + ficha de memoria: cualquier sesión sabe dónde está.

## 5 · Tu vuelta (lunes 11-08)

Primera frase al abrir Cowork:
> "Lee el CLAUDE.md raíz y la ficha de la Rebotica y dime dónde estamos y qué validaciones tengo pendientes."

Semana 11-16 ago: validar borradores (emails, píldoras, reto) + encargar cajones físicos (S34, llegan de sobra) + llamadas partner si quedaron pendientes. El teaser 1 sale en N26 (20-08): tienes una semana entera de margen. Última semana de agosto, con todo el equipo: ensayo general. Septiembre: ejecución.
