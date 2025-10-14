// Format phone number to international format
export function formatPhoneNumber(phone) {
  if (!phone) return ''
  
  // Remove all spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '')
  
  // If already has +, return as is
  if (cleaned.startsWith('+')) {
    return cleaned
  }
  
  // If starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    return '+' + cleaned.slice(2)
  }
  
  // If starts with 0 (UK format), convert to +44
  if (cleaned.startsWith('0')) {
    return '+44' + cleaned.slice(1)
  }
  
  // If starts with 44 but no +, add it
  if (cleaned.startsWith('44')) {
    return '+' + cleaned
  }
  
  // Otherwise, assume UK and add +44
  return '+44' + cleaned
}

// Validate phone number format
export function isValidPhone(phone) {
  const formatted = formatPhoneNumber(phone)
  // Basic validation: must start with + and have 10-15 digits
  return /^\+\d{10,15}$/.test(formatted)
}