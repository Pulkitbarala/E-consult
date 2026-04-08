# Authentication Testing Guide

## Current Error: "Invalid login credentials"

This error means one of the following:
1. **Account doesn't exist yet** - You need to sign up first
2. **Wrong email/password** - Double-check credentials
3. **Email not confirmed** - Check your email for verification link (if email confirmation is enabled in Supabase)

## How to Test Authentication

### Step 1: Sign Up (Create New Account)

1. Navigate to http://localhost:8080
2. Click on "Sign Up" tab
3. Fill in:
   - **Email**: Use a valid email address
   - **Password**: At least 6 characters
   - **Display Name**: At least 2 characters
4. Complete the Turnstile captcha
5. Click "Sign Up"

**Expected Result:**
- Frontend shows: "Account created! Please check your email to verify your account."
- Backend logs show: `Sign-up successful` with user ID
- Check your email for confirmation link (if email confirmation is enabled)

**Important:** If Supabase has email confirmation enabled, you MUST click the confirmation link in your email before you can sign in!

### Step 2: Check Email (If Required)

1. Check the email inbox for the email you used to sign up
2. Look for an email from Supabase
3. Click the confirmation link
4. You should be redirected to the app

### Step 3: Sign In

1. Navigate to http://localhost:8080
2. Click on "Sign In" tab
3. Enter the SAME email and password you used to sign up
4. Complete the Turnstile captcha
5. Click "Sign In"

**Expected Result:**
- Frontend shows: "Welcome back!"
- Backend logs show: `Sign-in successful` with user ID
- You should be redirected to the dashboard/feed

## Checking Backend Logs

The backend now logs detailed information for debugging:

### Sign-Up Logs:
```json
{"level":30,"msg":"Attempting sign-up","email":"user@example.com","displayName":"John Doe"}
{"level":30,"msg":"Sign-up successful","userId":"...", "email":"user@example.com","confirmed":null}
```

### Sign-In Logs:
```json
{"level":30,"msg":"Attempting sign-in","email":"user@example.com","hasCaptcha":true}
{"level":30,"msg":"Sign-in successful","userId":"...","email":"user@example.com"}
```

### Error Logs:
```json
{"level":50,"msg":"Sign-in failed","error":"Invalid login credentials","email":"user@example.com"}
```

## Common Issues & Solutions

### Issue: "Invalid login credentials" after sign-up

**Cause:** Email confirmation is required but not completed.

**Solution:**
1. Check your email inbox for confirmation link
2. Click the link to confirm your email
3. Then try signing in again

**OR**

Disable email confirmation in Supabase:
1. Go to Supabase Dashboard → Authentication → Settings
2. Under "Email Auth", disable "Enable email confirmations"
3. Try signing up again with a new email

### Issue: "Invalid body" error

**Cause:** Request validation failed (missing required fields or invalid format).

**Solution:**
- Make sure email is valid format (user@example.com)
- Password must be at least 6 characters
- Display name must be at least 2 characters

### Issue: Backend not responding

**Cause:** Backend server not running or port conflict.

**Solution:**
1. Check backend is running: http://localhost:4000/health
2. Should return: `{"status":"ok"}`
3. If not, restart backend: `cd backend && npm run dev`

### Issue: CORS error in browser console

**Cause:** Frontend origin not allowed in backend CORS config.

**Solution:**
- Check backend `.env` has: `FRONTEND_ORIGIN=http://localhost:8080`
- Restart backend after changing `.env`

## Testing with curl (Advanced)

### Test Sign-Up:
```bash
curl -X POST http://localhost:4000/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","displayName":"Test User"}'
```

### Test Sign-In:
```bash
curl -X POST http://localhost:4000/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## Recommended Test Flow

1. **First Time Setup:**
   - Sign up with a NEW email: `testuser@example.com`
   - Password: `test1234`
   - Display Name: `Test User`
   - Check email and confirm (if required)

2. **Test Sign-In:**
   - Use the SAME credentials: `testuser@example.com` / `test1234`
   - Should succeed and return access_token

3. **Test Protected Routes:**
   - After sign-in, try accessing profile: http://localhost:8080/profile
   - Try creating a consultation
   - Should work without errors

## Quick Fix: Reset Everything

If you're stuck with auth errors:

1. **Create new Supabase project** (if testing):
   - Go to https://supabase.com/dashboard
   - Create new project
   - Copy new URL and anon key
   - Update both frontend and backend `.env` files

2. **Or clear local data:**
   - Open browser DevTools → Application → Local Storage
   - Delete all `supabase.*` keys
   - Refresh page and try again

## Current Status

✅ Backend running on http://localhost:4000
✅ Frontend running on http://localhost:8080
✅ All routes registered and working
✅ Enhanced logging enabled

🔍 Next steps:
1. Try signing up with a new account
2. Check backend logs to see what's happening
3. Confirm email if required
4. Then try signing in again
