"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface Vehicle {
  id: string
  vehicle_id: number
  device_id: number | null
  customer_id: number | null
  no_pol: string | null
  latitude: number | null
  longitude: number | null
  speed: number | null
  time: string | null
  course: number | null
  engine_status: string | null
  ignition_status: string | null
  status: string | null
  active: number
  geofence: string | null
  current_geofence_id: number | null
  geofence_name: string | null
  enter_time: string | null
  out_time: string | null
  address: string | null
  weight: number | null
  weight_persen: number | null
  angle: number | null
  odometer: number | null
  total_odometer: number | null
  fuel: number | null
  deleted_at: string | null
  created_at: string | null
  updated_at: string | null
  geo_point: string | null
  total_distance: number | null
  geofence_status: string | null
  hso_status: number | null
  source_address: string | null
  status_address: string | null
  vendor_gps: string | null
  distance: number | null
  geom: any
  group_id: number | null
  protocol: string | null
}

export default function TrackingPage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [map, setMap] = useState<L.Map | null>(null)
  const [markers, setMarkers] = useState<L.Marker[]>([])
  
  const [isLeftOpen, setIsLeftOpen] = useState(true)
  const [isRightOpen, setIsRightOpen] = useState(true)
  
  // Initialize map
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mapInstance = L.map('map').setView([-6.2, 106.8], 10)
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance)
      
      setMap(mapInstance)
      
      return () => {
        mapInstance.remove()
      }
    }
  }, [])
  
  // Fetch data from API
  const fetchTracking = async () => {
    try {
      setLoading(true)
      
      const res = await fetch(
        `http://localhost:3000/traccars`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      const data = await res.json()
      if (data.success) {
        setVehicles(data.data)
        
        // Add markers to map
        if (map) {
          // Clear existing markers
          markers.forEach(marker => map.removeLayer(marker))
          
          const newMarkers: L.Marker[] = []
          
          data.data.forEach((vehicle: Vehicle) => {
            if (vehicle.latitude && vehicle.longitude) {
              // Custom icon based on status
              const icon = L.icon({
                iconUrl: getIconByStatus(vehicle.status),
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })
              
              const marker = L.marker([vehicle.latitude, vehicle.longitude], { icon })
                .addTo(map)
                .bindPopup(vehicle.no_pol || 'Unknown Vehicle')
              
              marker.on('click', () => {
                setSelectedVehicle(vehicle)
              })
              
              newMarkers.push(marker)
            }
          })
          
          setMarkers(newMarkers)
        }
      }
    } catch (err) {
      console.error("Error fetching tracking data:", err)
    } finally {
      setLoading(false)
    }
  }

  // Get icon based on vehicle status
  const getIconByStatus = (status: string | null) => {
    switch(status) {
      case 'bergerak':
        return 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
      case 'mati':
        return 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'
      case 'berhenti':
        return 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png'
      case 'diam':
        return 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png'
      default:
        return 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png'
    }
  }
  
  // Load data on component mount
  useEffect(() => {
    fetchTracking()
  }, [map])
  
  // Focus map on selected vehicle
  useEffect(() => {
    if (selectedVehicle && selectedVehicle.latitude && selectedVehicle.longitude && map) {
      map.setView([selectedVehicle.latitude, selectedVehicle.longitude], 15)
      
      // Highlight the selected marker
      markers.forEach(marker => {
        const latLng = marker.getLatLng()
        if (latLng.lat === selectedVehicle.latitude && latLng.lng === selectedVehicle.longitude) {
          marker.openPopup()
        }
      })
    }
  }, [selectedVehicle, map, markers])
  
  // Filter vehicles that have valid coordinates
  const vehiclesWithLocation = useMemo(() => 
    vehicles.filter(v => v.latitude && v.longitude), 
    [vehicles]
  )
  
  // Count vehicles by status
  const statusCounts = useMemo(() => {
    const counts = {
      bergerak: 0,
      mati: 0,
      berhenti: 0,
      diam: 0,
      unknown: 0
    }
    
    vehiclesWithLocation.forEach(vehicle => {
      if (vehicle.status === 'bergerak') counts.bergerak++
      else if (vehicle.status === 'mati') counts.mati++
      else if (vehicle.status === 'berhenti') counts.berhenti++
      else if (vehicle.status === 'diam') counts.diam++
      else counts.unknown++
    })
    
    return counts
  }, [vehiclesWithLocation])
  
  // Format time to local string
  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'N/A'
    return new Date(timeString).toLocaleString('id-ID')
  }
  
  return (
    <div className="flex h-screen">
      {/* Sidebar Kiri */}
      <div
        className={`relative bg-white shadow-lg transition-all duration-300 ${
          isLeftOpen ? "w-80" : "w-0"
        }`}
      >
        <div className={`${isLeftOpen ? "block" : "hidden"} p-4`}>
          <h2 className="font-bold mb-4 text-lg">Daftar Kendaraan</h2>
          
          {loading ? (
            <div className="text-center py-4">Memuat data...</div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              {vehiclesWithLocation.map(vehicle => (
                <div 
                  key={vehicle.id} 
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedVehicle?.id === vehicle.id 
                      ? 'bg-blue-100 border-blue-500' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <div className="font-medium">{vehicle.no_pol || 'Unknown'}</div>
                  <div className="text-sm text-gray-600">
                    {vehicle.time ? formatTime(vehicle.time) : 'Waktu tidak tersedia'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {vehicle.address ? `${vehicle.address.substring(0, 50)}...` : 'Lokasi tidak tersedia'}
                  </div>
                  <div className="text-xs mt-1">
                    Status: <span className={
                      vehicle.status === 'bergerak' ? 'text-green-600' : 
                      vehicle.status === 'mati' ? 'text-red-600' : 
                      vehicle.status === 'berhenti' ? 'text-orange-600' :
                      vehicle.status === 'diam' ? 'text-blue-600' : 'text-gray-600'
                    }>
                      {vehicle.status || 'tidak diketahui'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Toggle Button Kiri */}
        <button
          onClick={() => setIsLeftOpen(!isLeftOpen)}
          className="absolute top-1/2 -right-3 transform -translate-y-1/2 bg-gray-200 border border-gray-300 rounded-full w-6 h-12 flex items-center justify-center shadow"
        >
          {isLeftOpen ? (
            <span className="text-xs">◀</span>
          ) : (
            <span className="text-xs">▶</span>
          )}
        </button>
      </div>

      {/* Main content (map) */}
      <div className="flex-1 bg-blue-100 relative">
        <div id="map" className="w-full h-full"></div>
        
        {/* Information Panel Overlay */}
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-md z-[1000] max-w-md">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Informasi Monitoring
            </h2>

            {/* Online/Offline Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-2xl font-bold">{vehiclesWithLocation.length}</div>
                <div className="text-sm">Kendaraan Online</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-2xl font-bold">{vehicles.length - vehiclesWithLocation.length}</div>
                <div className="text-sm">Kendaraan Offline</div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div>
              <h3 className="font-medium mb-2">Status Kendaraan Online</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span>Bergerak:</span>
                  <span className="font-bold ml-1">{statusCounts.bergerak}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span>Mati:</span>
                  <span className="font-bold ml-1">{statusCounts.mati}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                  <span>Berhenti:</span>
                  <span className="font-bold ml-1">{statusCounts.berhenti}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span>Diam:</span>
                  <span className="font-bold ml-1">{statusCounts.diam}</span>
                </div>
                {statusCounts.unknown > 0 && (
                  <div className="flex items-center col-span-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                    <span>Tidak diketahui:</span>
                    <span className="font-bold ml-1">{statusCounts.unknown}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Keterangan */}
            <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded-lg">
              <span className="font-medium">Info:</span> Klik pada kendaraan di daftar atau peta untuk melihat detail.
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar Kanan */}
      <div
        className={`relative bg-white shadow-lg transition-all duration-300 ${
          isRightOpen ? "w-80" : "w-0"
        }`}
      >
        <div className={`${isRightOpen ? "block" : "hidden"} p-4`}>
          <h2 className="font-bold mb-4 text-lg">Detail Kendaraan</h2>
          
          {selectedVehicle ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xl font-bold">{selectedVehicle.no_pol || 'Unknown'}</div>
                <div className="text-sm text-gray-600">ID: {selectedVehicle.id}</div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Status</h3>
                <div className={
                  selectedVehicle.status === 'bergerak' ? 'text-green-600 font-bold' : 
                  selectedVehicle.status === 'mati' ? 'text-red-600 font-bold' : 
                  selectedVehicle.status === 'berhenti' ? 'text-orange-600 font-bold' :
                  selectedVehicle.status === 'diam' ? 'text-blue-600 font-bold' : 'text-gray-600'
                }>
                  {selectedVehicle.status || 'Tidak diketahui'}
                </div>
                <div className="text-sm">Ignition: {selectedVehicle.ignition_status || 'N/A'}</div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Lokasi & Waktu</h3>
                <div className="text-sm">{selectedVehicle.address || 'Lokasi tidak tersedia'}</div>
                <div className="text-sm mt-1">Update: {formatTime(selectedVehicle.time)}</div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Data Sensor</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Kecepatan: <span className="font-medium">{selectedVehicle.speed !== null ? `${selectedVehicle.speed} km/h` : 'N/A'}</span></div>
                  <div>Arah: <span className="font-medium">{selectedVehicle.course !== null ? `${selectedVehicle.course}°` : 'N/A'}</span></div>
                  <div>Odometer: <span className="font-medium">{selectedVehicle.odometer !== null ? `${selectedVehicle.odometer} km` : 'N/A'}</span></div>
                  <div>Total Odometer: <span className="font-medium">{selectedVehicle.total_odometer !== null ? `${selectedVehicle.total_odometer} km` : 'N/A'}</span></div>
                </div>
              </div>
              
              {selectedVehicle.geofence_name && (
                <div>
                  <h3 className="font-medium mb-2">Geofence</h3>
                  <div className="text-sm">{selectedVehicle.geofence_name}</div>
                  <div className="text-sm">Sejak: {formatTime(selectedVehicle.enter_time)}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Pilih kendaraan untuk melihat detail
            </div>
          )}
        </div>

        {/* Toggle Button Kanan */}
        <button
          onClick={() => setIsRightOpen(!isRightOpen)}
          className="absolute top-1/2 -left-3 transform -translate-y-1/2 bg-gray-200 border border-gray-300 rounded-full w-6 h-12 flex items-center justify-center shadow"
        >
          {isRightOpen ? (
            <span className="text-xs">▶</span>
          ) : (
            <span className="text-xs">◀</span>
          )}
        </button>
      </div>
    </div>
  )
}