/**
 * Integration Monitoring System
 * Monitors external services (Gmail, Calendar, Slack, Stripe) for events
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { DetectedEvent } from '@/lib/proactive/event-detector'

export interface IntegrationToken {
  id: string
  user_id: string
  integration_type: string
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
  scopes: string[]
  metadata: Record<string, any>
  is_active: boolean
}

export interface MonitoringJob {
  id: string
  user_id: string
  job_type: string
  integration_type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  last_run_at: string | null
  next_run_at: string | null
  run_interval_minutes: number
  metadata: Record<string, any>
  error_message: string | null
}

/**
 * Normalize integration type names (handle both hyphen and underscore formats)
 */
function normalizeIntegrationType(type: string): string[] {
  // Return both possible formats to check
  const normalized = type.replace(/-/g, '_')
  const hyphenated = type.replace(/_/g, '-')
  
  // Return unique values
  const variants = [type, normalized, hyphenated]
  return [...new Set(variants)]
}

/**
 * Get active integration token for a user
 */
export async function getIntegrationToken(
  userId: string,
  integrationType: string
): Promise<IntegrationToken | null> {
  const supabase = await createServerSupabaseClient()

  // Verify we have a valid user ID
  console.log(`[Integration Monitor] 👤 User ID: ${userId}`)
  
  // Note: Supabase Auth session tokens are basic OAuth tokens from sign-in
  // They typically don't have the extended scopes needed for Calendar/Gmail APIs
  // We should NOT use session tokens for API access - they will return "Forbidden"
  // Instead, we need to store tokens with proper scopes in oauth_tokens or integration_tokens tables
  
  // Try all possible naming variants (hyphen vs underscore)
  const variants = normalizeIntegrationType(integrationType)
  let data: any = null
  let error: any = null

  console.log(`[Integration Monitor] 🔍 Looking for integration token: ${integrationType} (trying variants: ${variants.join(', ')})`)

  // Try integration_tokens table first (new schema) with all variants
  for (const variant of variants) {
    const result = await supabase
      .from('integration_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('integration_type', variant)
      .eq('is_active', true)
      .maybeSingle()
    
    if (result.data && !result.error) {
      console.log(`[Integration Monitor] ✅ Found token with variant: ${variant}`)
      data = result.data
      break
    }
    if (result.error && !error) {
      error = result.error
    }
  }

  // If not found, log what tokens actually exist for debugging
  if (!data) {
    const { data: allTokens } = await supabase
      .from('integration_tokens')
      .select('integration_type')
      .eq('user_id', userId)
      .eq('is_active', true)
    
    if (allTokens && allTokens.length > 0) {
      console.log(`[Integration Monitor] 📋 Available tokens for user: ${allTokens.map((t: any) => t.integration_type).join(', ')}`)
    } else {
      console.log(`[Integration Monitor] ⚠️  No active tokens found in integration_tokens table`)
    }
  }

  // Fallback to oauth_tokens table (old schema) if not found
  if (error || !data) {
    console.log(`[Integration Monitor] 🔄 Token not found in integration_tokens, checking oauth_tokens table...`)
    
    // Map integration types to providers (handle both formats)
    const providerMap: Record<string, string> = {
      'gmail': 'google',
      'google_calendar': 'google',
      'google-calendar': 'google',
      'google_docs': 'google',
      'google-docs': 'google',
      'google': 'google',
      'slack': 'slack',
      'stripe': 'stripe'
    }

    // Try both hyphen and underscore variants
    const normalizedType = integrationType.replace(/-/g, '_')
    const hyphenatedType = integrationType.replace(/_/g, '-')
    const provider = providerMap[integrationType] || providerMap[normalizedType] || providerMap[hyphenatedType] || 'google'

    console.log(`[Integration Monitor] 🔍 Looking in oauth_tokens for provider: ${provider} (from integration type: ${integrationType})`)

    const { data: oauthData, error: oauthError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .maybeSingle()

    if (oauthError) {
      console.log(`[Integration Monitor] ❌ Error querying oauth_tokens:`, oauthError.message)
      console.log(`[Integration Monitor] ❌ Error code:`, oauthError.code)
      console.log(`[Integration Monitor] ❌ Error details:`, oauthError)
      
      // Check if it's an RLS/permissions issue
      if (oauthError.code === '42501' || oauthError.message?.includes('permission') || oauthError.message?.includes('policy')) {
        console.log(`[Integration Monitor] ⚠️  RLS policy may be blocking access to oauth_tokens table`)
      }
    }

    if (!oauthData) {
      // Check what providers actually exist for this user (without provider filter)
      console.log(`[Integration Monitor] 🔍 Checking all OAuth tokens for user ${userId}...`)
      const { data: allOAuthTokens, error: allTokensError } = await supabase
        .from('oauth_tokens')
        .select('provider, user_id, created_at')
        .eq('user_id', userId)
      
      if (allTokensError) {
        console.log(`[Integration Monitor] ❌ Error querying all OAuth tokens:`, allTokensError.message, allTokensError.code)
      }
      
      if (allOAuthTokens && allOAuthTokens.length > 0) {
        console.log(`[Integration Monitor] 📋 Available OAuth providers for user ${userId}: ${allOAuthTokens.map((t: any) => `${t.provider} (created: ${t.created_at})`).join(', ')}`)
        console.log(`[Integration Monitor] ⚠️  Looking for provider "${provider}" but found: ${allOAuthTokens.map((t: any) => t.provider).join(', ')}`)
      } else {
        console.log(`[Integration Monitor] ⚠️  No OAuth tokens found in oauth_tokens table for user ${userId}`)
        
        // Use admin client to bypass RLS and check what's actually in the database
        try {
          const { data: adminTokens, error: adminError } = await supabaseAdmin
            .from('oauth_tokens')
            .select('provider, user_id, created_at')
            .eq('user_id', userId)
          
          if (!adminError && adminTokens && adminTokens.length > 0) {
            console.log(`[Integration Monitor] 🔓 [ADMIN] Found ${adminTokens.length} token(s) for user ${userId} (RLS was blocking): ${adminTokens.map((t: any) => `${t.provider} (created: ${t.created_at})`).join(', ')}`)
            console.log(`[Integration Monitor] ⚠️  RLS policy is blocking access to oauth_tokens!`)
          } else {
            // Try querying without user_id filter to see if table has any data at all
            const { data: anyTokens, error: anyError } = await supabaseAdmin
              .from('oauth_tokens')
              .select('provider, user_id')
              .limit(5)
            
            if (!anyError && anyTokens && anyTokens.length > 0) {
              console.log(`[Integration Monitor] 🔓 [ADMIN] Table has ${anyTokens.length} token(s) but none for user ${userId}`)
              console.log(`[Integration Monitor] 🔓 [ADMIN] Sample tokens: ${anyTokens.map((t: any) => `user: ${t.user_id}, provider: ${t.provider}`).join('; ')}`)
            } else {
              console.log(`[Integration Monitor] 🔓 [ADMIN] oauth_tokens table appears to be empty`)
            }
          }
        } catch (adminErr: any) {
          console.log(`[Integration Monitor] ⚠️  Could not query with admin client:`, adminErr.message)
        }
      }
      
      // No token found in either table
      return null
    }

    console.log(`[Integration Monitor] ✅ Found OAuth token in oauth_tokens table for provider: ${provider}`)

    // Convert oauth_tokens format to IntegrationToken format
    data = {
      id: oauthData.id,
      user_id: oauthData.user_id,
      integration_type: integrationType,
      access_token: oauthData.access_token,
      refresh_token: oauthData.refresh_token || null,
      token_expires_at: oauthData.expires_at || null,
      scopes: [],
      metadata: {},
      is_active: true
    }
  }

  if (!data) return null

  // Check if token is expired
  if (data.token_expires_at) {
    const expiresAt = new Date(data.token_expires_at)
    if (expiresAt < new Date()) {
      // Token expired, try to refresh if refresh_token exists
      if (data.refresh_token) {
        return await refreshIntegrationToken(userId, integrationType, data as IntegrationToken)
      }
      return null
    }
  }

  return data as IntegrationToken
}

/**
 * Get all connected integrations for a user
 * Returns a set of integration types that are currently connected
 */
export async function getConnectedIntegrations(userId: string): Promise<Set<string>> {
  const supabase = await createServerSupabaseClient()
  const connected = new Set<string>()

  // Check integration_tokens table (new schema)
  const { data: tokens, error } = await supabase
    .from('integration_tokens')
    .select('integration_type, token_expires_at')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) {
    console.log(`[Integration Monitor] ⚠️  Error querying integration_tokens:`, error.message)
    console.log(`[Integration Monitor] ⚠️  Error code:`, error.code)
    
    // Check if it's an RLS/permissions issue
    if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
      console.log(`[Integration Monitor] ⚠️  RLS policy may be blocking access to integration_tokens table`)
    }
  }

  if (!error && tokens) {
    for (const token of tokens) {
      // Check if token is not expired, or try to refresh it
      if (token.token_expires_at) {
        const expiresAt = new Date(token.token_expires_at)
        if (expiresAt < new Date()) {
          // Token expired - try to refresh if we have a refresh token
          // Note: We'd need to fetch the full token to refresh, so for now we skip expired tokens
          // The getIntegrationToken function will handle refresh when actually needed
          continue
        }
      }
      // Add both hyphen and underscore variants for compatibility
      const type = token.integration_type
      connected.add(type)
      connected.add(type.replace(/-/g, '_'))
      connected.add(type.replace(/_/g, '-'))
    }
  }

  // Check oauth_tokens table (old schema) as fallback
  console.log(`[Integration Monitor] 🔄 Checking oauth_tokens table for connected integrations...`)
  const { data: oauthTokens, error: oauthError } = await supabase
    .from('oauth_tokens')
    .select('provider')
    .eq('user_id', userId)

  if (oauthError) {
    console.log(`[Integration Monitor] ⚠️  Error querying oauth_tokens:`, oauthError.message)
  }

  if (!oauthError && oauthTokens && oauthTokens.length > 0) {
    console.log(`[Integration Monitor] 📋 Found ${oauthTokens.length} OAuth token(s): ${oauthTokens.map((t: any) => t.provider).join(', ')}`)
    
    // Map providers to integration types (include both hyphen and underscore variants)
    const providerMap: Record<string, string[]> = {
      'google': ['gmail', 'google_calendar', 'google-calendar', 'google_docs', 'google-docs', 'google'],
      'slack': ['slack'],
      'stripe': ['stripe']
    }

    oauthTokens.forEach((token: any) => {
      const integrationTypes = providerMap[token.provider] || [token.provider]
      console.log(`[Integration Monitor] ✅ Adding integrations for provider ${token.provider}: ${integrationTypes.join(', ')}`)
      integrationTypes.forEach(type => connected.add(type))
    })
  } else {
    console.log(`[Integration Monitor] ℹ️  No OAuth tokens found in oauth_tokens table`)
  }

  return connected
}

