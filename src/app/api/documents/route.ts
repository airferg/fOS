import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)

    if (category) {
      query = query.eq('category', category)
    }

    const { data: documents } = await query.order('created_at', { ascending: false })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Documents error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const title = formData.get('title') as string
    const category = formData.get('category') as string
    const documentType = formData.get('type') as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // For now, store file metadata. In production, upload to Supabase Storage or S3
    const uploadedDocuments = []

    for (const file of files) {
      // In production, upload file to storage service and get URL
      // For now, create document record with file metadata
      const fileUrl = `#${file.name}` // Placeholder - replace with actual storage URL

      const { data: document, error } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title: title || file.name,
          type: documentType || 'other',
          category: category || null,
          content: null,
          link: fileUrl,
          status: 'draft',
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating document:', error)
        continue
      }

      uploadedDocuments.push(document)
    }

    return NextResponse.json({
      success: true,
      documents: uploadedDocuments,
      message: `Successfully uploaded ${uploadedDocuments.length} document(s)`
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload documents' },
      { status: 500 }
    )
  }
}
