import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Admin endpoint to run database migrations
 * This should be protected in production
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Create agent_tasks table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS agent_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        agent_id VARCHAR(100) NOT NULL,
        agent_name VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
        input JSONB NOT NULL DEFAULT '{}',
        output JSONB,
        error_message TEXT,
        tokens_used INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ
      );
    `

    // Note: Supabase JS client doesn't support raw SQL for security reasons
    // We need to use the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: createTableQuery })
    })

    if (!response.ok) {
      // Try alternative approach - insert a record to verify table exists
      const { data: existingTasks, error: selectError } = await supabase
        .from('agent_tasks')
        .select('id')
        .limit(1)

      if (selectError) {
        return NextResponse.json({
          success: false,
          message: 'Migration needed. Please run the SQL from migrations/002_agent_tasks.sql in Supabase Dashboard SQL Editor',
          sqlUrl: `https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql/new`,
          error: selectError.message
        }, { status: 500 })
      }

      // Table exists
      return NextResponse.json({
        success: true,
        message: 'agent_tasks table already exists',
        tableExists: true
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      hint: 'Run SQL from migrations/002_agent_tasks.sql in Supabase Dashboard'
    }, { status: 500 })
  }
}
