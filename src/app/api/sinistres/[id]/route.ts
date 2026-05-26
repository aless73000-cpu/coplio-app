import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'
import { withErrorHandler } from '@/lib/api-handler'

type SinistreUpdate = Database['public']['Tables']['sinistres']['Update']

const ALLOWED_FIELDS = ['compagnie_assurance', 'numero_declaration_assurance', 'montant_sinistre', 'montant_indemnise', 'description', 'titre'] as const

export const PATCH = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

  const body = await request.json()
  const update: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) update[key] = body[key]
  }

  const admin = createAdminClient()

  // Vérifier que le sinistre appartient bien au cabinet avant d'écrire
  const { data: existing } = await admin
    .from('sinistres')
    .select('id, cabinet_id')
    .eq('id', id)
    .single()

  if (!existing || existing.cabinet_id !== profile.cabinet_id) {
    return NextResponse.json({ error: 'Non trouvé ou accès refusé' }, { status: 404 })
  }

  const { data, error } = await admin
    .from('sinistres')
    .update(update as SinistreUpdate)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
})