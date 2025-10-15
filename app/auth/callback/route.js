import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // If password recovery, redirect to update password page
  if (type === 'recovery') {
    return NextResponse.redirect(`${requestUrl.origin}/update-password`)
  }

  // Otherwise go to dashboard
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}