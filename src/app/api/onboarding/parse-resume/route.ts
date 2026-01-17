import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { analyzeResume } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    console.log('[parse-resume] Creating server client...')
    const supabase = await createServerSupabaseClient()
    
    // Debug: Try to get session first
    const { data: { session: sessionData }, error: sessionError } = await supabase.auth.getSession()
    console.log('[parse-resume] Session check:', { hasSession: !!sessionData, sessionError })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[parse-resume] Authentication failed:', authError)
      console.error('[parse-resume] User:', user)
      console.error('[parse-resume] Session data:', sessionData)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[parse-resume] Authenticated user:', user.id)

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Extract text from file
    const text = await file.text()

    // Analyze with AI
    const analysis = await analyzeResume(text)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Resume parse error:', error)
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 })
  }
}
