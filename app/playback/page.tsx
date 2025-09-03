"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import MapComponent from "@/components/MapComponent"
import { Button } from "@/components/ui/Button"
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';


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

interface Track {
  type: string
  coordinates: number[][]
  properties?: {
    total_distance?: number
    total_time?: number
  }
}

// Interface untuk data filter
interface FilterForm {
  vehicle_id: string
  start_date: string
  end_date: string
}

// Interface untuk data parkir
interface ParkingInfo {
  point: Point
  startTime: Date
  endTime: Date
  duration: number // dalam detik
}

// Fungsi untuk menghitung jarak antara dua titik (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius bumi dalam kilometer
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Fungsi untuk memformat waktu
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}j ${minutes}m ${remainingSeconds}d`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}d`;
  } else {
    return `${remainingSeconds}d`;
  }
};

// Fungsi untuk memformat durasi parkir
const formatParkingDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}j ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}d`;
  }
};

// Fungsi untuk mendapatkan waktu hari (pagi, siang, sore, malam) dan warna yang sesuai
const getTimeOfDay = (timeString: string): { timeOfDay: string, bgColor: string, textColor: string } => {
  const hour = new Date(timeString).getHours();
  
  if (hour >= 5 && hour < 10) {
    return { timeOfDay: "Pagi", bgColor: "bg-gradient-to-r from-blue-50 to-amber-50", textColor: "text-amber-700" };
  } else if (hour >= 10 && hour < 15) {
    return { timeOfDay: "Siang", bgColor: "bg-gradient-to-r from-amber-50 to-yellow-50", textColor: "text-yellow-700" };
  } else if (hour >= 15 && hour < 19) {
    return { timeOfDay: "Sore", bgColor: "bg-gradient-to-r from-orange-50 to-red-50", textColor: "text-orange-700" };
  } else {
    return { timeOfDay: "Malam", bgColor: "bg-gradient-to-r from-blue-50 to-indigo-50", textColor: "text-indigo-700" };
  }
};

// Fungsi untuk export data ke Excel



export default function TrackingPage() {
  const { token } = useAuth()
  const [points, setPoints] = useState<Point[]>([])
  const [track, setTrack] = useState<Track | null>(null)
  const [, setLoading] = useState(true)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State untuk lokasi yang dipilih/difokuskan
  const [selectedLocation, setSelectedLocation] = useState<Point | null>(null)
  const [selectedLocationType, setSelectedLocationType] = useState<'highest_speed' | 'parking' | null>(null)

  const searchParams = useSearchParams();
  const vehicle_id = searchParams.get('vehicle_id');

  // State untuk form filter
  const [filters, setFilters] = useState<FilterForm>({
    vehicle_id: "",
    start_date: new Date().toISOString().split('T')[0], // Default: hari ini
    end_date: new Date().toISOString().split('T')[0]    // Default: hari ini
  })

  // State untuk toggle panel parkir
  const [showParkingInfo, setShowParkingInfo] = useState(false);

  // data saat ini (untuk info di card)
  const currentPoint = useMemo(() => points[currentIndex], [points, currentIndex])
  const startPoint = points[0]
  const endPoint = points[points.length - 1]
  const [, setAnimatedPos] = useState<[number, number] | null>(null)

  const [isLeftOpen, setIsLeftOpen] = useState(true)
  const [isRightOpen, setIsRightOpen] = useState(true)

  // Hitung total jarak dan waktu
  const totalDistance = useMemo(() => {
    if (points.length < 2) return 0;
    
    let distance = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      distance += calculateDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      );
    }
    return distance;
  }, [points]);

  const totalTime = useMemo(() => {
    if (points.length < 2) return 0;
    
    const start = new Date(points[0].time).getTime();
    const end = new Date(points[points.length - 1].time).getTime();
    return (end - start) / 1000;
  }, [points]);

  // Hitung jarak dan waktu hingga titik saat ini
  const distanceToCurrent = useMemo(() => {
    if (currentIndex < 1) return 0;
    
    let distance = 0;
    for (let i = 1; i <= currentIndex; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      distance += calculateDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      );
    }
    return distance;
  }, [points, currentIndex]);

  const timeToCurrent = useMemo(() => {
    if (currentIndex < 1) return 0;
    
    const start = new Date(points[0].time).getTime();
    const current = new Date(points[currentIndex].time).getTime();
    return (current - start) / 1000;
  }, [points, currentIndex]);

  // Dapatkan informasi waktu hari untuk titik saat ini
  const timeOfDayInfo = useMemo(() => {
    if (!currentPoint) return { timeOfDay: "", bgColor: "bg-gray-50", textColor: "text-gray-700" };
    return getTimeOfDay(currentPoint.time);
  }, [currentPoint]);

  // Temukan kecepatan tertinggi dan posisinya
  const highestSpeedInfo = useMemo(() => {
    if (points.length === 0) return null;
    
    let highestSpeed = 0;
    let highestSpeedPoint: Point | null = null;
    
    points.forEach(point => {
      if (point.speed > highestSpeed) {
        highestSpeed = point.speed;
        highestSpeedPoint = point;
      }
    });
    
    return highestSpeedPoint ? {
        speed: highestSpeed,
        point: highestSpeedPoint,
        position: `${(highestSpeedPoint as Point).latitude.toFixed(6)}, ${(highestSpeedPoint as Point).longitude.toFixed(6)}`,
        time: new Date((highestSpeedPoint as Point).time).toLocaleString(),
        address: (highestSpeedPoint as Point).address
    } : null;

  }, [points]);

  // Temukan titik parkir terlama
  const longestParkingSpots = useMemo(() => {
    if (points.length < 2) return [];
    
    const parkingSpots: ParkingInfo[] = [];
    let parkingStart: Point | null = null;
    
    for (let i = 0; i < points.length - 1; i++) {
      const currentPoint = points[i];
      const nextPoint = points[i + 1];
      
      // Jika status berubah dari "parking/stopped" ke "moving"
      if ((currentPoint.status === 'parking' || currentPoint.status === 'mati' || currentPoint.speed === 0) && 
          nextPoint.status === 'bergerak' && nextPoint.speed > 0) {
        
        if (parkingStart) {
          const startTime = new Date(parkingStart.time);
          const endTime = new Date(currentPoint.time);
          const duration = (endTime.getTime() - startTime.getTime()) / 1000; // dalam detik
          
          parkingSpots.push({
            point: parkingStart,
            startTime,
            endTime,
            duration
          });
          
          parkingStart = null;
        }
      }
      // Jika status berubah dari "moving" ke "parking/stopped"
      else if ((currentPoint.status === 'bergerak' && currentPoint.speed > 0) && 
               (nextPoint.status === 'parking' || nextPoint.status === 'mati' || nextPoint.speed === 0)) {
        parkingStart = nextPoint;
      }
    }
    
    // Urutkan berdasarkan durasi terpanjang dan ambil 10 teratas
    return parkingSpots
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
  }, [points]);

  // Fungsi untuk menangani klik pada kecepatan tertinggi
  const handleHighestSpeedClick = () => {
    if (highestSpeedInfo) {
      setSelectedLocation(highestSpeedInfo.point);
      setSelectedLocationType('highest_speed');
    }
  };

  // Fungsi untuk menangani klik pada lokasi parkir
  const handleParkingClick = (parkingSpot: ParkingInfo) => {
    setSelectedLocation(parkingSpot.point);
    setSelectedLocationType('parking');
  };

  const exportToExcel = () => {
  // Siapkan data untuk diexport
  const excelData = points.map((point, index) => ({
    'No': index + 1,
    'No. Polisi': point.no_pol,
    'Tanggal/Waktu': new Date(point.time).toLocaleString(),
    'Latitude': point.latitude,
    'Longitude': point.longitude,
    'Kecepatan (km/h)': point.speed,
    'Arah (derajat)': point.course,
    'Status': point.status,
    'Alamat': point.address,
  }));

  // Buat worksheet dari data
  const ws = XLSX.utils.json_to_sheet(excelData);
  
  // Buat workbook dan tambahkan worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tracking Data');
  
  // Generate nama file dengan timestamp
  const fileName = `tracking_data_${new Date().toISOString().slice(0, 10)}.xlsx`;
  
  // Download file
  XLSX.writeFile(wb, fileName);
};

// Fungsi untuk export data parkir ke Excel
const exportParkingToExcel = () => {
  if (longestParkingSpots.length === 0) return;
  
  // Siapkan data untuk diexport
  const excelData = longestParkingSpots.map((parking, index) => ({
    'No': index + 1,
    'No. Polisi': parking.point.no_pol,
    'Durasi Parkir': formatParkingDuration(parking.duration),
    'Mulai Parkir': new Date(parking.startTime).toLocaleString(),
    'Selesai Parkir': new Date(parking.endTime).toLocaleString(),
    'Latitude': parking.point.latitude,
    'Longitude': parking.point.longitude,
    'Alamat': parking.point.address,
  }));

  // Buat worksheet dari data
  const ws = XLSX.utils.json_to_sheet(excelData);
  
  // Buat workbook dan tambahkan worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Parking Data');
  
  // Generate nama file dengan timestamp
  const fileName = `parking_data_${new Date().toISOString().slice(0, 10)}.xlsx`;
  
  // Download file
  XLSX.writeFile(wb, fileName);
};

  // Fungsi untuk fetch data tracking dengan filter
  const fetchTracking = async (filterParams: FilterForm) => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (vehicle_id) params.append('vehicleId', vehicle_id);
      if (filterParams.start_date) params.append('start', filterParams.start_date)
      if (filterParams.end_date) params.append('end', filterParams.end_date)
      
      const res = await fetch(
        `https://demo.speedtrack.id/api/histories/tracking?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      const data = await res.json()
      if (data.success) {
        setPoints(data.points || [])
        setTrack(data.track || null)
        setCurrentIndex(0)
        setIsPlaying(false)
        // Reset selected location ketika data baru dimuat
        setSelectedLocation(null);
        setSelectedLocationType(null);
      }
    } catch (err) {
      console.error("Error fetching tracking data:", err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data tracking saat form disubmit
  const handleFilterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await fetchTracking(filters) // fungsi ambil data dari API
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form filter
  const handleResetFilters = () => {
    const today = new Date().toISOString().split('T')[0]
    setFilters({
      vehicle_id: "",
      start_date: today,
      end_date: today
    })
    // Optionally, fetch data dengan filter kosong
    fetchTracking({
      vehicle_id: "",
      start_date: today,
      end_date: today
    })
  }

  // Animasi play
  useEffect(() => {
    if (!isPlaying || points.length < 2) return

    let frame: number
    let startTime: number | null = null

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp

      const current = points[currentIndex]
      const next = points[currentIndex + 1]
      if (!next) {
        setIsPlaying(false)
        return
      }

      // hitung progress (0 -> 1)
      const duration = 2000 // Durasi konstan 2 detik antar titik
      const progress = Math.min((timestamp - startTime) / duration, 1)

      // linear interpolation lat & lng
      const lat = current.latitude + (next.latitude - current.latitude) * progress
      const lng = current.longitude + (next.longitude - current.longitude) * progress

      setAnimatedPos([lat, lng])

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      } else {
        // lanjut ke titik berikutnya
        setCurrentIndex((i) => {
          const newIndex = Math.min(i + 1, points.length - 1)
          if (newIndex === points.length - 1) setIsPlaying(false)
          return newIndex
        })
        startTime = null
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frame)
  }, [isPlaying, currentIndex, points])

  // Format untuk ditampilkan
  const formattedTotalDistance = `${totalDistance.toFixed(2)} km`;
  const formattedTotalTime = formatTime(totalTime);
  const formattedDistanceToCurrent = `${distanceToCurrent.toFixed(2)} km`;
  const formattedTimeToCurrent = formatTime(timeToCurrent);

  return (
    <div className="flex h-screen">
      {/* Sidebar Kiri */}
      <div
        className={`relative bg-white shadow-lg transition-all duration-300 ${
          isLeftOpen ? "w-80" : "w-0"
        }`}
      >
        <div className={`${isLeftOpen ? "flex flex-col h-full" : "hidden"}`}>
          <div className="p-4 overflow-y-auto flex-grow">
            <h2 className="font-bold mb-2">Filter Tracking</h2>
            
            <form onSubmit={handleFilterSubmit} className="space-y-4">
              {/* Tanggal Mulai */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-3 top-3 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* Tanggal Akhir */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-3 top-3 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex-1 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
                
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  className="flex-1"
                >
                  {!isSubmitting && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  )}
                  Track
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            

            {/* Playback Controls */}
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Playback Tracking
              </h2>

              {/* Informasi Jarak dan Waktu */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-blue-600">Total Jarak</div>
                    <div className="font-medium">{formattedTotalDistance}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600">Total Waktu</div>
                    <div className="font-medium">{formattedTotalTime}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600">Jarak Tempuh</div>
                    <div className="font-medium">{formattedDistanceToCurrent}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600">Waktu Tempuh</div>
                    <div className="font-medium">{formattedTimeToCurrent}</div>
                  </div>
                </div>
              </div>

              {/* Informasi Kecepatan Tertinggi */}
              {highestSpeedInfo && (
                <div 
                  className="bg-red-50 p-3 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                  onClick={handleHighestSpeedClick}
                >
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-sm font-bold text-red-700">Kecepatan Tertinggi</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-red-600">Speed</div>
                      <div className="font-medium">{highestSpeedInfo.speed} km/h</div>
                    </div>
                    <div>
                      <div className="text-xs text-red-600">Waktu</div>
                      <div className="font-medium text-xs">{highestSpeedInfo.time}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-red-600">Posisi</div>
                      <div className="font-medium text-xs">{highestSpeedInfo.position}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-red-600">Alamat</div>
                      <div className="font-medium text-xs bg-red-100 p-1 rounded mt-1">
                        {highestSpeedInfo.address || "Alamat tidak tersedia"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              

              {/* Slider posisi */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>0</span>
                  <span>Position: {currentIndex + 1}/{points.length}</span>
                  <span>{points.length}</span>
                </div>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600"
                  min={0}
                  max={Math.max(points.length - 1, 0)}
                  step={1}
                  value={currentIndex}
                  onChange={(e) => setCurrentIndex(Number(e.target.value))}
                />
              </div>

              {/* Tombol kontrol */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsPlaying((p) => !p)}
                  className="px-4 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={points.length === 0}
                >
                  {isPlaying ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Pause
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                      Play
                    </>
                  )}
                </button>
                <button
                  onClick={() => setCurrentIndex(0)}
                  className="px-4 py-2.5 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={points.length === 0}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
                <button
                  onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
                  className="px-3 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={points.length === 0 || currentIndex === 0}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Prev
                </button>
                <button
                  onClick={() => setCurrentIndex((i) => Math.min(i + 1, points.length - 1))}
                  className="px-3 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={points.length === 0 || currentIndex === points.length - 1}
                >
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Keterangan */}
              <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded-lg">
                <span className="font-medium">Info:</span> Marker yang tampil: titik awal, titik akhir, dan marker bergerak di posisi saat ini.
              </p>
            </div>
          </div>
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
      <div className="flex-1 bg-blue-100 flex items-center justify-center">
        <MapComponent 
          points={points} 
          track={track} 
          currentIndex={currentIndex} 
          selectedLocation={selectedLocation}
          selectedLocationType={selectedLocationType}
        />
      </div>

      {/* Sidebar Kanan */}
      <div
        className={`relative bg-white shadow-lg transition-all duration-300 ${
          isRightOpen ? "w-80" : "w-0"
        }`}
      >
        <div className={`${isRightOpen ? "flex flex-col h-full" : "hidden"}`}>
          <div className="p-4 overflow-y-auto flex-grow">
            <h2 className="font-bold mb-2">Playback Info : {currentPoint && (
                  <>
                  {currentPoint.no_pol}
                  </>
                )}</h2>
            {/* isi panel kanan */}
            <div className="space-y-4">
              {/* Panel waktu hari dengan background dinamis */}
              {currentPoint && (
                <div className={`p-4 rounded-lg ${timeOfDayInfo.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={`font-bold ${timeOfDayInfo.textColor}`}>
                        {timeOfDayInfo.timeOfDay}
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {new Date(currentPoint.time).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total titik:</span>
                  <span className="font-medium">{points.length}</span>
                </div>
                {startPoint && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Start:</span>
                    <span className="font-medium text-xs">{new Date(startPoint.time).toLocaleString()}</span>
                  </div>
                )}
                {endPoint && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">End:</span>
                    <span className="font-medium text-xs">{new Date(endPoint.time).toLocaleString()}</span>
                  </div>
                )}
                {currentPoint && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Date Time:</span>
                      <span className="font-medium text-xs">{new Date(currentPoint.time).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-xs text-blue-600">Status</div>
                        <div className="text-sm font-medium">{currentPoint.status}</div>
                      </div>
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-xs text-blue-600">Speed</div>
                        <div className="text-sm font-medium">{currentPoint.speed} km/h</div>
                      </div>
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-xs text-blue-600">Angle</div>
                        <div className="text-sm font-medium">{currentPoint.course}&deg;</div>
                      </div>
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-xs text-blue-600">Progress</div>
                        <div className="text-sm font-medium">{Math.round((currentIndex / (points.length - 1)) * 100)}%</div>
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="text-xs text-gray-500 mb-1">Address:</div>
                      <div className="text-sm bg-gray-100 p-2 rounded">{currentPoint.address}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Tombol Toggle Info Parkir */}
                <div className="mb-4">
                <button
                    onClick={() => setShowParkingInfo(!showParkingInfo)}
                    className="w-full px-4 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center justify-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    {showParkingInfo ? "Sembunyikan" : "Tampilkan"} Info Parkir
                </button>
                </div>

              {/* Informasi Parkir Terlama */}
              {showParkingInfo && longestParkingSpots.length > 0 && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-bold text-green-700">10 Parkir Terlama</span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {longestParkingSpots.map((parking, index) => (
                      <div 
                        key={index} 
                        className="bg-white p-2 rounded border border-green-100 cursor-pointer hover:bg-green-50 transition-colors"
                        onClick={() => handleParkingClick(parking)}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-medium text-green-800">#{index + 1}</span>
                          <span className="text-xs font-bold text-green-600">
                            {formatParkingDuration(parking.duration)}
                          </span>
                        </div>
                        <div className="text-xs mt-1 text-gray-600">
                          {new Date(parking.point.time).toLocaleString()}
                        </div>
                        <div className="text-xs bg-green-100 p-1 rounded mt-1">
                          {parking.point.address || "Alamat tidak tersedia"}
                        </div>
                        <div className="text-xs bg-green-100 p-1 rounded mt-1">
                          {parking.point.latitude.toFixed(6)} - {parking.point.longitude.toFixed(6)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Di sidebar kanan, setelah informasi parkir */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-bold text-gray-700 mb-2">Ekspor Data</h3>
                <div className="space-y-2">
                    <button
                    onClick={exportToExcel}
                    className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition flex items-center justify-center"
                    disabled={points.length === 0}
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Data Tracking
                    </button>
                    
                    {longestParkingSpots.length > 0 && (
                    <button
                        onClick={exportParkingToExcel}
                        className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition flex items-center justify-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Data Parkir
                    </button>
                    )}
                </div>
                </div>
              
              {/* Status Bergerak */}
              {currentPoint && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Status {currentPoint.status}</div>
                  <div className="flex items-center">
                    <div className={`h-3 w-3 rounded-full mr-2 ${currentPoint.status === 'bergerak' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    <span className="text-lg font-bold">{currentPoint.speed} km/h</span>
                  </div>
                </div>
              )}              
            </div>
          </div>
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