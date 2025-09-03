'use client';

import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/context/AuthContext';

// Define types for the API response (existing)
interface TrackingPoint {
  id: string;
  vehicle_id: number;
  no_pol: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: string;
  address: string;
  status: string;
  time: string;
  geojson: string;
}

interface TrackingData {
  success: boolean;
  vehicle_id: string;
  points: TrackingPoint[];
  track: {
    type: string;
    coordinates: number[][];
  };
}

// New type for last position API response
interface LastPositionData {
  success: boolean;
  data: Array<{
    id: string;
    vehicle_id: number;
    device_id: number;
    customer_id: number | null;
    no_pol: string;
    latitude: number;
    longitude: number;
    speed: number;
    time: string;
    course: number;
    engine_status: string | null;
    ignition_status: string;
    status: string;
    active: number;
    geofence: string;
    current_geofence_id: number;
    geofence_name: string;
    enter_time: string;
    out_time: string;
    address: string;
    weight: number | null;
    weight_persen: number | null;
    angle: number | null;
    odometer: number | null;
    total_odometer: number | null;
    fuel: number | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    geo_point: string;
    total_distance: number;
    geofence_status: string | null;
    hso_status: number;
    source_address: string;
    status_address: string | null;
    vendor_gps: string;
    distance: number;
    geom: string | null; // Changed from any to string | null
    group_id: number;
    protocol: string | null;
  }>;
}

// New type for vehicles API response
interface Vehicle {
  id: number;
  no_pol: string;
  // Add other vehicle properties if needed
}

interface VehiclesResponse {
  success: boolean;
  data: Vehicle[];
}

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

