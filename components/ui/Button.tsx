"use client"

import { ButtonHTMLAttributes, forwardRef } from "react"
import clsx from "clsx"

// Menambahkan tipe untuk variasi button
type ButtonVariant = "default" | "primary" | "secondary" | "success" | "danger" | "warning" | "outline"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
}

// Menggunakan forwardRef untuk mengakses ref jika diperlukan
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = "primary", 
    size = "md",
    disabled = false,
    isLoading = false,
    children,
    ...props 
  }, ref) => {
    
    // Base classes yang selalu diterapkan
    const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    
    // Variasi warna button
    const variantClasses = {
      default: "bg-gray-600 text-white hover:bg-gray-700", 
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      secondary: "bg-gray-600 text-white hover:bg-gray-700",
      success: "bg-green-600 text-white hover:bg-green-700",
      danger: "bg-red-600 text-white hover:bg-red-700",
      warning: "bg-yellow-500 text-white hover:bg-yellow-600",
      outline: "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100"
    }
    
    // Variasi ukuran button
    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg"
    }
    
    return (
      <button
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    )
  }
)

// Menambahkan display name untuk debugging
Button.displayName = "Button"