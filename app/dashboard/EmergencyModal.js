'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function EmergencyModal({ isOpen, onClose, user, profile, contacts, location }) {
  const [countdown, setCountdown] = useState(null)
  const [sending, setSending] = useState(false)
  const [alertSent, setAlertSent] = useState(false)

  useEffect(() => {
    if (countdown === null) return

    if (countdown === 0) {
      sendAlert()
      return
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown])

  const startCountdown = () => {
    setCountdown(5)
  }

  const cancelAlert = () => {
    setCountdown(null)
  }

  const sendAlert = async () => {
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
      onClose()
    } finally {
      setSending(false)
      setCountdown(null)
    }
  }

  const handleSafe = () => {
    setAlertSent(false)
    setCountdown(null)
    onClose()
  }

  if (!isOpen) return null

  // Success Screen
  if (alertSent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Alert Sent!</h2>
          <p className="text-gray-600 mb-4">
            Your emergency contacts have been notified:
          </p>
          <ul className="text-left bg-gray-50 rounded-lg p-4 mb-6 max-h-40 overflow-y-auto">
            {contacts.map(contact => (
              <li key={contact.id} className="text-gray-700 mb-2 flex items-center text-sm">
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
            onClick={handleSafe}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700"
          >
            I'm Safe Now
          </button>
        </div>
      </div>
    )
  }

  // Countdown Screen
  if (countdown !== null) {
    return (
      <div className="fixed inset-0 bg-red-600 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="text-9xl font-bold text-red-600 mb-4">
            {countdown}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Sending Alert...
          </h2>
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

  // Initial Warning Screen
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🚨</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Emergency Alert
          </h2>
          <p className="text-gray-600">
            This will notify all your emergency contacts
          </p>
        </div>

        {/* What will happen */}
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg mb-6">
          <p className="text-red-800 text-sm font-medium mb-2">
            What will happen:
          </p>
          <ul className="text-red-700 text-sm space-y-1">
            <li>• SMS sent to {contacts.length} contact(s)</li>
            <li>• Call to {contacts.find(c => c.is_primary)?.name || contacts[0]?.name}</li>
            <li>• Your location will be shared</li>
            <li>• 5-second countdown to cancel</li>
          </ul>
        </div>

        {/* Contacts list */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-32 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-600 mb-2">Will be notified:</p>
          {contacts.map(contact => (
            <div key={contact.id} className="flex items-center justify-between text-sm py-1">
              <span className="text-gray-700">{contact.name}</span>
              {contact.is_primary && (
                <span className="text-xs text-blue-600">Primary</span>
              )}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={startCountdown}
            disabled={sending}
            className="w-full bg-red-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 disabled:opacity-50"
          >
            🚨 SEND EMERGENCY ALERT
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}