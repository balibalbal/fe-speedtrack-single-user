// components/ProtectedRoute.tsx
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  requiredRole?: string
}

export default function ProtectedRoute({ 
  children, 
  requiredPermissions = [],
  requiredRole 
}: ProtectedRouteProps) {
  const { user, loading, hasPermission, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (!loading && user) {
      // Check role jika diperlukan
      if (requiredRole && !hasRole(requiredRole) && !user.is_superuser) {
        router.push('/unauthorized')
        return
      }

      // Check permissions jika diperlukan
      if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission => 
          hasPermission(permission)
        )
        
        if (!hasAllPermissions && !user.is_superuser) {
          router.push('/unauthorized')
          return
        }
      }
    }
  }, [user, loading, router, hasPermission, hasRole, requiredPermissions, requiredRole])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  // Final check sebelum render children
  if (requiredRole && !hasRole(requiredRole) && !user.is_superuser) {
    return null
  }

  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      hasPermission(permission)
    )
    
    if (!hasAllPermissions && !user.is_superuser) {
      return null
    }
  }

  return <>{children}</>
}