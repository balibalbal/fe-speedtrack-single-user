"use client"

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect, useState, useRef } from "react"

interface Point {
  id: string
  latitude: number
  longitude: number
  course: number
  status: string
  time: string
  no_pol?: string
  speed?: number
  address?: string
}

interface Track {
  type: string
  coordinates: number[][]
}

// Komponen untuk mengontrol pusat peta
function MapCenterController({ 
  currentPoint, 
  followMode,
  selectedLocation
}: { 
  currentPoint: Point | undefined
  followMode: boolean
  selectedLocation: Point | null
}) {
  const map = useMap()
  
  useEffect(() => {
    if (currentPoint && followMode) {
      map.setView([currentPoint.latitude, currentPoint.longitude], map.getZoom(), {
        animate: true,
        duration: 1
      })
    }
  }, [currentPoint, map, followMode])
  
  // Effect untuk menangani selectedLocation
  useEffect(() => {
    if (selectedLocation) {
      map.setView([selectedLocation.latitude, selectedLocation.longitude], 16, {
        animate: true,
        duration: 1
      })
    }
  }, [selectedLocation, map])
  
  return null
}

// Komponen untuk menampilkan marker lokasi terpilih
function SelectedLocationMarker({ 
  selectedLocation, 
  selectedLocationType 
}: { 
  selectedLocation: Point | null
  selectedLocationType: 'highest_speed' | 'parking' | null
}) {
  if (!selectedLocation) return null;
  
  // Tentukan ikon berdasarkan jenis lokasi
  let iconUrl = "https://tunasmuda.mtrack.co.id/backend/assets/img/illustrations/default.png";
  let iconSize: [number, number] = [32, 32];
  
  if (selectedLocationType === 'highest_speed') {
    iconUrl = "https://tunasmuda.mtrack.co.id/backend/assets/img/illustrations/on.png"; // atau ikon khusus kecepatan
    iconSize = [40, 40]; // Sedikit lebih besar untuk menonjolkan
  } else if (selectedLocationType === 'parking') {
    iconUrl = "https://tunasmuda.mtrack.co.id/backend/assets/img/illustrations/off.png"; // atau ikon khusus parkir
    iconSize = [36, 36];
  }
  
  const selectedIcon = new L.Icon({
    iconUrl,
    iconSize,
    iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
    popupAnchor: [0, -iconSize[1] / 2],
  });
  
  return (
    <Marker position={[selectedLocation.latitude, selectedLocation.longitude]} icon={selectedIcon}>
      <Popup>
        <div className="text-center">
          <strong>
            {selectedLocationType === 'highest_speed' ? '🚀 Kecepatan Tertinggi' : 
             selectedLocationType === 'parking' ? '🅿️ Parkir Terlama' : 'Lokasi Terpilih'}
          </strong>
          {selectedLocation.no_pol && <p><strong>No. Pol:</strong> {selectedLocation.no_pol}</p>}
          <p><strong>Waktu:</strong> {new Date(selectedLocation.time).toLocaleString()}</p>
          {selectedLocation.speed && <p><strong>Kecepatan:</strong> {selectedLocation.speed} km/h</p>}
          {selectedLocation.address && <p><strong>Alamat:</strong> {selectedLocation.address}</p>}
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapComponent({
  points,
  track,
  currentIndex,
  selectedLocation = null,
  selectedLocationType = null
}: {
  points: Point[]
  track: Track | null
  currentIndex: number
  selectedLocation?: Point | null
  selectedLocationType?: 'highest_speed' | 'parking' | null
}) {
  const [followMode, setFollowMode] = useState(true)
  const mapRef = useRef<L.Map | null>(null)
  
  const trackCoords: [number, number][] =
    track?.coordinates.map((c) => [c[1], c[0]] as [number, number]) || []

  const startPoint = points[0]
  const endPoint = points[points.length - 1]
  const currentPoint = points[currentIndex]

  // Fungsi untuk membuat icon dengan rotasi berdasarkan course
  const createRotatedIcon = (course: number) => {
    return new L.DivIcon({
      html: `
        <div style="
          transform: rotate(${course}deg);
          transform-origin: center;
          transition: transform 0.5s ease;
          width: 32px;
          height: 32px;
        ">
          <img 
            src="https://tunasmuda.mtrack.co.id/backend/assets/img/illustrations/on.png" 
            style="width: 100%; height: 100%;"
            alt="vehicle"
          />
        </div>
      `,
      className: 'custom-rotated-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  // Custom icon untuk titik awal (start)
  const startIcon = new L.Icon({
    iconUrl: "https://tunasmuda.mtrack.co.id/backend/assets/img/illustrations/default.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })

  // Custom icon untuk titik akhir (end)
  const endIcon = new L.Icon({
    iconUrl: "https://tunasmuda.mtrack.co.id/backend/assets/img/illustrations/off.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={
          startPoint ? [startPoint.latitude, startPoint.longitude] : [-4.635999982445299, 119.46826466098305]
        }
        zoom={4}
        scrollWheelZoom={true}
        className="w-full h-full rounded-xl shadow"
        ref={(map) => {
          if (map) {
            mapRef.current = map;
            map.getContainer().style.zIndex = "0";
          }
        }}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Controller untuk mengatur pusat peta */}
        <MapCenterController 
          currentPoint={currentPoint} 
          followMode={followMode} 
          selectedLocation={selectedLocation}
        />

        {/* Marker untuk lokasi yang dipilih (kecepatan tertinggi atau parkir) */}
        <SelectedLocationMarker 
          selectedLocation={selectedLocation} 
          selectedLocationType={selectedLocationType} 
        />

        {/* Marker Awal dengan icon kustom */}
        {startPoint && (
          <Marker 
            position={[startPoint.latitude, startPoint.longitude]}
            icon={startIcon}
          >
            <Popup>
              <div className="text-center">
                <strong>Titik Awal</strong>
                <p>Waktu: {new Date(startPoint.time).toLocaleString()}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marker Akhir dengan icon kustom */}
        {endPoint && (
          <Marker 
            position={[endPoint.latitude, endPoint.longitude]}
            icon={endIcon}
          >
            <Popup>
              <div className="text-center">
                <strong>Titik Akhir</strong>
                <p>Waktu: {new Date(endPoint.time).toLocaleString()}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Garis tracking */}
        {trackCoords.length > 0 && <Polyline positions={trackCoords} color="blue" />}

        {/* Marker kendaraan bergerak dengan rotasi */}
        {currentPoint && (
          <Marker
            position={[currentPoint.latitude, currentPoint.longitude]}
            icon={createRotatedIcon(currentPoint.course)}
          >
            <Popup>
              <div className="text-center">
                <p><strong>Status:</strong> {currentPoint.status}</p>
                <p><strong>Waktu:</strong> {new Date(currentPoint.time).toLocaleString()}</p>
                <p><strong>Course:</strong> {currentPoint.course}°</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Tombol toggle follow mode */}
      <div 
        className="absolute bottom-2 left-12 z-[1000] bg-white p-2 rounded-lg shadow-lg"
        style={{ zIndex: 1000 }}
      >
        <button
          onClick={() => setFollowMode(!followMode)}
          className={`px-4 py-2 rounded-md transition-colors ${
            followMode 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          {followMode ? '🎯 Follow Mode ON' : '🔓 Follow Mode OFF'}
        </button>
        
        {/* Status indicator */}
        <div className="mt-2 text-xs text-center text-gray-600">
          {followMode ? 'Peta mengikuti kendaraan' : 'Peta bebas digeser'}
        </div>
      </div>

      {/* Indikator lokasi terpilih */}
      {selectedLocation && (
        <div className="absolute top-4 right-4 z-[1000] bg-white p-3 rounded-lg shadow-lg max-w-xs">
          <div className="font-bold mb-1">
            {selectedLocationType === 'highest_speed' ? '🚀 Kecepatan Tertinggi' : 
             selectedLocationType === 'parking' ? '🅿️ Parkir Terlama' : 'Lokasi Terpilih'}
          </div>
          {selectedLocation.no_pol && <div><strong>No. Pol:</strong> {selectedLocation.no_pol}</div>}
          <div><strong>Waktu:</strong> {new Date(selectedLocation.time).toLocaleString()}</div>
          {selectedLocation.speed && <div><strong>Kecepatan:</strong> {selectedLocation.speed} km/h</div>}
          <button 
            onClick={() => setFollowMode(false)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
          >
            Nonaktifkan Follow Mode
          </button>
        </div>
      )}
    </div>
  )
}