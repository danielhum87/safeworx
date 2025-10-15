'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ContactsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: ''
  })

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }
    
    setUser(user)
    loadContacts(user.id)
  }

  const loadContacts = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setContacts(data || [])
    } catch (err) {
      console.error('Error loading contacts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (!formData.name || !formData.phone) {
      setError('Name and phone number are required')
      setSaving(false)
      return
    }

    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .insert([
          {
            user_id: user.id,
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            relationship: formData.relationship,
            is_primary: contacts.length === 0 // First contact is primary
          }
        ])

      if (error) throw error

      // Reload contacts
      loadContacts(user.id)
      
      // Reset form
      setFormData({ name: '', phone: '', email: '', relationship: '' })
      setShowForm(false)
      
    } catch (err) {
      setError(err.message || 'Failed to add contact')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (contactId) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactId)

      if (error) throw error
      
      loadContacts(user.id)
    } catch (err) {
      alert('Failed to delete contact')
    }
  }

  const handleSetPrimary = async (contactId) => {
    try {
      // First, unset all primary contacts
      await supabase
        .from('emergency_contacts')
        .update({ is_primary: false })
        .eq('user_id', user.id)

      // Then set this one as primary
      const { error } = await supabase
        .from('emergency_contacts')
        .update({ is_primary: true })
        .eq('id', contactId)

      if (error) throw error
      
      loadContacts(user.id)
    } catch (err) {
      alert('Failed to set primary contact')
    }
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
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">HomeSafe</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900 font-medium text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Emergency Contacts</h1>
          <p className="text-gray-600 mt-2">
            Add people who will be notified when you need help
          </p>
        </div>

        {/* Add Contact Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 mb-6"
          >
            + Add Emergency Contact
          </button>
        )}

        {/* Add Contact Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add New Contact</h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setFormData({ name: '', phone: '', email: '', relationship: '' })
                  setError('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Smith"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="07700 900000 or +44 7700 900000"
                    required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                    Enter UK format (07xxx) or international (+447xxx)
                    </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship
                </label>
                <select
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select relationship</option>
                  <option value="partner">Partner/Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="friend">Friend</option>
                  <option value="colleague">Colleague</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Contact'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setFormData({ name: '', phone: '', email: '', relationship: '' })
                    setError('')
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Contacts List */}
        {contacts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-200">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Emergency Contacts Yet</h3>
            <p className="text-gray-600 mb-6">
              Add at least one person who can help you in an emergency
            </p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Add Your First Contact
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{contact.name}</h3>
                      {contact.is_primary && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-600">📞 {contact.phone}</p>
                      {contact.email && (
                        <p className="text-gray-600">✉️ {contact.email}</p>
                      )}
                      {contact.relationship && (
                        <p className="text-gray-500 text-sm capitalize">
                          {contact.relationship}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Menu - Mobile Optimized */}
                  <div className="flex flex-col space-y-2 ml-4">
                    {!contact.is_primary && (
                      <button
                        onClick={() => handleSetPrimary(contact.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
          <p className="text-blue-800 text-sm">
            <strong>Primary contact</strong> will be called first in an emergency. 
            Other contacts receive SMS alerts with your location.
          </p>
        </div>
      </main>
    </div>
  )
}