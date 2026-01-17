# Complete Environment Variables Reference

This document lists ALL environment variables required for all 33 integrations in FounderOS.

## Core Application Variables (Required)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# OpenAI
OPENAI_API_KEY=sk-xxx...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Use http://localhost:3000 for local, https://yourdomain.com for production
```

## Integration Environment Variables

### Google Integrations (3 integrations using same OAuth)
**Used by:** Gmail, Google Calendar, Google Docs, Google Forms, Google Analytics

```bash
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

---

### Batch 1: Communication & Collaboration (5 integrations)

#### Outlook (Microsoft Graph)
```bash
OUTLOOK_CLIENT_ID=your_outlook_client_id
OUTLOOK_CLIENT_SECRET=your_outlook_client_secret
```

#### Slack
```bash
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
```

#### Discord
```bash
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

#### Zoom
```bash
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
```

#### Calendly
```bash
CALENDLY_CLIENT_ID=your_calendly_client_id
CALENDLY_CLIENT_SECRET=your_calendly_client_secret
```

---

### Batch 2: Document & Project Management (9 integrations)

#### Notion
```bash
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
```

#### Airtable
**Note:** No OAuth, uses Personal Access Token (PAT) - stored via user input, no env var needed

#### Coda
**Note:** No OAuth, uses Personal Access Token (PAT) - stored via user input, no env var needed

#### Tally
**Note:** No OAuth, uses API Key - stored via user input, no env var needed

#### Typeform
```bash
TYPEFORM_CLIENT_ID=your_typeform_client_id
TYPEFORM_CLIENT_SECRET=your_typeform_client_secret
```

#### Google Forms
**Uses:** `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (same as other Google integrations)

#### Productboard
**Note:** No OAuth, uses Personal Access Token (PAT) - stored via user input, no env var needed

#### Linear
**Note:** No OAuth, uses Personal Access Token (PAT) - stored via user input, no env var needed

#### Jira (Atlassian)
```bash
JIRA_CLIENT_ID=your_jira_client_id
JIRA_CLIENT_SECRET=your_jira_client_secret
```

---

### Batch 3: Development & Social (7 integrations)

#### Asana
```bash
ASANA_CLIENT_ID=your_asana_client_id
ASANA_CLIENT_SECRET=your_asana_client_secret
```

#### GitHub
```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_WEBHOOK_SECRET=your_github_webhook_secret  # For webhook signature verification
```

#### GitLab
```bash
GITLAB_CLIENT_ID=your_gitlab_client_id
GITLAB_CLIENT_SECRET=your_gitlab_client_secret
```

#### Vercel
```bash
VERCEL_CLIENT_ID=your_vercel_client_id
VERCEL_CLIENT_SECRET=your_vercel_client_secret
```

#### LinkedIn
```bash
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

#### Twitter / X
```bash
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

#### Google Analytics (GA4)
**Uses:** `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (same as other Google integrations)

---

### Batch 4: Analytics & Payments (8 integrations)

#### Mixpanel
**Note:** No OAuth, uses API Key + Project ID - stored via user input, no env var needed

#### Amplitude
**Note:** No OAuth, uses API Key + API Secret - stored via user input, no env var needed

#### Stripe
```bash
STRIPE_CLIENT_ID=your_stripe_client_id  # For Stripe Connect OAuth
STRIPE_SECRET_KEY=sk_live_xxx...        # For token exchange (your Stripe secret key)
STRIPE_WEBHOOK_SECRET=whsec_xxx...      # For webhook signature verification
```

#### QuickBooks Online
```bash
QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
QUICKBOOKS_CLIENT_SECRET=your_quickbooks_client_secret
```

#### Intercom
```bash
INTERCOM_CLIENT_ID=your_intercom_client_id
INTERCOM_CLIENT_SECRET=your_intercom_client_secret
```

#### Zendesk
```bash
ZENDESK_CLIENT_ID=your_zendesk_client_id
ZENDESK_CLIENT_SECRET=your_zendesk_client_secret
ZENDESK_SUBDOMAIN=yourcompany  # Your Zendesk subdomain (e.g., "yourcompany" for yourcompany.zendesk.com)
```

#### Mailchimp
```bash
MAILCHIMP_CLIENT_ID=your_mailchimp_client_id
MAILCHIMP_CLIENT_SECRET=your_mailchimp_client_secret
```

#### HubSpot
```bash
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
```

---

## Summary by Type

### OAuth2 Integrations (Require CLIENT_ID + CLIENT_SECRET)
1. Google (Gmail, Calendar, Docs, Forms, Analytics)
2. Outlook
3. Slack
4. Discord
5. Zoom
6. Calendly
7. Notion
8. Typeform
9. Jira
10. Asana
11. GitHub
12. GitLab
13. Vercel
14. LinkedIn
15. Twitter/X
16. Stripe
17. QuickBooks
18. Intercom
19. Zendesk (also needs SUBDOMAIN)
20. Mailchimp
21. HubSpot

**Total OAuth2 variables:** 20 providers × 2 = 40 variables, plus ZENDESK_SUBDOMAIN = **41 variables**

### API Key / PAT Integrations (No env vars needed - stored via user input)
1. Airtable
2. Coda
3. Tally
4. Productboard
5. Linear
6. Mixpanel
7. Amplitude

### Additional Webhook Secrets
- `GITHUB_WEBHOOK_SECRET`
- `STRIPE_WEBHOOK_SECRET`

---

## Complete .env.local Template

```bash
# ============================================
# CORE APPLICATION (REQUIRED)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
OPENAI_API_KEY=sk-xxx...
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Use https://yourdomain.com for production

