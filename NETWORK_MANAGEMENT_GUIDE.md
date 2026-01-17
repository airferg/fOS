# Network Management System - User Guide

## Overview

FounderOS includes a comprehensive network management system that helps you organize, tag, and track your professional connections. The system features AI-powered contact enrichment and support for LinkedIn CSV imports.

## Getting Your LinkedIn Network Data

### Step 1: Export Your LinkedIn Connections

1. Go to LinkedIn.com and sign in
2. Navigate to **My Network** → **Connections**
3. Click **More options** (three dots)
4. Select **Export connections** or visit directly:
   https://www.linkedin.com/psettings/member-data

5. LinkedIn will email you a ZIP file with your data (usually within 10-15 minutes)
6. Extract the ZIP file and locate `Connections.csv`

### LinkedIn CSV Format

The exported CSV includes these columns:
- First Name
- Last Name
- Email Address (may be empty for many connections)
- Company
- Position
- Connected On (date)

## Importing Your Network

### Upload to FounderOS

1. Navigate to **/contacts** (Network page)
2. Click **"Import CSV"** button
3. Select your `Connections.csv` file
4. Choose whether to use AI enrichment (recommended)
5. Click upload

### What Happens During Import

#### With AI Enrichment (Recommended)

The system uses GPT-4 to analyze each contact and automatically:

- **Generate relevant tags** based on their role and company
  - Examples: "engineer", "investor", "designer", "marketing", "b2b", "saas"

- **Estimate connection strength** (weak/medium/strong)
  - Based on how relevant they are to your current goal
  - Considers their role, company, and your startup focus

- **Categorize by stage**
  - contacted, engaged, active, champion
  - Based on role and potential relationship value

- **Identify what they can help with**
  - Options: funding, hiring, product feedback, customer intros, technical advice, etc.

- **Generate helpful summary**
  - One-sentence description of why they're valuable to you

#### Without AI Enrichment

Basic import that just stores:
- Name
- Email
- Company
- Position

All contacts are marked as "weak" connections in "contacted" stage.

### Import Results

After successful import, you'll see:
- Total contacts imported
- Contacts with emails vs without emails
- Number of unique companies/organizations created
- Tokens used (for AI enrichment)

## Organization Features

### 1. Organizations Database

Contacts are automatically linked to **Organizations** (their companies).

Benefits:
- See all contacts from the same company
- Filter by organization
- Track which companies you have relationships with
- Add organization notes and metadata

Organization fields:
- Name
- Industry
- Website
- Description
- Headquarters
- Size range (1-10, 11-50, 51-200, etc.)
- Tags
- Notes

### 2. Contact Groups

Every user gets **6 default groups** automatically:

| Group | Icon | Purpose |
|-------|------|---------|
| Investors | 💰 | Potential and current investors |
| Customers | 👥 | Leads, users, and paying customers |
| Partners | 🤝 | Strategic partners and collaborators |
| Advisors | 🎓 | Mentors and advisors |
| Team | ⚡ | Current and potential team members |
| Industry Contacts | 🏢 | People in your industry |

#### Creating Custom Groups

1. Go to **/contacts**
2. Click **"New Group"**
3. Enter:
   - Name
   - Description
   - Color (for UI coding)
   - Icon (emoji)
4. Save

#### Adding Contacts to Groups

- Contacts can belong to **multiple groups**
- Select contact → **"Add to Group"** → Choose group(s)
- Bulk add: Select multiple contacts → **"Add to Group"**

### 3. Contact Tagging System

Tags help you categorize and filter contacts:

**Auto-generated tags** (from AI enrichment):
- Role-based: engineer, designer, marketer, founder, investor
- Industry: b2b, b2c, saas, fintech, healthtech, etc.
- Function: technical, product, sales, growth, operations

**Custom tags**:
- Add your own tags to any contact
- Use for personal organization
- Examples: "warm-intro", "met-at-conference", "follow-up-needed"

### 4. Connection Strength Tracking

Three levels:

- **Weak** 🟡 - Just connected, haven't engaged much
- **Medium** 🟠 - Some interaction, semi-regular contact
- **Strong** 🟢 - Active relationship, frequent communication

AI automatically estimates initial strength based on:
- Role relevance to your goals
- Company/industry fit
- Position influence

You can manually update strength as relationships develop.

### 5. Contact Interactions Log

Track every interaction with your network:

**Interaction types**:
- Email
- Call
- Meeting
- LinkedIn message
- Other

**For each interaction, record**:
- Subject/topic
- Notes
- Outcome (e.g., "scheduled meeting", "no response", "interested")
- Next action
- Next action date

**Benefits**:
- See full relationship history
- Track follow-up tasks
- Identify neglected relationships
- Measure engagement over time

## Filtering and Search

### Filter Options

- **By Group**: Show only contacts in specific groups
- **By Organization**: View all contacts from a company
- **By Connection Strength**: Filter by weak/medium/strong
- **By Stage**: contacted, engaged, active, champion
- **By Tag**: Filter by any tag
- **By Last Contacted**: Recently contacted, stale relationships
- **Search**: Name, email, company, position, tags

### Smart Lists

Pre-built filtered views:

- **Needs Follow-up**: Contacts you haven't reached out to in 30+ days
- **Strong Connections**: Your most valuable relationships
- **Recently Added**: New contacts from latest import
- **No Email**: Contacts missing email addresses
- **Champions**: Contacts who actively help you

