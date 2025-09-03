"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/Button"
import { useSearchParams } from 'next/navigation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToStaticMarkup } from 'react-dom/server';

// Ikon kendaraan dengan arah (custom SVG)
const createVehicleIcon = (course: number, status: string | null) => {
  return L.divIcon({
    html: renderToStaticMarkup(
      <div style={{ transform: `rotate(${course}deg)`, transition: 'transform 0.5s ease' }}>
        <img 
          src={getIconByStatus(status)} 
          alt={status || 'unknown'} 
          className="w-12 h-12"
        />
      </div>
    ),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: 'vehicle-marker'
  });
};

const getIconByStatus = (status: string | null) => {
  if (!status) return '/images/vehicles/default.png';
  
  const statusLower = status.toLowerCase();
  
  switch(statusLower) {
    case 'bergerak':
      return '/images/vehicles/on.png';
    case 'mati':
      return '/images/vehicles/off.png';
    case 'berhenti':
      return '/images/vehicles/engine.png';
    case 'diam':
      return '/images/vehicles/ack.png';
    default:
      return '/images/vehicles/default.png';
  }
};

// Ikon titik biasa
const defaultIcon = L.divIcon({
  className: 'default-marker',
  iconSize: [8, 8],
  iconAnchor: [4, 4]
});


interface Point {
  id: string
  vehicle_id: number
  no_pol: string
  latitude: number
  longitude: number
  course: number
  speed: number
  status: string
  time: string
  address: string
  geojson: string
}

// Fungsi untuk menghitung jarak antara dua titik (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius bumi dalam km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Jarak dalam km
};

// Fungsi untuk mendapatkan tanggal dengan waktu 00:00:00 dan 23:59:59
const getTodayDateRange = (): { start: string, end: string } => {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 1, 0, 0); // 00:01:00
  
  const end = new Date(today);
  end.setHours(23, 59, 59, 999); // 23:59:59.999
  
  return {
    start: start.toISOString().split('.')[0],
    end: end.toISOString().split('.')[0]
  };
};

