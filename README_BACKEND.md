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

## Comment analysis integration

- Migration `supabase/migrations/20251014_add_comment_analysis_fields.sql` adds three columns to `public.comments`:
  - `sentimenttype text`
  - `score numeric`
  - `keyword text`

- The frontend calls `http://localhost:8000/predict` after a new comment is inserted to analyze content and updates the same comment row with the returned fields. The expected JSON payload from the predictor is:

```json
{ "sentimenttype": "positive|neutral|negative", "score": 0.0, "keyword": "..." }
```

It also tolerates alternative keys like `sentimentType`/`sentiment` and `confidence` or `keywords` array.

- The analysis runs in two places:
  - Immediately after comment creation in `src/pages/ConsultationDetail.tsx`.
  - On realtime insert for the same consultation, but only for the current user's own comments to avoid RLS update failures.

- Ensure the local predictor is running on `http://localhost:8000/predict` and supports POST with `{ text: string }`.

### Dev proxy and CORS
- During development, `vite.config.ts` proxies `/predict` to `http://localhost:8000` to avoid CORS preflight hitting your ML server directly (which may return 405 for OPTIONS). The frontend calls a relative `'/predict'` path.
- Optionally, set `VITE_PREDICT_URL` in `.env` to override the endpoint.

