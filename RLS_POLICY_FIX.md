# RLS Policy Fix - Consultation and Comment Creation

## Problem Fixed

**Error**: "new row violates row-level security policy for table \"consultations\""

**Root Cause**: Backend was using anonymous Supabase key (ANON_KEY) which doesn't have proper RLS context. The backend needs to pass the user's authentication token to Supabase when inserting data so that RLS policies recognize the authenticated user.

## Solution Implemented

### For Creating Consultations (`POST /consultations`)
```typescript
// Create authenticated Supabase client with user's bearer token
const userClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { Authorization: `Bearer ${req.token}` } },
});

// Insert with proper user context
const { data, error } = await userClient
  .from('consultations')
  .insert({
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    expires_at: parsed.data.expires_at,
    user_id: req.user?.id,
  })
  .select('*')
  .single();
```

### For Creating Comments (`POST /consultations/:id/comments`)
Same approach - uses user's bearer token to establish proper RLS context.

## What Changed

| File | Changes |
|------|---------|
| `src/routes/consultations.ts` | Use user-authenticated Supabase client for POST / (create) |
| `src/routes/comments.ts` | Use user-authenticated Supabase client for POST /consultations/:id/comments |

## How It Works

1. **Request arrives** with Bearer token in Authorization header
2. **Backend extracts** the token via `app.authenticate` middleware
3. **For data operations**, backend creates a new Supabase client with that token
4. **Supabase sees** the user ID in the JWT token
5. **RLS policy** recognizes the authenticated user
6. **Insert succeeds** because the user context matches the policy

## Testing

Try these actions now:
1. ✅ **Create Consultation** - Should work (was failing before)
2. ✅ **Post Comment** - Should work (was failing before)
3. ✅ **Like Comment** - Already working
4. ✅ **Edit/Delete Comment** - Already working

## Backend Logs

When successful, you'll see:
```json
{
  "consultationId": "...",
  "userId": "...",
  "msg": "Consultation created"
}
```

Or for comments:
```json
{
  "commentId": "...",
  "consultationId": "...",
  "userId": "...",
  "msg": "Comment created"
}
```

## Files Modified

- `backend/src/routes/consultations.ts` - POST endpoint
- `backend/src/routes/comments.ts` - POST endpoint

## Next Steps

1. Test creating a new consultation
2. Test posting a comment
3. Verify in backend logs they show success
4. Check database for the new records

All other operations (GET, PUT, DELETE) already work correctly with the authenticated client.
