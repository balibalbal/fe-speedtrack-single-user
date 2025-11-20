// app/admin/page.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import UserManagement from '@/components/UserManagement'
import PermissionManagement from '@/components/PermissionManagement'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function AdminPage() {
  const { user, hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState('users')

  if (!user) {
    return <LoadingSpinner />
  }

  if (!user.is_superuser && !hasPermission('user')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Akses Ditolak</h1>
          <p className="text-gray-600 mt-2">Anda tidak memiliki izin untuk mengakses halaman admin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Kelola pengguna dan permissions sistem</p>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Manajemen User
              </button>
              {(user.is_superuser || hasPermission('user')) && (
                <button
                  onClick={() => setActiveTab('permissions')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'permissions'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Manajemen Permissions
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'permissions' && <PermissionManagement />}
        </div>
      </div>
    </div>
  )
}