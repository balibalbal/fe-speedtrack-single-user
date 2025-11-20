'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import LoadingSpinner from '@/components/ui/LoadingSpinner'

// Define types for the API response
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
  gps_time: string;
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

// Colors for charts
const STATUS_COLORS = {
  bergerak: '#2ecc71',
  berhenti: '#f39c12',
  mati: '#e74c3c'
};

export default function GPSChartsPage() {
  const { token } = useAuth();
  const [selectedVehicle, setSelectedVehicle] = useState('39');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState('speed');
  const [timeRange, setTimeRange] = useState('7days');

  // Set default dates
  useEffect(() => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
  }, []);

  const fetchTrackingData = useCallback(async () => {
    if (!selectedVehicle || !startDate || !endDate) {
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
  }, [selectedVehicle, startDate, endDate, token]);

  // Auto-fetch data when dates change
  useEffect(() => {
    if (startDate && endDate) {
      fetchTrackingData();
    }
  }, [startDate, endDate, timeRange, fetchTrackingData]);

  // Process data for charts
  const getStatusData = () => {
    if (!trackingData?.points) return [];
    
    const statusCount = {
      bergerak: 0,
      berhenti: 0,
      mati: 0
    };

    trackingData.points.forEach(point => {
      const statusKey = point.status as keyof typeof statusCount;
      if (statusCount[statusKey] !== undefined) {
        statusCount[statusKey]++;
      }
    });

    return [
      { name: 'Bergerak', value: statusCount.bergerak, color: STATUS_COLORS.bergerak },
      { name: 'Berhenti', value: statusCount.berhenti, color: STATUS_COLORS.berhenti },
      { name: 'Mati', value: statusCount.mati, color: STATUS_COLORS.mati }
    ];
  };

  const getSpeedData = () => {
    if (!trackingData?.points) return [];
    
    const movingPoints = trackingData.points.filter(point => point.speed > 0);
    
    // Group by speed ranges
    const speedRanges = [
      { range: '0-20 km/h', count: 0, min: 0, max: 20 },
      { range: '21-40 km/h', count: 0, min: 21, max: 40 },
      { range: '41-60 km/h', count: 0, min: 41, max: 60 },
      { range: '61-80 km/h', count: 0, min: 61, max: 80 },
      { range: '81-100 km/h', count: 0, min: 81, max: 100 },
      { range: '>100 km/h', count: 0, min: 101, max: Infinity }
    ];

    movingPoints.forEach(point => {
      for (const range of speedRanges) {
        if (point.speed >= range.min && point.speed <= range.max) {
          range.count++;
          break;
        }
      }
    });

    return speedRanges.map(range => ({
      name: range.range,
      count: range.count
    }));
  };

  const getDailyActivityData = () => {
    if (!trackingData?.points) return [];
    
    const dailyData: { [key: string]: { date: string, moving: number, stopped: number, off: number } } = {};
    
    trackingData.points.forEach(point => {
      const date = new Date(point.gps_time).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit'
      });
      
      if (!dailyData[date]) {
        dailyData[date] = { date, moving: 0, stopped: 0, off: 0 };
      }
      
      if (point.status === 'bergerak') dailyData[date].moving++;
      if (point.status === 'berhenti') dailyData[date].stopped++;
      if (point.status === 'mati') dailyData[date].off++;
    });

    return Object.values(dailyData).sort((a, b) => {
      const [dayA, monthA] = a.date.split('/');
      const [dayB, monthB] = b.date.split('/');
      return new Date(`2024-${monthA}-${dayA}`).getTime() - new Date(`2024-${monthB}-${dayB}`).getTime();
    });
  };

  const getHourlyActivityData = () => {
    if (!trackingData?.points) return [];
    
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      count: 0
    }));

    trackingData.points.forEach(point => {
      const hour = new Date(point.gps_time).getHours();
      hourlyData[hour].count++;
    });

    return hourlyData;
  };

  const getTopLocationsData = () => {
    if (!trackingData?.points) return [];
    
    const locationCount: { [key: string]: number } = {};
    
    trackingData.points.forEach(point => {
      const simplifiedAddress = point.address.split(',')[0]; // Take only the first part of address
      locationCount[simplifiedAddress] = (locationCount[simplifiedAddress] || 0) + 1;
    });

    return Object.entries(locationCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  };

  const getSpeedTrendData = () => {
    if (!trackingData?.points) return [];
    
    const movingPoints = trackingData.points
      .filter(point => point.speed > 0)
      .sort((a, b) => new Date(a.gps_time).getTime() - new Date(b.gps_time).getTime());

    // Sample every 10th point for trend
    return movingPoints
      .filter((_, index) => index % 10 === 0)
      .map((point, index) => ({
        index,
        speed: point.speed,
        time: new Date(point.gps_time).toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));
  };

  // Render different charts based on selection
  const renderChart = () => {
    if (!trackingData?.points) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          color: '#7f8c8d'
        }}>
          {loading ? (
            <>
              <LoadingSpinner />
            </>
          ) : (
            'Refresh Data'
          )}
        </div>
      );
    }

    switch (chartType) {
      case 'status':
        return renderStatusChart();
      case 'speed':
        return renderSpeedChart();
      case 'daily':
        return renderDailyActivityChart();
      case 'hourly':
        return renderHourlyActivityChart();
      case 'locations':
        return renderLocationsChart();
      case 'trend':
        return renderSpeedTrendChart();
      default:
        return renderStatusChart();
    }
  };

  const renderStatusChart = () => {
    const data = getStatusData();
    return (
      <div style={{ height: '400px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50' }}>
          Distribusi Status Kendaraan
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              label={({ name, value, percent }) => 
                `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`
              }
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderSpeedChart = () => {
    const data = getSpeedData();
    return (
      <div style={{ height: '400px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50' }}>
          Distribusi Kecepatan Kendaraan
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3498db" name="Jumlah Data Points" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderDailyActivityChart = () => {
    const data = getDailyActivityData();
    return (
      <div style={{ height: '400px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50' }}>
          Aktivitas Harian Kendaraan
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="moving" stackId="a" fill={STATUS_COLORS.bergerak} name="Bergerak" />
            <Bar dataKey="stopped" stackId="a" fill={STATUS_COLORS.berhenti} name="Berhenti" />
            <Bar dataKey="off" stackId="a" fill={STATUS_COLORS.mati} name="Mati" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderHourlyActivityChart = () => {
    const data = getHourlyActivityData();
    return (
      <div style={{ height: '400px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50' }}>
          Aktivitas per Jam
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="count" fill="#8884d8" stroke="#8884d8" name="Data Points" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderLocationsChart = () => {
    const data = getTopLocationsData();
    return (
      <div style={{ height: '400px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50' }}>
          8 Lokasi Paling Sering Dikunjungi
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={100} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#82ca9d" name="Jumlah Kunjungan" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderSpeedTrendChart = () => {
    const data = getSpeedTrendData();
    return (
      <div style={{ height: '400px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50' }}>
          Trend Kecepatan Over Time
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="speed" 
              stroke="#e74c3c" 
              strokeWidth={2}
              name="Kecepatan (km/h)" 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Statistics cards
  const renderStatistics = () => {
    if (!trackingData?.points) return null;

    const totalPoints = trackingData.points.length;
    const movingPoints = trackingData.points.filter(p => p.status === 'bergerak').length;
    const stoppedPoints = trackingData.points.filter(p => p.status === 'berhenti').length;
    const offPoints = trackingData.points.filter(p => p.status === 'mati').length;
    
    const movingSpeeds = trackingData.points.filter(p => p.speed > 0).map(p => p.speed);
    const avgSpeed = movingSpeeds.length > 0 
      ? (movingSpeeds.reduce((a, b) => a + b, 0) / movingSpeeds.length).toFixed(1)
      : '0';
    const maxSpeed = movingSpeeds.length > 0 ? Math.max(...movingSpeeds) : 0;

    const stats = [
      { title: 'Total Data Points', value: totalPoints, color: '#3498db', icon: '📊' },
      { title: 'Bergerak', value: movingPoints, color: '#2ecc71', icon: '🚗' },
      { title: 'Berhenti', value: stoppedPoints, color: '#f39c12', icon: '🅿️' },
      { title: 'Mati', value: offPoints, color: '#e74c3c', icon: '🔌' },
      { title: 'Rata-rata Kecepatan', value: `${avgSpeed} km/h`, color: '#9b59b6', icon: '📈' },
      { title: 'Kecepatan Maks', value: `${maxSpeed} km/h`, color: '#e67e22', icon: '⚡' }
    ];

    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '15px', 
        marginBottom: '30px' 
      }}>
        {stats.map((stat, index) => (
          <div key={index} style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>{stat.icon}</div>
            <h3 style={{ 
              margin: '0 0 10px 0', 
              color: stat.color,
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {stat.title}
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: '24px', 
              fontWeight: 'bold',
              color: '#2c3e50'
            }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '30px' }}>
        📈 Dashboard Grafik GPS Tracker
      </h1>
      
      {/* Filters */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '25px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginTop: 0, color: '#34495e' }}>Filter Data</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Kendaraan:
            </label>
            <select 
              value={selectedVehicle} 
              onChange={(e) => setSelectedVehicle(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="39">B 9236 J (ID: 39)</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Jenis Grafik:
            </label>
            <select 
              value={chartType} 
              onChange={(e) => setChartType(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="status">Status Kendaraan</option>
              <option value="speed">Distribusi Kecepatan</option>
              <option value="daily">Aktivitas Harian</option>
              <option value="hourly">Aktivitas per Jam</option>
              <option value="locations">Lokasi Terbanyak</option>
              <option value="trend">Trend Kecepatan</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Rentang Waktu:
            </label>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="7days">7 Hari Terakhir</option>
              <option value="30days">30 Hari Terakhir</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
        
        {timeRange === 'custom' && (
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
        )}
        
        <button 
          onClick={fetchTrackingData}
          disabled={loading}
          style={{
            padding: '12px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Memuat Data...' : 'Refresh Data'}
        </button>
      </div>

      {/* Statistics */}
      {renderStatistics()}

      {/* Chart */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        {renderChart()}
      </div>

      {/* Additional Info */}
      {trackingData && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, color: '#7f8c8d' }}>
            Data periode: {startDate} hingga {endDate} • {trackingData.points.length} data points • 
            Kendaraan: {trackingData.points[0]?.no_pol || 'N/A'}
          </p>
        </div>
      )}
    </div>
  );
}