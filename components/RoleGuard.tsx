// components/RoleGuard.tsx
'use client'

import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface RoleGuardProps {
  role: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function RoleGuard({ 
  role, 
  children, 
  fallback = null 
}: RoleGuardProps) {
  const { hasRole, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!hasRole(role)) {
    return fallback
  }

  return <>{children}</>
}