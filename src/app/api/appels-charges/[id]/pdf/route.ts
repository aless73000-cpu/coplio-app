import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { captureException } from '@/lib/monitoring'
import { rateLimit, getIP, rateLimitResponse } from '@/lib/rate-limit'

function euro(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}
function date(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const ip = getIP(_request)
  const limit = rateLimit(`pdf:${ip}`, { max: 20, windowMs: 60 * 60 * 1000 })
  if (!limit.success) return rateLimitResponse(limit.resetAt)

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id, cabinet:cabinets(nom, adresse, code_postal, ville, telephone, email_contact, siret)')
      .eq('id', user.id)
      .single()

    if (!profile?.cabinet_id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const { data: appel } = await supabase
      .from('appels_charges')
      .select(`
        *,
        lot:lots(id, numero, type, etage, surface, tantiemes,
          coproprietaire:profiles(prenom, nom, email)
        ),
        copropriete:coproprietes(id, nom, adresse, code_postal, ville, cabinet_id)
      `)
      .eq('id', params.id)
      .single()

    if (!appel) return NextResponse.json({ error: 'Appel introuvable' }, { status: 404 })

    // Sécurité : vérifier que l'appel appartient au cabinet
    const copropriete = appel.copropriete as { cabinet_id?: string; nom?: string; adresse?: string; code_postal?: string; ville?: string } | null
    if (copropriete?.cabinet_id !== profile.cabinet_id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const cabinet = profile.cabinet as { nom?: string; adresse?: string; code_postal?: string; ville?: string; telephone?: string; email_contact?: string; siret?: string } | null
    const lot = appel.lot as { numero?: string; type?: string; etage?: string; surface?: number; tantiemes?: number; coproprietaire?: { prenom?: string; nom?: string; email?: string } | null } | null
    const proprio = lot?.coproprietaire as { prenom?: string; nom?: string; email?: string } | null

    // ── Génération PDF ────────────────────────────────────────────
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = 210
    const margin = 20

    // En-tête cabinet (haut gauche)
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    doc.setFont('helvetica', 'bold')
    doc.text(cabinet?.nom ?? 'Cabinet syndic', margin, 20)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    if (cabinet?.adresse) doc.text(cabinet.adresse, margin, 26)
    if (cabinet?.code_postal || cabinet?.ville) doc.text(`${cabinet?.code_postal ?? ''} ${cabinet?.ville ?? ''}`.trim(), margin, 31)
    if (cabinet?.telephone) doc.text(`Tél : ${cabinet.telephone}`, margin, 36)
    if (cabinet?.email_contact) doc.text(cabinet.email_contact, margin, 41)
    if (cabinet?.siret) doc.text(`SIRET : ${cabinet.siret}`, margin, 46)

    // Destinataire (haut droite)
    const destX = 130
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    if (proprio?.prenom || proprio?.nom) {
      doc.text(`${proprio?.prenom ?? ''} ${proprio?.nom ?? ''}`.trim(), destX, 20)
    } else {
      doc.text('Copropriétaire', destX, 20)
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)
    if (copropriete?.adresse) doc.text(copropriete.adresse, destX, 26)
    if (copropriete?.code_postal || copropriete?.ville) {
      doc.text(`${copropriete?.code_postal ?? ''} ${copropriete?.ville ?? ''}`.trim(), destX, 31)
    }

    // Ligne séparatrice
    doc.setDrawColor(220, 220, 220)
    doc.line(margin, 55, pageW - margin, 55)

    // Titre
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 110, 86) // coplio-green
    doc.text('AVIS D\'APPEL DE CHARGES', pageW / 2, 68, { align: 'center' })

    // Sous-titre
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`Référence : ${params.id.slice(0, 8).toUpperCase()}`, pageW / 2, 75, { align: 'center' })

    // Infos copropriété + lot
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.setFont('helvetica', 'bold')
    doc.text('Copropriété', margin, 88)
    doc.setFont('helvetica', 'normal')
    doc.text(copropriete?.nom ?? '—', margin + 32, 88)

    doc.setFont('helvetica', 'bold')
    doc.text('Lot', margin, 95)
    doc.setFont('helvetica', 'normal')
    const lotInfo = [
      `N° ${lot?.numero ?? '—'}`,
      lot?.etage ? `Étage ${lot.etage}` : null,
      lot?.surface ? `${lot.surface} m²` : null,
      lot?.tantiemes ? `${lot.tantiemes} / 10 000 tantièmes` : null,
    ].filter(Boolean).join(' · ')
    doc.text(lotInfo, margin + 32, 95)

    // Tableau montants
    autoTable(doc, {
      startY: 108,
      margin: { left: margin, right: margin },
      head: [['Désignation', 'Période', 'Montant']],
      body: [
        [
          appel.libelle || 'Appel de charges',
          appel.date_echeance ? `Échéance : ${date(appel.date_echeance)}` : '—',
          euro(appel.montant),
        ],
        ...((appel.montant_paye ?? 0) > 0 ? [
          ['Acompte versé', '—', `- ${euro(appel.montant_paye ?? 0)}`],
        ] : []),
      ],
      foot: [[
        { content: 'SOLDE À RÉGLER', colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } },
        { content: euro(appel.montant - (appel.montant_paye ?? 0)), styles: { fontStyle: 'bold', textColor: appel.paye ? [15, 110, 86] : [220, 50, 50] } },
      ]],
      headStyles: { fillColor: [15, 110, 86], textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 2: { halign: 'right', cellWidth: 35 } },
    })

    const tableEnd = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

    // Statut
    if (appel.paye) {
      doc.setFillColor(220, 250, 235)
      doc.setDrawColor(15, 110, 86)
      doc.roundedRect(margin, tableEnd, pageW - margin * 2, 12, 3, 3, 'FD')
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 110, 86)
      doc.text('✓  Cet appel de charges est entièrement réglé.', pageW / 2, tableEnd + 8, { align: 'center' })
    } else {
      // Instructions de paiement
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.text('Merci de régler ce montant avant la date d\'échéance indiquée ci-dessus.', margin, tableEnd + 6)
      doc.text('Pour tout renseignement, contactez votre syndic.', margin, tableEnd + 12)
    }

    // Pied de page
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Document généré le ${date(new Date().toISOString())} par Coplio — ${cabinet?.nom ?? ''}`,
      pageW / 2,
      285,
      { align: 'center' }
    )

    const buffer = Buffer.from(doc.output('arraybuffer'))
    const filename = `avis_appel_charges_lot${lot?.numero ?? 'X'}_${params.id.slice(0, 8)}.pdf`

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    captureException(err, { context: 'appels-charges-pdf' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
