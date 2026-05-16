import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const referer = request.headers.get('referer') ?? ''
  const dest = referer.includes('/admin') ? '/admin/login' : '/login'
  return NextResponse.redirect(new URL(dest, request.url))
}

// GET removed — GET /signout is a CSRF vector (triggered by <img>, <link>, etc.)
// All logout buttons must use POST.
