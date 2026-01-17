# FounderOS

An AI-powered operating system for startup founders. Built on the Bird-in-Hand principle, FounderOS helps you leverage what you already have—skills, network, funds, and experience—to build your startup from idea to traction.

## Features

### Core Capabilities
- **AI-Powered Onboarding**: Interactive questionnaire that maps your Bird-in-Hand resources
- **Intelligent Assistant**: Context-aware AI that suggests and executes real startup-building actions
- **Action Execution**: Automatically send emails, schedule calls, create documents, and more
- **Smart Roadmap**: AI-generated, personalized roadmap based on your goal and available time
- **Network CRM**: Manage and activate your network with AI-powered suggestions
- **Document Generation**: Create pitch decks, interview scripts, memos, and more

### What Makes It Different
Unlike typical AI assistants that only give advice, FounderOS **takes action**:
- Send outreach emails via Gmail API
- Schedule Zoom calls via Google Calendar
- Generate documents in Google Docs or Notion
- Track all actions and progress

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS 4
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI**: OpenAI GPT-4 Turbo
- **Integrations**: Gmail API, Google Calendar API, Zoom API, Google Docs API, Notion API
- **Hosting**: Vercel

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- A Supabase account
- An OpenAI API key
- Google Cloud Platform account (for Gmail, Calendar, Docs APIs)
- (Optional) Zoom Developer account
- (Optional) Notion API key

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd founder-os
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migration to create tables:
   - Go to SQL Editor in Supabase Dashboard
   - Copy and paste the contents of `migrations/001_init.sql`
   - Run the query

3. Configure Authentication:
   - Go to Authentication > Providers
   - Enable Google OAuth
   - Add your Google OAuth credentials
   - Set redirect URL: `http://localhost:3000/auth/callback`

### 3. Set Up Google Cloud APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable APIs:
   - Gmail API
   - Google Calendar API
   - Google Docs API
   - Google People API (for network import)

4. Create OAuth 2.0 credentials:
   - Go to APIs & Services > Credentials
   - Create OAuth client ID (Web application)
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/callback`
     - Your production domain when ready
   - Copy Client ID and Client Secret

5. Configure OAuth consent screen:
   - Add required scopes:
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/documents`

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Google OAuth & APIs
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional: Zoom
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret

# Optional: Notion
NOTION_API_KEY=your_notion_api_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the Application

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Usage Flow

### 1. Sign Up
- Create an account or sign in with Google
- Google OAuth will request permissions for Gmail, Calendar, and Docs

### 2. Onboarding (Bird-in-Hand Interview)
The AI will guide you through understanding your resources:
- **Skills**: Upload resume or manually enter skills
- **Experience**: Share your professional background
- **Network**: Import contacts or describe your network
- **Ideas**: Share startup ideas you're considering
- **Funds**: Available budget for validation
- **Time**: Weekly commitment hours
- **Goal**: Current objective (e.g., "Validate idea", "Launch MVP")

### 3. Dashboard
- Chat with the AI assistant about your startup
- AI automatically suggests actionable next steps
- Click actions to execute them (emails, documents, calls)
- View upcoming tasks and your resources

### 4. Take Action
Example interactions:
- **"I want to reach out to designers in my network"**
  → AI drafts emails and sends via Gmail
- **"Create an interview script for user research"**
  → AI generates document in Google Docs
- **"Schedule calls with 3 potential customers"**
  → AI finds time slots and creates Calendar events with Zoom links

### 5. Track Progress
- View your roadmap (auto-generated, customizable)
- Manage your network/CRM
- Access all generated documents

## Project Structure

```
founder-os/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication
│   │   │   ├── chat/         # AI chat endpoint
│   │   │   ├── actions/      # Action execution
│   │   │   ├── onboarding/   # Onboarding flow
│   │   │   ├── roadmap/      # Roadmap CRUD
│   │   │   ├── contacts/     # CRM endpoints
│   │   │   └── documents/    # Document management
│   │   ├── auth/             # Auth pages
│   │   ├── dashboard/        # Main dashboard
│   │   ├── onboarding/       # Onboarding UI
│   │   ├── roadmap/          # Roadmap view
│   │   ├── contacts/         # Network/CRM view
│   │   ├── documents/        # Documents view
│   │   └── page.tsx          # Landing page
│   └── lib/
│       ├── supabase.ts       # Supabase client
│       ├── ai.ts             # OpenAI functions
│       └── types.ts          # TypeScript types
├── migrations/
│   └── 001_init.sql          # Database schema
└── package.json
```

## Key Files

### AI Functions (src/lib/ai.ts)
- `generateResponse()` - Main chat completion
- `analyzeResume()` - Extract skills from resume
- `generateRoadmap()` - Create personalized roadmap
- `generateEmail()` - Draft outreach emails
- `generateDocument()` - Create startup documents

### Action Execution
- src/app/api/actions/send-email/route.ts - Gmail integration
- src/app/api/actions/schedule-call/route.ts - Calendar + Zoom
- src/app/api/actions/generate-document/route.ts - Google Docs/Notion

## Database Schema

See migrations/001_init.sql for the complete schema.

Key tables:
- `users` - User profiles with Bird-in-Hand data
- `skills` - User skills and proficiency
- `contacts` - Network/CRM
- `ideas` - Startup ideas
- `documents` - Generated documents
- `roadmap_items` - Personalized roadmap
- `action_logs` - Audit trail of AI actions
- `oauth_tokens` - Encrypted API tokens

## Security Notes

- Row Level Security (RLS) enabled on all tables
- OAuth tokens stored encrypted in Supabase
- API calls use user-scoped authentication
- Service role key only used server-side

## Deployment

### Deploy to Vercel

```bash
vercel deploy
```

Update environment variables in Vercel dashboard with production values.

### Post-Deployment
1. Update Google OAuth redirect URIs with production domain
2. Update Supabase auth settings with production URL
3. Run Supabase migrations on production database

## Customization

### Change AI Model
Edit src/lib/ai.ts, line 17:
```typescript
model: 'gpt-4-turbo', // or 'gpt-4', 'gpt-3.5-turbo'
```

### Add New Actions
1. Create new route in `src/app/api/actions/`
2. Add action detection in `src/app/api/chat/route.ts`
3. Update UI to handle new action type

### Customize Onboarding
Edit src/app/onboarding/page.tsx to modify questions and flow.

## Troubleshooting

### Gmail API Not Working
- Check OAuth scopes include `gmail.send`
- Verify tokens are stored in `oauth_tokens` table
- Check token hasn't expired (implement refresh logic)

### AI Responses Failing
- Verify OPENAI_API_KEY is set correctly
- Check API usage limits
- Review error logs in browser console

### Supabase Auth Issues
- Confirm redirect URLs match exactly
- Check RLS policies are set correctly
- Verify service role key for admin operations

## Future Enhancements

Potential additions:
- LinkedIn API integration for network import
- Slack integration for notifications
- Stripe integration for payment tracking
- Analytics dashboard
- Team collaboration features
- Mobile app (React Native)

## Contributing

This is an MVP. Contributions welcome!

## License

MIT

---

Built with Claude Code
