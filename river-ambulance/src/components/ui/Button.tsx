import { cn } from '@/lib/utils'
import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost' | 'outline' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

const VARIANT_STYLES = {
  primary: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white border-transparent',
  danger:  'bg-red-600  hover:bg-red-500  active:bg-red-700  text-white border-transparent',
  success: 'bg-green-600 hover:bg-green-500 active:bg-green-700 text-white border-transparent',
  ghost:   'bg-white/5 hover:bg-white/10 active:bg-white/15 text-blue-100 border-white/10',
  outline: 'bg-transparent hover:bg-white/5 text-blue-200 border-blue-400/40 hover:border-blue-400/60',
}

const SIZE_STYLES = {
  sm: 'h-8  px-3   text-xs  gap-1.5',
  md: 'h-11 px-4   text-sm  gap-2',
  lg: 'h-14 px-6   text-base gap-2.5',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg border font-semibold',
        'transition-all duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900',
        'disabled:opacity-50 disabled:pointer-events-none',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className
      )}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin w-4 h-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
