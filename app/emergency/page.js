'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EmergencyPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [contacts, setContacts] = useState([])
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [alertSent, setAlertSent] = useState(false)

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

  const startCountdown = () => {
    setCountdown(5)
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          sendAlert()
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  const cancelAlert = () => {
    setCountdown(null)
  }

  const sendAlert = async () => {
    if (contacts.length === 0) {
      alert('Please add emergency contacts first!')
      router.push('/contacts')
      return
    }

    setSending(true)

    try {
      // Save alert to database
      const { data: alertData, error: alertError } = await supabase
        .from('alerts')
        .insert([
          {
            user_id: user.id,
            alert_type: 'emergency',
            latitude: location?.latitude,
            longitude: location?.longitude,
            status: 'active'
          }
        ])
        .select()
        .single()

      if (alertError) throw alertError

      // Send SMS and make call via API
      const response = await fetch('/api/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts,
          userName: profile?.full_name || user.email,
          userPhone: profile?.phone || '',
          latitude: location?.latitude,
          longitude: location?.longitude
        })
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error)

      // Save notification records
      for (const contact of contacts) {
        await supabase
          .from('alert_notifications')
          .insert([
            {
              alert_id: alertData.id,
              contact_id: contact.id,
              notification_type: 'sms',
              delivered: true
            }
          ])
      }

      setAlertSent(true)

    } catch (err) {
      console.error('Error sending alert:', err)
      alert('Failed to send alert: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  const resolveAlert = async () => {
    setAlertSent(false)
    router.push('/dashboard')
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

  if (alertSent) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Alert Sent!
          </h1>
          <p className="text-gray-600 mb-2">
            Your emergency contacts have been notified:
          </p>
          <ul className="text-left bg-gray-50 rounded-lg p-4 mb-6">
            {contacts.map(contact => (
              <li key={contact.id} className="text-gray-700 mb-2 flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                {contact.name} - {contact.phone}
                {contact.is_primary && <span className="ml-2 text-xs text-blue-600">(Called)</span>}
              </li>
            ))}
          </ul>
          {location && (
            <p className="text-sm text-gray-500 mb-6">
              📍 Location shared: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </p>
          )}
          <button
            onClick={resolveAlert}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700"
          >
            I'm Safe Now
          </button>
        </div>
      </div>
    )
  }

  if (countdown !== null) {
    return (
      <div className="min-h-screen bg-red-600 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-9xl font-bold text-red-600 mb-4">
            {countdown}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Sending Alert...
          </h1>
          <p className="text-gray-600 mb-6">
            Emergency alert will be sent to {contacts.length} contact(s)
          </p>
          <button
            onClick={cancelAlert}
            className="w-full bg-gray-200 text-gray-900 py-4 rounded-lg font-semibold hover:bg-gray-300 text-lg"
          >
            CANCEL
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">SafeWorx</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 inline-block">
            ← Back to Dashboard
          </Link>
        </div>

        {contacts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No Emergency Contacts
            </h2>
            <p className="text-gray-600 mb-6">
              You need to add at least one emergency contact before you can send alerts.
            </p>
            <Link href="/contacts">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700">
                Add Emergency Contacts
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Emergency Button */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Emergency Alert
                </h1>
                <p className="text-gray-600">
                  Press and hold the button below if you need help
                </p>
              </div>

              {/* THE BIG RED BUTTON */}
              <div className="flex justify-center mb-6">
                <button
                  onClick={startCountdown}
                  disabled={sending}
                  className="w-64 h-64 bg-red-600 hover:bg-red-700 rounded-full shadow-2xl flex flex-col items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <div className="text-7xl mb-2">🚨</div>
                  <div className="text-2xl font-bold">SOS</div>
                  <div className="text-sm mt-2">Tap for Help</div>
                </button>
              </div>

              {/* Info */}
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg">
                <p className="text-red-800 text-sm font-medium mb-1">
                  What happens when you press this button:
                </p>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• 5-second countdown to cancel accidentally</li>
                  <li>• SMS sent to all {contacts.length} emergency contact(s)</li>
                  <li>• Phone call to {contacts.find(c => c.is_primary)?.name || contacts[0]?.name} (primary contact)</li>
                  <li>• Your live location is shared</li>
                </ul>
              </div>
            </div>

            {/* Contacts List */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4">
                Who will be notified:
              </h3>
              <div className="space-y-3">
                {contacts.map(contact => (
                  <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-600">{contact.phone}</p>
                    </div>
                    {contact.is_primary && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                        Will be called
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <Link href="/contacts" className="block mt-4 text-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                Manage Contacts →
              </Link>
            </div>

            {/* Location Status */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-lg mb-2">Location Status</h3>
              {location ? (
                <div className="flex items-center text-green-600">
                  <span className="text-2xl mr-2">✓</span>
                  <div>
                    <p className="font-semibold">Location enabled</p>
                    <p className="text-sm text-gray-600">
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center text-yellow-600">
                  <span className="text-2xl mr-2">⚠️</span>
                  <div>
                    <p className="font-semibold">Location unavailable</p>
                    <p className="text-sm text-gray-600">
                      Enable location services for better emergency response
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}