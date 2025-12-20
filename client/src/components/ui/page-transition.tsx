import { motion, AnimatePresence } from "framer-motion"
import { ReactNode } from "react"

const pageTransitionVariants = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0 
  },
  exit: { 
    opacity: 0, 
    y: -10 
  }
}

const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30
}

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={springTransition}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  )
}

interface PageTransitionWrapperProps {
  children: ReactNode
  routeKey: string
  className?: string
}

export function PageTransitionWrapper({ 
  children, 
  routeKey,
  className 
}: PageTransitionWrapperProps) {
  return (
    <AnimatePresence mode="wait">
      <PageTransition key={routeKey} className={className}>
        {children}
      </PageTransition>
    </AnimatePresence>
  )
}
