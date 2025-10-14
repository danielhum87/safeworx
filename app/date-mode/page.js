'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EmergencyModal from '@/app/dashboard/EmergencyModal'

export default function DateModePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeDate, setActiveDate] = useState(null)
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [location, setLocation] = useState(null)
  
  const [formData, setFormData] = useState({
    dateName: '',
    venueName: '',
    venueAddress: '',
    scheduledTime: '',
    expectedEndTime: '',
    emergencyContactId: '',
    excuseTemplate: 'family_emergency'
  })

  const excuseTemplates = {
    family_emergency: "Hi! My sister just called - there's a family emergency. I need to leave right away. So sorry!",
    work_emergency: "Oh no, my boss just called. There's an urgent work issue I need to handle. I have to go!",
    friend_emergency: "My best friend just texted - they're having a crisis and need me. I'm so sorry, I have to leave.",
    sick_feeling: "I'm not feeling well suddenly. I think I need to go home. Sorry to cut this short!",
    pet_emergency: "The dog sitter just called - there's an issue with my dog. I need to go check on them!",
    custom: "Custom message (you'll type it when activating)"
  }

  useEffect(() => {
    checkUser()
    getLocation()
  }, [])

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

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }
    
    setUser(user)
    loadProfile(user.id)
    loadContacts(user.id)
    checkActiveDate(user.id)
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
      
      // Auto-select primary contact
      const primary = data?.find(c => c.is_primary)
      if (primary) {
        setFormData(prev => ({ ...prev, emergencyContactId: primary.id }))
      }
    } catch (err) {
      console.error('Error loading contacts:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkActiveDate = async (userId) => {
    const { data } = await supabase
      .from('dates')
      .select('*, emergency_contacts(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()
    
    if (data) {
      setActiveDate(data)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleActivate = async (e) => {
    e.preventDefault()
    
    if (contacts.length === 0) {
      alert('Please add emergency contacts first!')
      router.push('/contacts')
      return
    }

    setSaving(true)

    try {
      // Create date record
      const { data: dateData, error: dateError } = await supabase
        .from('dates')
        .insert([
          {
            user_id: user.id,
            date_name: formData.dateName,
            venue_name: formData.venueName,
            venue_address: formData.venueAddress,
            scheduled_time: formData.scheduledTime,
            expected_end_time: formData.expectedEndTime,
            emergency_contact_id: formData.emergencyContactId,
            excuse_template: excuseTemplates[formData.excuseTemplate],
            status: 'active'
          }
        ])
        .select('*, emergency_contacts(*)')
        .single()

      if (dateError) throw dateError

      setActiveDate(dateData)
      
      // Show success message
      alert('Date Mode activated! Your emergency contact has been notified.')

    } catch (err) {
      console.error('Error activating date mode:', err)
      alert('Failed to activate date mode: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEndDate = async () => {
    if (!confirm('Are you sure you&apos;re safe and want to end Date Mode?')) return

    try {
      const { error } = await supabase
        .from('dates')
        .update({ status: 'completed' })
        .eq('id', activeDate.id)

      if (error) throw error

      setActiveDate(null)
      alert('Date Mode ended. Glad you&apos;re safe!')
      
    } catch (err) {
      alert('Failed to end date mode: ' + err.message)
    }
  }

  const handleFakeCall = () => {
    if (!activeDate) return
    
    const excuse = activeDate.excuse_template
    alert(`Your emergency contact will call you now!\n\nThey'll say: "${excuse}"\n\n(In production, this triggers an actual call)`)
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

  // Active Date Screen
  if (activeDate) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">SafeWorx</span>
            </Link>
            <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900 font-medium text-sm">
              Logout
            </button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Active Status Banner */}
          <div className="bg-pink-500 text-white rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-4xl">💝</div>
                <div>
                  <h2 className="text-2xl font-bold">Date Mode Active</h2>
                  <p className="text-pink-100">You're protected</p>
                </div>
              </div>
              <div className="animate-pulse">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Date Details */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h3 className="font-bold text-xl mb-4">Date Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Meeting</p>
                <p className="font-semibold">{activeDate.date_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-semibold">{activeDate.venue_name}</p>
                <p className="text-sm text-gray-500">{activeDate.venue_address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-semibold">
                  {new Date(activeDate.scheduled_time).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Emergency Contact</p>
                <p className="font-semibold">{activeDate.emergency_contacts?.name}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Fake Call */}
            <button
              onClick={handleFakeCall}
              className="bg-blue-500 text-white rounded-2xl p-6 shadow-lg hover:bg-blue-600 transition-all"
            >
              <div className="text-4xl mb-2">📞</div>
              <h3 className="font-bold text-lg mb-1">Request Fake Call</h3>
              <p className="text-blue-100 text-sm">Get an excuse to leave</p>
            </button>

            {/* Emergency Alert */}
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="bg-red-500 text-white rounded-2xl p-6 shadow-lg hover:bg-red-600 transition-all w-full text-left"
            >
              <div className="text-4xl mb-2">🚨</div>
              <h3 className="font-bold text-lg mb-1">Emergency Alert</h3>
              <p className="text-red-100 text-sm">Send SOS immediately</p>
            </button>
          </div>

          {/* Your Excuse */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
            <p className="text-blue-900 text-sm font-semibold mb-1">Your Preset Excuse:</p>
            <p className="text-blue-800 text-sm">"{activeDate.excuse_template}"</p>
          </div>

          {/* End Date Mode */}
          <button
            onClick={handleEndDate}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-50"
          >
            ✓ I&apos;m Safe - End Date Mode
          </button>

          {/* Info */}
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Tip:</strong> Keep SafeWorx open in the background. Your emergency contact knows where you are and who you're with.
            </p>
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

  // Setup Date Mode Screen
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">SafeWorx</span>
          </Link>
          <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900 font-medium text-sm">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Date Mode</h1>
          <p className="text-gray-600 mt-2">
            Set up safety for your date - we'll notify your emergency contact and stay on standby
          </p>
        </div>

        {contacts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No Emergency Contacts
            </h2>
            <p className="text-gray-600 mb-6">
              Add at least one emergency contact before using Date Mode
            </p>
            <Link href="/contacts">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700">
                Add Emergency Contacts
              </button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleActivate} className="space-y-6">
            {/* Date Details Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-xl mb-4">Date Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Who are you meeting? *
                  </label>
                  <input
                    type="text"
                    name="dateName"
                    value={formData.dateName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Alex from Tinder"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue Name *
                  </label>
                  <input
                    type="text"
                    name="venueName"
                    value={formData.venueName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., The Rose & Crown"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="venueAddress"
                    value={formData.venueAddress}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 123 High Street, London"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="scheduledTime"
                      value={formData.scheduledTime}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected End Time
                    </label>
                    <input
                      type="datetime-local"
                      name="expectedEndTime"
                      value={formData.expectedEndTime}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Settings Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-xl mb-4">Safety Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact *
                  </label>
                  <select
                    name="emergencyContactId"
                    value={formData.emergencyContactId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select contact</option>
                    {contacts.map(contact => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} {contact.is_primary && '(Primary)'}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    They'll be notified when you activate Date Mode
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fake Call Excuse *
                  </label>
                  <select
                    name="excuseTemplate"
                    value={formData.excuseTemplate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {Object.entries(excuseTemplates).map(([key, value]) => (
                      <option key={key} value={key}>
                        {key === 'custom' ? 'Custom message' : key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Preview: "{excuseTemplates[formData.excuseTemplate]}"
                  </p>
                </div>
              </div>
            </div>

            {/* What Happens */}
            <div className="bg-pink-50 border-l-4 border-pink-500 p-4 rounded-r-lg">
              <p className="text-pink-900 font-semibold text-sm mb-2">What happens when you activate:</p>
              <ul className="text-pink-800 text-sm space-y-1">
                <li>• Your emergency contact receives all date details</li>
                <li>• You get quick access to fake call & emergency alert</li>
                <li>• Your location is tracked during the date</li>
                <li>• Auto check-in reminder at expected end time</li>
              </ul>
            </div>

            {/* Activate Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-pink-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-pink-600 disabled:opacity-50 transition-all"
            >
              {saving ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Activating...
                </span>
              ) : (
                '💝 Activate Date Mode'
              )}
            </button>
          </form>
        )}
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