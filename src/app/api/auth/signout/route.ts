import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { captureException } from '@/lib/monitoring'

async function signout(request: Request) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
    const referer = request.headers.get('referer') ?? ''
    const dest = referer.includes('/admin') ? '/admin/login' : '/login'
    return NextResponse.redirect(new URL(dest, request.url))
  } catch (err) {
    captureException(err, { context: 'auth-signout' })
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export async function POST(request: Request) {
  return signout(request)
}

export async function GET(request: Request) {
  return signout(request)
}
