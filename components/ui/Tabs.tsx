"use client"

import { useState, createContext, useContext } from 'react'
import clsx from 'clsx'

// Types untuk Tabs
interface TabsContextType {
  activeTab: string
  setActiveTab: (id: string) => void
  variant: 'underline' | 'pills' | 'rounded'
  color: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

function useTabs() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider')
  }
  return context
}

// Tabs Root Component
interface TabsProps {
  children: React.ReactNode
  defaultValue: string
  variant?: 'underline' | 'pills' | 'rounded'
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
  className?: string
}

export function Tabs({ 
  children, 
  defaultValue, 
  variant = 'underline', 
  color = 'primary',
  className 
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, variant, color }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

// TabsList Component
interface TabsListProps {
  children: React.ReactNode
  className?: string
  fullWidth?: boolean
}

export function TabsList({ children, className, fullWidth = false }: TabsListProps) {
  const { variant } = useTabs()
  
  const variantStyles = {
    underline: 'border-b border-gray-200',
    pills: 'p-1 bg-gray-100 rounded-lg',
    rounded: 'gap-2'
  }

  return (
    <div 
      className={clsx(
        'flex mb-6',
        variantStyles[variant],
        fullWidth && 'w-full',
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  )
}

// TabsTrigger Component
interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
}

export function TabsTrigger({ value, children, className, icon }: TabsTriggerProps) {
  const { activeTab, setActiveTab, variant, color } = useTabs()
  
  const isActive = activeTab === value
  
  const colorStyles = {
    primary: {
      underline: isActive ? 'border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700',
      pills: isActive ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-gray-900',
      rounded: isActive ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'
    },
    success: {
      underline: isActive ? 'border-green-500 text-green-600' : 'text-gray-500 hover:text-gray-700',
      pills: isActive ? 'bg-green-500 text-white' : 'text-gray-600 hover:text-gray-900',
      rounded: isActive ? 'bg-green-500 text-white' : 'text-gray-700 hover:bg-gray-100'
    },
    warning: {
      underline: isActive ? 'border-yellow-500 text-yellow-600' : 'text-gray-500 hover:text-gray-700',
      pills: isActive ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:text-gray-900',
      rounded: isActive ? 'bg-yellow-500 text-white' : 'text-gray-700 hover:bg-gray-100'
    },
    danger: {
      underline: isActive ? 'border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700',
      pills: isActive ? 'bg-red-500 text-white' : 'text-gray-600 hover:text-gray-900',
      rounded: isActive ? 'bg-red-500 text-white' : 'text-gray-700 hover:bg-gray-100'
    },
    neutral: {
      underline: isActive ? 'border-gray-500 text-gray-800' : 'text-gray-500 hover:text-gray-700',
      pills: isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900',
      rounded: isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
    }
  }

  const variantStyles = {
    underline: clsx(
      'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
      colorStyles[color].underline
    ),
    pills: clsx(
      'px-4 py-2 text-sm font-medium rounded-md transition-colors',
      colorStyles[color].pills
    ),
    rounded: clsx(
      'px-4 py-2 text-sm font-medium rounded-full transition-colors',
      colorStyles[color].rounded
    )
  }

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      id={`trigger-${value}`}
      className={clsx(
        'flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        className
      )}
      onClick={() => setActiveTab(value)}
      tabIndex={isActive ? 0 : -1}
    >
      {icon && <span className="text-base">{icon}</span>}
      {children}
    </button>
  )
}

// TabsContent Component
interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { activeTab } = useTabs()
  
  if (activeTab !== value) return null
  
  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`trigger-${value}`}
      className={className}
    >
      {children}
    </div>
  )
}