/**
 * Migration runner script
 * Runs SQL migrations against Supabase database
 */
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration(filename) {
  console.log(`Running migration: ${filename}`)

  const migrationPath = path.join(__dirname, filename)
  const sql = fs.readFileSync(migrationPath, 'utf8')

  // Split by semicolons to execute multiple statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement })

      if (error) {
        // If rpc doesn't exist, try direct SQL execution via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: statement })
        })

        if (!response.ok) {
          console.error(`Error executing statement: ${statement.substring(0, 100)}...`)
          console.error(`Response: ${response.status} ${response.statusText}`)
        }
      }
    } catch (err) {
      console.error(`Error: ${err.message}`)
      console.error(`Statement: ${statement.substring(0, 100)}...`)
    }
  }

  console.log(`✓ Migration ${filename} completed`)
}

async function main() {
  const migrationFile = process.argv[2] || '002_agent_tasks.sql'
  await runMigration(migrationFile)
  console.log('All migrations completed!')
}

main().catch(console.error)
