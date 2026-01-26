'use client'

import { motion, type Variants } from 'framer-motion'

interface HydraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  animate?: boolean
  className?: string
}

export default function HydraLogo({ 
  size = 'md', 
  showText = false, 
  animate = true,
  className = '' 
}: HydraLogoProps) {
  const sizeMap = {
    sm: { logo: 'h-6 w-6', text: 'text-sm' },
    md: { logo: 'h-8 w-8', text: 'text-base' },
    lg: { logo: 'h-10 w-10', text: 'text-xl' },
    xl: { logo: 'h-16 w-16', text: 'text-3xl' },
  }

  const { logo: logoSize, text: textSize } = sizeMap[size]

  const logoVariants: Variants = {
    initial: { 
      rotate: 0,
      scale: 0.8,
      opacity: 0 
    },
    animate: { 
      rotate: 360,
      scale: 1,
      opacity: 1,
      transition: {
        rotate: {
          duration: 0.8,
          ease: 'easeOut' as const,
        },
        scale: {
          duration: 0.5,
          ease: 'easeOut' as const,
        },
        opacity: {
          duration: 0.3,
        }
      }
    },
    hover: {
      rotate: 180,
      transition: {
        duration: 0.4,
        ease: 'easeInOut' as const,
      }
    }
  }

  const textVariants: Variants = {
    initial: { 
      opacity: 0,
      x: -10
    },
    animate: { 
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        delay: 0.3,
        ease: 'easeOut' as const,
      }
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.img
        src="/hydraOS-logo.png"
        alt="Hydra"
        variants={animate ? logoVariants : undefined}
        initial={animate ? 'initial' : undefined}
        animate={animate ? 'animate' : undefined}
        whileHover={animate ? 'hover' : undefined}
        className={`${logoSize} object-contain flex-shrink-0`}
      />
      {showText && (
        <motion.span
          variants={animate ? textVariants : undefined}
          initial={animate ? 'initial' : undefined}
          animate={animate ? 'animate' : undefined}
          className={`font-medium tracking-tight text-black dark:text-white ${textSize}`}
        >
          Hydra
        </motion.span>
      )}
    </div>
  )
}
