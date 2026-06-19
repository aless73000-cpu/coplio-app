import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { requireCabinetUser } from '@/lib/api-handler'

function euro(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0)
}
function dateFr(s: string | null | undefined) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

interface FactureRow {
  numero: string | null
  objet: string
  periode_type: string
  periode_label: string | null
  date_emission: string
  date_echeance: string | null
  montant_ht: number
  taux_tva: number
  montant_tva: number
  montant_ttc: number
  statut: string
  notes: string | null
  copropriete: { nom?: string; adresse?: string; code_postal?: string; ville?: string } | null
}

// GET /api/factures-honoraires/[id]/pdf — génère la facture en PDF
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { supabase, cabinetId } = auth
  const db = supabase as unknown as SupabaseClient

  const { data: cabinet } = await db
    .from('cabinets')
    .select('nom, adresse, code_postal, ville, telephone, email_contact, siret')
    .eq('id', cabinetId)
    .single()

  const { data: f } = await db
    .from('factures_honoraires')
    .select('*, copropriete:coproprietes(nom, adresse, code_postal, ville)')
    .eq('id', id)
    .eq('cabinet_id', cabinetId)
    .single()

  if (!f) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })

  const facture = f as unknown as FactureRow
  const cab = (cabinet ?? {}) as { nom?: string; adresse?: string; code_postal?: string; ville?: string; telephone?: string; email_contact?: string; siret?: string }
  const copro = facture.copropriete

  // ── Génération PDF ────────────────────────────────────────────
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210
  const margin = 20

  // Émetteur (cabinet) — haut gauche
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'bold')
  doc.text(cab.nom ?? 'Cabinet syndic', margin, 20)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  let y = 26
  if (cab.adresse) { doc.text(cab.adresse, margin, y); y += 5 }
  if (cab.code_postal || cab.ville) { doc.text(`${cab.code_postal ?? ''} ${cab.ville ?? ''}`.trim(), margin, y); y += 5 }
  if (cab.telephone) { doc.text(`Tél : ${cab.telephone}`, margin, y); y += 5 }
  if (cab.email_contact) { doc.text(cab.email_contact, margin, y); y += 5 }
  if (cab.siret) { doc.text(`SIRET : ${cab.siret}`, margin, y); y += 5 }

  // Destinataire (syndicat) — haut droite
  const destX = 130
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text('Syndicat des copropriétaires', destX, 20)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(copro?.nom ?? '—', destX, 26)
  if (copro?.adresse) doc.text(copro.adresse, destX, 31)
  if (copro?.code_postal || copro?.ville) {
    doc.text(`${copro?.code_postal ?? ''} ${copro?.ville ?? ''}`.trim(), destX, 36)
  }

  // Ligne séparatrice
  doc.setDrawColor(220, 220, 220)
  doc.line(margin, 55, pageW - margin, 55)

  // Titre
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text('FACTURE', pageW / 2, 68, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`N° ${facture.numero ?? '—'}`, pageW / 2, 75, { align: 'center' })

  // Métadonnées (dates)
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.setFont('helvetica', 'bold')
  doc.text('Date d’émission', margin, 90)
  doc.setFont('helvetica', 'normal')
  doc.text(dateFr(facture.date_emission), margin + 38, 90)
  if (facture.date_echeance) {
    doc.setFont('helvetica', 'bold')
    doc.text('Échéance', margin, 96)
    doc.setFont('helvetica', 'normal')
    doc.text(dateFr(facture.date_echeance), margin + 38, 96)
  }

  // Tableau montants (HT / TVA / TTC)
  const periode = facture.periode_label
    ? facture.periode_label
    : facture.periode_type === 'annuel' ? 'Forfait annuel'
    : facture.periode_type === 'mensuel' ? 'Forfait mensuel'
    : 'Prestation ponctuelle'

  autoTable(doc, {
    startY: 106,
    margin: { left: margin, right: margin },
    head: [['Désignation', 'Période', 'Montant HT']],
    body: [[facture.objet, periode, euro(facture.montant_ht)]],
    foot: [
      [{ content: 'Total HT', colSpan: 2, styles: { halign: 'right' } }, { content: euro(facture.montant_ht), styles: { halign: 'right' } }],
      [{ content: `TVA (${facture.taux_tva} %)`, colSpan: 2, styles: { halign: 'right' } }, { content: euro(facture.montant_tva), styles: { halign: 'right' } }],
      [{ content: 'Total TTC', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } }, { content: euro(facture.montant_ttc), styles: { halign: 'right', fontStyle: 'bold' } }],
    ],
    headStyles: { fillColor: [15, 110, 86], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [245, 245, 245], textColor: [17, 24, 39] },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 2: { halign: 'right', cellWidth: 40 } },
  })

  let tableEnd = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  if (facture.notes) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(doc.splitTextToSize(facture.notes, pageW - margin * 2), margin, tableEnd)
    tableEnd += 12
  }

  // Mention sur la répartition (pédagogie + conformité)
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text(
    doc.splitTextToSize(
      'Honoraires de gestion répartis entre les copropriétaires selon les tantièmes, via les appels de charges du budget voté en assemblée générale.',
      pageW - margin * 2,
    ),
    margin,
    tableEnd,
  )

  // Pied de page
  doc.setFontSize(8)
  doc.setTextColor(160, 160, 160)
  doc.text(
    `Document généré le ${dateFr(new Date().toISOString())} par Coplio — ${cab.nom ?? ''}`,
    pageW / 2,
    285,
    { align: 'center' },
  )

  const buffer = Buffer.from(doc.output('arraybuffer'))
  const filename = `facture_honoraires_${facture.numero ?? id.slice(0, 8)}.pdf`

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