/**
 * Check if specific integrations are connected
 * Returns object with connection status for each integration
 */
export async function checkIntegrationStatus(
  userId: string,
  integrationTypes: string[]
): Promise<Record<string, boolean>> {
  const connected = await getConnectedIntegrations(userId)
  const status: Record<string, boolean> = {}

  integrationTypes.forEach(type => {
    status[type] = connected.has(type)
  })

  return status
}

/**
 * Refresh an expired integration token
 */
async function refreshIntegrationToken(
  userId: string,
  integrationType: string,
  token: IntegrationToken
): Promise<IntegrationToken | null> {
  console.log(`Token refresh needed for ${integrationType} (user: ${userId})`)
  
  // Handle Google OAuth token refresh
  if (integrationType.includes('google') || integrationType.includes('gmail')) {
    if (!token.refresh_token) {
      console.log(`[Token Refresh] No refresh token available for ${integrationType}`)
      return null
    }

    try {
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: token.refresh_token,
          grant_type: 'refresh_token',
        }),
      })

      if (!refreshResponse.ok) {
        const errorData = await refreshResponse.text()
        console.error(`[Token Refresh] Failed to refresh ${integrationType}:`, errorData)
        return null
      }

      const tokenData = await refreshResponse.json()
      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null

      // Update token in database
      const supabase = await createServerSupabaseClient()
      
      // Try to update in oauth_tokens table
      const { error: updateError } = await supabaseAdmin
        .from('oauth_tokens')
        .update({
          access_token: tokenData.access_token,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('provider', 'google')

      if (updateError) {
        console.error(`[Token Refresh] Error updating token in database:`, updateError)
      } else {
        console.log(`[Token Refresh] Successfully refreshed token for ${integrationType}`)
      }

      // Return updated token
      return {
        ...token,
        access_token: tokenData.access_token,
        token_expires_at: expiresAt || token.token_expires_at,
      }
    } catch (error: any) {
      console.error(`[Token Refresh] Error refreshing ${integrationType}:`, error.message)
      return null
    }
  }

  // For other providers, return null for now
  console.log(`[Token Refresh] Token refresh not implemented for ${integrationType}`)
  return null
}

