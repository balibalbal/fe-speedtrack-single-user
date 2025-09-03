"use client"

import { ReactNode } from "react"
import clsx from "clsx"

interface CardProps {
  children: ReactNode
  className?: string
  variant?: "default" | "filled" | "outlined"
  color?: "default" | "primary" | "success" | "warning" | "danger"
  hoverEffect?: boolean
  onClick?: () => void
}

export function Card({ 
  children, 
  className, 
  variant = "default",
  color = "default",
  hoverEffect = false,
  onClick 
}: CardProps) {
  const baseClasses = "rounded-2xl transition-all duration-300"
  
  const variantClasses = {
    default: "bg-white shadow-md",
    filled: clsx(
      "shadow-sm",
      color === "default" && "bg-gray-50",
      color === "primary" && "bg-blue-50",
      color === "success" && "bg-green-50",
      color === "warning" && "bg-yellow-50",
      color === "danger" && "bg-red-50"
    ),
    outlined: clsx(
      "border bg-white",
      color === "default" && "border-gray-200",
      color === "primary" && "border-blue-200",
      color === "success" && "border-green-200",
      color === "warning" && "border-yellow-200",
      color === "danger" && "border-red-200"
    )
  }
  
  const hoverClasses = hoverEffect ? "hover:shadow-lg hover:-translate-y-1 cursor-pointer" : ""
  
  const colorClasses = {
    default: "",
    primary: "",
    success: "",
    warning: "",
    danger: ""
  }
  
  return (
    <div 
      className={clsx(
        baseClasses, 
        variantClasses[variant], 
        colorClasses[color],
        hoverClasses,
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
  withDivider?: boolean
}

export function CardHeader({ children, className, withDivider = true }: CardHeaderProps) {
  return (
    <div className={clsx(
      "p-6 pb-4",
      withDivider && "border-b border-gray-100",
      className
    )}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: ReactNode
  className?: string
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

export function CardTitle({ children, className, as = "h2" }: CardTitleProps) {
  const TitleTag = as
  return (
    <TitleTag className={clsx(
      "text-xl font-semibold text-gray-800",
      className
    )}>
      {children}
    </TitleTag>
  )
}

interface CardDescriptionProps {
  children: ReactNode
  className?: string
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p className={clsx(
      "mt-1 text-sm text-gray-500",
      className
    )}>
      {children}
    </p>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={clsx("p-6", className)}>
      {children}
    </div>
  )
}

interface CardFooterProps {
  children: ReactNode
  className?: string
  align?: "left" | "center" | "right"
}

export function CardFooter({ children, className, align = "left" }: CardFooterProps) {
  const alignment = {
    left: "text-left",
    center: "text-center",
    right: "text-right"
  }
  
  return (
    <div className={clsx(
      "p-6 pt-4 border-t border-gray-100",
      alignment[align],
      className
    )}>
      {children}
    </div>
  )
}