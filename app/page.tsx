"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import { useAuth } from "@/context/AuthContext"
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link';
import Image from 'next/image'

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
  total_odometer: null
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
  geom: string | null
  group_id: number | null
  protocol: string | null
}

interface Device {
  id: string
  name: string
  imei: string
  sim_number: string
  type_id: number
  vehicle_id: number
  status: number
  created_at: string
}

// Tab types
type TabType = 'all' | 'bergerak' | 'mati' | 'diam' | 'berhenti'
type DetailTabType = 'info' | 'device'

export default function TrackingPage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [deviceData, setDeviceData] = useState<Device | null>(null)
  const [deviceLoading, setDeviceLoading] = useState(false)
  const [map, setMap] = useState<L.Map | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTabType>('info')
  const [searchTerm, setSearchTerm] = useState('')
  const [isPolling, setIsPolling] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  
  const [isLeftOpen, setIsLeftOpen] = useState(true)
  const [isRightOpen, setIsRightOpen] = useState(true)
  
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([])

  // Get icon based on vehicle status
  const getIconByStatus = useCallback((status: string | null) => {
    switch(status) {
      case 'bergerak': return '/images/vehicles/on.png';
      case 'mati': return '/images/vehicles/off.png';
      case 'berhenti': return '/images/vehicles/engine.png';
      case 'diam': return '/images/vehicles/ack.png';
      default: return '/images/vehicles/default.png';
    }
  }, [])
  
  // Initialize map
  useEffect(() => {
    if (typeof window !== 'undefined' && mapRef.current && !map) {
      const mapInstance = L.map(mapRef.current).setView([-6.2, 106.8], 10)
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance)
      
      setMap(mapInstance)
      
      return () => {
        mapInstance.remove()
        setMap(null)
      }
    }
  }, [])
  
  // Handle map resize when sidebars are toggled
  useEffect(() => {
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    }
  }, [isLeftOpen, isRightOpen, map]);

  // Fetch data from API
  const fetchTracking = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true)
      
      const res = await fetch(
        `https://demo.speedtrack.id/api/traccars`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-cache'
        }
      )
      
      if (!res.ok) throw new Error('Failed to fetch data')
      
      const data = await res.json()
      if (data.success) {
        setVehicles(data.data)
        
        // Add markers to map
        if (map) {
          // Clear existing markers
          markersRef.current.forEach(marker => map.removeLayer(marker))
          markersRef.current = []
          
          const bounds = L.latLngBounds([]);
          
          data.data.forEach((vehicle: Vehicle) => {
            if (vehicle.latitude && vehicle.longitude) {
              const latLng = L.latLng(vehicle.latitude, vehicle.longitude);
              bounds.extend(latLng);
              
              const customIcon = L.divIcon({
                html: `
                  <div style="transform: rotate(${vehicle.course || 0}deg); transform-origin: center;">
                    <img src="${getIconByStatus(vehicle.status)}" width="25" height="41"/>
                  </div>
                `,
                className: 'custom-div-icon',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
              })
              
              const marker = L.marker(latLng, { icon: customIcon })
                .addTo(map)
                .bindPopup(vehicle.no_pol || 'Unknown Vehicle')
              
              marker.on('click', () => {
                setSelectedVehicle(vehicle)
              })
              
              markersRef.current.push(marker)
            }
          })
          
          if (bounds.getNorthWest() && bounds.getSouthEast()) {
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        }
        
        // Update last update time
        setLastUpdate(new Date().toLocaleTimeString('id-ID'))
      }
    } catch (err) {
      console.error("Error fetching tracking data:", err)
    } finally {
      setLoading(false)
    }
  }, [token, map, getIconByStatus])

  // Polling data setiap 30 detik
  useEffect(() => {
    if (token && isPolling) {
      fetchTracking(); // Fetch immediately
      const interval = setInterval(fetchTracking, 30000);
      return () => clearInterval(interval);
    }
  }, [token, isPolling, fetchTracking]);

  // Fetch device data when selected vehicle changes
  const fetchDeviceData = useCallback(async (deviceId: string) => {
    if (!deviceId) return;
    
    try {
      setDeviceLoading(true);
      const res = await fetch(
        `https://demo.speedtrack.id/api/devices/${deviceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const data = await res.json();
      if (data.success) {
        setDeviceData(data.data);
      }
    } catch (err) {
      console.error("Error fetching device data:", err);
    } finally {
      setDeviceLoading(false);
    }
  }, [token]);

  // When a vehicle is selected, fetch device data if device_id exists
  useEffect(() => {
    if (selectedVehicle && selectedVehicle.device_id) {
      fetchDeviceData(selectedVehicle.device_id.toString());
      setActiveDetailTab('info');
    } else {
      setDeviceData(null);
    }
  }, [selectedVehicle, fetchDeviceData]);
  
  // Focus map on selected vehicle
  useEffect(() => {
    if (selectedVehicle && selectedVehicle.latitude && selectedVehicle.longitude && map) {
      map.setView([selectedVehicle.latitude, selectedVehicle.longitude], 15)
      
      // Highlight the selected marker
      markersRef.current.forEach(marker => {
        const latLng = marker.getLatLng()
        if (latLng.lat === selectedVehicle.latitude && latLng.lng === selectedVehicle.longitude) {
          marker.openPopup()
        }
      })
    }
  }, [selectedVehicle, map])
  
  // Filter vehicles that have valid coordinates
  const vehiclesWithLocation = useMemo(() => 
    vehicles.filter(v => v.latitude && v.longitude), 
    [vehicles]
  )
  
  // Filter vehicles by active tab
  const filteredVehicles = useMemo(() => {
    let filtered = vehiclesWithLocation;
    
    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === activeTab);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(vehicle => 
        vehicle.no_pol && vehicle.no_pol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [vehiclesWithLocation, activeTab, searchTerm])
  
  // Format time to local string
  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'N/A'
    return new Date(timeString).toLocaleString('id-ID')
  }

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
  
  // Handle download data
  const handleDownload = () => {
    // Create CSV content
    let csvContent = "No Polisi,Status,Alamat,Waktu,Kecepatan\n";
    
    const dataToExport = searchTerm 
      ? vehiclesWithLocation.filter(v => v.no_pol && v.no_pol.toLowerCase().includes(searchTerm.toLowerCase()))
      : vehiclesWithLocation;
    
    dataToExport.forEach(vehicle => {
      csvContent += `"${vehicle.no_pol || ''}","${vehicle.status || ''}","${vehicle.address || ''}","${vehicle.time || ''}","${vehicle.speed || ''}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `data-kendaraan-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Manual refresh function
  const handleManualRefresh = () => {
    fetchTracking();
  }
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Kiri */}
      <div
        className={`relative bg-white shadow-lg transition-all duration-300 ${
          isLeftOpen ? "w-80" : "w-0"
        }`}
      >
        <div className={`${isLeftOpen ? "block" : "hidden"} h-full flex flex-col`}>
          {/* Search Box */}
          <div className="p-3 border-b">
            <div className="relative">
              <input
                type="text"
                placeholder="Type plate number here..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs p-2 pl-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

                    
          {/* Tab Navigation - Modern Design */}
          <div className="flex border-b px-2 pt-2">
            <button
              className={`flex-1 py-2 px-1 text-center text-xs font-medium rounded-t-lg transition-all duration-200 ${
                activeTab === 'all' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('all')}
              title="Semua Kendaraan"
            >
              <div className="flex flex-col justify-center items-center">
                <span>All</span>
                <span className="text-xs font-bold mt-1">{vehiclesWithLocation.length}</span>
              </div>
            </button>
            <button
              className={`flex-1 py-2 px-1 text-center text-xs font-medium rounded-t-lg transition-all duration-200 ${
                activeTab === 'bergerak' 
                  ? 'bg-green-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('bergerak')}
              title="Bergerak"
            >
              <div className="flex flex-col justify-center items-center">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  <span>Bergerak</span>
                </div>
                <span className="text-xs font-bold mt-1">{statusCounts.bergerak}</span>
              </div>
            </button>
            <button
              className={`flex-1 py-2 px-1 text-center text-xs font-medium rounded-t-lg transition-all duration-200 ${
                activeTab === 'mati' 
                  ? 'bg-red-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('mati')}
              title="Mati"
            >
              <div className="flex flex-col justify-center items-center">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                  <span>Mati</span>
                </div>
                <span className="text-xs font-bold mt-1">{statusCounts.mati}</span>
              </div>
            </button>
            <button
              className={`flex-1 py-2 px-1 text-center text-xs font-medium rounded-t-lg transition-all duration-200 ${
                activeTab === 'berhenti' 
                  ? 'bg-yellow-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('berhenti')}
              title="Berhenti"
            >
              <div className="flex flex-col justify-center items-center">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                  <span>Berhenti</span>
                </div>
                <span className="text-xs font-bold mt-1">{statusCounts.berhenti}</span>
              </div>
            </button>
            <button
              className={`flex-1 py-2 px-1 text-center text-xs font-medium rounded-t-lg transition-all duration-200 ${
                activeTab === 'diam' 
                  ? 'bg-gray-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('diam')}
              title="Diam"
            >
              <div className="flex flex-col justify-center items-center">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-gray-500 rounded-full mr-1"></div>
                  <span>Diam</span>
                </div>
                <span className="text-xs font-bold mt-1">{statusCounts.diam}</span>
              </div>
            </button>
          </div>

          
          {/* Vehicle List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-6">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-500">Memuat data...</p>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2">
                  {searchTerm ? `Tidak ditemukan kendaraan dengan no. polisi "${searchTerm}"` : 'Tidak ada kendaraan'}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredVehicles.map(vehicle => (
                  <div 
                    key={vehicle.id} 
                    className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedVehicle?.id === vehicle.id 
                        ? 'bg-blue-50 border-blue-500 shadow-md' 
                        : 'border-gray-200 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedVehicle(vehicle)}
                  >
                    <div className="flex items-start">
                      {/* Icon status */}
                      <div className="flex-shrink-0 mr-3 mt-1">
                        <Image 
                          src={getIconByStatus(vehicle.status)} 
                          alt={vehicle.status || 'unknown'} 
                          width={24}
                          height={24}
                          className="w-6 h-6"
                         />

                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="font-semibold text-gray-800 truncate">
                            {vehicle.no_pol || 'Unknown'}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            vehicle.status === 'bergerak' ? 'bg-green-100 text-green-800' :
                            vehicle.status === 'mati' ? 'bg-red-100 text-red-800' :
                            vehicle.status === 'berhenti' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {vehicle.status || 'unknown'}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 mt-1 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {vehicle.time ? formatTime(vehicle.time) : 'Waktu tidak tersedia'}
                        </div>
                        
                        {vehicle.address && (
                          <div className="text-xs text-gray-500 mt-2 truncate">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 inline text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {vehicle.address.substring(0, 60)}...
                          </div>
                        )}
                        
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          {vehicle.speed !== null && (
                            <div className="flex items-center mr-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                              </svg>
                              {vehicle.speed} km/h
                            </div>
                          )}
                          
                          {vehicle.ignition_status && (
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              {vehicle.ignition_status}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Toggle Button Kiri */}
        <button
          onClick={() => setIsLeftOpen(!isLeftOpen)}
          className="absolute top-1/2 -right-3 transform -translate-y-1/2 bg-white border border-gray-300 rounded-full w-6 h-12 flex items-center justify-center shadow hover:bg-gray-50 transition-all duration-200"
        >
          {isLeftOpen ? (
            <span className="text-xs">◀</span>
          ) : (
            <span className="text-xs">▶</span>
          )}
        </button>
      </div>

      {/* Main content (map) */}
      <div className="flex-1 relative">
        <div 
          id="map" 
          ref={mapRef}
          className="w-full h-full" 
          style={{ zIndex: 1 }}
        ></div>
      </div>

      {/* Sidebar Kanan */}
      <div
        className={`relative bg-white shadow-lg transition-all duration-300 ${
          isRightOpen ? "w-80" : "w-0"
        }`}
      >
        <div className={`${isRightOpen ? "block" : "hidden"} h-full flex flex-col`}>
          <div className="p-4 flex-1 overflow-y-auto">
            {/* Auto Refresh Control */}
            <div className="p-3 border-b bg-yellow-50 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Auto Refresh</span>
                <button
                  onClick={() => setIsPolling(!isPolling)}
                  className={`px-2 py-1 rounded text-xs ${
                    isPolling ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                  }`}
                >
                  {isPolling ? 'Stop' : 'Start'}
                </button>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Last update: {lastUpdate}</span>
                <button 
                  onClick={handleManualRefresh}
                  className="text-blue-500 hover:text-blue-700"
                >
                  Refresh
                </button>
              </div>
            </div>
            
            {/* Download Button */}
            <div className="mb-4 flex justify-end">
              <button
                onClick={handleDownload}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm"
                title="Download Data"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            <h2 className="font-bold mb-4 text-md">Detail Kendaraan</h2>
            
            {selectedVehicle ? (
              <div className="space-y-4">
                {/* Header dengan No Pol dan Button */}
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xl font-bold">{selectedVehicle.no_pol || 'Unknown'}</div>
                    </div>
                    <div className="flex space-x-1">
                      <button 
                        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded text-xs"
                        title="Playback"
                      >
                        <Link 
                          href={{
                            pathname: '/monitoring/live',
                            query: { vehicle_id: selectedVehicle.vehicle_id }
                          }}
                          passHref
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </Link>
                      </button>
                      <button 
                        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded text-xs"
                        title="Playback"
                      >
                        <Link 
                          href={{
                            pathname: '/playback',
                            query: { vehicle_id: selectedVehicle.vehicle_id }
                          }}
                          passHref
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </Link>
                      </button>
                      <button 
                        className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded text-xs"
                        title="Report"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Tab Navigation untuk Detail */}
                <div className="flex border-b">
                  <button
                    className={`flex-1 py-2 text-center text-sm font-medium ${
                      activeDetailTab === 'info' 
                        ? 'border-b-2 border-blue-500 text-blue-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveDetailTab('info')}
                  >
                    Info
                  </button>
                  <button
                    className={`flex-1 py-2 text-center text-sm font-medium ${
                      activeDetailTab === 'device' 
                        ? 'border-b-2 border-blue-500 text-blue-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveDetailTab('device')}
                    disabled={!selectedVehicle.device_id}
                  >
                    Device
                  </button>
                </div>
                
                {/* Tab Content */}
                {activeDetailTab === 'info' ? (
                  <>
                    <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total titik:</span>
                <span className="font-medium">{selectedVehicle.ignition_status || 'N/A'}</span>
              </div>              
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Date Time:</span>
                    <span className="font-medium text-xs">{selectedVehicle.time}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="text-xs text-blue-600">Status</div>
                      <div className="text-sm font-medium">{selectedVehicle.status}</div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="text-xs text-blue-600">Speed</div>
                      <div className="text-sm font-medium">{selectedVehicle.speed} km/h</div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="text-xs text-blue-600">Angle</div>
                      <div className="text-sm font-medium">{selectedVehicle.course}&deg;</div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="text-xs text-gray-500 mb-1">Address:</div>
                    <div className="text-sm bg-gray-100 p-2 rounded">{selectedVehicle.address}</div>
                  </div>
            </div>
            
            
          </div>

                    <div>
                      <h3 className="font-medium mb-2">Status</h3>
                      <div className={
                        selectedVehicle.status === 'bergerak' ? 'text-green-600 font-bold' : 
                        selectedVehicle.status === 'mati' ? 'text-red-600 font-bold' : 'text-gray-600'
                      }>
                        {selectedVehicle.status || 'Tidak diketahui'}
                      </div>
                      <div className="text-sm">Ignition: </div>
                    </div>

                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">Address</p>
                          <p className="text-sm">{selectedVehicle.address || 'Lokasi tidak tersedia'}</p>
                          <p className="text-sm">{formatTime(selectedVehicle.time)}</p>
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
                  </>
                ) : (
                  <div>
                    {deviceLoading ? (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        <p className="mt-2 text-gray-500">Memuat data perangkat...</p>
                      </div>
                    ) : deviceData ? (
                      <div className="space-y-4">
                        <h5 className="font-medium mb-2">Device Info</h5>
                        
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">Device Name</p>
                          <p className="text-sm">{deviceData.name}</p>
                        </div>
                        
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">IMEI</p>
                          <p className="text-sm">{deviceData.imei}</p>
                        </div>
                        
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">SIM Number</p>
                          <p className="text-sm">{deviceData.sim_number}</p>
                        </div>

                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">Status Device</p>
                          <p className={`text-sm ${deviceData.status === 1 ? 'text-green-600' : 'text-red-600'}`}>{deviceData.status === 1 ? 'Aktif' : 'Tidak Aktif'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="mt-2">Tidak ada data perangkat</p>
                        <p className="text-xs">Perangkat mungkin tidak terhubung dengan kendaraan ini</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              
              <div className="text-center py-8 text-gray-500">
                {/* Keterangan */}
                <p className="text-xs text-gray-500 bg-red-50 p-2 rounded-lg">
                  <span className="font-medium"> Klik pada kendaraan di daftar atau peta untuk melihat detail.</span>
                </p>
              </div>
              
            )}
          </div>
        </div>

        {/* Toggle Button Kanan */}
        <button
          onClick={() => setIsRightOpen(!isRightOpen)}
          className="absolute top-1/2 -left-3 transform -translate-y-1/2 bg-white border border-gray-300 rounded-full w-6 h-12 flex items-center justify-center shadow hover:bg-gray-50"
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

// Tambahkan style CSS untuk mengatur tumpukan elemen
<style>{`
  .leaflet-container {
    z-index: 1;
  }
  .leaflet-top, .leaflet-bottom {
    z-index: 2;
  }
`}</style>