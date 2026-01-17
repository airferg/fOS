'use client'

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder'

// Client-side supabase client using @supabase/ssr for proper cookie handling
// This ensures cookies are set in a format the server can read
// IMPORTANT: Only use this in client components (pages with 'use client')
// For API routes, use createServerSupabaseClient from @/lib/supabase-server
// For admin operations, use supabaseAdmin from @/lib/supabase-admin
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