export default function GPSReportPage() {
  const { token } = useAuth();
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [lastPositionData, setLastPositionData] = useState<LastPositionData | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastPositionLoading, setLastPositionLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [reportType, setReportType] = useState('detail');

  // Fetch vehicles data on component mount
  const fetchVehicles = useCallback(async () => {
    if (!token) {
      alert('Anda harus login untuk mengakses data ini');
      return;
    }

    setVehiclesLoading(true);
    try {
      const response = await fetch(
        `https://demo.speedtrack.id/api/vehicles/select`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          alert('Token tidak valid atau telah kedaluwarsa. Silakan login kembali.');
          return;
        }
        throw new Error('Gagal mengambil data kendaraan');
      }
      
      const data: VehiclesResponse = await response.json();
      if (data.success) {
        setVehicles(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat mengambil data kendaraan');
    } finally {
      setVehiclesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]); // Added fetchVehicles to dependency array

  const fetchTrackingData = async () => {
    if (!selectedVehicle || !startDate || !endDate) {
      alert('Harap pilih kendaraan, tanggal mulai, dan tanggal akhir');
      return;
    }

    if (!token) {
      alert('Anda harus login untuk mengakses data ini');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://demo.speedtrack.id/api/histories/tracking?vehicleId=${selectedVehicle}&start=${startDate}&end=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          alert('Token tidak valid atau telah kedaluwarsa. Silakan login kembali.');
          return;
        }
        throw new Error('Gagal mengambil data tracking');
      }
      
      const data: TrackingData = await response.json();
      setTrackingData(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat mengambil data');
    } finally {
      setLoading(false);
    }
  };

  // New function to fetch last position data
  const fetchLastPosition = async () => {
    if (!token) {
      alert('Anda harus login untuk mengakses data ini');
      return;
    }

    setLastPositionLoading(true);
    try {
      const response = await fetch(
        `https://demo.speedtrack.id/api/traccars`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          alert('Token tidak valid atau telah kedaluwarsa. Silakan login kembali.');
          return;
        }
        throw new Error('Gagal mengambil data last position');
      }
      
      const data: LastPositionData = await response.json();
      setLastPositionData(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat mengambil data last position');
    } finally {
      setLastPositionLoading(false);
    }
  };

  // New function to download last position report
  const downloadLastPositionReport = () => {
    if (!lastPositionData || !lastPositionData.data) return;

    const excelData = lastPositionData.data.map(point => ({
      'No Polisi': point.no_pol,
      'Latitude': point.latitude,
      'Longitude': point.longitude,
      'Speed (km/h)': point.speed,
      'Course': point.course,
      'Alamat': point.address,
      'Status': point.status,
      'Status Mesin': point.engine_status,
      'Status Ignition': point.ignition_status,
      'Geofence': point.geofence_name,
      'Waktu Update': new Date(point.time).toLocaleString('id-ID'),
      'Tanggal Update': new Date(point.time).toLocaleDateString('id-ID'),
      'Jarak Total (km)': point.total_distance,
      'Vendor GPS': point.vendor_gps
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    const colWidths = [
      { width: 15 }, { width: 12 }, { width: 12 },
      { width: 15 }, { width: 10 }, { width: 40 },
      { width: 12 }, { width: 15 }, { width: 15 },
      { width: 20 }, { width: 15 }, { width: 20 },
      { width: 15 }, { width: 15 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Last Position');
    XLSX.writeFile(wb, `last_position_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Existing report functions (detail, summary, speed, parking, distance) remain the same
  const generateDetailReport = () => {
    if (!trackingData || !trackingData.points) return;

    const excelData = trackingData.points.map(point => ({
      'ID': point.id,
      'No Polisi': point.no_pol,
      'Latitude': point.latitude,
      'Longitude': point.longitude,
      'Speed (km/h)': point.speed,
      'Course': point.course,
      'Alamat': point.address,
      'Status': point.status,
      'Waktu': new Date(point.time).toLocaleString('id-ID'),
      'Tanggal': new Date(point.time).toLocaleDateString('id-ID')
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    const colWidths = [
      { width: 15 }, { width: 15 }, { width: 12 },
      { width: 12 }, { width: 15 }, { width: 10 },
      { width: 40 }, { width: 12 }, { width: 20 },
      { width: 15 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Detail Tracking');
    XLSX.writeFile(wb, `detail_tracking_${selectedVehicle}_${startDate}_to_${endDate}.xlsx`);
  };

  const generateSummaryReport = () => {
    if (!trackingData || !trackingData.points) return;

    const statusCount = {
      bergerak: 0,
      berhenti: 0,
      mati: 0
    };

    let totalSpeed = 0;
    let maxSpeed = 0;

    trackingData.points.forEach(point => {
      statusCount[point.status as keyof typeof statusCount] = (statusCount[point.status as keyof typeof statusCount] || 0) + 1;
      totalSpeed += point.speed;
      if (point.speed > maxSpeed) maxSpeed = point.speed;
    });

    const avgSpeed = totalSpeed / trackingData.points.length;

    const summaryData = [{
      'Kendaraan': trackingData.points[0]?.no_pol || 'N/A',
      'Periode': `${startDate} s/d ${endDate}`,
      'Total Data Points': trackingData.points.length,
      'Bergerak': statusCount.bergerak,
      'Berhenti': statusCount.berhenti,
      'Mati': statusCount.mati,
      'Kecepatan Rata-rata': `${avgSpeed.toFixed(2)} km/h`,
      'Kecepatan Maksimum': `${maxSpeed} km/h`
    }];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(summaryData);
    
    const colWidths = [
      { width: 20 }, { width: 25 }, { width: 18 },
      { width: 15 }, { width: 15 }, { width: 15 },
      { width: 25 }, { width: 25 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Summary Report');
    XLSX.writeFile(wb, `summary_report_${selectedVehicle}_${startDate}_to_${endDate}.xlsx`);
  };

  const generateSpeedReport = () => {
    if (!trackingData || !trackingData.points) return;

    // Filter points with speed > 0 and sort by speed descending
    const movingPoints = trackingData.points
      .filter(point => point.speed > 0)
      .sort((a, b) => b.speed - a.speed);

    const speedData = movingPoints.map(point => ({
      'Waktu': new Date(point.time).toLocaleString('id-ID'),
      'Tanggal': new Date(point.time).toLocaleDateString('id-ID'),
      'No Polisi': point.no_pol,
      'Speed (km/h)': point.speed,
      'Status': point.status,
      'Lokasi': point.address,
      'Latitude': point.latitude,
      'Longitude': point.longitude
    }));

    // Speed analysis summary
    const maxSpeed = Math.max(...movingPoints.map(p => p.speed));
    const avgSpeed = movingPoints.reduce((sum, p) => sum + p.speed, 0) / movingPoints.length;
    const speedViolations = movingPoints.filter(p => p.speed > 80).length; // Assuming 80 km/h as speed limit

    const summaryData = [{
      'Kendaraan': trackingData.points[0]?.no_pol || 'N/A',
      'Periode': `${startDate} s/d ${endDate}`,
      'Total Data Bergerak': movingPoints.length,
      'Kecepatan Maksimum': `${maxSpeed} km/h`,
      'Kecepatan Rata-rata': `${avgSpeed.toFixed(2)} km/h`,
      'Pelanggaran Kecepatan (>80 km/h)': speedViolations,
      'Persentase Pelanggaran': `${((speedViolations / movingPoints.length) * 100).toFixed(2)}%`
    }];

    const wb = XLSX.utils.book_new();
    
    // Add speed data sheet
    const wsData = XLSX.utils.json_to_sheet(speedData);
    XLSX.utils.book_append_sheet(wb, wsData, 'Data Kecepatan');
    
    // Add summary sheet
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Kecepatan');

    XLSX.writeFile(wb, `speed_report_${selectedVehicle}_${startDate}_to_${endDate}.xlsx`);
  };

  const generateParkingReport = () => {
    if (!trackingData || !trackingData.points) return;

    // Filter parking events (status berhenti or mati)
    const parkingEvents = trackingData.points.filter(point => 
      point.status === 'berhenti' || point.status === 'mati'
    );

    // Group parking events by location and calculate duration
    const parkingByLocation: { [key: string]: { count: number, totalDuration: number, lastTime: Date, address: string } } = {};

    for (let i = 0; i < parkingEvents.length - 1; i++) {
      const current = parkingEvents[i];
      const next = parkingEvents[i + 1];
      
      const locationKey = `${current.latitude.toFixed(6)},${current.longitude.toFixed(6)}`;
      const currentTime = new Date(current.time);
      const nextTime = new Date(next.time);
      const duration = (nextTime.getTime() - currentTime.getTime()) / 1000 / 60; // Duration in minutes

      if (duration > 5) { // Only consider parking longer than 5 minutes
        if (!parkingByLocation[locationKey]) {
          parkingByLocation[locationKey] = {
            count: 0,
            totalDuration: 0,
            lastTime: currentTime,
            address: current.address
          };
        }

        parkingByLocation[locationKey].count++;
        parkingByLocation[locationKey].totalDuration += duration;
        parkingByLocation[locationKey].lastTime = currentTime;
      }
    }

    // Convert to array for Excel
    const parkingData = Object.entries(parkingByLocation).map(([location, data]) => ({
      'Lokasi Parkir': data.address,
      'Koordinat': location,
      'Jumlah Parkir': data.count,
      'Total Durasi (menit)': Math.round(data.totalDuration),
      'Durasi Rata-rata (menit)': Math.round(data.totalDuration / data.count),
      'Terakhir Parkir': data.lastTime.toLocaleString('id-ID')
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(parkingData);
    
    const colWidths = [
      { width: 40 }, { width: 20 }, { width: 15 },
      { width: 20 }, { width: 25 }, { width: 20 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Parkir');
    XLSX.writeFile(wb, `parking_report_${selectedVehicle}_${startDate}_to_${endDate}.xlsx`);
  };

  const generateDailyDistanceReport = () => {
    if (!trackingData || !trackingData.points) return;

    // Group points by date
    const pointsByDate: { [date: string]: TrackingPoint[] } = {};
    
    trackingData.points.forEach(point => {
      const date = new Date(point.time).toLocaleDateString('id-ID');
      if (!pointsByDate[date]) {
        pointsByDate[date] = [];
      }
      pointsByDate[date].push(point);
    });

    // Calculate distance for each day
    const dailyData = Object.entries(pointsByDate).map(([date, points]) => {
      let totalDistance = 0;
      
      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        
        // Only calculate distance for moving points
        if (current.status === 'bergerak' && next.status === 'bergerak') {
          const distance = calculateDistance(
            current.latitude, current.longitude,
            next.latitude, next.longitude
          );
          totalDistance += distance;
        }
      }

      return {
        'Tanggal': date,
        'Jarak Tempuh (km)': totalDistance.toFixed(2),
        'Jumlah Data Points': points.length,
        'Points Bergerak': points.filter(p => p.status === 'bergerak').length,
        'Points Berhenti': points.filter(p => p.status === 'berhenti').length,
        'Points Mati': points.filter(p => p.status === 'mati').length
      };
    });

    // Calculate total distance
    const totalDistance = dailyData.reduce((sum, day) => sum + parseFloat(day['Jarak Tempuh (km)']), 0);

    const summaryData = [{
      'Kendaraan': trackingData.points[0]?.no_pol || 'N/A',
      'Periode': `${startDate} s/d ${endDate}`,
      'Total Jarak Tempuh (km)': totalDistance.toFixed(2),
      'Rata-rata Harian (km)': (totalDistance / dailyData.length).toFixed(2),
      'Jumlah Hari': dailyData.length
    }];

    const wb = XLSX.utils.book_new();
    
    // Add daily data sheet
    const wsDaily = XLSX.utils.json_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(wb, wsDaily, 'Data Harian');
    
    // Add summary sheet
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

    XLSX.writeFile(wb, `daily_distance_report_${selectedVehicle}_${startDate}_to_${endDate}.xlsx`);
  };

  const downloadReport = () => {
    switch (reportType) {
      case 'detail':
        generateDetailReport();
        break;
      case 'summary':
        generateSummaryReport();
        break;
      case 'speed':
        generateSpeedReport();
        break;
      case 'parking':
        generateParkingReport();
        break;
      case 'distance':
        generateDailyDistanceReport();
        break;
      default:
        generateDetailReport();
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '30px' }}>
        Laporan GPS Tracker
      </h1>
      
      {/* NEW CARD FOR LAST POSITION DOWNLOAD */}
      <div style={{ 
        backgroundColor: '#e8f5e9', 
        padding: '25px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginTop: 0, color: '#2e7d32' }}>Download Last Position</h2>
        <p style={{ color: '#555', marginBottom: '20px' }}>
          Download data posisi terakhir semua kendaraan tanpa filter.
        </p>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={fetchLastPosition}
            disabled={lastPositionLoading}
            style={{
              padding: '12px 20px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: lastPositionLoading ? 'not-allowed' : 'pointer',
              opacity: lastPositionLoading ? 0.7 : 1,
              minWidth: '120px'
            }}
          >
            {lastPositionLoading ? 'Memuat Data...' : 'Ambil Last Position'}
          </button>
          
          <button 
            onClick={downloadLastPositionReport}
            disabled={!lastPositionData}
            style={{
              padding: '12px 20px',
              backgroundColor: lastPositionData ? '#2e7d32' : '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: lastPositionData ? 'pointer' : 'not-allowed',
              minWidth: '150px'
            }}
          >
            Download Last Position
          </button>
        </div>

        {lastPositionData && lastPositionData.data && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ color: '#2e7d32' }}>Pratinjau Data Last Position</h3>
            <div style={{ 
              backgroundColor: 'white', 
              padding: '15px', 
              borderRadius: '8px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflowX: 'auto'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f8e9' }}>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>No Polisi</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Kecepatan</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Lokasi</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Update Terakhir</th>
                  </tr>
                </thead>
                <tbody>
                  {lastPositionData.data.slice(0, 5).map((point, index) => (
                    <tr key={index}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {point.no_pol}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: 
                            point.status === 'bergerak' ? '#2ecc71' : 
                            point.status === 'berhenti' ? '#f39c12' : '#e74c3c',
                          color: 'white'
                        }}>
                          {point.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {point.speed} km/h
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {point.address}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {new Date(point.time).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {lastPositionData.data.length > 5 && (
                <p style={{ textAlign: 'center', padding: '10px', color: '#7f8c8d' }}>
                  Menampilkan 5 dari {lastPositionData.data.length} kendaraan
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* EXISTING FILTER CARD FOR HISTORICAL DATA */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '25px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginTop: 0, color: '#34495e' }}>Filter Laporan Historis</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Pilih Kendaraan:
            </label>
            <select 
              value={selectedVehicle} 
              onChange={(e) => setSelectedVehicle(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
              disabled={vehiclesLoading}
            >
              <option value="">-- Pilih Kendaraan --</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.no_pol} (ID: {vehicle.id})
                </option>
              ))}
            </select>
            {vehiclesLoading && <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Memuat data kendaraan...</p>}
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Tipe Laporan:
            </label>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="detail">Laporan Detail</option>
              <option value="summary">Laporan Ringkasan</option>
              <option value="speed">Laporan Kecepatan</option>
              <option value="parking">Laporan Parkir</option>
              <option value="distance">Laporan Jarak Harian</option>
            </select>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Tanggal Mulai:
            </label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Tanggal Akhir:
            </label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={fetchTrackingData}
            disabled={loading || vehiclesLoading}
            style={{
              padding: '12px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (loading || vehiclesLoading) ? 'not-allowed' : 'pointer',
              opacity: (loading || vehiclesLoading) ? 0.7 : 1,
              minWidth: '120px'
            }}
          >
            {loading ? 'Memuat Data...' : 'Ambil Data Historis'}
          </button>
          
          <button 
            onClick={downloadReport}
            disabled={!trackingData}
            style={{
              padding: '12px 20px',
              backgroundColor: trackingData ? '#27ae60' : '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: trackingData ? 'pointer' : 'not-allowed',
              minWidth: '150px'
            }}
          >
            Download Excel
          </button>
        </div>
      </div>
      
      {/* Existing tracking data preview and statistics */}
      {trackingData && trackingData.points && (
        <div>
          <h2 style={{ color: '#34495e' }}>Pratinjau Data</h2>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflowX: 'auto',
            marginBottom: '20px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f2f6' }}>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Waktu</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Kecepatan</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Lokasi</th>
                </tr>
              </thead>
              <tbody>
                {trackingData.points.slice(0, 5).map((point, index) => (
                  <tr key={index}>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      {new Date(point.time).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: 
                          point.status === 'bergerak' ? '#2ecc71' : 
                          point.status === 'berhenti' ? '#f39c12' : '#e74c3c',
                        color: 'white'
                      }}>
                        {point.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      {point.speed} km/h
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      {point.address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {trackingData.points.length > 5 && (
              <p style={{ textAlign: 'center', padding: '10px', color: '#7f8c8d' }}>
                Menampilkan 5 dari {trackingData.points.length} data points
              </p>
            )}
          </div>

          {/* Statistics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0, color: '#34495e' }}>Statistik Umum</h3>
              <p>Total Data Points: <strong>{trackingData.points.length}</strong></p>
              <p>Bergerak: <strong>{trackingData.points.filter(p => p.status === 'bergerak').length}</strong></p>
              <p>Berhenti: <strong>{trackingData.points.filter(p => p.status === 'berhenti').length}</strong></p>
              <p>Mati: <strong>{trackingData.points.filter(p => p.status === 'mati').length}</strong></p>
            </div>

            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0, color: '#34495e' }}>Statistik Kecepatan</h3>
              <p>Kecepatan Maks: <strong>{Math.max(...trackingData.points.map(p => p.speed))} km/h</strong></p>
              <p>Kecepatan Rata-rata: <strong>{(trackingData.points.reduce((sum, p) => sum + p.speed, 0) / trackingData.points.length).toFixed(2)} km/h</strong></p>
              <p>Points Bergerak: <strong>{trackingData.points.filter(p => p.speed > 0).length}</strong></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}