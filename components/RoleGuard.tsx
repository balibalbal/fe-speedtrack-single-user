// components/RoleGuard.tsx
'use client'

import { useAuth } from '@/context/AuthContext'

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
    return <div>Loading...</div>
  }

  if (!hasRole(role)) {
    return fallback
  }

  return <>{children}</>
}