// components/PermissionGuard.tsx
'use client'

import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface PermissionGuardProps {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function PermissionGuard({ 
  permission, 
  children, 
  fallback = null 
}: PermissionGuardProps) {
  const { hasPermission, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!hasPermission(permission)) {
    return fallback
  }

  return <>{children}</>
}