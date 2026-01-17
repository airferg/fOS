# Database Migrations

This directory contains SQL migrations for FounderOS.

## How to Run Migrations

Supabase requires migrations to be run through the SQL Editor for security.

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of the migration file (e.g., `002_agent_tasks.sql`)
4. Paste into the SQL Editor
5. Click "Run"

### Option 2: Using the API endpoint

```bash
curl -X POST http://localhost:3000/api/admin/migrate
```

This will attempt to create the tables or verify they exist.

## Migration Files

- `001_initial_schema.sql` - Initial database schema (profiles, roadmap, contacts, documents)
- `002_agent_tasks.sql` - Agent execution tracking table

## Current Schema

### agent_tasks
Tracks AI agent executions for monitoring and debugging.

Columns:
- `id` - Unique task identifier
- `user_id` - User who initiated the task
- `agent_id` - Agent identifier (e.g., 'draft-investor-email')
- `agent_name` - Human-readable agent name
- `status` - Task status (pending, running, completed, failed)
- `input` - JSONB input parameters
- `output` - JSONB output results
- `error_message` - Error details if failed
- `tokens_used` - OpenAI token usage
- `created_at` - Task creation timestamp
- `started_at` - Execution start timestamp
- `completed_at` - Execution completion timestamp