export default function LivePage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [points, setPoints] = useState<Point[]>([])
  const [trackLine, setTrackLine] = useState<number[][]>([])
  const [lastPoint, setLastPoint] = useState<Point | null>(null)
  const [totalDistance, setTotalDistance] = useState<number>(0)
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString())
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const polylineRef = useRef<L.Polyline | null>(null)
  const vehicleMarkerRef = useRef<L.Marker | null>(null)
  const lastDataRef = useRef<any>(null) // Untuk menyimpan data terakhir

  const searchParams = useSearchParams();
  const vehicle_id = searchParams.get('vehicle_id');
  const [isLeftOpen, setIsLeftOpen] = useState(true)
  const [isCenterOpen, setIsCenterOpen] = useState(true)

  // Inisialisasi peta
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!mapRef.current) {
        mapRef.current = L.map('map').setView([-6.683704, 111.605511], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapRef.current);
      }
    }
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Effect untuk menyesuaikan ukuran peta ketika sidebar di-toggle
  useEffect(() => {
    if (mapRef.current) {
      // Timeout kecil untuk memastikan DOM sudah di-render ulang
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 300);
    }
  }, [isLeftOpen, isCenterOpen]);

  // Fungsi untuk menambahkan/memperbarui marker dan polyline
  const updateMap = (points: Point[], trackLine: number[][]) => {
  if (!mapRef.current) return;
  
  const map = mapRef.current;
  
  // Hapus marker lama
  markersRef.current.forEach(marker => marker.remove());
  markersRef.current = [];
  
  // Hapus polyline lama
  if (polylineRef.current) {
    polylineRef.current.remove();
  }
  
  // Hapus vehicle marker lama
  if (vehicleMarkerRef.current) {
    vehicleMarkerRef.current.remove();
  }
  
  // Tambahkan marker untuk setiap titik (kecuali yang terakhir)
  if (points.length > 1) {
    for (let i = 0; i < points.length - 1; i++) {
      const point = points[i];
      const marker = L.marker([point.latitude, point.longitude], { icon: defaultIcon })
        .addTo(map);
      markersRef.current.push(marker);
    }
  }
  
  // Tambahkan polyline
  if (trackLine.length > 0) {
    polylineRef.current = L.polyline(trackLine.map(coord => [coord[1], coord[0]] as [number, number]), {
      color: 'blue',
      weight: 4,
      opacity: 0.7,
      smoothFactor: 1
    }).addTo(map);
  }
  
  // Tambahkan vehicle marker di titik terakhir
  if (points.length > 0) {
    const lastPoint = points[points.length - 1];
    // Perbaikan di sini: tambahkan parameter status
    const vehicleIcon = createVehicleIcon(parseInt(lastPoint.course.toString()), lastPoint.status);
    vehicleMarkerRef.current = L.marker([lastPoint.latitude, lastPoint.longitude], { icon: vehicleIcon })
      .addTo(map);
    
    // Fokus ke titik terakhir
    map.setView([lastPoint.latitude, lastPoint.longitude], 15);
  }
};

  // Fungsi untuk fetch data tracking dengan tanggal hari ini
  const fetchTracking = async (isAutoUpdate: boolean = false) => {
    try {
      if (!isAutoUpdate) {
        setLoading(true);
      }
      
      // Build query parameters dengan tanggal hari ini
      const params = new URLSearchParams()
      if (vehicle_id) params.append('vehicleId', vehicle_id);
      
      // Gunakan rentang waktu hari ini (00:01 - 23:59)
      const dateRange = getTodayDateRange();
      params.append('start', dateRange.start);
      params.append('end', dateRange.end);
      
      // Tambahkan timestamp untuk menghindari cache
      params.append('t', Date.now().toString());
      
      const res = await fetch(
        `http://localhost:3000/histories/tracking?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          // Tidak menggunakan cache untuk mendapatkan data terbaru
          cache: 'no-store'
        }
      )
      
      const data = await res.json()
      
      // Cek apakah data berbeda dengan data sebelumnya
      if (data.success && JSON.stringify(data) !== JSON.stringify(lastDataRef.current)) {
        lastDataRef.current = data;
        
        setPoints(data.points || []);
        setTrackLine(data.track?.coordinates || []);
        
        if (data.points && data.points.length > 0) {
          setLastPoint(data.points[data.points.length - 1]);
          
          // Hitung total jarak
          if (data.track && data.track.coordinates && data.track.coordinates.length > 1) {
            let distance = 0;
            const coords = data.track.coordinates;
            
            for (let i = 1; i < coords.length; i++) {
              const [lon1, lat1] = coords[i-1];
              const [lon2, lat2] = coords[i];
              distance += calculateDistance(lat1, lon1, lat2, lon2);
            }
            
            setTotalDistance(distance);
          }
          
          // Update peta
          updateMap(data.points, data.track?.coordinates || []);
        }
        
        // Update waktu terakhir
        setLastUpdate(new Date().toLocaleTimeString());
        
        // Animasi notifikasi update
        if (isAutoUpdate) {
          const updateIndicator = document.getElementById('update-indicator');
          if (updateIndicator) {
            updateIndicator.classList.add('animate-pulse');
            setTimeout(() => {
              updateIndicator.classList.remove('animate-pulse');
            }, 1000);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching tracking data:", err)
    } finally {
      if (!isAutoUpdate) {
        setLoading(false);
      }
    }
  }

  // Fetch data otomatis saat komponen dimount
  useEffect(() => {
    if (token) {
      fetchTracking();
      
      // Set interval untuk fetch data setiap 30 detik
      const interval = setInterval(() => fetchTracking(true), 30000);
      
      return () => clearInterval(interval);
    }
  }, [token]);

  // Format waktu
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format tanggal dan waktu lengkap
  const formatDateTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format kecepatan
  const formatSpeed = (speed: number) => {
    return `${speed} km/h`;
  };

  // Format jarak
  const formatDistance = (distance: number) => {
    return `${distance.toFixed(2)} km`;
  };

  // Dapatkan status warna berdasarkan status kendaraan
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'bergerak': return 'bg-green-100 text-green-800';
      case 'berhenti': return 'bg-yellow-100 text-yellow-800';
      case 'mati': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen relative">
      {/* Sidebar Kiri - Informasi Kendaraan */}
      <div
        className={`bg-white shadow-lg transition-all duration-300 overflow-hidden ${
          isLeftOpen ? "w-80" : "w-0"
        }`}
      >
        {isLeftOpen && (
          <div className="p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-bold">Information Today</h4>
              <div id="update-indicator" className="text-xs text-gray-500">
                Update: {lastUpdate}
              </div>
            </div>
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <p>Load data...</p>
              </div>
            ) : lastPoint ? (
              <div className="flex-1 overflow-auto">
                <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                  <h3 className="font-semibold text-lg">{lastPoint.no_pol}</h3>
                  <p className="text-sm text-gray-600">Vehicle ID: {lastPoint.vehicle_id}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-500">Speed</p>
                    <p className="font-bold text-lg">{formatSpeed(lastPoint.speed)}</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-500">Direction</p>
                    <p className="font-bold text-lg">{lastPoint.course}°</p>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${getStatusColor(lastPoint.status)}`}>
                    <p className="text-xs">Status</p>
                    <p className="font-bold text-lg capitalize">{lastPoint.status}</p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-500">Total Distance</p>
                    <p className="font-bold text-lg">{formatDistance(totalDistance)}</p>
                  </div>
                </div>
                
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Last Address</p>
                  <p className="text-sm">{lastPoint.address}</p>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Last Location</p>
                  <p className="text-sm">{lastPoint.latitude}, {lastPoint.longitude}</p>
                </div>
                
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Last Update</p>
                  <p className="text-sm">{formatDateTime(lastPoint.time)}</p>
                </div>
                
                <div className="mt-auto pt-4">
                  <Button onClick={() => fetchTracking()} className="w-full" disabled={loading}>
                    {loading ? "Memuat..." : "Refresh Manual"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p>Tidak ada data kendaraan</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Tengah - Riwayat Perjalanan */}
      <div
        className={`bg-white shadow-lg transition-all duration-300 overflow-hidden ${
          isCenterOpen ? "w-80" : "w-0"
        }`}
      >
        {isCenterOpen && (
          <div className="p-4 h-full flex flex-col">
            <h4 className="text-md font-bold mb-4">Historical Vehicle</h4>
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <p>Memuat data...</p>
              </div>
            ) : points.length > 0 ? (
              <div className="flex-1 overflow-auto">
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Total Point: {points.length}</p>
                </div>
                
                <div className="space-y-3">
                  {points.slice().reverse().map((point, index) => (
                    <div key={point.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{formatTime(point.time)}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(point.time)}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(point.status)}`}>
                          {point.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="text-sm">
                          <p className="text-gray-500">Kecepatan</p>
                          <p className="font-medium">{formatSpeed(point.speed)}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-gray-500">Arah</p>
                          <p className="font-medium">{point.course}°</p>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <p className="text-gray-500">Lokasi</p>
                        <p className="font-medium truncate">{point.address.split(',')[0]}</p>
                        <p className="text-xs text-gray-500 truncate">{point.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p>Tidak ada riwayat perjalanan</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Peta - Dipindah ke Kanan (TANPA TOGGLE) */}
      <div className="flex-1 relative" style={{ zIndex: 1 }}>
        <div id="map" className="w-full h-full"></div>
        
        {/* Overlay informasi update otomatis */}
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md flex items-center" style={{ zIndex: 1000 }}>
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <p>Update otomatis aktif</p>
        </div>
      </div>

      {/* Toggle Button Kiri - Diposisikan secara absolut dengan z-index tinggi */}
      <button
        onClick={() => setIsLeftOpen(!isLeftOpen)}
        className="absolute top-1/2 bg-white border border-gray-300 rounded-full w-8 h-12 flex items-center justify-center shadow-md hover:bg-gray-100 transition-all duration-300 z-50"
        style={{ 
          left: isLeftOpen ? '19rem' : '0',
          transform: 'translateY(-50%)'
        }}
      >
        {isLeftOpen ? (
          <span className="text-xs font-bold">◀</span>
        ) : (
          <span className="text-xs font-bold">▶</span>
        )}
      </button>

      {/* Toggle Button Tengah - Diposisikan secara absolut dengan z-index tinggi */}
      <button
        onClick={() => setIsCenterOpen(!isCenterOpen)}
        className="absolute top-1/2 bg-white border border-gray-300 rounded-full w-8 h-12 flex items-center justify-center shadow-md hover:bg-gray-100 transition-all duration-300 z-50"
        style={{ 
          left: isLeftOpen ? (isCenterOpen ? '39rem' : '19rem') : (isCenterOpen ? '19rem' : '0'),
          transform: 'translateY(-50%)'
        }}
      >
        {isCenterOpen ? (
          <span className="text-xs font-bold">◀</span>
        ) : (
          <span className="text-xs font-bold">▶</span>
        )}
      </button>

      <style jsx>{`
        .vehicle-marker {
          transition: transform 0.5s ease;
        }
        .default-marker {
          background-color: #3b82f6;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
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