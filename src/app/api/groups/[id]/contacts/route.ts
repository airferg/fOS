import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Add contacts to a group
 * POST /api/groups/[id]/contacts
 * Body: { contactIds: string[] }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify group belongs to user
    const { data: group, error: groupError } = await supabase
      .from('contact_groups')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const { contactIds } = await req.json()

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'contactIds array is required' }, { status: 400 })
    }

    // Verify all contacts belong to user
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', user.id)
      .in('id', contactIds)

    if (contactsError) {
      return NextResponse.json({ error: contactsError.message }, { status: 400 })
    }

    if (contacts.length !== contactIds.length) {
      return NextResponse.json({ error: 'Some contacts not found' }, { status: 400 })
    }

    // Insert memberships (ignore conflicts for existing memberships)
    const memberships = contactIds.map(contactId => ({
      contact_id: contactId,
      group_id: id,
    }))

    const { error: insertError } = await supabase
      .from('contact_group_members')
      .insert(memberships)
      .select()

    if (insertError && !insertError.message.includes('duplicate')) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, added: contactIds.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

/**
 * Remove contacts from a group
 * DELETE /api/groups/[id]/contacts
 * Body: { contactIds: string[] }
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify group belongs to user
    const { data: group, error: groupError } = await supabase
      .from('contact_groups')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const { contactIds } = await req.json()

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'contactIds array is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('contact_group_members')
      .delete()
      .eq('group_id', id)
      .in('contact_id', contactIds)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, removed: contactIds.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

