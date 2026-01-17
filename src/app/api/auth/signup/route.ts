import { NextRequest, NextResponse } from 'next/server'

// This route is no longer needed - signup should be done client-side
// Keeping for backwards compatibility but it won't work properly
export async function POST(req: NextRequest) {
  return NextResponse.json({ 
    error: 'Signup should be done client-side. Use supabase.auth.signUp() in your client component.' 
  }, { status: 400 })
}
