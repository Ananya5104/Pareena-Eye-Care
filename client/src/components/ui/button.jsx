import React from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

const Button = React.forwardRef(({ 
  className, 
  variant = "default", 
  size = "default", 
  asChild = false, 
  children,
  ...props 
}, ref) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
  
  const variants = {
    default: "bg-navy-900 text-white hover:bg-navy-800 focus-visible:ring-navy-900",
    destructive: "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500",
    outline: "border border-navy-900 bg-transparent text-navy-900 hover:bg-navy-900 hover:text-white focus-visible:ring-navy-900",
    secondary: "bg-navy-100 text-navy-900 hover:bg-navy-200 focus-visible:ring-navy-900",
    ghost: "text-navy-900 hover:bg-navy-100 focus-visible:ring-navy-900",
    link: "text-navy-900 underline-offset-4 hover:underline focus-visible:ring-navy-900",
    primary: "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-600",
    accent: "bg-accent-orange text-white hover:bg-orange-500 focus-visible:ring-orange-500",
  }

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  }

  const Comp = asChild ? motion.div : motion.button

  return (
    <Comp
      className={clsx(baseClasses, variants[variant], sizes[size], className)}
      ref={ref}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    >
      {children}
    </Comp>
  )
})

Button.displayName = "Button"

export { Button }
