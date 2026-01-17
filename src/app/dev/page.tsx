'use client'

import Link from 'next/link'

export default function DevPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-base font-medium text-black">FounderOS</h1>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="text-zinc-600 hover:text-black transition-colors">
              Dashboard
            </Link>
            <Link href="/roadmap" className="text-zinc-600 hover:text-black transition-colors">
              Roadmap
            </Link>
            <Link href="/contacts" className="text-zinc-600 hover:text-black transition-colors">
              Network
            </Link>
            <Link href="/documents" className="text-zinc-600 hover:text-black transition-colors">
              Documents
            </Link>
            <Link href="/agents" className="text-zinc-600 hover:text-black transition-colors">
              AI Agents
            </Link>
            <Link href="/integrations" className="text-zinc-600 hover:text-black transition-colors">
              Integrations
            </Link>
            <Link href="/dev" className="text-black font-medium">
              Dev
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg border border-zinc-200 p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-black mb-4">FounderOS - Developer Documentation</h1>
            <p className="text-zinc-600">Complete overview of the application, its goals, and roadmap to full functionality.</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-black border-b border-zinc-200 pb-2">What This App Is</h2>
            <div className="prose prose-sm max-w-none text-zinc-700 space-y-3">
              <p>
                FounderOS is an AI-powered operating system for early-stage startup founders. It acts as an autonomous AI co-founder 
                that monitors, manages, and executes business operations without constant user input.
              </p>
              <p>
                Unlike traditional productivity tools, FounderOS is proactive rather than reactive. The AI initiates conversations, 
                detects important changes (budget shifts, calendar events, roadmap progress), and suggests or executes actions 
                autonomously. It integrates with 32+ tools (Gmail, Calendar, Slack, Stripe, Notion, etc.) to provide a unified 
                workflow hub.
              </p>
              <p>
                The system uses vector databases for context-aware responses, tracks resources (time, budget, team), manages 
                networks and relationships, and provides a Kanban-style roadmap for tracking traction. Everything is designed 
                around the "Bird in Hand" principle - helping founders leverage what they already have (skills, network, funds, 
                experience) rather than waiting for perfect conditions.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-black border-b border-zinc-200 pb-2">Ideal Features</h2>
            <div className="space-y-4 text-zinc-700">
              <div>
                <h3 className="font-semibold text-black mb-2">1. Autonomous Task Execution</h3>
                <p>
                  AI agents that execute complex, multi-step tasks without user intervention. Examples: Drafting investor update 
                  emails with current metrics, generating product specs from roadmap items, analyzing customer feedback and 
                  extracting actionable insights, sending personalized LinkedIn outreach sequences, scheduling meetings based on 
                  availability and priorities.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">2. Proactive Monitoring & Alerts</h3>
                <p>
                  Continuous monitoring of budget, calendar, emails, roadmap, and network. The AI detects important changes and 
                  initiates conversations. Examples: "I noticed your runway dropped to 2 months - should I draft a fundraising 
                  update?", "You have a meeting with an investor tomorrow - I've prepared talking points", "You haven't responded 
                  to 3 emails from potential customers - should I draft replies?"
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">3. Unified Workflow Hub</h3>
                <p>
                  Single interface that integrates 32+ tools (Email, Calendar, Slack, Notion, Linear, Stripe, Google Analytics, 
                  etc.). Data flows seamlessly between tools. Actions in one tool trigger actions in others. No context switching 
                  or manual data entry.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">4. Resource-Aware Planning</h3>
                <p>
                  AI understands available time, budget, team size, and network. Suggests actions that match current resources. 
                  Tracks runway, burn rate, and budget allocation. Helps prioritize based on resources, not just goals.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">5. Network Management & Relationship Tracking</h3>
                <p>
                  Comprehensive CRM with AI-powered organization. Import LinkedIn networks, automatically tag and categorize contacts, 
                  organize into custom groups, track interactions, suggest follow-ups, identify warm introductions, maintain 
                  relationship health scores.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">6. Context-Aware AI Chat</h3>
                <p>
                  Chat interface where AI initiates conversations. Uses vector database for semantic search across conversation 
                  history, documents, and context. Remembers past conversations, understands current startup state, and provides 
                  relevant suggestions based on history and context.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">7. 20+ Specialized AI Agents</h3>
                <p>
                  Pre-built agents for common founder tasks: Customer development (interview analysis, survey generation, outreach), 
                  Product (spec generation, Jira ticket creation, PR reviews), Fundraising (investor updates, VC research, pitch 
                  deck updates), Marketing (LinkedIn posts, blog posts, SEO analysis), Operations (team priorities, payment 
                  reconciliation, calendar optimization).
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">8. Progress Tracking & Roadmap</h3>
                <p>
                  Kanban-style roadmap with visual progress tracking. AI suggests next steps based on current progress. Tracks 
                  completion rates, identifies blockers, suggests pivots. Integrates with task management tools (Linear, Jira, 
                  Notion).
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-black border-b border-zinc-200 pb-2">Problems It Solves</h2>
            <div className="space-y-3 text-zinc-700">
              <div>
                <h3 className="font-semibold text-black">1. Founder Overwhelm</h3>
                <p>
                  Early-stage founders wear many hats and juggle countless tasks. FounderOS acts as a co-founder that never sleeps, 
                  monitoring everything and proactively suggesting what to focus on next. Reduces decision fatigue and context 
                  switching.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black">2. Tool Fragmentation</h3>
                <p>
                  Founders use 20+ different tools (Gmail, Calendar, Slack, Notion, Stripe, etc.) that don't talk to each other. 
                  FounderOS provides a unified interface where data flows seamlessly between tools, eliminating manual data entry 
                  and context switching.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black">3. Reactive vs Proactive Work</h3>
                <p>
                  Most tools require you to remember to use them. FounderOS is proactive - it monitors your startup and initiates 
                  actions when needed. You don't have to remember to check runway, follow up with contacts, or update investors - 
                  the AI does it for you.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black">4. Network Management Chaos</h3>
                <p>
                  Founders have hundreds of contacts across LinkedIn, email, events, etc. Managing this network manually is 
                  impossible. FounderOS automatically organizes contacts, suggests follow-ups, tracks relationship health, and 
                  identifies warm introductions.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black">5. Lack of Strategic Context</h3>
                <p>
                  Most tools operate in isolation without understanding your overall startup state. FounderOS has full context - 
                  your goals, resources, progress, network, and history. Every suggestion is contextual and resource-aware.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black">6. Time-Consuming Admin Tasks</h3>
                <p>
                  Founders spend hours on administrative tasks (drafting emails, updating documents, scheduling, data entry). 
                  FounderOS automates these with AI agents, freeing up time for high-value work.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black">7. Information Silos</h3>
                <p>
                  Critical information is scattered across tools, documents, emails, and conversations. FounderOS centralizes 
                  everything with semantic search, making it easy to find relevant context and past decisions.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-black border-b border-zinc-200 pb-2">Who It Serves</h2>
            <div className="space-y-3 text-zinc-700">
              <div>
                <h3 className="font-semibold text-black">Primary: Early-Stage Startup Founders (Pre-Seed to Series A)</h3>
                <p>
                  Solo founders or small teams (1-10 people) building their first or second startup. Typically have limited 
                  resources, wear many hats, and need to move fast. They're technical enough to use advanced tools but don't have 
                  time to manage complex setups.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black">Secondary: Startup Accelerator Participants</h3>
                <p>
                  Founders in YC, Techstars, or similar programs who need to track progress, maintain investor relationships, and 
                  execute on accelerator milestones. The system helps them stay organized and proactive during intensive programs.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black">Tertiary: Startup Advisors & Coaches</h3>
                <p>
                  Advisors who manage multiple startup relationships can use FounderOS to track their portfolio, stay updated on 
                  progress, and provide contextual advice. The system helps them scale their advisory work.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-black border-b border-zinc-200 pb-2">Steps to Make a Fully Functional Agent System</h2>
            <div className="space-y-6 text-zinc-700">
              <div>
                <h3 className="font-semibold text-black mb-2">Phase 1: Core Infrastructure ✅ (COMPLETED)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>✅ OpenAI integration with API client</li>
                  <li>✅ Agent execution framework (BaseAgent, AgentRegistry)</li>
                  <li>✅ Database schema for agent tasks and tracking</li>
                  <li>✅ Vector database setup (pgvector for semantic search)</li>
                  <li>✅ Event detection system framework</li>
                  <li>✅ Proactive message generation system</li>
                  <li>✅ Background job system (cron endpoints)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">Phase 2: Complete 3 Proof-of-Concept Agents ✅ (COMPLETED)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>✅ Draft Investor Update Email - Pulls metrics, generates email</li>
                  <li>✅ Generate Product Spec - Creates PRD from roadmap items</li>
                  <li>✅ Analyze Customer Feedback - Extracts insights and action items</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">Phase 3: OAuth Integrations (IN PROGRESS)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>🔲 Gmail OAuth - Read/send emails, detect important messages</li>
                  <li>🔲 Google Calendar OAuth - Read events, create meetings, detect conflicts</li>
                  <li>🔲 Slack OAuth - Read messages, send notifications, detect mentions</li>
                  <li>🔲 Stripe Webhooks - Real-time payment events, budget updates</li>
                  <li>🔲 Notion OAuth - Sync roadmap, create documents, update pages</li>
                  <li>🔲 Linear/Jira OAuth - Create tickets, sync tasks, track progress</li>
                </ul>
                <p className="mt-2 text-sm text-zinc-600">
                  Each integration requires: OAuth flow, token storage, API client, event detection, webhook handlers (where applicable)
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">Phase 4: Complete All 20 AI Agents (PARTIAL)</h3>
                <p className="mb-2">Currently have 3 agents. Need to implement remaining 17:</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-black mb-1">Customer Development (4 agents):</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>🔲 Schedule customer interview (Calendar integration)</li>
                      <li>🔲 Generate customer survey (Form builder integration)</li>
                      <li>🔲 Draft cold outreach sequence (Email integration)</li>
                      <li>🔲 Analyze interview transcripts (NLP analysis)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-black mb-1">Product (4 agents):</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>🔲 Create Jira tickets from feedback (Jira integration)</li>
                      <li>🔲 Review pull requests (GitHub integration)</li>
                      <li>🔲 Analyze competitor features (Web scraping + analysis)</li>
                      <li>✅ Generate product spec (COMPLETED)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-black mb-1">Fundraising (4 agents):</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>✅ Draft investor update (COMPLETED)</li>
                      <li>🔲 Research VCs for seed round (Web research + analysis)</li>
                      <li>🔲 Update pitch deck with metrics (Document generation)</li>
                      <li>🔲 Send thank you notes to investors (Email integration)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-black mb-1">Marketing (4 agents):</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>🔲 Write LinkedIn posts (Social media API)</li>
                      <li>🔲 Generate SEO blog post (SEO optimization)</li>
                      <li>🔲 Analyze website traffic (Analytics integration)</li>
                      <li>🔲 Set up email nurture campaign (Email marketing integration)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-black mb-1">Operations (4 agents):</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>🔲 Sync tasks to Notion (Notion integration)</li>
                      <li>🔲 Generate weekly team priorities (Task analysis)</li>
                      <li>🔲 Reconcile Stripe with QuickBooks (Payment reconciliation)</li>
                      <li>🔲 Analyze calendar for focus time (Calendar optimization)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">Phase 5: Enhanced Event Detection (PARTIAL)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>✅ Budget changes (Basic - needs Stripe integration)</li>
                  <li>✅ Roadmap updates (Basic - needs enhancement)</li>
                  <li>🔲 Calendar events (Needs Google Calendar OAuth)</li>
                  <li>🔲 Email events (Needs Gmail OAuth)</li>
                  <li>🔲 Payment events (Needs Stripe webhooks)</li>
                  <li>🔲 Slack mentions (Needs Slack OAuth)</li>
                  <li>🔲 Contact interactions (Needs email/calendar integration)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">Phase 6: Advanced Features</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>🔲 Learning system - Track which suggestions users act on, improve relevance</li>
                  <li>🔲 Multi-event correlation - "You completed X, have meeting with Y, budget increased"</li>
                  <li>🔲 Predictive suggestions - Use historical data to predict needs</li>
                  <li>🔲 Relationship health scores - Track network relationship quality over time</li>
                  <li>🔲 Automated workflows - Chain agents together (e.g., analyze feedback → create tickets → notify team)</li>
                  <li>🔲 Custom agent creation - Let users create their own agents</li>
                  <li>🔲 Agent marketplace - Share agents between users</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">Phase 7: Production Readiness</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>🔲 Error handling & retry logic for all integrations</li>
                  <li>🔲 Rate limiting for API calls</li>
                  <li>🔲 Cost monitoring and alerts</li>
                  <li>🔲 Performance optimization (caching, batching)</li>
                  <li>🔲 Security audit (OAuth token storage, data encryption)</li>
                  <li>🔲 Monitoring & alerting (error tracking, performance metrics)</li>
                  <li>🔲 User onboarding flow</li>
                  <li>🔲 Documentation & tutorials</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-black border-b border-zinc-200 pb-2">Steps to Make Fully Functional App</h2>
            <div className="space-y-6 text-zinc-700">
              <div>
                <h3 className="font-semibold text-black mb-2">Current Status: ~40% Complete</h3>
                <p className="mb-2">
                  Core infrastructure is built, but many features are partially implemented or missing integrations. 
                  Estimated 60-80 hours of development remaining for full functionality.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">1. Complete OAuth Integrations (20-30 hours)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Set up OAuth apps in Google, Slack, Notion, Linear, etc.</li>
                  <li>Implement OAuth flows (redirect, callback, token exchange)</li>
                  <li>Store tokens securely (encrypted, refresh token handling)</li>
                  <li>Build API clients for each service</li>
                  <li>Implement webhook handlers (Stripe, Slack, etc.)</li>
                  <li>Add token refresh logic</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">2. Complete All 20 AI Agents (25-35 hours)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Implement remaining 17 agents following established patterns</li>
                  <li>Each agent: Input validation, API integration, error handling, output formatting</li>
                  <li>Test each agent with real data</li>
                  <li>Add agent-specific UI components</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">3. Enhanced Event Detection (10-15 hours)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Connect event detectors to OAuth integrations</li>
                  <li>Implement real-time webhook processing</li>
                  <li>Add event correlation logic</li>
                  <li>Improve event prioritization</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">4. UI/UX Improvements (8-12 hours)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Agent execution status indicators</li>
                  <li>Better error messages and loading states</li>
                  <li>Agent result visualization</li>
                  <li>Settings page for integrations</li>
                  <li>Agent configuration UI</li>
                  <li>Mobile responsiveness</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">5. Testing & Bug Fixes (8-10 hours)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Integration tests for agents</li>
                  <li>End-to-end testing</li>
                  <li>Error scenario testing</li>
                  <li>Performance testing</li>
                  <li>Fix discovered bugs</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">6. Production Deployment (4-6 hours)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Environment configuration</li>
                  <li>Database migrations in production</li>
                  <li>Background job setup (Vercel Cron or external)</li>
                  <li>Monitoring setup (error tracking, analytics)</li>
                  <li>Security hardening</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-black border-b border-zinc-200 pb-2">Technical Stack</h2>
            <div className="text-zinc-700 space-y-2">
              <p><span className="font-semibold">Frontend:</span> Next.js 16, React, TypeScript, Tailwind CSS</p>
              <p><span className="font-semibold">Backend:</span> Next.js API Routes, Supabase (PostgreSQL + Auth)</p>
              <p><span className="font-semibold">AI:</span> OpenAI GPT-4 Turbo, text-embedding-3-small</p>
              <p><span className="font-semibold">Database:</span> Supabase (PostgreSQL with pgvector extension)</p>
              <p><span className="font-semibold">Authentication:</span> Supabase Auth (OAuth ready)</p>
              <p><span className="font-semibold">Background Jobs:</span> Vercel Cron (or external cron service)</p>
              <p><span className="font-semibold">Deployment:</span> Vercel (or similar)</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-black border-b border-zinc-200 pb-2">Key Architectural Decisions</h2>
            <div className="space-y-3 text-zinc-700">
              <div>
                <h3 className="font-semibold text-black">Agent Framework Pattern</h3>
                <p>
                  All agents extend BaseAgent class, making it easy to add new agents. Agents are registered in a central 
                  registry. Execution is tracked in database for monitoring and debugging.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-black">Proactive vs Reactive</h3>
                <p>
                  System is designed to be proactive - AI initiates conversations rather than waiting for user input. Events 
                  trigger agent execution automatically.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-black">Vector Database for Context</h3>
                <p>
                  All conversations stored with embeddings. Semantic search enables context-aware responses. System remembers 
                  past conversations and uses them to generate better suggestions.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-black">Event-Driven Architecture</h3>
                <p>
                  Changes trigger events, events trigger agents, agents generate messages. Clean separation of concerns. Easy to 
                  add new event types and detectors.
                </p>
              </div>
            </div>
          </section>

          <div className="pt-8 border-t border-zinc-200">
            <p className="text-sm text-zinc-500">
              Last updated: {new Date().toLocaleDateString()} | 
              Status: Active Development | 
              Current Completion: ~40%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

