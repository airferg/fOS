'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Use Supabase client directly for proper session handling
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            name: name,
          },
        },
      })

      if (error) {
        console.error('Signup error:', error)
        setError(error.message)
        return
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.session) {
          // User is logged in, redirect to onboarding
          router.push('/onboarding')
          router.refresh()
        } else {
          // Email confirmation required
          setError('Please check your email to confirm your account.')
        }
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      setError('')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/contacts.readonly',
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      // Redirect will happen automatically via Supabase
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      console.error('Google signup error:', err)
      setError(err.message || 'Failed to initiate Google signup')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md px-8">
        <div className="mb-10">
          <h1 className="text-2xl font-medium tracking-tight text-black mb-2">
            FounderOS
          </h1>
          <p className="text-sm text-zinc-600">
            Create your account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-black mb-1.5">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-sm"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-black mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-sm"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-zinc-500">At least 8 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-black text-white text-sm font-medium rounded hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-zinc-500">or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignup}
          className="mt-6 w-full py-2.5 border border-zinc-300 text-black text-sm font-medium rounded hover:bg-zinc-50 transition-colors"
        >
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-zinc-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-black font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
