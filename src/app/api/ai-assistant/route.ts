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

    const { message, history } = await request.json()

    // Build conversation history with system message
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: `You are a helpful AI assistant for Hydra, a startup operating system. You help founders with:
- Task management and planning
- Document generation
- Data analysis
- Strategic advice
- Answering questions about their startup

Be concise, helpful, and actionable in your responses.`,
      },
      ...(history || []).map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ]

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      messages: messages,
    })

    const assistantMessage = response.choices[0]?.message?.content || ''

    return NextResponse.json({ response: assistantMessage })
  } catch (error: any) {
    console.error('AI Assistant error:', error)
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    )
  }
}
