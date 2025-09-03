"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import MapComponent from "@/components/MapComponent"
import { Button } from "@/components/ui/Button"



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
}

// Interface untuk data filter
interface FilterForm {
  vehicle_id: string
  start_date: string
  end_date: string
}

export default function TrackingPage() {
  const { token } = useAuth()
  const [points, setPoints] = useState<Point[]>([])
  const [track, setTrack] = useState<Track | null>(null)
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState<any[]>([]) // State untuk daftar kendaraan

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State untuk form filter
  const [filters, setFilters] = useState<FilterForm>({
    vehicle_id: "",
    start_date: new Date().toISOString().split('T')[0], // Default: hari ini
    end_date: new Date().toISOString().split('T')[0]    // Default: hari ini
  })

  // data saat ini (untuk info di card)
  const currentPoint = useMemo(() => points[currentIndex], [points, currentIndex])
  const startPoint = points[0]
  const endPoint = points[points.length - 1]
  const [animatedPos, setAnimatedPos] = useState<[number, number] | null>(null)

  const [isLeftOpen, setIsLeftOpen] = useState(true)
  const [isRightOpen, setIsRightOpen] = useState(true)


  // Fetch daftar kendaraan saat komponen mount
  useEffect(() => {
    const fetchVehicles = async () => {
  try {
    // CEK NILAI TOKEN SEBELUM DIGUNAKAN
    console.log("Token yang digunakan:", token); 
    if (!token) {
      console.error("Token tidak ditemukan! Harap login terlebih dahulu.");
      return; // Hentikan eksekusi jika token tidak ada
    }

    const res = await fetch("http://localhost:3000/vehicles/select", {
      headers: {
        //"Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (data.success) {
      setVehicles(data.data || []);
    }
  } catch (err) {
    console.error("Error fetching vehicles:", err);
  }
};

    if (token) fetchVehicles()
  }, [token])

  // Fungsi untuk fetch data tracking dengan filter
  const fetchTracking = async (filterParams: FilterForm) => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (filterParams.vehicle_id) params.append('vehicleId', filterParams.vehicle_id)
      if (filterParams.start_date) params.append('start', filterParams.start_date)
      if (filterParams.end_date) params.append('end', filterParams.end_date)
      
      const res = await fetch(
        `http://localhost:3000/histories/tracking?${params.toString()}`,
        {
          headers: {
            // "Content-Type": "application/json",
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
      if (!next) return

      // hitung progress (0 -> 1)
      const duration = current.speed * 10 // bisa disesuaikan, atau berdasarkan speed
      const progress = Math.min((timestamp - startTime) / duration, 1)

      // linear interpolation lat & lng
      const lat = current.latitude + (next.latitude - current.latitude) * progress
      const lng = current.longitude + (next.longitude - current.longitude) * progress

      setAnimatedPos([lat, lng])

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      } else {
        // lanjut ke titik berikutnya
        setCurrentIndex((i) => Math.min(i + 1, points.length - 1))
        startTime = null
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frame)
  }, [isPlaying, currentIndex, points])


  return (
    <div className="flex h-screen">
      {/* Sidebar Kiri */}
      <div
        className={`relative bg-white shadow-lg transition-all duration-300 ${
          isLeftOpen ? "w-80" : "w-0"
        }`}
      >
        <div className={`${isLeftOpen ? "block" : "hidden"} p-4`}>
          <h2 className="font-bold mb-2">Filter Tracking</h2>
          {/* isi filter tracking */}
          
      
      <form onSubmit={handleFilterSubmit} className="space-y-4">
        {/* Pilih Kendaraan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plat Number
          </label>
          <select
            value={filters.vehicle_id}
            onChange={(e) => setFilters({...filters, vehicle_id: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            <option value="">Select Vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.no_pol}
              </option>
            ))}
          </select>
        </div>

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
          
          {/* Terapkan pakai component Button */}
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

        {/* Slider posisi */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>0</span>
            <span>Position: {currentIndex + 1}</span>
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
        <MapComponent points={points} track={track} currentIndex={currentIndex} />
      </div>

      {/* Sidebar Kanan */}
      <div
        className={`relative bg-white shadow-lg transition-all duration-300 ${
          isRightOpen ? "w-80" : "w-0"
        }`}
      >
        <div className={`${isRightOpen ? "block" : "hidden"} p-4`}>
          <h2 className="font-bold mb-2">Playback Info</h2>
          {/* isi panel kanan */}
          <div className="space-y-4">
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
                  </div>
                  <div className="pt-2">
                    <div className="text-xs text-gray-500 mb-1">Address:</div>
                    <div className="text-sm bg-gray-100 p-2 rounded">{currentPoint.address}</div>
                  </div>
                </>
              )}
            </div>
            
            {/* Status Bergerak */}
            {currentPoint && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Status {currentPoint.status}</div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-lg font-bold">{currentPoint.speed} km/h</span>
                </div>
              </div>
            )}
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