// app/dashboard/page.tsx
'use client'

import { useAuth } from '@/context/AuthContext'
import PermissionGuard from '@/components/PermissionGuard'

export default function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        {user?.is_superuser && (
          <p className="text-green-600 font-semibold">Super User</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PermissionGuard permission="view_reports">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Reports</h2>
            <p>You can view reports because you have the view_reports permission.</p>
          </div>
        </PermissionGuard>

        <PermissionGuard permission="manage_users">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <p>You can manage users because you have the manage_users permission.</p>
          </div>
        </PermissionGuard>
      </div>

      <button
        onClick={logout}
        className="mt-6 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  )
}