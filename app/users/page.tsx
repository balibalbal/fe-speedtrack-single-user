'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Plus, Eye, Edit, Trash2, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

// Tipe data untuk user
interface User {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  joinDate: string
}

interface ApiUser {
  id: string | number
  name: string
  email: string
  role?: string
  status: string
  created_at?: string
}


export default function UsersPage() {
  const { token } = useAuth() // ambil token dari context
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  // Fetch user dari API
  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return
      try {
        const res = await fetch(`${API_URL}/api/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await res.json()
        if (data.success) {
          const mapped: User[] = data.data.map((u: ApiUser) => ({
            id: Number(u.id),
            name: u.name,
            email: u.email,
            role: u.role ?? 'User', 
            status: u.status === '1' ? 'active' : 'inactive',
            joinDate: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '',
          }))
          setUsers(mapped)
        }
      } catch (err) {
        console.error('Error fetching users:', err)
      }
    }
    fetchUsers()
  }, [token])

  // Filter users berdasarkan search term
const filteredUsers = users.filter(user => 
  user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  user.email.toLowerCase().includes(searchTerm.toLowerCase())
)

// Handler untuk membuka modal
const openViewModal = (user: User) => {
  setSelectedUser(user)
  setIsViewModalOpen(true)
}

const openEditModal = (user: User) => {
  setSelectedUser(user)
  setIsEditModalOpen(true)
}

const openDeleteModal = (user: User) => {
  setSelectedUser(user)
  setIsDeleteModalOpen(true)
}

// Handler untuk menghapus user
const handleDeleteUser = () => {
  if (selectedUser) {
    setUsers(users.filter(user => user.id !== selectedUser.id))
    setIsDeleteModalOpen(false)
    setSelectedUser(null)
  }
}


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white p-6 rounded-xl shadow">
        {/* Header dengan judul dan tombol Add */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">User Management</h2>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-500 text-white py-3 px-6 rounded-3xl shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 hover:bg-blue-600 transition-all duration-300">
            <Plus size={20} />
            Add User
          </button>
        </div>

        {/* Search dan Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-100 py-2 px-4 rounded-lg transition duration-200">
            <Filter size={18} />
            Filter
          </button>
        </div>

        {/* Tabel User */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Role</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Join Date</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-3">{user.id}</td>
                  <td className="p-3 font-medium">{user.name}</td>
                  <td className="p-3 text-gray-600">{user.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'Editor' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">&quot;{user.joinDate}&quot;</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openViewModal(user)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition duration-200"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => openEditModal(user)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-full transition duration-200"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => openDeleteModal(user)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-full transition duration-200"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Showing 1 to {filteredUsers.length} of {filteredUsers.length} results
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-100">
              <ChevronLeft size={16} />
            </button>
            <button className="w-8 h-8 bg-blue-600 text-white rounded-md text-sm">1</button>
            <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-100">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Add User */}
      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md border-4 border-blue-200 shadow-2xl shadow-blue-200/50">
            <h3 className="text-xl font-semibold mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full p-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="w-full p-2 border border-gray-300 rounded-lg">
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md border-4 border-blue-200 shadow-2xl shadow-blue-200/50">
            <div className="relative">
                {/* Tombol close */}
                <button 
                onClick={() => setIsEditModalOpen(false)}
                className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                >
                ✕
                </button>
                
                <h3 className="text-2xl font-bold mb-6 text-gray-800 text-center">Edit User</h3>
                
                <form>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/80 p-6 rounded-lg shadow-inner">
                    {/* Kolom 1 */}
                    <div className="space-y-4">
                    {/* ID User */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                        <input 
                        type="text" 
                        value={selectedUser.id} 
                        readOnly
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm"
                        />
                    </div>
                    
                    {/* Nama User */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input 
                        type="text" 
                        defaultValue={selectedUser.name}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                        />
                    </div>
                    
                    {/* Email User */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input 
                        type="email" 
                        defaultValue={selectedUser.email}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                        />
                    </div>
                    </div>
                    
                    {/* Kolom 2 */}
                    <div className="space-y-4">
                    {/* Role User */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select 
                        defaultValue={selectedUser.role}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                        <option value="Editor">Editor</option>
                        <option value="Viewer">Viewer</option>
                        </select>
                    </div>
                    
                    {/* Status User */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select 
                        defaultValue={selectedUser.status}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    
                    {/* Join Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                        <input 
                        type="text" 
                        value={selectedUser.joinDate} 
                        readOnly
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm"
                        />
                    </div>
                    </div>
                </div>
                </form>
                
                <div className="flex justify-center gap-4 mt-8">
                <button 
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow-lg hover:bg-gray-600 transition-all duration-300 text-sm"
                >
                    Cancel
                </button>
                <button 
                    onClick={() => {
                    // Handle update logic here
                    setIsEditModalOpen(false);
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg shadow-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 text-sm"
                >
                    Update User
                </button>
                </div>
            </div>
            </div>
        </div>
        )}

      {/* Modal View User */}
      {isViewModalOpen && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md border-4 border-blue-200 shadow-2xl shadow-blue-200/50">
            <h3 className="text-xl font-semibold mb-4">User Details</h3>
            <div className="space-y-3">
              <div className="flex">
                <div className="w-1/3 font-medium text-gray-700">ID:</div>
                <div className="w-2/3">{selectedUser.id}</div>
              </div>
              <div className="flex">
                <div className="w-1/3 font-medium text-gray-700">Name:</div>
                <div className="w-2/3">{selectedUser.name}</div>
              </div>
              <div className="flex">
                <div className="w-1/3 font-medium text-gray-700">Email:</div>
                <div className="w-2/3">{selectedUser.email}</div>
              </div>
              <div className="flex">
                <div className="w-1/3 font-medium text-gray-700">Role:</div>
                <div className="w-2/3">{selectedUser.role}</div>
              </div>
              <div className="flex">
                <div className="w-1/3 font-medium text-gray-700">Status:</div>
                <div className="w-2/3 capitalize">{selectedUser.status}</div>
              </div>
              <div className="flex">
                <div className="w-1/3 font-medium text-gray-700">Join Date:</div>
                <div className="w-2/3">{selectedUser.joinDate}</div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete Confirmation */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md border-4 border-blue-200 shadow-2xl shadow-blue-200/50">
            <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete user <span className="font-medium">&quot;{selectedUser.name}&quot;</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}