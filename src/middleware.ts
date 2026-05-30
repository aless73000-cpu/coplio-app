import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { rateLimit, getIP, rateLimitResponse } from '@/lib/rate-limit'

const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/portail',
  '/forgot-password',
  '/reset-password',
  '/cgu',
  '/confidentialite',
  '/mentions-legales',
  '/offline',
  '/auth/callback',
  '/auth/confirm',
  '/tarifs',
  '/admin/login',
  '/api/stripe/webhook',
  '/api/auth/register',
  '/api/auth/signout',
  '/api/health',
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Landing page : toujours accessible, mais redirige si "Rester connecté" était coché
  if (pathname === '/') {
    const persistCookie = request.cookies.get('coplio_persist')?.value
    if (!persistCookie) return NextResponse.next({ request })

    // Cookie présent → vérifier la session et rediriger vers le bon espace
    let supabaseResponse = NextResponse.next({ request })
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2]))
          },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const dest = profile?.role === 'owner_resident' ? '/accueil' : '/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    // Cookie présent mais session expirée → nettoyer le cookie et afficher la landing
    const res = NextResponse.next({ request })
    res.cookies.set('coplio_persist', '', { path: '/', maxAge: 0 })
    return res
  }

  // Page portail : redirige les copropriétaires déjà connectés vers leur espace
  if (pathname === '/portail') {
    const persistCookie = request.cookies.get('coplio_persist')?.value
    if (!persistCookie) return NextResponse.next({ request })

    let supabaseResponse = NextResponse.next({ request })
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2]))
          },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return NextResponse.redirect(new URL('/accueil', request.url))
    return supabaseResponse
  }

  // Autoriser les routes publiques sans vérification
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next({ request })
  }

  // Rate limiting sur les méthodes d'écriture des routes API (POST/PUT/PATCH/DELETE)
  const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']
  if (pathname.startsWith('/api/') && WRITE_METHODS.includes(request.method)) {
    const ip = getIP(request)
    const limit = await rateLimit(`api-write:${ip}`, { max: 60, windowMs: 60_000 })
    if (!limit.success) return rateLimitResponse(limit.resetAt)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Pas connecté → rediriger vers login
  if (!user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 2FA : vérifier que le niveau d'assurance est suffisant
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1') {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('mfa_required', '1')
    return NextResponse.redirect(redirectUrl)
  }

  // Séparation portail / syndic : un copropriétaire qui tente d'accéder
  // à une route syndic est redirigé vers son espace (/accueil)
  const PORTAIL_PREFIXES = [
    '/accueil', '/mes-', '/mon-', '/signaler', '/espace-conseil',
  ]
  const isPortailRoute = PORTAIL_PREFIXES.some(p => pathname.startsWith(p))

  if (!isPortailRoute && !pathname.startsWith('/api/')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'owner_resident') {
      return NextResponse.redirect(new URL('/accueil', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
