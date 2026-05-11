import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function formatEuro(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id, role, prenom, nom, cabinet:cabinets(nom)')
    .eq('id', user.id)
    .single()

  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet introuvable' }, { status: 404 })

  const url = new URL(request.url)
  const moisParam = url.searchParams.get('mois') // format: YYYY-MM
  const now = new Date()
  const [year, month] = moisParam
    ? moisParam.split('-').map(Number)
    : [now.getFullYear(), now.getMonth()] // default = previous month

  const startDate = new Date(year, month - 1, 1).toISOString()
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()
  const moisLabel = new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const cabinetId = profile.cabinet_id

  // Fetch data
  const { data: coproprietes } = await supabase
    .from('coproprietes')
    .select('id, nom, nb_lots, montant_impayes')
    .eq('cabinet_id', cabinetId)

  const coproprieteIds = (coproprietes ?? []).map((c) => c.id)

  const [{ data: appels }, { data: sinistres }, { data: nouveauxLots }] = await Promise.all([
    coproprieteIds.length > 0
      ? supabase
          .from('appels_charges')
          .select('copropriete_id, montant, montant_paye, paye, date_echeance')
          .in('copropriete_id', coproprieteIds)
          .gte('created_at', startDate)
          .lte('created_at', endDate)
      : Promise.resolve({ data: [] }),
    supabase
      .from('sinistres')
      .select('titre, status, copropriete:coproprietes(nom)')
      .eq('cabinet_id', cabinetId)
      .gte('created_at', startDate)
      .lte('created_at', endDate),
    coproprieteIds.length > 0
      ? supabase
          .from('lots')
          .select('id')
          .in('copropriete_id', coproprieteIds)
          .gte('created_at', startDate)
          .lte('created_at', endDate)
      : Promise.resolve({ data: [] }),
  ])

  const allAppels = (appels ?? []) as { copropriete_id: string; montant: number; montant_paye: number; paye: boolean }[]
  const totalEmis = allAppels.reduce((s, a) => s + a.montant, 0)
  const totalRecouvre = allAppels.reduce((s, a) => s + a.montant_paye, 0)
  const totalImpayes = totalEmis - totalRecouvre
  const tauxRecouvrement = totalEmis > 0 ? Math.round((totalRecouvre / totalEmis) * 100) : 100

  // Build PDF
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const cabinetNom = (profile.cabinet as { nom?: string } | null)?.nom ?? 'Cabinet'

  // Header
  doc.setFillColor(34, 197, 94) // coplio-green
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('COPLIO', 14, 12)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Rapport mensuel · ${moisLabel}`, 14, 20)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(cabinetNom, 210 - 14, 16, { align: 'right' })

  // Reset colors
  doc.setTextColor(30, 30, 30)

  let y = 36

  // KPI summary
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Résumé du mois', 14, y)
  y += 7

  const kpis = [
    { label: 'Copropriétés gérées', value: String(coproprietes?.length ?? 0) },
    { label: 'Appels émis ce mois', value: String(allAppels.length) },
    { label: 'Total émis', value: formatEuro(totalEmis) },
    { label: 'Total recouvré', value: formatEuro(totalRecouvre) },
    { label: 'Impayés', value: formatEuro(totalImpayes) },
    { label: 'Taux de recouvrement', value: `${tauxRecouvrement}%` },
    { label: 'Sinistres ouverts ce mois', value: String(sinistres?.length ?? 0) },
    { label: 'Nouveaux lots ajoutés', value: String(nouveauxLots?.length ?? 0) },
  ]

  autoTable(doc, {
    startY: y,
    head: [['Indicateur', 'Valeur']],
    body: kpis.map((k) => [k.label, k.value]),
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // Copropriétés table
  if ((coproprietes?.length ?? 0) > 0) {
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('État des copropriétés', 14, y)
    y += 3

    autoTable(doc, {
      startY: y,
      head: [['Copropriété', 'Lots', 'Impayés']],
      body: (coproprietes ?? []).map((c) => [c.nom, c.nb_lots, formatEuro(c.montant_impayes)]),
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    })

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  // Sinistres table
  if ((sinistres?.length ?? 0) > 0) {
    if (y > 240) { doc.addPage(); y = 20 }
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Sinistres ouverts ce mois', 14, y)
    y += 3

    autoTable(doc, {
      startY: y,
      head: [['Sinistre', 'Statut', 'Copropriété']],
      body: (sinistres ?? []).map((s) => [
        s.titre,
        s.status,
        (s.copropriete as { nom?: string } | null)?.nom ?? '',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    })
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Coplio · ${cabinetNom} · Rapport ${moisLabel} · Page ${i}/${pageCount}`,
      105,
      292,
      { align: 'center' }
    )
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  const filename = `rapport-${year}-${String(month).padStart(2, '0')}.pdf`

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
