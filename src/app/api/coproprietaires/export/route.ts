/**
 * GET /api/coproprietaires/export
 *
 * Génère et retourne un fichier Excel (.xlsx) avec la liste complète
 * des copropriétaires du cabinet. Remplace l'ancienne export client-side
 * qui dépendait du package `xlsx` côté navigateur.
 */
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { withErrorHandler } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'

export const GET = withErrorHandler(async () => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id')
      .eq('id', user.id)
      .single()
    if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('coproprietaires')
      .select('prenom, nom, email, telephone, portail_actif, invitation_envoyee_at')
      .eq('cabinet_id', profile.cabinet_id)
      .order('nom')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Copropriétaires')

    ws.columns = [
      { header: 'Prénom',            key: 'prenom',    width: 18 },
      { header: 'Nom',               key: 'nom',       width: 18 },
      { header: 'Email',             key: 'email',     width: 32 },
      { header: 'Téléphone',         key: 'telephone', width: 16 },
      { header: 'Portail actif',     key: 'portail',   width: 14 },
      { header: 'Invitation envoyée', key: 'invitation', width: 20 },
    ]

    // Mettre en gras la ligne d'en-tête
    ws.getRow(1).font = { bold: true }

    for (const c of data ?? []) {
      ws.addRow({
        prenom:     c.prenom ?? '',
        nom:        c.nom ?? '',
        email:      c.email ?? '',
        telephone:  c.telephone ?? '',
        portail:    c.portail_actif ? 'Oui' : 'Non',
        invitation: c.invitation_envoyee_at
          ? new Date(c.invitation_envoyee_at).toLocaleDateString('fr-FR')
          : '',
      })
    }

    const buffer = await wb.xlsx.writeBuffer()
    const filename = `coproprietaires_${new Date().toISOString().slice(0, 10)}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    captureException(err, { context: 'coproprietaires-export' })
    return NextResponse.json({ error: 'Erreur lors de la génération du fichier' }, { status: 500 })
  }
})
