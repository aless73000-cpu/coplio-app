import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/portail',
  '/forgot-password',
  '/reset-password',
  '/cgu',
  '/confidentialite',
  '/auth/callback',
  '/auth/confirm',
  '/tarifs',
  '/admin/login',
  '/api/stripe/webhook',
  '/api/auth/register',
  '/api/auth/signout',
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setAll(cookiesToSet: any[]) {
            cookiesToSet.forEach(({ name, value }: { name: string; value: string }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: object }) => supabaseResponse.cookies.set(name, value, options))
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setAll(cookiesToSet: any[]) {
            cookiesToSet.forEach(({ name, value }: { name: string; value: string }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: object }) => supabaseResponse.cookies.set(name, value, options))
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

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: object }) =>
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

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
