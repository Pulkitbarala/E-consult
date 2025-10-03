Backend migration and RPC to support Feed

What I added
- SQL migration: `supabase/migrations/20251002_create_get_feed_consultations.sql`
  - Creates SQL function `public.get_feed_consultations(p_user_id uuid, p_page int, p_page_size int)` that:
    - Excludes consultations the given user already commented on
    - Returns comment counts per consultation
    - Paginates results
  - Adds helpful indexes for `comments.consultation_id` and `consultations.expires_at`.

- Supabase Edge Function example: `supabase/functions/get-feed-consultations/index.ts`
  - Server-side wrapper that calls the RPC with service-role key and returns results as JSON.

How to apply migration
1. From the Supabase SQL editor, paste the SQL in `supabase/migrations/20251002_create_get_feed_consultations.sql` and run it.
2. Or if using `supabase` CLI with a project configured, run:

```bash
supabase db push
```

How to deploy the edge function
1. Install the Supabase CLI and login.
2. From the `supabase/functions/get-feed-consultations` folder run:

```bash
supabase functions deploy get-feed-consultations --project-ref your-project-ref
```

How to call the RPC directly from frontend (recommended)
- Using Supabase client (on server or client):

```ts
const { data, error } = await supabase.rpc('get_feed_consultations', { p_user_id: userId, p_page: 1, p_page_size: 20 });
```

Notes and security
- Running the RPC from the client may expose logic but not sensitive data. If you need to enforce stricter access (e.g., hide some fields), call the RPC from a server function using the service role key.
- The Edge Function example uses the service role key; keep it secret.

Next steps
- Integrate the frontend to call the RPC behind a feature flag (add a toggle in `src/integrations/supabase/client.ts` or via environment variable).
- Add tests for the SQL function (pgTAP) or run explain analyze to check performance for large tables.
