# Integration Architecture

This document describes the complete integration architecture for FounderOS, including OAuth token management, agent execution, and the integrations dashboard.

## Database Schema

### `oauth_tokens` Table
Stores OAuth tokens for external providers (Google, Slack, Stripe, etc.)

```sql
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  provider TEXT NOT NULL, -- 'google', 'slack', 'stripe', etc.
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
```

**RLS Policies:**
- Users can read, insert, update, and delete their own OAuth tokens

### `integration_tokens` Table
Stores tokens for specific integrations (Gmail, Google Calendar, Google Docs, etc.)

```sql
CREATE TABLE integration_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  integration_type VARCHAR(100) NOT NULL, -- 'gmail', 'google_calendar', etc.
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, integration_type)
);
```

### `agent_tasks` Table
Logs all AI agent executions for tracking and debugging

```sql
CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  agent_id VARCHAR(100) NOT NULL,
  agent_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  input JSONB DEFAULT '{}',
  output JSONB,
  error_message TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

**RLS Policies:**
- Users can view, create, update, and delete their own agent tasks

## OAuth Flow

### 1. Initiate OAuth (Google Example)

**Route:** `GET /api/integrations/google/connect`

- Authenticates user
- Generates OAuth URL with required scopes
- Returns redirect URL to frontend

**Scopes requested:**
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/documents`

### 2. OAuth Callback

**Route:** `GET /api/integrations/google/callback`

- Receives authorization code from Google
- Exchanges code for access/refresh tokens
- Stores tokens in both `oauth_tokens` and `integration_tokens` tables
- Redirects user back to integrations page

### 3. Token Storage

Tokens are stored in two places:
1. **`oauth_tokens`** - Provider-level tokens (one per provider)
2. **`integration_tokens`** - Service-level tokens (one per service like Gmail, Calendar, Docs)

This dual storage allows:
- Provider-level operations (e.g., all Google services)
- Service-specific operations (e.g., just Gmail)
- Better token refresh management

## Agent Execution

### Token Lookup

When an agent tool needs to access an integration:

1. **Check `integration_tokens`** first (service-specific)
2. **Fallback to `oauth_tokens`** (provider-level)
3. **Normalize naming** (handle `google-calendar` vs `google_calendar`)

### Error Handling

If a token is missing, tools return:
```json
{
  "error": "Gmail not connected",
  "message": "Gmail integration is not connected. Please connect it in Settings > Integrations to use this feature.",
  "connected": false
}
```

The AI agent:
- Detects `connected: false` errors
- Explains what would have been done
- Suggests connecting the integration
- Continues with other parts of the task

## Integrations Dashboard

### Features

1. **Connection Status**
   - Fetches real-time status from database
   - Shows "Connected" badge for active integrations
   - Updates automatically after connect/disconnect

2. **Connect Flow**
   - Click "Connect" button
   - Redirects to OAuth provider
   - Returns to dashboard after authorization
   - Shows success/error messages

3. **Disconnect Flow**
   - Click "Disconnect" button
   - Confirms action
   - Removes tokens from database
   - Updates UI immediately

### API Routes

- `GET /api/integrations/status` - Get connection status for all integrations
- `GET /api/integrations/google/connect` - Initiate Google OAuth
- `GET /api/integrations/google/callback` - Handle Google OAuth callback
- `DELETE /api/integrations/disconnect` - Disconnect an integration

## Environment Variables

Required for Google OAuth:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

## Setup Instructions

1. **Run Migrations**
   ```sql
   -- Run in Supabase SQL Editor:
   -- migrations/008_fix_oauth_tokens.sql
   ```

2. **Configure Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://your-domain.com/api/integrations/google/callback`
   - Add environment variables to `.env.local`

3. **Test Integration**
   - Go to `/integrations` page
   - Click "Connect" on Gmail or Google Calendar
   - Complete OAuth flow
   - Verify tokens are stored in database
   - Test agent execution with connected integration

## Troubleshooting

### Tokens Not Stored

- Check OAuth callback URL matches Google Console settings
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Check server logs for OAuth errors
- Verify RLS policies allow token insertion

### Agent Can't Find Tokens

- Check token exists in `oauth_tokens` or `integration_tokens` table
- Verify `user_id` matches authenticated user
- Check token expiration (tokens expire after 1 hour)
- Look for naming mismatches (`google-calendar` vs `google_calendar`)

### RLS Policy Errors

- Ensure RLS policies are created (see migration 008)
- Verify user is authenticated
- Check `auth.uid()` matches `user_id` in token records

## Future Enhancements

1. **Token Refresh**
   - Automatic refresh before expiration
   - Background job to refresh tokens
   - Handle refresh token rotation

2. **Additional Providers**
   - Zoom OAuth
   - Slack OAuth
   - Stripe OAuth
   - Notion OAuth

3. **Token Management**
   - View token expiration dates
   - Manually refresh tokens
   - Revoke specific scopes

4. **Analytics**
   - Track integration usage
   - Monitor token refresh failures
   - Alert on expired tokens

