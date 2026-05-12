import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  nom: z.string().min(1),
  type_document: z.enum(['pv_ag', 'mandat', 'devis', 'contrat', 'autre']).default('autre'),
  copropriete_id: z.string().uuid().optional().nullable(),
  signataires: z.array(z.object({
    prenom: z.string(),
    nom: z.string(),
    email: z.string().email(),
  })).min(1),
  fichier_url: z.string().optional().nullable(),
})

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json([])

  const { searchParams } = new URL(request.url)
  const coproprieteId = searchParams.get('copropriete_id')

  let query = supabase
    .from('signatures')
    .select('*, copropriete:coproprietes(id, nom)')
    .eq('cabinet_id', profile.cabinet_id)
    .order('created_at', { ascending: false })

  if (coproprieteId) query = query.eq('copropriete_id', coproprieteId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const yousignKey = process.env.YOUSIGN_API_KEY
  const yousignBase = process.env.YOUSIGN_ENV === 'production'
    ? 'https://api.yousign.app/v3'
    : 'https://staging-api.yousign.app/v3'

  let yousignRequestId: string | null = null
  let lienSignature: string | null = null
  let statut = 'brouillon'

  // Créer la demande Yousign si clé disponible
  if (yousignKey && parsed.data.fichier_url) {
    try {
      // 1. Créer la signature request
      const srRes = await fetch(`${yousignBase}/signature_requests`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${yousignKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parsed.data.nom,
          delivery_mode: 'email',
          timezone: 'Europe/Paris',
        }),
      })
      const sr = await srRes.json()
      yousignRequestId = sr.id

      // 2. Uploader le document
      const docRes = await fetch(`${yousignBase}/signature_requests/${sr.id}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${yousignKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: parsed.data.nom, file_object: parsed.data.fichier_url, nature: 'signable_document' }),
      })
      const doc = await docRes.json()

      // 3. Ajouter les signataires
      for (const s of parsed.data.signataires) {
        const sigRes = await fetch(`${yousignBase}/signature_requests/${sr.id}/signers`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${yousignKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            info: { first_name: s.prenom, last_name: s.nom, email: s.email, locale: 'fr' },
            signature_level: 'electronic_signature',
            fields: [{ document_id: doc.id, type: 'signature', page: 1, x: 100, y: 700, width: 200, height: 50 }],
          }),
        })
        const signer = await sigRes.json()
        lienSignature = signer.signature_link ?? null
      }

      // 4. Activer la request
      await fetch(`${yousignBase}/signature_requests/${sr.id}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${yousignKey}` },
      })
      statut = 'en_attente'
    } catch {
      // Yousign failed — save as brouillon anyway
    }
  }

  const { data, error } = await supabase
    .from('signatures')
    .insert({
      cabinet_id: profile.cabinet_id,
      copropriete_id: parsed.data.copropriete_id ?? null,
      nom: parsed.data.nom,
      type_document: parsed.data.type_document,
      yousign_request_id: yousignRequestId,
      statut,
      signataires: parsed.data.signataires,
      fichier_url: parsed.data.fichier_url ?? null,
      lien_signature: lienSignature,
      created_by: user.id,
    })
    .select('*, copropriete:coproprietes(id, nom)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
