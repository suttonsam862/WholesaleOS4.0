import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { ReactNode } from "react"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted skeleton-shimmer",
        className
      )}
      {...props}
    />
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 p-4 rounded-lg bg-card border border-border", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <div className="flex justify-between pt-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

function SkeletonList({ 
  rows = 5, 
  className,
  staggered = true 
}: { 
  rows?: number
  className?: string
  staggered?: boolean
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-3 p-3 rounded-lg bg-card/50"
          style={staggered ? { animationDelay: `${i * 100}ms` } : undefined}
        >
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton 
              className="h-4" 
              style={{ width: `${85 - (i * 5)}%` }}
            />
            <Skeleton 
              className="h-3" 
              style={{ width: `${60 - (i * 3)}%` }}
            />
          </div>
          <Skeleton className="h-6 w-16 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}

function SkeletonTable({ 
  rows = 5, 
  columns = 4,
  className 
}: { 
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div className={cn("rounded-lg border border-border overflow-hidden", className)}>
      <div className="bg-muted/50 p-3 flex gap-4 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="h-4 flex-1" 
            style={{ maxWidth: i === 0 ? '150px' : '100px' }}
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="p-3 flex gap-4 border-b border-border last:border-b-0"
          style={{ animationDelay: `${rowIndex * 50}ms` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className="h-4 flex-1" 
              style={{ 
                maxWidth: colIndex === 0 ? '150px' : '100px',
                width: `${70 + Math.random() * 30}%`
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function SkeletonChart({ 
  type = 'bar',
  className 
}: { 
  type?: 'bar' | 'line'
  className?: string
}) {
  const bars = [65, 80, 45, 90, 55, 70, 85, 60, 75, 50]
  
  return (
    <div className={cn("p-4 rounded-lg bg-card border border-border", className)}>
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
      </div>
      <div className="h-48 flex items-end gap-2 pt-4">
        {type === 'bar' ? (
          bars.map((height, i) => (
            <Skeleton 
              key={i}
              className="flex-1 rounded-t-sm"
              style={{ 
                height: `${height}%`,
                animationDelay: `${i * 50}ms`
              }}
            />
          ))
        ) : (
          <div className="w-full h-full relative">
            <Skeleton className="absolute bottom-0 left-0 right-0 h-1 rounded-full" />
            <Skeleton className="absolute bottom-[30%] left-0 right-0 h-1 rounded-full opacity-50" />
            <Skeleton className="absolute bottom-[60%] left-0 right-0 h-1 rounded-full opacity-30" />
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path
                d="M0,80 Q25,40 50,60 T100,30"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted skeleton-shimmer"
                style={{ opacity: 0.5 }}
              />
            </svg>
          </div>
        )}
      </div>
      <div className="flex justify-between mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  )
}

function SkeletonAvatar({ 
  size = 'md',
  withText = true,
  className 
}: { 
  size?: 'sm' | 'md' | 'lg'
  withText?: boolean
  className?: string
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14'
  }
  
  const textSizeClasses = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-5'
  }
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Skeleton className={cn("rounded-full flex-shrink-0", sizeClasses[size])} />
      {withText && (
        <div className="space-y-2 flex-1">
          <Skeleton className={cn("w-32", textSizeClasses[size])} />
          <Skeleton className={cn("w-20", size === 'lg' ? 'h-4' : 'h-3')} />
        </div>
      )}
    </div>
  )
}

function SkeletonText({ 
  lines = 3,
  className 
}: { 
  lines?: number
  className?: string
}) {
  const widths = ['100%', '95%', '85%', '90%', '75%', '80%', '70%']
  
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i}
          className="h-4"
          style={{ 
            width: widths[i % widths.length],
            animationDelay: `${i * 75}ms`
          }}
        />
      ))}
    </div>
  )
}

const springTransition = {
  type: "spring" as const,
  damping: 25,
  stiffness: 300
}

interface LoadingContainerProps {
  isLoading: boolean
  skeleton: ReactNode
  children: ReactNode
  className?: string
}

function LoadingContainer({ 
  isLoading, 
  skeleton, 
  children, 
  className 
}: LoadingContainerProps) {
  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={springTransition}
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springTransition}
            className="content-fade-in"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { 
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  SkeletonChart,
  SkeletonAvatar,
  SkeletonText,
  LoadingContainer
}
