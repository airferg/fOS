'use client'

import { motion } from 'framer-motion'

export function PageBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-full">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
      
      {/* Gradient in top-left corner */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute top-0 left-0 w-[250px] h-[250px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle at top left, rgba(251, 146, 60, 0.5) 0%, rgba(251, 146, 60, 0.3) 20%, rgba(251, 146, 60, 0.1) 40%, transparent 60%)',
          filter: 'blur(60px)',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
