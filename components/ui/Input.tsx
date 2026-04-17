import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-lg border bg-white text-vobi-dark placeholder:text-vobi-gray-light',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-vobi-primary/20 focus:border-vobi-primary',
            error ? 'border-red-400' : 'border-vobi-border',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
