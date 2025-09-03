'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Plus, Eye, Edit, Trash2, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

// Tipe data untuk vehicle
interface Vehicle {
  id: number
  no_pol: string
  group_name: string
  sim_number: string
  type: 'mobil' | 'motor'
  status: 'active' | 'inactive'
  joinDate: string
}

interface VehicleApiResponse {
  id: number
  no_pol: string
  group_name: string
  sim_number: string
  type: number
  status: number
  created_at: string
}

interface PaginationData {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNext: boolean
  hasPrev: boolean
}

interface ApiResponse {
  success: boolean
  data: {
    vehicles: VehicleApiResponse[]
    pagination: PaginationData
  }
}

export default function VehiclePage() {
  const { token } = useAuth()
  const [vehicles, setVehicle] = useState<Vehicle[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  
  // ✅ State untuk server-side pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(false)

  // ✅ Fetch vehicles dengan pagination
  useEffect(() => {
    const fetchVehicle = async () => {
      if (!token) return
      
      setLoading(true)
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          ...(searchTerm && { search: searchTerm })
        })

        const res = await fetch(`http://localhost:3000/vehicles?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        const data: ApiResponse = await res.json()
        
        if (data.success) {
          const mapped: Vehicle[] = data.data.vehicles.map((v: VehicleApiResponse) => ({
            id: Number(v.id),
            no_pol: v.no_pol || 'N/A',
            group_name: v.group_name || 'N/A',
            type: v.type === 1 ? 'mobil' : 'motor',
            sim_number: v.sim_number || 'N/A',
            status: v.status === 1 ? 'active' : 'inactive',
            joinDate: v.created_at ? new Date(v.created_at).toISOString().split('T')[0] : '',
          }))
          
          setVehicle(mapped)
          setTotalPages(data.data.pagination.totalPages)
          setTotalItems(data.data.pagination.totalItems)
        }
      } catch (err) {
        console.error('Error fetching vehicles:', err)
      } finally {
        setLoading(false)
      }
    }
    
    // ✅ Debounce search untuk menghindari terlalu banyak request
    const timeoutId = setTimeout(() => {
      fetchVehicle()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [token, currentPage, itemsPerPage, searchTerm])

  // ✅ Handler untuk ganti page
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // ✅ Handler untuk ganti items per page
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  // ✅ Handler untuk search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  // Handler untuk modal
  const openViewModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsViewModalOpen(true)
  }

  const openEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteVehicle = () => {
    if (selectedVehicle) {
      setVehicle(vehicles.filter(vehicle => vehicle.id !== selectedVehicle.id))
      setIsDeleteModalOpen(false)
      setSelectedVehicle(null)
    }
  }

  // ✅ Generate page numbers untuk pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white p-6 rounded-xl shadow">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Vehicle Management</h2>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-500 text-white py-3 px-6 rounded-3xl shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 hover:bg-blue-600 transition-all duration-300">
            <Plus size={20} />
            Add Vehicle
          </button>
        </div>

        {/* Search dan Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-100 py-2 px-4 rounded-lg transition duration-200">
            <Filter size={18} />
            Filter
          </button>
        </div>

        {/* ✅ Items per page selector */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Items per page:</label>
            <select 
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        {/* Tabel Vehicles */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Nopol</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Group</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No vehicles found
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3">{vehicle.id}</td>
                    <td className="p-3 font-medium">{vehicle.no_pol}</td>
                    <td className="p-3 text-gray-600">{vehicle.group_name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        vehicle.type === 'mobil' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {vehicle.type}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        vehicle.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openViewModal(vehicle)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition duration-200"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => openEditModal(vehicle)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-full transition duration-200"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(vehicle)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-full transition duration-200"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ Pagination Controls */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            
            {/* Page numbers */}
            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2 py-1">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => goToPage(page as number)}
                  disabled={loading}
                  className={`w-8 h-8 rounded-md text-sm ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-100'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {page}
                </button>
              )
            ))}
            
            <button 
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Add Vehicle */}
      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md border-4 border-blue-200 shadow-2xl shadow-blue-200/50">
            <h3 className="text-xl font-semibold mb-4">Add New Vehicle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IMEI Number</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SIM Number</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-lg" />
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

      {isEditModalOpen && selectedVehicle && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md border-4 border-blue-200 shadow-2xl shadow-blue-200/50">
            <div className="relative">
                <button 
                onClick={() => setIsEditModalOpen(false)}
                className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                >
                ✕
                </button>
                
                <h3 className="text-2xl font-bold mb-6 text-gray-800 text-center">Edit Vehicle</h3>
                
                <form>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/80 p-6 rounded-lg shadow-inner">
                    <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle ID</label>
                        <input 
                        type="text" 
                        value={selectedVehicle.id} 
                        readOnly
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">License Plate *</label>
                        <input 
                        type="text" 
                        defaultValue={selectedVehicle.no_pol}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IMEI *</label>
                        <input 
                        type="text" 
                        defaultValue={selectedVehicle.group_name}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                        />
                    </div>
                    </div>
                    
                    <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SIM Number</label>
                        <input 
                        type="text" 
                        defaultValue={selectedVehicle.sim_number}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select 
                        defaultValue={selectedVehicle.status}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                        <input 
                        type="text" 
                        value={selectedVehicle.joinDate} 
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
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg shadow-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 text-sm"
                >
                    Update Vehicle
                </button>
                </div>
            </div>
            </div>
        </div>
        )}

      {/* Modal View Vehicle */}
      {isViewModalOpen && selectedVehicle && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md border-4 border-blue-200 shadow-2xl shadow-blue-200/50">
            <h3 className="text-xl font-semibold mb-4">Vehicle Details</h3>
            <div className="space-y-3">
              <div className="flex">
                <div className="w-1/3 font-medium text-gray-700">ID:</div>
                <div className="w-2/3">&quot;{selectedVehicle.id}&quot;</div>
              </div>
              <div className="flex">
                <div className="w-1/3 font-medium text-gray-700">License Plate:</div>
                <div className="w-2/3">&quot;{selectedVehicle.no_pol}&quot;</div>
              </div>
              <div className="flex">
                <div className="w-1/3 font-medium text-gray-700">IMEI:</div>
                <div className="w-2/3">&quot;{selectedVehicle.group_name}&quot;</div>
              </div>
              <div className="flex">
                <div className="w-1/3 font-medium text-gray-700">SIM Number:</div>
                <div className="w-2/3">&quot;{selectedVehicle.sim_number}&quot;</div>
              </div>
              <div className="flex">
                <div className="w-1/3 font-medium text-gray-700">Type:</div>
                <div className="w-2/3">&quot;{selectedVehicle.type}&quot;</div>
              </div>
              <div className="flex">
                <div className="w-1/3 font-medium text-gray-700">Status:</div>
                <div className="w-2/3 capitalize">&quot;{selectedVehicle.status}&quot;</div>
              </div>
              <div className="flex">
                <div className="w-1/3 font-medium text-gray-700">Join Date:</div>
                <div className="w-2/3">&quot;{selectedVehicle.joinDate}&quot;</div>
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
      {isDeleteModalOpen && selectedVehicle && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md border-4 border-blue-200 shadow-2xl shadow-blue-200/50">
            <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete vehicle <span className="font-medium">&quot;{selectedVehicle.no_pol}&quot;</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteVehicle}
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