# Troubleshooting: Proactive AI Not Working

## Common Issues

### 1. Database Tables Don't Exist (Migrations Not Run)

**Symptoms:**
- No messages appearing in chat
- API errors in browser console
- 500 errors when calling `/api/chat/proactive`

**Fix:**
Run the migrations in Supabase SQL Editor:
1. `migrations/004_proactive_ai.sql`
2. `migrations/005_proactive_functions.sql`

**How to Check:**
```sql
-- In Supabase SQL Editor, check if tables exist:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('events', 'proactive_messages', 'conversations');
```

### 2. No Events Detected Yet

**Symptoms:**
- Chat shows greeting message but no proactive alerts
- No errors, just no messages

**Fix:**
Manually trigger event detection:
```bash
# After logging in, call this endpoint:
GET /api/proactive/check
```

Or wait for background job (runs every 15 minutes).

**How to Check:**
```sql
-- Check if events exist:
SELECT * FROM events WHERE user_id = 'your-user-id' ORDER BY detected_at DESC LIMIT 10;

-- Check if messages exist:
SELECT * FROM proactive_messages WHERE user_id = 'your-user-id' ORDER BY created_at DESC LIMIT 10;
```

### 3. Background Jobs Not Running

**Symptoms:**
- Events exist but no messages generated
- Messages not appearing over time

**Fix:**
- If using Vercel: Check Vercel Dashboard → Functions → Cron Jobs
- If using external cron: Verify the cron job is set up and calling `/api/cron/proactive-check`
- Manual test: Call `/api/proactive/check` directly

### 4. API Errors in Console

**Check Browser Console:**
1. Open dashboard
2. Open browser DevTools (F12)
3. Check Console tab for errors
4. Check Network tab for failed API calls

**Common Errors:**
- `relation "proactive_messages" does not exist` → Run migrations
- `Unauthorized` → Check authentication/session
- `Failed to generate embedding` → Check OPENAI_API_KEY
- `relation "conversations" does not exist` → Run migrations

### 5. Chat Interface Not Loading Messages

**Symptoms:**
- Dashboard loads but chat is empty
- No greeting message appears

**Debug Steps:**
1. Check browser console for errors
2. Check Network tab - is `/api/chat/proactive` being called?
3. What response does it return?
4. Check if messages state is being set in React

**Quick Fix:**
Open browser console and run:
```javascript
fetch('/api/chat/proactive')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

This will show you the raw API response.

## Step-by-Step Debugging

### Step 1: Verify Migrations Are Run

```sql
-- Run in Supabase SQL Editor
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'proactive_messages'
);
```

Should return `true`. If `false`, run migrations.

### Step 2: Check Authentication

```sql
-- Check if you're logged in (replace with your user ID)
SELECT id, email FROM auth.users LIMIT 1;
```

### Step 3: Manually Trigger Event Detection

Call the endpoint directly:
```bash
# In browser console (after logging in):
fetch('/api/proactive/check', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

This should:
- Detect events
- Generate messages
- Return a response with counts

### Step 4: Check Generated Messages

```sql
SELECT * FROM proactive_messages 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC 
LIMIT 5;
```

### Step 5: Test Proactive Chat Endpoint

```bash
# In browser console:
fetch('/api/chat/proactive', { credentials: 'include' })
  .then(r => r.json())
  .then(data => {
    console.log('Messages:', data.messages);
    console.log('Has proactive:', data.hasProactiveMessages);
  })
  .catch(console.error)
```

Should return messages array.

### Step 6: Check Frontend Code

Open browser console, check for:
- React errors
- API call errors
- State update errors

## Quick Fixes

### Fix 1: Run Migrations (Most Common Issue)

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `migrations/004_proactive_ai.sql`
3. Paste and run
4. Copy contents of `migrations/005_proactive_functions.sql`
5. Paste and run
6. Refresh dashboard

### Fix 2: Generate Test Events

If tables exist but no events:
1. Update your profile budget to a low value (e.g., $20000 with $10000 monthly burn)
2. Call `/api/proactive/check`
3. Should generate low runway alert

### Fix 3: Reset and Test

```sql
-- Clear all proactive data (for testing)
DELETE FROM proactive_messages WHERE user_id = 'your-user-id';
DELETE FROM events WHERE user_id = 'your-user-id';
DELETE FROM conversations WHERE user_id = 'your-user-id';
```

Then trigger event detection again.

## Expected Behavior

**When Working Correctly:**
1. User opens dashboard
2. Frontend calls `/api/chat/proactive`
3. Backend returns messages (greeting or proactive messages)
4. Messages appear in chat interface
5. Chat opens automatically or shows notification

**First Time Setup:**
- No events yet → Shows greeting message
- After events detected → Shows proactive messages
- Messages persist until user reads/dismisses them

## Still Not Working?

1. Check all error messages in browser console
2. Check Supabase logs (Dashboard → Logs)
3. Verify OPENAI_API_KEY is set in `.env.local`
4. Check network tab for failed API calls
5. Verify user is authenticated (check session/cookies)

## Contact/Report Issue

If still not working after all steps:
1. Copy all console errors
2. Copy API response from `/api/chat/proactive`
3. Check Supabase logs for database errors
4. Verify migrations were run successfully

