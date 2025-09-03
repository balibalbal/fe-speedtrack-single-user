// components/PermissionManager.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'

interface Permission {
  id: string
  name: string
  description: string
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

export default function PermissionManager({ userId }: { userId: string }) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'individual' | 'bulk'>('individual')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { hasPermission } = useAuth()

  // Fungsi untuk menambah notifikasi
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    
    setNotifications(prev => [...prev, newNotification])

    // Auto remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration || 5000)
    }
  }

  // Fungsi untuk menghapus notifikasi
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  // Notification Component
  const NotificationContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-3 w-80">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )

  // Notification Item Component
  const NotificationItem = ({ notification, onClose }: { notification: Notification; onClose: () => void }) => {
    const { type, title, message } = notification

    const getStyles = () => {
      switch (type) {
        case 'success':
          return {
            bg: 'bg-green-50 border-green-200',
            border: 'border-green-400',
            text: 'text-green-800',
            icon: (
              <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          }
        case 'error':
          return {
            bg: 'bg-red-50 border-red-200',
            border: 'border-red-400',
            text: 'text-red-800',
            icon: (
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          }
        case 'warning':
          return {
            bg: 'bg-yellow-50 border-yellow-200',
            border: 'border-yellow-400',
            text: 'text-yellow-800',
            icon: (
              <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )
          }
        case 'info':
          return {
            bg: 'bg-blue-50 border-blue-200',
            border: 'border-blue-400',
            text: 'text-blue-800',
            icon: (
              <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          }
      }
    }

    const styles = getStyles()

    return (
      <div className={`${styles.bg} border-l-4 ${styles.border} rounded-md p-4 shadow-lg transform transition-all duration-300 ease-in-out hover:scale-105`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {styles.icon}
          </div>
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${styles.text}`}>
              {title}
            </h3>
            <div className={`mt-1 text-sm ${styles.text} opacity-90`}>
              {message}
            </div>
          </div>
          <button
            onClick={onClose}
            className={`ml-4 flex-shrink-0 rounded-md inline-flex focus:outline-none ${styles.text} hover:opacity-70`}
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // Fungsi toast helper
  const toast = {
    success: (message: string, title: string = 'Berhasil!') => {
      addNotification({ type: 'success', title, message, duration: 3000 })
    },
    error: (message: string, title: string = 'Error') => {
      addNotification({ type: 'error', title, message, duration: 5000 })
    },
    warning: (message: string, title: string = 'Peringatan') => {
      addNotification({ type: 'warning', title, message, duration: 4000 })
    },
    info: (message: string, title: string = 'Info') => {
      addNotification({ type: 'info', title, message, duration: 3000 })
    }
  }

  const fetchAllPermissions = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/permissions', {
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
      toast.error('Gagal memuat data permissions')
    }
  }, [])

  const fetchUserPermissions = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/permissions/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setUserPermissions(data.data.map((p: Permission) => p.id))
        setSelectedPermissions(data.data.map((p: Permission) => p.id))
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error)
      toast.error('Gagal memuat permissions user')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (hasPermission('manage_permissions')) {
      fetchAllPermissions()
      fetchUserPermissions()
    }
  }, [userId, hasPermission, fetchAllPermissions, fetchUserPermissions])

  useEffect(() => {
    if (mode === 'individual') {
      setSelectedPermissions(userPermissions)
    }
  }, [userPermissions, mode])

  const togglePermissionIndividual = async (permissionId: string, currentlyHasPermission: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const permissionName = permissions.find(p => p.id === permissionId)?.name || 'Permission'
      
      if (currentlyHasPermission) {
        const response = await fetch('http://localhost:3000/permissions/user', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ userId, permissionId })
        })
        
        const data = await response.json()
        
        if (data.success) {
          setUserPermissions(prev => prev.filter(id => id !== permissionId))
          toast.success(`Permission "${permissionName}" berhasil dihapus`)
        } else {
          toast.error(`Gagal menghapus permission: ${data.message}`)
        }
      } else {
        const response = await fetch('http://localhost:3000/permissions/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ userId, permissionId })
        })
        
        const data = await response.json()
        
        if (data.success) {
          setUserPermissions(prev => [...prev, permissionId])
          toast.success(`Permission "${permissionName}" berhasil ditambahkan`)
        } else {
          toast.error(`Gagal menambahkan permission: ${data.message}`)
        }
      }
    } catch (error) {
      console.error('Error toggling permission:', error)
      toast.error('Terjadi kesalahan saat mengubah permission')
    }
  }

  const togglePermissionBulk = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const selectAllPermissions = () => {
    setSelectedPermissions(permissions.map(p => p.id))
    toast.info('Semua permissions dipilih')
  }

  const clearAllPermissions = () => {
    setSelectedPermissions([])
    toast.info('Semua permissions dihapus')
  }

  const saveBulkPermissions = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      
      try {
        const response = await fetch('http://localhost:3000/permissions/user/bulk', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            userId, 
            permissionIds: selectedPermissions 
          })
        })

        const data = await response.json()
        
        if (data.success) {
          toast.success(`${selectedPermissions.length} permissions berhasil disimpan`)
          setUserPermissions(selectedPermissions)
          setMode('individual')
        } else {
          throw new Error(data.message)
        }
      } catch {
        // Fallback ke individual operations
        let successCount = 0
        let errorCount = 0

        // Hapus permissions yang tidak dipilih
        const toRemove = userPermissions.filter(id => !selectedPermissions.includes(id))
        for (const permissionId of toRemove) {
          try {
            await fetch('http://localhost:3000/permissions/user', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ userId, permissionId })
            })
            successCount++
          } catch {
            errorCount++
          }
        }

        // Tambahkan permissions yang dipilih
        const toAdd = selectedPermissions.filter(id => !userPermissions.includes(id))
        for (const permissionId of toAdd) {
          try {
            await fetch('http://localhost:3000/permissions/user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ userId, permissionId })
            })
            successCount++
          } catch {
            errorCount++
          }
        }

        if (errorCount === 0) {
          toast.success(`Semua ${successCount} permissions berhasil disimpan`)
        } else {
          toast.warning(`${successCount} berhasil, ${errorCount} gagal disimpan`)
        }
        
        setUserPermissions(selectedPermissions)
        setMode('individual')
      }
    } catch {
      console.error('Error saving permissions:')
      toast.error('Terjadi kesalahan saat menyimpan permissions')
    } finally {
      setSaving(false)
    }
  }

  if (!hasPermission('manage_permissions')) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Akses Ditolak
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Anda tidak memiliki izin untuk mengelola permissions.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading permissions...</span>
      </div>
    )
  }

  return (
    <>
      <NotificationContainer />
      
      <div className="permission-manager">
        {/* Mode Selector */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Mode:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setMode('individual')}
                className={`px-3 py-1 rounded-md text-sm ${
                  mode === 'individual'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setMode('bulk')}
                className={`px-3 py-1 rounded-md text-sm ${
                  mode === 'bulk'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Bulk
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            {mode === 'individual' 
              ? 'Klik checkbox untuk langsung menambah atau menghapus permission'
              : 'Pilih permissions yang diinginkan, lalu klik Simpan'
            }
          </p>
        </div>

        {/* Bulk Actions */}
        {mode === 'bulk' && (
          <div className="mb-4 flex space-x-3">
            <button
              onClick={selectAllPermissions}
              className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
            >
              Pilih Semua
            </button>
            <button
              onClick={clearAllPermissions}
              className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
            >
              Hapus Semua
            </button>
            <button
              onClick={saveBulkPermissions}
              disabled={saving}
              className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Permissions'}
            </button>
          </div>
        )}

        {/* Permissions List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {permissions.map((permission) => {
            const isSelected = mode === 'individual' 
              ? userPermissions.includes(permission.id)
              : selectedPermissions.includes(permission.id)
            
            return (
              <div key={permission.id} className="flex items-start p-3 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  id={`permission-${permission.id}`}
                  checked={isSelected}
                  onChange={() => 
                    mode === 'individual'
                      ? togglePermissionIndividual(permission.id, isSelected)
                      : togglePermissionBulk(permission.id)
                  }
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <label 
                    htmlFor={`permission-${permission.id}`} 
                    className="block text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    {permission.name}
                  </label>
                  <p className="text-sm text-gray-500 mt-1">{permission.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {mode === 'individual' 
                ? `${userPermissions.length} dari ${permissions.length} permissions aktif`
                : `${selectedPermissions.length} dari ${permissions.length} permissions dipilih`
              }
            </span>
            <button
              onClick={fetchUserPermissions}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </>
  )
}