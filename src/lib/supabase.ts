'use client'

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables. ' +
    'If deploying to Vercel, add these in your project settings under Environment Variables.'
  )
}

// Client-side supabase client using @supabase/ssr for proper cookie handling
// This ensures cookies are set in a format the server can read
// IMPORTANT: Only use this in client components (pages with 'use client')
// For API routes, use createServerSupabaseClient from @/lib/supabase-server
// For admin operations, use supabaseAdmin from @/lib/supabase-admin
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
