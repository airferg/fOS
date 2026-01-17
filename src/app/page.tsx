import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h1 className="text-5xl font-medium tracking-tight text-black mb-6">
          FounderOS
        </h1>
        <p className="text-xl text-zinc-600 mb-4">
          An AI-powered operating system for startup founders
        </p>
        <p className="text-base text-zinc-500 mb-12 max-w-xl mx-auto">
          Leverage what you already have. Skills, network, funds, and experience.
          Build your startup using the Bird-in-Hand principle.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="px-8 py-3 bg-black text-white text-sm font-medium rounded hover:bg-zinc-800 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-3 border border-zinc-300 text-black text-sm font-medium rounded hover:bg-zinc-50 transition-colors"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-3 gap-12 text-left">
          <div>
            <h3 className="text-sm font-medium text-black mb-2">AI Assistant</h3>
            <p className="text-sm text-zinc-600">
              Get actionable suggestions based on your unique situation
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black mb-2">Real Actions</h3>
            <p className="text-sm text-zinc-600">
              Send emails, schedule calls, create documents automatically
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black mb-2">Smart Roadmap</h3>
            <p className="text-sm text-zinc-600">
              AI-generated plan tailored to your time and resources
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
