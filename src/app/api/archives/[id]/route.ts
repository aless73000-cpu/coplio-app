import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Vérifier la rétention légale
  const { data: archive } = await supabase.from('archives').select('retention_jusqu_au').eq('id', params.id).single()
  if (archive && new Date(archive.retention_jusqu_au) > new Date()) {
    return NextResponse.json({ error: `Document sous rétention légale jusqu'au ${new Date(archive.retention_jusqu_au).toLocaleDateString('fr-FR')}` }, { status: 403 })
  }

  await supabase.from('archives').delete().eq('id', params.id)
  return NextResponse.json({ ok: true })
}