## Database Schema

### Tables Created

1. **organizations** - Companies and firms
2. **contact_groups** - User-defined groups
3. **contact_group_members** - Many-to-many group membership
4. **contact_interactions** - Interaction history log

### Enhanced Contacts Table

New fields added to existing `contacts` table:

- `organization_id` - Link to organization
- `company` - Company name (text)
- `position` - Job title
- `linkedin_url` - LinkedIn profile
- `phone` - Phone number
- `location` - City/region
- `connection_strength` - weak/medium/strong
- `how_we_met` - Origin of connection
- `can_help_with` - Array of help categories
- `needs_help_with` - Array of their needs

### Row Level Security (RLS)

All tables have RLS policies ensuring:
- Users only see their own data
- Full CRUD permissions on own records
- No access to other users' networks

## Migration Instructions

### Running the Migration

Before using network features, run migration `003_network_organizations.sql`:

#### Option 1: Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Open `migrations/003_network_organizations.sql`
3. Copy all SQL
4. Paste into SQL Editor
5. Click **Run**

#### Option 2: Command Line

```bash
psql your_database_url < migrations/003_network_organizations.sql
```

### Migration Includes

- Creates 4 new tables
- Alters `contacts` table with 10 new columns
- Adds indexes for performance
- Sets up RLS policies
- Creates `contact_stats` view
- Adds trigger for default group creation

## Privacy & Security

### What Gets Stored

- Contact information from your CSV
- AI-generated enrichment data (tags, summaries)
- Your custom notes and tags
- Interaction history you manually log

### What Doesn't Get Stored

- Raw CSV files (deleted after processing)
- LinkedIn passwords or credentials
- Private LinkedIn data beyond the CSV export
- Any data from contacts' LinkedIn profiles

### Data Ownership

- All imported data belongs to you
- You can export or delete anytime
- Contacts are never shared between users
- RLS ensures complete isolation

## Cost Considerations

### AI Enrichment Costs

LinkedIn CSV import with AI enrichment uses OpenAI tokens:

- **Small network** (100 contacts): ~$0.15 - $0.30
- **Medium network** (500 contacts): ~$0.75 - $1.50
- **Large network** (1000+ contacts): ~$1.50 - $3.00

Processed in batches of 20 for efficiency.

### Without AI Enrichment

If you prefer to skip AI enrichment:
- Set `useAI=false` in upload
- Zero AI costs
- You'll need to manually tag and organize
- Basic import only stores name, email, company, position

## Best Practices

### 1. Import Strategy

- **First import**: Use AI enrichment to bootstrap your network
- **Updates**: Re-import periodically to catch new connections
- **Dedupe**: System prevents duplicate emails automatically

### 2. Tagging Strategy

Start with broad categories, refine over time:
- Industry tags: saas, fintech, healthtech
- Function tags: eng, product, sales, ops
- Stage tags: customer, prospect, partner
- Personal tags: met-2024, needs-follow-up, warm-intro

### 3. Group Organization

Use groups for **context**, not just categories:
- **Fundraising Round**: Active VCs you're talking to
- **Beta Users**: Customers testing your product
- **Advisory Board**: Official advisors
- **Conference - TechCrunch 2024**: People met at specific events

### 4. Relationship Maintenance

Set up workflows:
- **Weekly**: Review "Needs Follow-up" list
- **Monthly**: Check in with strong connections
- **Quarterly**: Review weak connections, prune or re-engage

### 5. Interaction Logging

Log every meaningful interaction to:
- Track relationship progression
- Remember conversation context
- Identify which relationships drive value
- Justify time spent networking

## Roadmap

Future enhancements planned:

- [ ] Auto-sync with LinkedIn (if API available)
- [ ] Email integration for auto-logging interactions
- [ ] Relationship health scores
- [ ] Automated follow-up reminders
- [ ] Network analytics and insights
- [ ] Find mutual connections between contacts
- [ ] Export options (CSV, vCard)
- [ ] Integration with CRM tools

## Troubleshooting

### Import Failed

**Issue**: CSV import returns error

**Solutions**:
- Verify CSV is from LinkedIn export
- Check file isn't corrupted
- Ensure file has header row
- Try without AI enrichment first

### Missing Emails

**Issue**: Many contacts have no email

**Explanation**: LinkedIn only includes emails for connections who chose to share them. This is normal.

**Workarounds**:
- Search for them on company website
- Look up via email finding tools
- Reach out via LinkedIn messaging

### AI Enrichment Seems Wrong

**Issue**: Tags or categories don't make sense

**Solutions**:
- Update your profile goal/focus for better context
- Manually edit tags and categories
- Re-import specific contacts
- Provide feedback for improvements

### Slow Import

**Issue**: Large CSV takes long time

**Explanation**: AI enrichment processes batches of 20. For 1000 contacts, expect 2-3 minutes.

**Solutions**:
- Import in chunks (500 at a time)
- Skip AI enrichment, add manually later
- Import runs async, you can navigate away

## Support

For questions or issues:
- Check migrations README: `migrations/README.md`
- Review AI agent docs: `AI_AGENTS_IMPLEMENTATION.md`
- Report issues: [GitHub Issues](https://github.com/your-repo/issues)

---

**Ready to import your network?**

1. Export from LinkedIn
2. Go to /contacts
3. Click "Import CSV"
4. Watch the magic happen ✨
