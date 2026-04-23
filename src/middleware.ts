import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes publiques (pas d'auth requise)
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/cgu',
  '/confidentialite',
  '/auth/callback',
  '/auth/confirm',
  '/tarifs',
  '/api/stripe/webhook',
  '/api/auth/register',
  '/api/auth/signout',
]

// Routes réservées aux copropriétaires
const PORTAIL_ROUTES = [
  '/mon-compte',
  '/mes-charges',
  '/mes-documents',
  '/mes-travaux',
  '/mes-messages',
]

// Routes réservées aux syndics (owner/manager)
const SYNDIC_ROUTES = [
  '/dashboard',
  '/coproprietes',
  '/lots',
  '/documents',
  '/sinistres',
  '/assemblees',
  '/impayes',
  '/parametres',
  '/facturation',
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Autoriser les routes publiques AVANT de créer le client Supabase
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next({ request })
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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
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

  // Récupérer le rôle de l'utilisateur
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete')
    .eq('id', user.id)
    .single()

  const role = profile?.role

  // Onboarding obligatoire pour les nouveaux owners
  if (
    role === 'owner' &&
    !profile?.onboarding_complete &&
    !pathname.startsWith('/onboarding') &&
    !pathname.startsWith('/api/')
  ) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Copropriétaire essaie d'accéder aux routes syndic
  if (role === 'owner_resident' && SYNDIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/mes-charges', request.url))
  }

  // Syndic essaie d'accéder aux routes portail
  if (
    (role === 'owner' || role === 'manager') &&
    PORTAIL_ROUTES.some(r => pathname.startsWith(r))
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirection depuis la racine
  if (pathname === '/') {
    if (role === 'owner_resident') {
      return NextResponse.redirect(new URL('/mes-charges', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