/**
 * Get or create a monitoring job for a user
 */
export async function getOrCreateMonitoringJob(
  userId: string,
  jobType: string,
  integrationType: string,
  intervalMinutes: number = 30
): Promise<MonitoringJob> {
  const supabase = await createServerSupabaseClient()

  // Check if job exists
  const { data: existing } = await supabase
    .from('monitoring_jobs')
    .select('*')
    .eq('user_id', userId)
    .eq('job_type', jobType)
    .eq('integration_type', integrationType)
    .single()

  if (existing) {
    return existing as MonitoringJob
  }

  // Create new job
  const nextRunAt = new Date(Date.now() + intervalMinutes * 60 * 1000)

  const { data: newJob, error } = await supabaseAdmin
    .from('monitoring_jobs')
    .insert({
      user_id: userId,
      job_type: jobType,
      integration_type: integrationType,
      status: 'pending',
      run_interval_minutes: intervalMinutes,
      next_run_at: nextRunAt.toISOString(),
    })
    .select()
    .single()

  if (error || !newJob) {
    throw new Error(`Failed to create monitoring job: ${error?.message}`)
  }

  return newJob as MonitoringJob
}

/**
 * Update monitoring job status
 */
export async function updateMonitoringJob(
  jobId: string,
  updates: {
    status?: 'pending' | 'running' | 'completed' | 'failed'
    last_run_at?: Date
    next_run_at?: Date
    error_message?: string | null
    metadata?: Record<string, any>
  }
): Promise<void> {
  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  if (updates.status) updateData.status = updates.status
  if (updates.last_run_at) updateData.last_run_at = updates.last_run_at.toISOString()
  if (updates.next_run_at) updateData.next_run_at = updates.next_run_at.toISOString()
  if (updates.error_message !== undefined) updateData.error_message = updates.error_message
  if (updates.metadata) updateData.metadata = updates.metadata

  await supabaseAdmin
    .from('monitoring_jobs')
    .update(updateData)
    .eq('id', jobId)
}

/**
 * Get all active monitoring jobs that need to run
 */
export async function getJobsToRun(): Promise<MonitoringJob[]> {
  const supabase = await createServerSupabaseClient()

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('monitoring_jobs')
    .select('*')
    .or(`next_run_at.is.null,next_run_at.lte.${now}`)
    .neq('status', 'running')

  if (error || !data) return []

  return data as MonitoringJob[]
}

/**
 * Get all integrations a user has connected
 */
export async function getUserIntegrations(userId: string): Promise<string[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('integration_tokens')
    .select('integration_type')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error || !data) return []

  return data.map((token) => token.integration_type)
}

