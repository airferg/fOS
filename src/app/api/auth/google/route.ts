import { NextRequest, NextResponse } from 'next/server'

// This route is no longer needed - OAuth is handled client-side
// Keeping for backwards compatibility but it won't work properly
export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    error: 'OAuth should be initiated from client-side. Use supabase.auth.signInWithOAuth() in your client component.' 
  }, { status: 400 })
}
