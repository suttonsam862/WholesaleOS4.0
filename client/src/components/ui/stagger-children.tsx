import { motion } from "framer-motion"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

const containerVariants = {
  hidden: { 
    opacity: 0 
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  }
}

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 12,
    scale: 0.98
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
}

interface StaggerContainerProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
  initialDelay?: number
}

export function StaggerContainer({ 
  children, 
  className,
  staggerDelay = 0.05,
  initialDelay = 0.02
}: StaggerContainerProps) {
  const customVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay
      }
    }
  }

  return (
    <motion.div
      variants={customVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      variants={itemVariants}
      className={cn(className)}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  )
}

interface StaggerGridProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggerGrid({ 
  children, 
  className,
  staggerDelay = 0.03
}: StaggerGridProps) {
  return (
    <StaggerContainer 
      className={cn("grid gap-4", className)} 
      staggerDelay={staggerDelay}
    >
      {children}
    </StaggerContainer>
  )
}

interface StaggerListProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggerList({ 
  children, 
  className,
  staggerDelay = 0.05
}: StaggerListProps) {
  return (
    <StaggerContainer 
      className={cn("flex flex-col gap-3", className)} 
      staggerDelay={staggerDelay}
    >
      {children}
    </StaggerContainer>
  )
}
