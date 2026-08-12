# farmapro — Portal de formación y comunidad

Portal de formación, recursos, comunidad y empleo para profesionales de farmacia (vertical farmapro de Mkpro).

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind + shadcn/ui
- **Backend:** Supabase (Postgres + RLS + Edge Functions en Deno)
- **Pagos:** Stripe (planes individuales y de equipo)
- **CRM:** Clientify (vía edge function `clientify-sync`, solo CRM) · **Email:** Mailrelay (masivo + transaccional del portal; la edge `send-portal-email` llega con el prompt Lovable nº 1 — la invitación de equipo ya sale por Mailrelay)
- **Build/Deploy:** Lovable (auto-commit al repo conectado)

## Desarrollo

```sh
npm install      # o: bun install
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run lint     # eslint
npm test         # vitest
```

## Variables de entorno

Definir en `.env` (NO versionar — ver `.gitignore`). Solo claves públicas `VITE_`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

Los secretos de servidor (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY,
OPENAI_API_KEY, LOVABLE_API_KEY, CLIENTIFY_API_KEY) se configuran como secrets de las Edge Functions
en Supabase, nunca en el frontend.

## Estructura

- `src/pages/` — páginas (público, dashboard, `admin/`)
- `src/components/` — UI por dominio (course, community, forum, subscription, admin, …)
- `src/hooks/` — acceso a datos (React Query) y lógica de cliente
- `src/integrations/supabase/` — cliente y tipos generados
- `supabase/functions/` — Edge Functions (pagos, IA, clientify, generación diaria)
- `supabase/migrations/` — esquema y políticas RLS

## Seguridad (resumen)

- La autorización vive en **RLS** (servidor); el rol de admin se determina en `user_roles`
  vía `is_current_user_admin()`. Los checks de cliente son solo UX.
- El plan de suscripción es `profiles.subscription_role` (la columna `role` está obsoleta).
- Ver `docs/auditoria-portal-2026-06-17.md` para el estado de hallazgos.
