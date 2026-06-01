// GET  → conversations du copropriétaire connecté
// POST → créer ou récupérer la conversation avec le syndic

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'

type Ctx =
  | { isTenant: false; coproprietaireId: string; cabinetId: string; gestionnaireId: string | null }
  | { isTenant: true; tenantId: string; cabinetId: string; gestionnaireId: string | null }

async function getContext(): Promise<Ctx | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  // Copropriétaire (a une fiche coproprietaires liée au profil)
  const { data: copro } = await admin
    .from('coproprietaires')
    .select('id, cabinet_id, copropriete:coproprietes(gestionnaire_id)')
    .eq('profile_id', user.id)
    .maybeSingle()
  if (copro) {
    const gestionnaireId = (copro.copropriete as { gestionnaire_id?: string | null } | null)?.gestionnaire_id ?? null
    return { isTenant: false, coproprietaireId: copro.id, cabinetId: copro.cabinet_id, gestionnaireId }
  }

  // Locataire (cabinet_id NULL → dérivé de sa copropriété)
  const { data: prof } = await admin
    .from('profiles')
    .select('role, lot:lots(copropriete:coproprietes(cabinet_id, gestionnaire_id))')
    .eq('id', user.id)
    .maybeSingle()
  if (prof?.role === 'tenant') {
    const cop = (prof.lot as { copropriete?: { cabinet_id?: string; gestionnaire_id?: string | null } | null } | null)?.copropriete
    if (cop?.cabinet_id) {
      return { isTenant: true, tenantId: user.id, cabinetId: cop.cabinet_id, gestionnaireId: cop.gestionnaire_id ?? null }
    }
  }
  return null
}

export const GET = withErrorHandler(async () => {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()
  let q = admin.from('conversations').select('id, sujet, derniere_activite')
  q = ctx.isTenant ? q.eq('tenant_id', ctx.tenantId) : q.eq('coproprietaire_id', ctx.coproprietaireId)
  const { data: convs, error } = await q.order('derniere_activite', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(convs ?? [])
})

export const POST = withErrorHandler(async () => {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()

  // Chercher une conversation existante
  let findQ = admin.from('conversations').select('id, sujet, derniere_activite')
  findQ = ctx.isTenant ? findQ.eq('tenant_id', ctx.tenantId) : findQ.eq('coproprietaire_id', ctx.coproprietaireId)
  const { data: existing } = await findQ.order('derniere_activite', { ascending: false }).limit(1).maybeSingle()

  if (existing) return NextResponse.json(existing)

  // Créer une nouvelle conversation
  const { data: created, error } = await admin
    .from('conversations')
    .insert({
      cabinet_id: ctx.cabinetId,
      coproprietaire_id: ctx.isTenant ? null : ctx.coproprietaireId,
      tenant_id: ctx.isTenant ? ctx.tenantId : null,
      gestionnaire_id: ctx.gestionnaireId,
      sujet: ctx.isTenant ? 'Message au syndic (locataire)' : 'Message au syndic',
      derniere_activite: new Date().toISOString(),
    })
    .select('id, sujet, derniere_activite')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(created, { status: 201 })
})
