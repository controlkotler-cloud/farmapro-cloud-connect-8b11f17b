# Cláusula EL BAÚL para las bases legales de la Rebotica (15-07-2026)

> Decisión de Francesc (15-07, Cowork): el control de entrega del Baúl va en las BASES, no en verificación técnica.
> Destino: `src/pages/ReboticaBasesLegales.tsx` — insertar como nueva sección tras "5. Caducidad y canje" y renumerar las siguientes (6→7, 7→8, 8→9, 9→10).
> Ámbito: SOLO el Baúl. El Gordo no lleva cláusula equivalente por ahora.

## Texto de la sección (listo para pegar)

**Título:** `6. EL BAÚL: sorteo mensual, adjudicación y entrega`

**Cuerpo:**

EL BAÚL es el premio físico que se sortea una vez al mes entre todas las aperturas de cajón del mes natural (cada apertura equivale a una participación). Su adjudicación y entrega quedan sujetas a las siguientes condiciones particulares: (a) solo podrá recibirlo quien, en la fecha del sorteo, sea titular o cotitular de una oficina de farmacia abierta al público en España; no se entregará a empleados o colaboradores de la farmacia ni a personas ajenas a su titularidad, sin perjuicio de que su participación siga siendo válida a todos los demás efectos de la Rebotica. (b) farmapro podrá solicitar al ganador acreditación razonable de dicha titularidad antes del envío. (c) La entrega se realizará única y exclusivamente en la oficina de farmacia de la que el ganador sea titular, dentro de su horario de apertura; no se realizarán entregas en domicilios particulares ni a terceros. (d) Si el ganador no reuniera la condición de titular, no la acreditara en el plazo de siete (7) días naturales desde la comunicación del premio, renunciara a él o la entrega no pudiera completarse por causas a él imputables, el premio se declarará desierto respecto de ese ganador y se celebrará un nuevo sorteo entre las restantes participaciones del mismo mes, al que resultarán de aplicación estas mismas condiciones. (e) EL BAÚL es personal e intransferible y no es canjeable por dinero ni por otros premios.

## Snippet TSX (para la sesión Code)

```ts
{
  title: '6. EL BAÚL: sorteo mensual, adjudicación y entrega',
  body: 'EL BAÚL es el premio físico que se sortea una vez al mes entre todas las aperturas de cajón del mes natural (cada apertura equivale a una participación). Su adjudicación y entrega quedan sujetas a las siguientes condiciones particulares: (a) solo podrá recibirlo quien, en la fecha del sorteo, sea titular o cotitular de una oficina de farmacia abierta al público en España; no se entregará a empleados o colaboradores de la farmacia ni a personas ajenas a su titularidad, sin perjuicio de que su participación siga siendo válida a todos los demás efectos de la Rebotica. (b) farmapro podrá solicitar al ganador acreditación razonable de dicha titularidad antes del envío. (c) La entrega se realizará única y exclusivamente en la oficina de farmacia de la que el ganador sea titular, dentro de su horario de apertura; no se realizarán entregas en domicilios particulares ni a terceros. (d) Si el ganador no reuniera la condición de titular, no la acreditara en el plazo de siete (7) días naturales desde la comunicación del premio, renunciara a él o la entrega no pudiera completarse por causas a él imputables, el premio se declarará desierto respecto de ese ganador y se celebrará un nuevo sorteo entre las restantes participaciones del mismo mes, al que resultarán de aplicación estas mismas condiciones. (e) EL BAÚL es personal e intransferible y no es canjeable por dinero ni por otros premios.',
},
```

Coherencia comprobada con las bases actuales: §2 (participación abierta a mayores de edad del sector) no cambia — la condición de titular es de ENTREGA del Baúl, no de participación; §5 (no canjeable por dinero) se refuerza en (e); mecánica de sorteo mensual = catálogo v4 (cada apertura del mes = 1 participación).
