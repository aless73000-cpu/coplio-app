import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rateLimit, getIP, rateLimitResponse } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const ip = getIP(request)
  const limit = await rateLimit(`search:${ip}`, { max: 60, windowMs: 60 * 1000 })
  if (!limit.success) return rateLimitResponse(limit.resetAt)

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()

  if (!profile?.cabinet_id) return NextResponse.json({ results: [] })

  const cabinetId = profile.cabinet_id
  const search = `%${q}%`

  const [coproprietes, lots, profiles] = await Promise.all([
    supabase
      .from('coproprietes')
      .select('id, nom, adresse, ville')
      .eq('cabinet_id', cabinetId)
      .ilike('nom', search)
      .limit(5),

    supabase
      .from('lots')
      .select('id, numero, etage, copropriete:coproprietes!inner(id, nom, cabinet_id)')
      .eq('coproprietes.cabinet_id', cabinetId)
      .ilike('numero', search)
      .limit(5),

    supabase
      .from('profiles')
      .select('id, prenom, nom, email, lot_id')
      .eq('cabinet_id', cabinetId)
      .or(`prenom.ilike.${search},nom.ilike.${search},email.ilike.${search}`)
      .eq('role', 'owner_resident')
      .limit(5),
  ])

  const results = [
    ...(coproprietes.data ?? []).map((c) => ({
      type: 'copropriete' as const,
      id: c.id,
      label: c.nom,
      sub: [c.adresse, c.ville].filter(Boolean).join(', ') || 'Copropriété',
      href: `/coproprietes/${c.id}`,
    })),
    ...(lots.data ?? []).map((l) => ({
      type: 'lot' as const,
      id: l.id,
      label: `Lot ${l.numero}${l.etage ? ` — Étage ${l.etage}` : ''}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sub: (l.copropriete as any)?.nom ?? 'Lot',
      href: `/lots/${l.id}`,
    })),
    ...(profiles.data ?? []).map((p) => ({
      type: 'coproprietaire' as const,
      id: p.id,
      label: `${p.prenom ?? ''} ${p.nom ?? ''}`.trim(),
      sub: p.email ?? 'Copropriétaire',
      href: `/coproprietaires/${p.id}`,
    })),
  ]

  return NextResponse.json({ results })
}
