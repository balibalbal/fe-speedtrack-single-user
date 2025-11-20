// components/PermissionManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface Permission {
  id: string
  name: string
  description: string
  created_at: string
}

export default function PermissionManagement() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPermission, setNewPermission] = useState({ name: '', description: '' })
  const { hasPermission, isSuperUser } = useAuth()

  useEffect(() => {
    if (isSuperUser() || hasPermission('user')) {
      fetchPermissions()
    }
  }, [isSuperUser, hasPermission])

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('https://demo.speedtrack.id/api/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setPermissions(data.data)
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPermission = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('https://demo.speedtrack.id/api/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPermission)
      })
      const data = await response.json()
      
      if (data.success) {
        setPermissions([...permissions, data.data])
        setShowCreateModal(false)
        setNewPermission({ name: '', description: '' })
        alert('Permission berhasil dibuat!')
      } else {
        alert('Gagal membuat permission: ' + data.message)
      }
    } catch (error) {
      console.error('Error creating permission:', error)
      alert('Terjadi kesalahan saat membuat permission.')
    }
  }

  if (!isSuperUser() && !hasPermission('user')) {
    return <div>Anda tidak memiliki izin untuk mengelola permissions.</div>
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Manajemen Permissions</h2>
          <p className="text-sm text-gray-600 mt-1">Kelola permissions sistem</p>
        </div>
        {isSuperUser() && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Buat Permission Baru
          </button>
        )}
      </div>

      {/* Permissions List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deskripsi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dibuat Pada
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {permissions.map((permission) => (
              <tr key={permission.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {permission.name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">
                    {permission.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(permission.created_at).toLocaleDateString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Permission Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Buat Permission Baru
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nama Permission
                  </label>
                  <input
                    type="text"
                    value={newPermission.name}
                    onChange={(e) => setNewPermission({...newPermission, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="contoh: view_reports"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Deskripsi
                  </label>
                  <textarea
                    value={newPermission.description}
                    onChange={(e) => setNewPermission({...newPermission, description: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Deskripsi permission..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Batal
                </button>
                <button
                  onClick={createPermission}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Buat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}