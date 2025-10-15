import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Handle email verification with token_hash
  if (token_hash && type) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.verifyOtp({ token_hash, type })
  }

  // If password recovery, redirect to update password page
  if (type === 'recovery') {
    return NextResponse.redirect(`${requestUrl.origin}/update-password`)
  }

  // Otherwise go to dashboard
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}