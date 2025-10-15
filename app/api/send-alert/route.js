import { NextResponse } from 'next/server'
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioNumber = process.env.TWILIO_PHONE_NUMBER

const client = twilio(accountSid, authToken)

export async function POST(request) {
  try {
    const { contacts, userName, userPhone, latitude, longitude } = await request.json()

    if (!contacts || contacts.length === 0) {
      return NextResponse.json(
        { error: 'No emergency contacts provided' },
        { status: 400 }
      )
    }

    console.log('Sending alerts to:', contacts.length, 'contacts')
    console.log('User:', userName, userPhone)
    console.log('Location:', latitude, longitude)

    // Create Google Maps link for location
    const locationLink = latitude && longitude 
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : 'Location unavailable'

    // Send SMS to all contacts
    const smsPromises = contacts.map(async (contact) => {
      const message = `🚨 EMERGENCY ALERT from ${userName}!\n\nThey need help NOW!\n\nLocation: ${locationLink}\n\nCall them: ${userPhone || 'No phone provided'}\n\nThis is an automated HomeSafe emergency alert.`

      try {
        const result = await client.messages.create({
          body: message,
          from: twilioNumber,
          to: contact.phone
        })
        console.log('SMS sent to', contact.name, '- SID:', result.sid)
        return { success: true, contact: contact.name, sid: result.sid }
      } catch (err) {
        console.error(`Failed to send SMS to ${contact.name}:`, err.message)
        return { success: false, contact: contact.name, error: err.message }
      }
    })

    // Find primary contact for phone call
    const primaryContact = contacts.find(c => c.is_primary) || contacts[0]

    // Make call to primary contact
    let callResult = null
    if (primaryContact) {
      try {
        const call = await client.calls.create({
          twiml: `<Response><Say voice="alice">Emergency alert! ${userName} has triggered an emergency alert and needs help immediately. Please check your messages for their location and call them back right away.</Say></Response>`,
          to: primaryContact.phone,
          from: twilioNumber
        })
        console.log('Call made to', primaryContact.name, '- SID:', call.sid)
        callResult = { success: true, contact: primaryContact.name, callSid: call.sid }
      } catch (err) {
        console.error(`Failed to call ${primaryContact.name}:`, err.message)
        callResult = { success: false, contact: primaryContact.name, error: err.message }
      }
    }

    const smsResults = await Promise.all(smsPromises)

    console.log('All alerts sent!')
    console.log('SMS Results:', smsResults)
    console.log('Call Result:', callResult)

    return NextResponse.json({
      success: true,
      smsResults,
      callResult,
      message: `Alert sent to ${contacts.length} contact(s)`
    })

  } catch (error) {
    console.error('Error in send-alert API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send alert' },
      { status: 500 }
    )
  }
}