# ============================================
# GOOGLE INTEGRATIONS (Gmail, Calendar, Docs, Forms, Analytics)
# ============================================
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# ============================================
# BATCH 1: Communication & Collaboration
# ============================================
OUTLOOK_CLIENT_ID=your_outlook_client_id
OUTLOOK_CLIENT_SECRET=your_outlook_client_secret
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
CALENDLY_CLIENT_ID=your_calendly_client_id
CALENDLY_CLIENT_SECRET=your_calendly_client_secret

# ============================================
# BATCH 2: Document & Project Management
# ============================================
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
TYPEFORM_CLIENT_ID=your_typeform_client_id
TYPEFORM_CLIENT_SECRET=your_typeform_client_secret
JIRA_CLIENT_ID=your_jira_client_id
JIRA_CLIENT_SECRET=your_jira_client_secret

# ============================================
# BATCH 3: Development & Social
# ============================================
ASANA_CLIENT_ID=your_asana_client_id
ASANA_CLIENT_SECRET=your_asana_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_WEBHOOK_SECRET=your_github_webhook_secret
GITLAB_CLIENT_ID=your_gitlab_client_id
GITLAB_CLIENT_SECRET=your_gitlab_client_secret
VERCEL_CLIENT_ID=your_vercel_client_id
VERCEL_CLIENT_SECRET=your_vercel_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# ============================================
# BATCH 4: Analytics & Payments
# ============================================
STRIPE_CLIENT_ID=your_stripe_client_id
STRIPE_SECRET_KEY=sk_live_xxx...
STRIPE_WEBHOOK_SECRET=whsec_xxx...
QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
QUICKBOOKS_CLIENT_SECRET=your_quickbooks_client_secret
INTERCOM_CLIENT_ID=your_intercom_client_id
INTERCOM_CLIENT_SECRET=your_intercom_client_secret
ZENDESK_CLIENT_ID=your_zendesk_client_id
ZENDESK_CLIENT_SECRET=your_zendesk_client_secret
ZENDESK_SUBDOMAIN=yourcompany
MAILCHIMP_CLIENT_ID=your_mailchimp_client_id
MAILCHIMP_CLIENT_SECRET=your_mailchimp_client_secret
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
```

---

## Notes

1. **API Key/PAT Integrations** (Airtable, Coda, Tally, Productboard, Linear, Mixpanel, Amplitude) don't need environment variables - users enter their credentials directly in the UI.

2. **Google Integrations** share the same OAuth credentials - you only need to set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` once.

3. **Stripe** requires both OAuth credentials (`STRIPE_CLIENT_ID`) and your Stripe secret key (`STRIPE_SECRET_KEY`) for token exchange.

4. **Zendesk** requires an additional `ZENDESK_SUBDOMAIN` variable (your company's Zendesk subdomain).

5. **Webhook Secrets** are optional but recommended for security (GitHub, Stripe).

6. You can leave unused integrations as placeholders (`your_xxx_client_id`) - the integration will simply return a 500 error if someone tries to connect without proper credentials.

7. **Redirect URIs**: For all OAuth integrations, use HTTPS in production. The redirect URI pattern is `${NEXT_PUBLIC_APP_URL}/api/integrations/{integration-name}/callback`. Make sure `NEXT_PUBLIC_APP_URL` uses `https://` in production (e.g., `https://yourdomain.com`).

