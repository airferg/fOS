import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { generateEmail } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contactIds, goal, subject } = await req.json()

    // Get contacts
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .in('id', contactIds)
      .eq('user_id', user.id)

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts found' }, { status: 400 })
    }

    // Generate emails
    const emails = await Promise.all(
      contacts.map(async (contact) => {
        const body = await generateEmail(contact.name, goal, '')
        return {
          contact_id: contact.id,
          to: contact.email,
          subject: subject || `Let's talk about ${goal}`,
          body,
        }
      })
    )

    // Log action
    await supabase
      .from('action_logs')
      .insert({
        user_id: user.id,
        action_type: 'email_draft',
        action_details: { contacts: contactIds.length, goal },
        status: 'success',
        result: { emails_generated: emails.length },
      })

    return NextResponse.json({ emails })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
