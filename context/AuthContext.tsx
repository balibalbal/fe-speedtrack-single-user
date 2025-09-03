// contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Permission {
  id: string
  name: string
  description: string
}

interface User {
  id: string
  name: string
  email: string
  user_type: number
  status: string
  akses: string
  settings: any
  created_at: string
  is_superuser?: boolean
  role?: string
  permissions: Permission[] | string[]
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
  isSuperUser: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Fungsi untuk mengecek permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    
    // Super user memiliki semua permission
    if (user.is_superuser) return true
    
    // Cek jika user memiliki permission yang diminta
    if (Array.isArray(user.permissions)) {
      return user.permissions.some((p: Permission | string) => 
        typeof p === 'string' ? p === permission : p.name === permission
      )
    }
    
    return false
  }

  // Fungsi untuk mengecek role
  const hasRole = (role: string): boolean => {
    return user?.role === role || user?.is_superuser === true
  }

  // Fungsi untuk mengecek super user
  const isSuperUser = (): boolean => {
    return user?.is_superuser === true
  }

  // 🔹 Restore token & user saat reload
  useEffect(() => {
  const storedToken = localStorage.getItem('token');
  console.log('Stored token:', storedToken);
  
  if (!storedToken) {
    setLoading(false);
    return;
  }

  setToken(storedToken);

  const fetchUserData = async () => {
    try {
      console.log('Fetching user data with token');
      const res = await fetch('https://demo.speedtrack.id/api/auth/me', {
        headers: { 
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json'
        },
      });
      
      console.log('Auth check response status:', res.status);
      
      if (res.status === 401) {
        // Token tidak valid atau expired
        console.log('Token invalid or expired, clearing storage');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Auth check response data:', data);
      
      if (data.success) {
        console.log('User data fetched successfully:', data.data);
        setUser(data.data);
      } else {
        console.warn("Server returned unsuccessful response");
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error("Gagal fetch user:", err);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  fetchUserData();
}, []);


  const login = async (email: string, password: string): Promise<boolean> => {
  try {
    console.log('Attempting login with:', { email });
    
    const res = await fetch('https://demo.speedtrack.id/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('Login response status:', res.status);
    
    // Handle 401 Unauthorized
    if (res.status === 401) {
      console.log('Login failed: Invalid credentials');
      return false;
    }
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log('Login response data:', data);

    if (data.success && data.data && data.data.user && data.data.token) {
      console.log('Login successful, user:', data.data.user);
      setUser(data.data.user);
      setToken(data.data.token);
      localStorage.setItem('token', data.data.token);
      
      // Redirect setelah state diupdate
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
      
      return true;
    } else {
      console.log('Login failed, invalid response format:', data);
      return false;
    }
  } catch (err) {
    console.error('Login error:', err);
    return false;
  }
};


  const logout = () => {
    // Panggil API logout jika diperlukan
    fetch('http://demo.speedtrack.id:4000/api/auth/logout', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    }).catch(err => console.error('Logout API error:', err))
    
    // Clear state dan localStorage
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    router.push('/login')
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    loading,
    hasPermission,
    hasRole,
    isSuperUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}