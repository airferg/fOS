/**
 * Apply database migration for agent_tasks table
 * Run this with: npx tsx migrations/apply-migration.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
})

async function applyMigration() {
  console.log('📦 Applying agent_tasks migration...\n')

  const migrationPath = path.join(__dirname, '002_agent_tasks.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  console.log('Migration SQL:')
  console.log('─'.repeat(80))
  console.log(sql)
  console.log('─'.repeat(80))
  console.log('\n⚠️  Please run this SQL directly in your Supabase SQL Editor:')
  console.log(`   ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new`)
  console.log('\nNote: Supabase client library doesn\'t support raw SQL execution for security.')
  console.log('You must run migrations through the Supabase Dashboard SQL Editor.\n')
}

applyMigration().catch(console.error)
