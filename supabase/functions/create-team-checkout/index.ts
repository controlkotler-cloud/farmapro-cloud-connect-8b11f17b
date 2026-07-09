// =====================================================================
// DEPRECADO — modelo antiguo (premium/profesional por asiento).
// El nuevo checkout de equipo se gestiona con plan='equipo' en
// supabase/functions/create-checkout (ver src/lib/plans.ts).
// Se mantiene el archivo para no romper referencias, pero devuelve 410.
// =====================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(() => new Response(
  JSON.stringify({
    error: 'create-team-checkout está deprecado. Usa create-checkout con { plan: "equipo", cycle: "monthly"|"yearly" }.',
  }),
  { status: 410, headers: { 'Content-Type': 'application/json' } },
));
