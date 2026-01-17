# FounderOS Setup Guide

This guide will walk you through setting up FounderOS from scratch.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier is fine)
- An OpenAI API key
- A Google Cloud Platform account

## Step 1: Environment Setup

1. Copy the example environment file:
```bash
cp .env.local.example .env.local
```

2. Install dependencies:
```bash
npm install
```

## Step 2: Supabase Setup

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose a name, password, and region
4. Wait for the project to be created

### 2.2 Get API Keys

1. In your Supabase project dashboard, go to Settings > API
2. Copy the following values to your `.env.local`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 2.3 Run Database Migration

1. In Supabase dashboard, go to SQL Editor
2. Open the file `migrations/001_init.sql` in your code editor
3. Copy the entire contents
4. Paste into the SQL Editor in Supabase
5. Click "Run" to execute the migration
6. Verify that tables were created by going to Table Editor

### 2.4 Configure Authentication

1. In Supabase dashboard, go to Authentication > Providers
2. Enable Email provider (should be enabled by default)
3. Enable Google OAuth:
   - Toggle "Google Enabled"
   - Keep this tab open - you'll add credentials after setting up Google Cloud

## Step 3: Google Cloud Setup

### 3.1 Create a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable billing (required for OAuth, but won't be charged for basic usage)

### 3.2 Enable Required APIs

1. Go to APIs & Services > Library
2. Search for and enable each of these APIs:
   - Gmail API
   - Google Calendar API
   - Google Docs API
   - Google People API

### 3.3 Configure OAuth Consent Screen

The OAuth consent screen is what users see when they authenticate with Google. This is a required configuration before you can create OAuth credentials.

1. Go to APIs & Services > OAuth consent screen
   - In Google Cloud Console, click the hamburger menu (☰) in the top-left
   - Select "APIs & Services"
   - Click "OAuth consent screen" in the left sidebar

2. Choose user type:
   - **External**: Choose this if you're using a personal Gmail account (most common)
     - Allows anyone with a Google account to sign in
     - Limited to 100 users until you publish the app
   - **Internal**: Only available if you have a Google Workspace organization
     - Only users in your organization can sign in
   - Click "Create"

3. Configure OAuth consent screen (Step 1 of 4):
   - **App name**: `FounderOS` (or your preferred name)
   - **User support email**: Select your email from dropdown
   - **App logo**: Optional - skip for now
   - **App domain**: Optional - skip for development
   - **Authorized domains**: Leave blank for now (add your production domain later)
   - **Developer contact information**: Enter your email address
   - Click "Save and Continue"

4. Add Scopes (Step 2 of 4):
   - Click "Add or Remove Scopes" button
   - In the filter box, search for each scope and check the box:
     - Type "userinfo.email" → Select `.../auth/userinfo.email`
     - Type "userinfo.profile" → Select `.../auth/userinfo.profile`
     - Type "gmail.send" → Select `.../auth/gmail.send`
     - Type "calendar" → Select `.../auth/calendar`
     - Type "documents" → Select `.../auth/documents`
   - You should see 5 scopes selected at the bottom
   - Click "Update" to save your scope selection
   - Click "Save and Continue" to proceed

