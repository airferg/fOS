import { OpenAI } from 'openai'

/**
 * Get OpenAI client instance (lazy initialization)
 * Only initializes when actually called, not at module load time
 * Returns null if API key is not configured (allows build to succeed)
 */
let _client: OpenAI | null = null

function getClient(): OpenAI | null {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return null
    }
    _client = new OpenAI({ apiKey })
  }
  return _client
}

export async function generateResponse(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  systemPrompt?: string
) {
  const client = getClient()
  if (!client) {
    throw new Error('OpenAI API key not configured')
  }

  const systemMessage = systemPrompt || `You are Hydra, an AI-powered operating system for early-stage startup founders. 
You help founders leverage the "Bird in Hand" principle - using what they already have (skills, network, funds, experience).
You're encouraging, practical, and action-oriented. You understand startup building, validation, and growth.
Keep responses SHORT - maximum 2-3 sentences. Get straight to the point. Suggest specific actions when relevant.`

  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { role: 'system', content: systemMessage },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 400, // Optimized: Chat responses should be brief
  })

  return response.choices[0]?.message?.content || ''
}

export async function analyzeResume(resumeText: string) {
  const response = await generateResponse(
    [
      {
        role: 'user',
        content: `Analyze this resume and extract key skills, experience, and domains in JSON format:
{
  "skills": [{ "name": string, "type": "technical" | "design" | "business" | "growth" | "other", "proficiency": "beginner" | "intermediate" | "expert" }],
  "experience": [{ "title": string, "company": string, "duration": string, "description": string }],
  "domains": string[],
  "insights": string[]
}

Resume:
${resumeText}`,
      },
    ],
    'Extract structured information from a resume for startup founder profiling.'
  )

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null
  } catch {
    return null
  }
}

export async function generateIdeas(
  skills: string[],
  experience: string[],
  domains: string[]
) {
  const response = await generateResponse(
    [
      {
        role: 'user',
        content: `Based on this founder's background, suggest 3-5 startup ideas they could validate:
Skills: ${skills.join(', ')}
Experience: ${experience.join(', ')}
Domains: ${domains.join(', ')}

Format as JSON:
[
  {
    "title": string,
    "description": string,
    "marketSize": string,
    "whyYou": string,
    "mvpSteps": string[]
  }
]`,
      },
    ],
    'Generate startup ideas tailored to founder background'
  )

  try {
    return JSON.parse(response)
  } catch {
    return []
  }
}

export async function generateRoadmap(
  goal: string,
  hoursPerWeek: number,
  duration: number = 12
) {
  const response = await generateResponse(
    [
      {
        role: 'user',
        content: `Create a ${duration}-week startup roadmap for this goal: "${goal}"
Available time: ${hoursPerWeek} hours/week

Format as JSON:
[
  {
    "week": number,
    "title": string,
    "milestone": string,
    "tasks": string[],
    "success_metrics": string[]
  }
]`,
      },
    ],
    'Generate a practical startup roadmap'
  )

  try {
    return JSON.parse(response)
  } catch {
    return []
  }
}

export async function suggestActions(
  goal: string,
  birdInHand: {
    skills: string[]
    experience: string[]
    network: number
    funds: number
  }
) {
  const response = await generateResponse(
    [
      {
        role: 'user',
        content: `Suggest 3 specific, immediately actionable next steps for this founder:
Goal: ${goal}
Skills: ${birdInHand.skills.join(', ')}
Experience: ${birdInHand.experience.join(', ')}
Network size: ${birdInHand.network} contacts
Available funds: $${birdInHand.funds}

Format as JSON:
[
  {
    "action": string,
    "type": "email" | "call" | "document" | "survey" | "code" | "research",
    "why": string,
    "expectedOutcome": string,
    "timeEstimate": "15min" | "30min" | "1hour" | "2hours" | "1day"
  }
]`,
      },
    ],
    'Suggest immediate actions for startup building'
  )

  try {
    return JSON.parse(response)
  } catch {
    return []
  }
}

export async function generateEmail(
  recipient: string,
  goal: string,
  context: string
) {
  const response = await generateResponse(
    [
      {
        role: 'user',
        content: `Draft a professional, warm outreach email to ${recipient} about: ${goal}
Context: ${context}

Keep it concise (150-200 words), personal, and action-oriented.`,
      },
    ],
    'Draft professional outreach emails'
  )

  return response
}

export async function generateInterviewScript(
  targetUser: string,
  productArea: string
) {
  const response = await generateResponse(
    [
      {
        role: 'user',
        content: `Generate a 10-question user interview script for talking to a ${targetUser} about ${productArea}.
Make questions open-ended, insightful, and focused on discovering real pain points.
Format: numbered list with brief follow-up tips.`,
      },
    ],
    'Generate user interview scripts'
  )

  return response
}

export async function generateDocument(
  documentType: string,
  context: string
) {
  const response = await generateResponse(
    [
      {
        role: 'user',
        content: `Generate a ${documentType} with this context:
${context}

Make it professional, clear, and ready to use.`,
      },
    ],
    'Generate startup documents'
  )

  return response
}
