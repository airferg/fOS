import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// This route is no longer needed - signup should be done client-side
// Keeping for backwards compatibility but it won't work properly
export async function POST(req: NextRequest) {
  return NextResponse.json({ 
    error: 'Signup should be done client-side. Use supabase.auth.signUp() in your client component.' 
  }, { status: 400 })
  
  /* OLD CODE - kept for reference
  try {
    const { email, password, name } = await req.json()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 400 })
    }

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: data.user.id,
        email,
        name,
        onboarding_complete: false,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
    }

    return NextResponse.json({ user: data.user, session: data.session })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
