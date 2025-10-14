'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EmergencyModal from './EmergencyModal'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [contacts, setContacts] = useState([])
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)

  useEffect(() => {
    checkUser()
    getLocation()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }
    
    setUser(user)
    loadProfile(user.id)
    loadContacts(user.id)
  }

  const loadProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    setProfile(data)
  }

  const loadContacts = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })

      if (error) throw error
      setContacts(data || [])
    } catch (err) {
      console.error('Error loading contacts:', err)
    } finally {
      setLoading(false)
    }
  }

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  const handleEmergencyClick = () => {
    if (contacts.length === 0) {
      if (confirm('You need to add emergency contacts first. Go to contacts page?')) {
        router.push('/contacts')
      }
      return
    }
    setShowEmergencyModal(true)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">SafeWorx</span>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900 font-medium text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back!
          </h1>
          <p className="text-gray-600">
            {user?.email}
          </p>
        </div>

        {/* Quick Actions - Mobile First Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Emergency Button - NOW CLICKABLE! */}
          <button
            onClick={handleEmergencyClick}
            className="bg-red-500 rounded-2xl p-6 text-white shadow-lg hover:bg-red-600 transition-all transform hover:scale-105 active:scale-95"
          >
            <div className="text-4xl mb-3">🚨</div>
            <h3 className="font-bold text-xl mb-2">Emergency Alert</h3>
            <p className="text-red-100 text-sm mb-4">
              Send alert to all contacts
            </p>
            <div className="w-full bg-white text-red-500 py-3 rounded-lg font-semibold text-center">
              Tap for Help
            </div>
          </button>

          {/* Emergency Contacts */}
          <Link href="/contacts" className="block">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 h-full hover:border-gray-300 transition-all">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="font-bold text-xl mb-2">Emergency Contacts</h3>
              <p className="text-gray-600 text-sm mb-4">
                {contacts.length} contact{contacts.length !== 1 ? 's' : ''} added
              </p>
              <div className="w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-semibold text-center hover:bg-gray-200">
                Manage Contacts
              </div>
            </div>
          </Link>

          {/* Date Mode */}
          <Link href="/date-mode" className="block">
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 h-full hover:border-gray-300 transition-all">
    <div className="text-4xl mb-3">💝</div>
    <h3 className="font-bold text-xl mb-2">Date Mode</h3>
    <p className="text-gray-600 text-sm mb-4">
      Set up safety for your date
    </p>
    <div className="w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-semibold text-center hover:bg-gray-200">
      Setup Date
    </div>
  </div>
</Link>

          {/* Check-In Timer */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="text-4xl mb-3">⏰</div>
            <h3 className="font-bold text-xl mb-2">Check-In Timer</h3>
            <p className="text-gray-600 text-sm mb-4">
              Set automatic safety check-ins
            </p>
            <button className="w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-200">
              Start Timer
            </button>
          </div>

          {/* Venue Map */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="text-4xl mb-3">🗺️</div>
            <h3 className="font-bold text-xl mb-2">Verified Venues</h3>
            <p className="text-gray-600 text-sm mb-4">
              Find safe places nearby
            </p>
            <button className="w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-200">
              View Map
            </button>
          </div>

                    <Link href="/settings" className="block">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 h-full hover:border-gray-300 transition-all">
                <div className="text-4xl mb-3">⚙️</div>
                <h3 className="font-bold text-xl mb-2">Settings</h3>
                <p className="text-gray-600 text-sm mb-4">
                Manage your account
                </p>
                <div className="w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-semibold text-center hover:bg-gray-200">
                Settings
                </div>
            </div>
            </Link>
        </div>

        {/* Status Info */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Location Status */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            {location ? (
              <div className="flex items-center text-green-600">
                <span className="text-2xl mr-3">✓</span>
                <div>
                  <p className="font-semibold text-sm">Location Enabled</p>
                  <p className="text-xs text-gray-500">Ready for emergencies</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center text-yellow-600">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <p className="font-semibold text-sm">Location Disabled</p>
                  <p className="text-xs text-gray-500">Enable for better safety</p>
                </div>
              </div>
            )}
          </div>

          {/* Contacts Status */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            {contacts.length > 0 ? (
              <div className="flex items-center text-green-600">
                <span className="text-2xl mr-3">✓</span>
                <div>
                  <p className="font-semibold text-sm">{contacts.length} Contact{contacts.length !== 1 ? 's' : ''} Ready</p>
                  <p className="text-xs text-gray-500">Emergency system active</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <p className="font-semibold text-sm">No Contacts</p>
                  <p className="text-xs text-gray-500">Add contacts to activate</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Emergency Modal */}
      <EmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        user={user}
        profile={profile}
        contacts={contacts}
        location={location}
      />
    </div>
  )
}