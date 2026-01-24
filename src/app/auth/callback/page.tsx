'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent immediate redirect - show loading state
      console.log('[OAuth Callback Client] ===== STARTING CALLBACK =====')
      console.log('[OAuth Callback Client] Full URL:', window.location.href)
      console.log('[OAuth Callback Client] Hash:', window.location.hash)
      console.log('[OAuth Callback Client] Search params:', searchParams.toString())
      console.log('[OAuth Callback Client] All search params:', Array.from(searchParams.entries()))
      
      // Check for code in hash (PKCE flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      console.log('[OAuth Callback Client] Hash params:', Array.from(hashParams.entries()))
      
      // Check for error in hash
      const hashError = hashParams.get('error')
      const hashErrorDescription = hashParams.get('error_description')
      
      if (hashError) {
        console.error('[OAuth Callback Client] OAuth error in hash:', hashError, hashErrorDescription)
        setError(hashErrorDescription || hashError)
        setTimeout(() => {
          router.push('/auth/login?error=' + encodeURIComponent(hashErrorDescription || hashError))
        }, 3000)
        return
      }

      try {

        // Check for error in URL query params
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (errorParam) {
          console.error('[OAuth Callback Client] OAuth error in query:', errorParam, errorDescription)
          setError(errorDescription || errorParam)
          setTimeout(() => {
            router.push('/auth/login?error=' + encodeURIComponent(errorDescription || errorParam))
          }, 3000)
          return
        }

        // Wait a bit for Supabase to process the URL hash
        console.log('[OAuth Callback Client] Waiting for Supabase to process URL...')
        await new Promise(resolve => setTimeout(resolve, 500))

        // Supabase automatically handles the session from the URL
        // Check if we have a session
        console.log('[OAuth Callback Client] Getting session...')
        let { data: { session }, error: sessionError } = await supabase.auth.getSession()

        console.log('[OAuth Callback Client] First session check:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          email: session?.user?.email,
          sessionError: sessionError?.message
        })

        // If no session, try waiting a bit more and check again
        if (!session && !sessionError) {
          console.log('[OAuth Callback Client] No session on first check, waiting and retrying...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          const retryResult = await supabase.auth.getSession()
          session = retryResult.data.session
          sessionError = retryResult.error
          console.log('[OAuth Callback Client] Retry session check:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            userId: session?.user?.id,
            sessionError: sessionError?.message
          })
        }

        // Try getting user directly as fallback
        if (!session || !session.user) {
          console.log('[OAuth Callback Client] Trying getUser() as fallback...')
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          console.log('[OAuth Callback Client] getUser() result:', { 
            userId: user?.id, 
            email: user?.email,
            error: userError?.message 
          })
          
          if (user && !userError) {
            // We have a user but no session - create session from user
            console.log('[OAuth Callback Client] Found user but no session, will proceed with user')
            // Continue with user object
          } else {
            console.error('[OAuth Callback Client] No session or user found')
            console.error('[OAuth Callback Client] Session data:', session)
            console.error('[OAuth Callback Client] User error:', userError)
            console.error('[OAuth Callback Client] Full URL at failure:', window.location.href)
            console.error('[OAuth Callback Client] Hash at failure:', window.location.hash)
            setError('No session found after OAuth callback. Check console for details.')
            // Don't redirect immediately - let user see the error
            setTimeout(() => {
              router.push('/auth/login?error=no_session')
            }, 5000)
            return
          }
        }

        if (sessionError) {
          console.error('[OAuth Callback Client] Session error:', sessionError)
          console.error('[OAuth Callback Client] Full error:', sessionError)
          setError(sessionError.message)
          setTimeout(() => {
            router.push('/auth/login?error=' + encodeURIComponent(sessionError.message))
          }, 2000)
          return
        }

        // Get the user from session or directly
        const user = session?.user || (await supabase.auth.getUser()).data.user
        
        if (!user) {
          console.error('[OAuth Callback Client] No user found after all checks')
          setError('No user found after OAuth callback')
          setTimeout(() => {
            router.push('/auth/login?error=no_user')
          }, 2000)
          return
        }

        console.log('[OAuth Callback Client] User found. User:', user.id, user.email)

        // Check if user profile exists using client-side Supabase
        try {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            // PGRST116 is "not found" - expected for new users
            console.error('[OAuth Callback Client] Error checking profile:', profileError)
            setError('Failed to check profile')
            setTimeout(() => {
              router.push('/auth/login?error=profile_check_failed')
            }, 2000)
            return
          }

          if (profile) {
            console.log('[OAuth Callback Client] Profile exists:', profile)
            console.log('[OAuth Callback Client] Onboarding complete:', profile.onboarding_complete)
            
            // Wait a moment to ensure cookies are set
            console.log('[OAuth Callback Client] Waiting for cookies to be set...')
            await new Promise(resolve => setTimeout(resolve, 500))
            
            // Verify session is still valid
            const { data: { session: verifySession } } = await supabase.auth.getSession()
            console.log('[OAuth Callback Client] Session verification:', { hasSession: !!verifySession })
            
            // Redirect based on onboarding status
            // Use window.location to ensure cookies are set before navigation
            if (profile.onboarding_complete) {
              console.log('[OAuth Callback Client] Redirecting to dashboard...')
              window.location.href = '/dashboard'
            } else {
              console.log('[OAuth Callback Client] Redirecting to onboarding...')
              window.location.href = '/onboarding'
            }
            return
          } else {
            // Profile doesn't exist, create it using client-side Supabase
            console.log('[OAuth Callback Client] Profile does not exist, creating...')
            
            const userName = user.user_metadata?.full_name || 
                            user.user_metadata?.name || 
                            user.email?.split('@')[0] ||
                            'User'

            const { data: newProfile, error: insertError } = await supabase
              .from('users')
              .insert({
                id: user.id,
                email: user.email!,
                name: userName,
                onboarding_complete: false,
              })
              .select()
              .single()

            if (insertError) {
              console.error('[OAuth Callback Client] Error creating profile:', insertError)
              setError('Failed to create profile')
              setTimeout(() => {
                router.push('/auth/login?error=profile_creation_failed')
              }, 2000)
              return
            }

            console.log('[OAuth Callback Client] Profile created successfully:', newProfile)
            console.log('[OAuth Callback Client] Redirecting to onboarding...')
            window.location.href = '/onboarding'
          }
        } catch (apiError: any) {
          console.error('[OAuth Callback Client] Unexpected error:', apiError)
          setError(apiError.message || 'An unexpected error occurred')
          setTimeout(() => {
            router.push('/auth/login?error=unexpected_error')
          }, 2000)
        }
      } catch (err: any) {
        console.error('[OAuth Callback Client] Unexpected error:', err)
        setError(err.message || 'An unexpected error occurred')
        setTimeout(() => {
          router.push('/auth/login?error=unexpected_error')
        }, 2000)
      }
    }

    handleCallback()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-center">
          <h1 className="text-xl font-medium text-black dark:text-white mb-2">Authentication Error</h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">{error}</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">Completing sign in...</p>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">Loading...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  )
}

