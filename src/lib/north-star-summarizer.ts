import { openai, DEFAULT_MODEL } from '@/lib/openai'

/**
 * Summarize a North Star description to maximum 100 characters
 */
export async function summarizeNorthStar(text: string): Promise<string> {
  if (!text || !text.trim()) {
    return ''
  }

  // If already under 100 characters, return as is
  if (text.trim().length <= 100) {
    return text.trim()
  }

  try {
    const systemPrompt = `You are an expert at summarizing startup and business descriptions concisely.
Your task is to summarize the given text to EXACTLY 100 characters or less while preserving the key meaning and essence.
Be direct, clear, and impactful. Remove any fluff or unnecessary words.`

    const userPrompt = `Summarize this description in exactly 100 characters or less:
"${text}"

Return ONLY the summary, nothing else. Maximum 100 characters.`

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 50, // Small token limit for concise summaries
    })

    let summary = completion.choices[0]?.message?.content?.trim() || ''
    
    // Ensure it's exactly 100 characters or less
    if (summary.length > 100) {
      summary = summary.substring(0, 97) + '...'
    }

    return summary || text.trim().substring(0, 100)
  } catch (error: any) {
    console.error('[NorthStarSummarizer] Error generating summary:', error)
    // Fallback: truncate to 100 characters with ellipsis
    return text.trim().length > 100 
      ? text.trim().substring(0, 97) + '...' 
      : text.trim()
  }
}