5. Add Test Users (Step 3 of 4):
   - **Important**: While your app is in "Testing" mode, only added test users can sign in
   - Click "Add Users"
   - Enter your email address (the one you'll use to test)
   - Add any other email addresses you want to test with
   - Click "Add"
   - Click "Save and Continue"

6. Review Summary (Step 4 of 4):
   - Review your configuration
   - Click "Back to Dashboard"

Your OAuth consent screen is now configured! The app will remain in "Testing" mode, which is fine for development and personal use.

### 3.4 Create OAuth Client ID

1. Go to APIs & Services > Credentials
2. Click "+ Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Name it "FounderOS Web Client"
5. Add Authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (for development)
   - Your production domain URL when ready (e.g., `https://yourdomain.com/auth/callback`)
6. Click "Create"
7. Copy Client ID and Client Secret to `.env.local`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### 3.5 Complete Supabase Google OAuth Setup

1. Go back to Supabase dashboard > Authentication > Providers > Google
2. Paste your Google Client ID and Client Secret
3. Copy the "Callback URL" shown in Supabase
4. Go back to Google Cloud Console > Credentials
5. Edit your OAuth client
6. Add the Supabase callback URL to Authorized redirect URIs
7. Click "Save"

## Step 4: OpenAI Setup

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to API keys section
4. Create a new API key
5. Copy it to `.env.local` as `OPENAI_API_KEY`
6. Add billing information (required to use the API)
7. Set usage limits if desired

## Step 5: Additional API Keys (Optional)

The following integrations are **optional** and can be configured later. You can leave these as placeholder values in your `.env.local` for now:

### LinkedIn Integration (Optional)
Not currently used in the core app. Skip for now or set up if needed:

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Get Client ID and Client Secret
4. Add to `.env.local`:
   - `LINKEDIN_CLIENT_ID`
   - `LINKEDIN_CLIENT_SECRET`

### Zoom Integration (Optional)
Covered in "Optional Enhancements" section. Skip for initial setup.

### Tally Forms Integration (Optional)
If you want to use Tally forms:

1. Go to [tally.so](https://tally.so)
2. Sign up for an account
3. Go to Settings > API
4. Generate an API key
5. Add to `.env.local` as `TALLY_API_KEY`

### Notion Integration (Optional)
Covered in "Optional Enhancements" section. Skip for initial setup.

### Google Calendar & Gmail API Keys
**Note**: These individual API keys are **NOT required** if you've completed the Google Cloud Setup in Step 3. The OAuth credentials (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`) provide access to both Gmail and Calendar APIs. You can leave these as placeholder values:
- `GOOGLE_CALENDAR_API_KEY=your_google_calendar_api_key`
- `GMAIL_API_KEY=your_gmail_api_key`

## Step 6: Final Environment Configuration

Your `.env.local` should now have the **required** values filled in like this:

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# OpenAI (REQUIRED)
OPENAI_API_KEY=sk-xxx...

# Google OAuth & APIs (REQUIRED)
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# Optional Google API Keys (can leave as placeholders)
GOOGLE_CALENDAR_API_KEY=your_google_calendar_api_key
GMAIL_API_KEY=your_gmail_api_key

# Optional Integrations (can leave as placeholders)
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
TALLY_API_KEY=your_tally_api_key
NOTION_API_KEY=your_notion_api_key

# App URL (REQUIRED)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 7: Run the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000)

3. Click "Get Started" to create an account

4. Go through the onboarding process

## Step 8: Test the Features

### Test Authentication
- Sign up with email/password
- Sign in with Google OAuth
- Verify you're redirected to onboarding

### Test Onboarding
- Upload a resume (PDF or TXT file)
- Answer the Bird-in-Hand questions
- Verify you're redirected to dashboard

### Test Dashboard
- Chat with the AI assistant
- Ask it to suggest actions
- Verify the AI responds with context about your profile

### Test Actions (Requires Google OAuth)
1. **Email Action**:
   - First, import contacts via CSV
   - Ask AI: "Send emails to 3 people in my network about user research"
   - Verify email drafts and sends work

2. **Document Generation**:
   - Ask AI: "Create an interview script for talking to users"
   - Check that document appears in Documents page

3. **Calendar**:
   - Ask AI: "Schedule calls with my contacts"
   - Check Google Calendar for created events

### Test Other Pages
- **Roadmap**: Verify tasks are shown, drag between columns works
- **Network**: Import CSV of contacts, verify they appear
- **Documents**: Verify generated documents are listed

## Troubleshooting

### Supabase Connection Issues
- Verify your URL and keys are correct
- Check that RLS policies are enabled (should be from migration)
- Look at Supabase logs for errors

### OAuth Issues
**"Redirect URI mismatch"**
- Make sure callback URLs match exactly in Google Cloud and Supabase
- Include protocol (http/https)
- No trailing slashes

**"Access blocked: This app's request is invalid"**
- Verify OAuth consent screen is properly configured
- Check that scopes are added
- Make sure you're using a test user account if app is in testing mode

### Gmail API Not Working
- Verify Gmail API is enabled in Google Cloud
- Check that `gmail.send` scope is in OAuth consent screen
- After signing in with Google, check that tokens are saved in `oauth_tokens` table
- Tokens expire - implement refresh token logic if needed

### AI Not Responding
- Check OpenAI API key is correct
- Verify you have billing enabled and credits
- Check browser console and server logs for errors
- Verify OpenAI API status

### Database Errors
- Run the migration again if tables are missing
- Check that RLS policies don't block your operations
- Use Supabase service role key for admin operations

## Optional Enhancements

### Notion Integration (Optional)
1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Create new integration
3. Copy Internal Integration Token to `.env.local` as `NOTION_API_KEY`
4. Share a Notion database with your integration
5. Update user preference to use Notion instead of Google Docs

### Zoom Integration (Optional)
1. Go to [marketplace.zoom.us](https://marketplace.zoom.us)
2. Create a Server-to-Server OAuth app
3. Copy credentials to `.env.local`
4. Modify schedule-call route to use Zoom instead of Google Meet

## Production Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add all environment variables from `.env.local`
5. Deploy

### Post-Deployment Steps

1. Update `NEXT_PUBLIC_APP_URL` in Vercel environment variables
2. Add production URL to:
   - Google Cloud OAuth redirect URIs
   - Supabase Auth settings
3. Run migration on production database if needed
4. Test all features in production

## Security Checklist

- [ ] Environment variables are not committed to git
- [ ] Service role key is only used server-side
- [ ] RLS policies are enabled on all tables
- [ ] OAuth tokens are encrypted in database
- [ ] HTTPS is enabled in production
- [ ] Rate limiting is configured for API routes
- [ ] Input validation is in place

## Getting Help

- Check the main README.md for architecture details
- Review the database schema in `migrations/001_init.sql`
- Check Supabase logs for backend errors
- Check browser console for frontend errors
- Review Next.js and Supabase documentation

## Next Steps

Once everything is working:
1. Customize the AI prompts in `src/lib/ai.ts`
2. Add more action types
3. Improve the UI/UX
4. Add analytics
5. Implement token refresh for long-lived sessions
6. Add more integrations (LinkedIn, Slack, etc.)

Happy building! 🚀
