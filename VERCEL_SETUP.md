# Vercel Deployment Setup Guide

## Environment Variables

You need to add the following environment variables in your Vercel project settings:

### Required Variables

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: Your Supabase project URL (e.g., `https://dsqshjvzronbsxatxflw.supabase.co`)
   - Found in: Supabase Dashboard → Settings → API → Project URL

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: Your Supabase anon/public key
   - Found in: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: Your Supabase service role key (keep this secret!)
   - Found in: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
   - ⚠️ **Never expose this to the client-side**

4. **OPENAI_API_KEY**
   - Value: Your OpenAI API key
   - Found in: OpenAI Dashboard → API Keys

### Optional Variables

- `NEXT_PUBLIC_APP_URL`: Your production URL (e.g., `https://yourdomain.com`)
- Integration-specific OAuth keys (see `ENV_VARIABLES.md` for full list)

## How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: The variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: The actual value
   - **Environment**: Select all environments (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** your application for changes to take effect

## Supabase Redirect URI Configuration

After setting up environment variables, you need to configure redirect URIs in Supabase:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add the following to **Redirect URLs**:
   ```
   https://yourdomain.com/auth/callback
   https://yourdomain.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```
   (Replace `yourdomain.com` and `yourdomain.vercel.app` with your actual domains)

4. Add the following to **Site URL**:
   ```
   https://yourdomain.com
   ```
   (Or your Vercel preview URL for testing)

5. Click **Save**

## Troubleshooting

### "This site can't be reached" / DNS_PROBE_FINISHED_NXDOMAIN

- **Cause**: `NEXT_PUBLIC_SUPABASE_URL` is not set or is set to a placeholder value
- **Fix**: Add the correct Supabase URL in Vercel environment variables and redeploy

### OAuth redirect errors

- **Cause**: Redirect URI not configured in Supabase
- **Fix**: Add your production callback URL to Supabase's redirect URL list (see above)

### Build succeeds but runtime errors

- **Cause**: Environment variables not set in Vercel
- **Fix**: Add all required environment variables in Vercel project settings and redeploy
