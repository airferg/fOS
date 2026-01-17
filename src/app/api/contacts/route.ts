import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, email, phone, company, position, description, linkedin_url, x, facebook, instagram, university, role, tags = [], helpful_for, connection_strength, stage } = await req.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Build insert object with fields that exist in the schema
    const contactData: any = {
      user_id: user.id,
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      company: company?.trim() || null,
      position: position?.trim() || null,
      role: position?.trim() || role || null,
      helpful_for: description?.trim() || helpful_for || null,
      linkedin_url: linkedin_url?.trim() || null,
      tags: tags || [],
      stage: stage || 'contacted',
      connection_strength: connection_strength || 'weak',
    }

    // Store social media and university in notes/metadata if columns don't exist
    // Format: JSON string in notes field
    const socialInfo: any = {}
    if (x?.trim()) socialInfo.x = x.trim()
    if (facebook?.trim()) socialInfo.facebook = facebook.trim()
    if (instagram?.trim()) socialInfo.instagram = instagram.trim()
    if (university?.trim()) socialInfo.university = university.trim()
    
    if (Object.keys(socialInfo).length > 0) {
      // Store in notes field as JSON (or add to existing notes)
      contactData.notes = JSON.stringify(socialInfo)
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert(contactData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ contact: data })
  } catch (error) {
    console.error('Contact error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, name, email, phone, company, position, description, linkedin_url, x, facebook, instagram, university, role, tags, helpful_for, connection_strength, stage } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 })
    }

    // Verify contact belongs to user
    const { data: existingContact, error: fetchError } = await supabase
      .from('contacts')
      .select('id, notes')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Build update object
    const contactData: any = {}
    if (name !== undefined) contactData.name = name.trim()
    if (email !== undefined) contactData.email = email?.trim() || null
    if (phone !== undefined) contactData.phone = phone?.trim() || null
    if (company !== undefined) contactData.company = company?.trim() || null
    if (position !== undefined) {
      contactData.position = position?.trim() || null
      if (position?.trim()) contactData.role = position.trim()
    }
    if (role !== undefined && !position) contactData.role = role?.trim() || null
    if (helpful_for !== undefined) contactData.helpful_for = helpful_for?.trim() || null
    if (description !== undefined && !helpful_for) contactData.helpful_for = description?.trim() || null
    if (linkedin_url !== undefined) contactData.linkedin_url = linkedin_url?.trim() || null
    if (tags !== undefined) contactData.tags = tags || []
    if (connection_strength !== undefined) contactData.connection_strength = connection_strength
    if (stage !== undefined) contactData.stage = stage

    // Parse existing notes to preserve other data
    let notesData: any = {}
    try {
      if (existingContact.notes) {
        notesData = JSON.parse(existingContact.notes)
      }
    } catch (e) {
      // If notes is not JSON, treat it as plain text or ignore
    }

    // Update social media info in notes
    const socialInfo: any = { ...notesData }
    if (x !== undefined) socialInfo.x = x?.trim() || null
    if (facebook !== undefined) socialInfo.facebook = facebook?.trim() || null
    if (instagram !== undefined) socialInfo.instagram = instagram?.trim() || null
    if (university !== undefined) socialInfo.university = university?.trim() || null

    // Remove null values from socialInfo
    Object.keys(socialInfo).forEach(key => {
      if (socialInfo[key] === null || socialInfo[key] === '') {
        delete socialInfo[key]
      }
    })

    // Store social info in notes field (as JSON)
    if (Object.keys(socialInfo).length > 0) {
      contactData.notes = JSON.stringify(socialInfo)
    } else if (x !== undefined || facebook !== undefined || instagram !== undefined || university !== undefined) {
      // If all social fields are being cleared, clear notes too
      contactData.notes = null
    }

    contactData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('contacts')
      .update(contactData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ contact: data })
  } catch (error) {
    console.error('Contact update error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query params for filtering
    const { searchParams } = new URL(req.url)
    const groupId = searchParams.get('group_id')
    const organizationId = searchParams.get('organization_id')
    const search = searchParams.get('search')
    const connectionStrength = searchParams.get('connection_strength')
    const stage = searchParams.get('stage')

    // If filtering by group, get contact IDs first
    let contactIds: string[] | undefined = undefined
    if (groupId) {
      const { data: members, error: membersError } = await supabase
        .from('contact_group_members')
        .select('contact_id')
        .eq('group_id', groupId)

      if (!membersError && members) {
        contactIds = members.map(m => m.contact_id)
        if (contactIds.length === 0) {
          return NextResponse.json({ contacts: [] })
        }
      }
    }

    // Build query with joins
    let query = supabase
      .from('contacts')
      .select(`
        *,
        organization:organizations(*),
        groups:contact_group_members(
          group:contact_groups(*)
        )
      `)
      .eq('user_id', user.id)

    // Apply group filter
    if (contactIds) {
      query = query.in('id', contactIds)
    }

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    if (connectionStrength) {
      query = query.eq('connection_strength', connectionStrength)
    }

    if (stage) {
      query = query.eq('stage', stage)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,position.ilike.%${search}%`)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Transform groups data to be flat array
    const transformedData = (data || []).map(contact => ({
      ...contact,
      groups: (contact.groups || []).map((g: any) => g.group).filter(Boolean)
    }))

    return NextResponse.json({ contacts: transformedData })
  } catch (error) {
    console.error('Contacts error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
