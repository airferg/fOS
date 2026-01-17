# Quick Fix: AI Assistant Not Working

## Most Likely Issue: Migrations Not Run

The proactive AI system requires database tables that are created by migrations. If you see no messages or errors, **run the migrations first**.

## Quick Fix Steps

### Step 1: Run Migrations

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Open `migrations/004_proactive_ai.sql`
4. Copy all the SQL code
5. Paste into SQL Editor and click **Run**
6. Open `migrations/005_proactive_functions.sql`
7. Copy all the SQL code
8. Paste into SQL Editor and click **Run**

### Step 2: Verify Tables Were Created

In SQL Editor, run:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('events', 'proactive_messages', 'conversations');
```

You should see 3 rows returned.

### Step 3: Refresh Your Dashboard

1. Refresh your browser
2. The AI should now show a greeting message
3. If you want proactive alerts, trigger event detection (see below)

### Step 4: Generate Test Events (Optional)

To see proactive messages in action:

1. **Option A: Update your budget** (to trigger low runway alert)
   - Go to your profile
   - Set budget to $20000 and monthly burn to $10000
   - Then call the check endpoint (see below)

2. **Option B: Manually trigger event detection**
   
   Open browser console (F12) and run:
   ```javascript
   fetch('/api/proactive/check', { credentials: 'include' })
     .then(r => r.json())
     .then(console.log)
     .catch(console.error)
   ```

   This will:
   - Detect events (budget changes, completed tasks, etc.)
   - Generate proactive messages
   - Return a response showing what was detected

3. **Refresh dashboard** - you should see proactive messages

## What Should Happen

**After migrations:**
- Dashboard loads
- Chat shows: "Welcome back, [Name]. I'm monitoring your startup and ready to help."
- This is the greeting message (working correctly!)

**After event detection:**
- Proactive messages appear about important events
- Examples: "Low runway alert", "Task completed", etc.

## If Still Not Working

1. **Check browser console** (F12 → Console tab)
   - Look for any red error messages
   - Share them if you need help

2. **Check Network tab** (F12 → Network tab)
   - Look for `/api/chat/proactive` request
   - Check if it returns 200 OK or an error
   - Click on it to see the response

3. **Verify you're logged in**
   - Make sure you can see your dashboard
   - Check that other API calls work (profile, roadmap, etc.)

## Common Error Messages

**"relation proactive_messages does not exist"**
→ Run migrations (Step 1 above)

**"Unauthorized"**
→ Make sure you're logged in, refresh the page

**"Failed to generate embedding"**
→ Check that OPENAI_API_KEY is set in `.env.local`

**No errors, but no messages**
→ This is normal! The system will show a greeting message. Proactive alerts only appear when events are detected. Run Step 4 to generate test events.

## Summary

1. ✅ Run migrations (`004_proactive_ai.sql` and `005_proactive_functions.sql`)
2. ✅ Refresh dashboard
3. ✅ You should see a greeting message
4. ✅ (Optional) Trigger event detection to see proactive alerts

The system is now working! Proactive alerts will appear automatically as events are detected (via background jobs or manual triggers).

