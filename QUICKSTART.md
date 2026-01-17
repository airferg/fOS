# FounderOS Quick Start

Get up and running in 10 minutes.

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Supabase

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy `.env.local.example` to `.env.local`
4. Add Supabase URL and keys from Settings > API
5. Go to SQL Editor, paste contents of `migrations/001_init.sql`, and run

## 3. Add OpenAI Key

1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Add to `.env.local` as `OPENAI_API_KEY`

## 4. Configure Google OAuth (for actions)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project and enable Gmail, Calendar, Docs APIs
3. Create OAuth credentials
4. Add client ID/secret to `.env.local`
5. Add `http://localhost:3000/auth/callback` to redirect URIs

See [SETUP.md](./SETUP.md) for detailed instructions.

## 5. Run

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Test It Out

1. Sign up with email or Google
2. Complete the onboarding questionnaire
3. Chat with the AI assistant
4. Try creating documents or sending emails

## What's Next?

- Read [README.md](./README.md) for architecture overview
- Read [SETUP.md](./SETUP.md) for detailed configuration
- Customize AI prompts in `src/lib/ai.ts`
- Add your own actions in `src/app/api/actions/`

## Need Help?

Check [SETUP.md](./SETUP.md) Troubleshooting section.
