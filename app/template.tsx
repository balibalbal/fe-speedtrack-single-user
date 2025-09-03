// app/template.tsx
'use client'

import Navbar from '@/components/Navbar'
import Footer from "@/components/Footer"
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute' // Ubah import ini
import { usePathname } from 'next/navigation'

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'
  const isPublicPage = isLoginPage || pathname === '/register' || pathname === '/unauthorized'

  return (
    <AuthProvider>
      {/* Navbar tidak ditampilkan untuk halaman publik */}
      {!isPublicPage && <Navbar />}

      {/* Konten utama */}
      <main className={!isPublicPage ? 'p-6 mt-16' : ''}>
        {/* Hanya lindungi route yang non-public */}
        {!isPublicPage ? (
          <ProtectedRoute> 
            {children}
          </ProtectedRoute>
        ) : (
          children
        )}
      </main>

      {/* Footer tidak ditampilkan untuk halaman publik */}
      {!isPublicPage && <Footer />}
    </AuthProvider>
  )
}