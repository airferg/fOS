export type SkillType = 'technical' | 'design' | 'business' | 'growth' | 'other'
export type Proficiency = 'beginner' | 'intermediate' | 'expert'
export type DocumentType = 'pitch' | 'memo' | 'interview_script' | 'landing_page' | 'problem_brief' | 'fundraising_memo' | 'other'
export type RoadmapStatus = 'todo' | 'in_progress' | 'done'
export type ContactStage = 'contacted' | 'interviewed' | 'interested' | 'cofounder' | 'investor' | 'advisor'

export interface UserProfile {
  id: string
  email: string
  name: string | null
  onboarding_complete: boolean
  current_goal: string | null
  funds_available: number | null
  hours_per_week: number | null
  resume_url: string | null
  avatar_url: string | null
  preferred_tool_docs: 'google_docs' | 'notion'
  created_at: string
  updated_at: string
}

export interface Skill {
  id: string
  user_id: string
  name: string
  type: SkillType
  proficiency: Proficiency
  created_at: string
}

export interface Contact {
  id: string
  user_id: string
  name: string
  email: string
  role: string | null
  tags: string[]
  helpful_for: string | null
  stage: ContactStage
  notes: string | null
  last_contacted: string | null
  created_at: string
  updated_at: string
}

export interface Idea {
  id: string
  user_id: string
  title: string
  description: string | null
  score: number | null
  market_size: string | null
  validation_status: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  title: string
  type: DocumentType
  content: string | null
  link: string | null
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
}

export interface RoadmapItem {
  id: string
  user_id: string
  title: string
  description: string | null
  due_date: string | null
  status: RoadmapStatus
  priority: number
  related_idea_id: string | null
  created_at: string
  updated_at: string
}

export interface ActionLog {
  id: string
  user_id: string
  action_type: string
  action_details: Record<string, any>
  status: 'pending' | 'success' | 'failed'
  result: Record<string, any> | null
  created_at: string
}

export interface OAuthToken {
  id: string
  user_id: string
  provider: string
  access_token: string
  refresh_token: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}
