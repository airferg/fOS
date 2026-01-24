import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { openai, DEFAULT_MODEL } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch existing startup data from various tables
    const [profileData, teamData, fundingData, contactsData] = await Promise.all([
      supabase.from('startup_profile').select('*').eq('user_id', user.id).single(),
      supabase.from('team_members').select('*').eq('user_id', user.id),
      supabase.from('funding_rounds').select('*').eq('user_id', user.id),
      supabase.from('contacts').select('*').eq('user_id', user.id).limit(10),
    ])

    const existingProfile = profileData.data
    const teamMembers = teamData.data || []
    const fundingRounds = fundingData.data || []

    // Generate enhanced portfolio using OpenAI
    const prompt = `Generate an enhanced startup portfolio based on the following data:

Existing Profile: ${JSON.stringify(existingProfile, null, 2)}
Team Size: ${teamMembers.length}
Funding Rounds: ${fundingRounds.length}

Please generate:
1. A compelling tagline (max 100 characters)
2. A detailed description that highlights the problem, solution, and unique value proposition (200-300 words)

Return the response as JSON with the structure:
{
  "tagline": "...",
  "description": "..."
}

Make it investor-ready, compelling, and professional.`

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const generatedContent = response.choices[0]?.message?.content || '{}'

    // Parse the JSON response
    let generated
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = generatedContent.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        generated = JSON.parse(jsonMatch[1])
      } else {
        generated = JSON.parse(generatedContent)
      }
    } catch {
      // Fallback if parsing fails
      generated = {
        tagline: 'Building the future of innovation',
        description: generatedContent,
      }
    }

    // Update the profile with generated content
    const { data: updatedProfile, error } = await supabase
      .from('startup_profile')
      .update({
        tagline: generated.tagline,
        description: generated.description,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: updatedProfile })
  } catch (error: any) {
    console.error('Portfolio generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate portfolio', details: error.message },
      { status: 500 }
    )
  }
}
