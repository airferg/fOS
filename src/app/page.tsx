'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import HydraLogo from '@/components/HydraLogo'

// Floating particle component
function FloatingParticle({ delay, duration, size, x, y }: { 
  delay: number
  duration: number
  size: number
  x: number
  y: number 
}) {
  return (
    <motion.div
      className="absolute rounded-full bg-zinc-200 dark:bg-zinc-800"
      style={{ width: size, height: size, left: `${x}%`, top: `${y}%` }}
      animate={{
        y: [0, -30, 0],
        opacity: [0.3, 0.6, 0.3],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// Grid background
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-zinc-950" />
    </div>
  )
}

// Animated gradient orbs
function GradientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.03] dark:opacity-[0.05]"
        style={{
          background: 'radial-gradient(circle, rgba(0,0,0,1) 0%, transparent 70%)',
          left: '10%',
          top: '20%',
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-[0.02] dark:opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, rgba(0,0,0,1) 0%, transparent 70%)',
          right: '10%',
          bottom: '20%',
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}

export default function Home() {
  const [particles, setParticles] = useState<Array<{ id: number; delay: number; duration: number; size: number; x: number; y: number }>>([])

  useEffect(() => {
    // Generate random particles on mount
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 5,
      size: 2 + Math.random() * 4,
      x: Math.random() * 100,
      y: Math.random() * 100,
    }))
    setParticles(newParticles)
  }, [])

  const features = [
    {
      title: 'AI Assistant',
      description: 'Actionable suggestions based on your unique situation',
    },
    {
      title: 'Real Actions',
      description: 'Send emails, schedule calls, create documents automatically',
    },
    {
      title: 'Smart Roadmap',
      description: 'AI-generated plan tailored to your time and resources',
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background elements */}
      <GridBackground />
      <GradientOrbs />
      
      {/* Floating particles */}
      {particles.map((particle) => (
        <FloatingParticle key={particle.id} {...particle} />
      ))}

      {/* Main content */}
      <motion.div 
        className="max-w-2xl mx-auto px-6 text-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Logo */}
        <motion.div 
          className="flex justify-center mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <HydraLogo size="xl" showText={false} animate />
        </motion.div>

        {/* Title */}
        <motion.h1 
          className="text-3xl font-semibold text-black dark:text-white mb-4 tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Hydra
        </motion.h1>

        {/* Tagline */}
        <motion.p 
          className="text-sm text-zinc-500 dark:text-zinc-400 mb-12 max-w-md mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          The AI-powered operating system for startup founders.
          <br />
          <span className="text-zinc-400 dark:text-zinc-500">
            Leverage your skills, network, and experience.
          </span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          className="flex gap-3 justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Link href="/auth/signup">
            <motion.button
              className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg transition-all"
              whileHover={{ scale: 1.02, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              whileTap={{ scale: 0.98 }}
            >
              Get Started
            </motion.button>
          </Link>
          <Link href="/auth/login">
            <motion.button
              className="px-6 py-2.5 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white text-sm font-medium rounded-lg transition-all hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Sign In
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Features - positioned at bottom */}
      <motion.div 
        className="absolute bottom-12 left-0 right-0 px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="text-center group cursor-default"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                whileHover={{ y: -2 }}
              >
                <h3 className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-1 group-hover:text-black dark:group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-600 leading-relaxed max-w-[140px]">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Subtle bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
    </div>
  )
}
