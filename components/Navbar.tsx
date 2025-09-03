'use client'

import { Bell, UserCircle, LogOut, Menu, X, Settings, ChevronDown, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Image from "next/image"

export default function Navbar() {
  const pathname = usePathname()
  const { logout, user } = useAuth() 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMasterOpen, setIsMasterOpen] = useState(false)
  const [isMonitoringOpen, setIsMonitoringOpen] = useState(false)

  const profileRef = useRef<HTMLDivElement>(null)
  const masterRef = useRef<HTMLDivElement>(null)
  const monitoringRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    setIsProfileOpen(false)
  }

  const menu = [
    { name: 'Report', href: '/report' },
    { name: 'Grafik', href: '/grafik' },
    { name: 'Users', href: '/users' },
  ]

  const masterMenu = [
    { name: 'Vehicle', href: '/master/vehicle' },
    { name: 'Device', href: '/master/device' },
    { name: 'Group', href: '/master/group' },
    { name: 'Geofence', href: '/master/geofence' },
  ]

  const monitoringMenu = [
    { name: 'Monitoring Vehicle', href: '/monitoring' },
    { name: 'Historical', href: '/tracking' },
  ]

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
  const toggleProfileMenu = () => setIsProfileOpen(!isProfileOpen)
  const toggleMasterMenu = () => setIsMasterOpen(!isMasterOpen)
  const toggleMonitoringMenu = () => setIsMonitoringOpen(!isMonitoringOpen)

  // Close dropdown if click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
      if (masterRef.current && !masterRef.current.contains(event.target as Node)) {
        setIsMasterOpen(false)
      }
      if (monitoringRef.current && !monitoringRef.current.contains(event.target as Node)) {
        setIsMonitoringOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="bg-white shadow-md fixed w-full top-0 z-50">
      {/* Hapus container di sini, langsung gunakan flex layout */}
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Logo and Desktop Menu */}
        <div className="flex items-center">
          <Link 
            href="/" 
            className="flex-shrink-0 flex items-center gap-2 text-xl text-blue-600"
          >
            <Image
              src="/images/logo/speed-track-logo.png"
              alt="Logo"
              width={150}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          <div className="hidden md:flex md:ml-10 md:space-x-6">
            {/* Master Dropdown */}
            <div className="relative" ref={masterRef}>
              <button
                onClick={toggleMasterMenu}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith('/master')
                    ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                Master
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isMasterOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isMasterOpen && (
                <div
                  className="absolute mt-2 w-56 bg-white rounded-2xl shadow-lg ring-1 ring-black/5 z-20
                             transform origin-top animate-scale-fade"
                >
                  {masterMenu.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-gray-700 
                                 hover:bg-blue-50 hover:text-blue-600 
                                 rounded-lg transition-colors duration-200"
                      onClick={() => setIsMasterOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Monitoring Dropdown */}
            <div className="relative" ref={monitoringRef}>
              <button
                onClick={toggleMonitoringMenu}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith('/monitoring')
                    ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                Monitoring
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isMonitoringOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isMonitoringOpen && (
                <div
                  className="absolute mt-2 w-56 bg-white rounded-2xl shadow-lg ring-1 ring-black/5 z-20
                             transform origin-top animate-scale-fade"
                >
                  {monitoringMenu.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-gray-700 
                                 hover:bg-blue-50 hover:text-blue-600 
                                 rounded-lg transition-colors duration-200"
                      onClick={() => setIsMonitoringOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            
            {menu.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  pathname === item.href
                    ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-500'
                } px-3 py-2 text-sm font-medium`}
              >
                {item.name}
              </Link>
            ))}
            
          </div>
        </div>

        {/* Right side items */}
        <div className="hidden md:flex md:items-center md:gap-4">
          <button className="relative p-1">
            <Bell className="h-6 w-6 text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
              3
            </span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={toggleProfileMenu}
              className="flex items-center text-gray-600 hover:text-blue-600"
            >
              <UserCircle className="h-8 w-8" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg ring-1 ring-black/5 animate-scale-fade">
                {/* Header dengan nama user dan ikon */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span>{user?.name || 'Guest'}</span>
                  </div>
                  {user?.email && (
                    <div className="text-xs text-gray-500 mt-1">
                      {user.email.toLowerCase()}
                    </div>
                  )}
                </div>
                
                {/* Menu Profile dengan ikon */}
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-2"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <User className="h-4 w-4" /> Profile
                </Link>
                
                {/* Menu Settings dengan ikon */}
                <Link
                  href="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-2"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                
                {/* Menu Logout dengan ikon */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-md flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            onClick={toggleMobileMenu}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-blue-500 focus:outline-none"
          >
            {isMobileMenuOpen ? (
              <X className="block h-6 w-6" />
            ) : (
              <Menu className="block h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg animate-scale-fade">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* Mobile Master Menu */}
            <div className="px-3 py-2">
              <button
                onClick={toggleMasterMenu}
                className="flex items-center justify-between w-full text-gray-600 hover:text-blue-500"
              >
                <span>Master</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isMasterOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isMasterOpen && (
                <div className="pl-4 mt-2 space-y-2">
                  {masterMenu.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-500 rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Monitoring Menu */}
            <div className="px-3 py-2">
              <button
                onClick={toggleMonitoringMenu}
                className="flex items-center justify-between w-full text-gray-600 hover:text-blue-500"
              >
                <span>Monitoring</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isMonitoringOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isMonitoringOpen && (
                <div className="pl-4 mt-2 space-y-2">
                  {monitoringMenu.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-500 rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {menu.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-600 font-semibold block'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-blue-500'
                } block px-3 py-2 rounded-md text-base font-medium`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            
            {/* Mobile bottom menu items */}
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-5 gap-4 mb-3">
                <UserCircle className="h-10 w-10 text-gray-600" />
                <div className="text-sm font-medium text-gray-800">{user?.name || 'Guest'}</div>
              </div>
              <div className="flex flex-col space-y-2 px-5">
                <Link
                  href="/profile"
                  className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-red-600 hover:bg-gray-100 px-3 py-2 rounded-md flex items-center gap-2 text-left"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}