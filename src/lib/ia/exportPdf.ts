export interface CabinetInfo {
  nom: string
  adresse?: string
  logoBase64?: string
  logoMime?: string
}

export async function urlToBase64(url: string): Promise<{ data: string; mime: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    const mime = blob.type || 'image/png'
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        resolve({ data: result.split(',')[1], mime })
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function exportIAPDF(
  text: string,
  titre: string,
  cabinet: CabinetInfo
) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const TEXT    = '#1C1C1A'
  const GRAY    = '#F8F8F6'
  const RULE    = '#E0E0DC'
  const PAGE_W  = 210
  const MARGIN  = 20
  const CONTENT_W = PAGE_W - MARGIN * 2
  const today   = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  let pageNum   = 1

  function addHeader() {
    const H = 24
    doc.setFillColor(GRAY)
    doc.rect(0, 0, PAGE_W, H, 'F')
    doc.setDrawColor(RULE)
    doc.setLineWidth(0.4)
    doc.line(0, H, PAGE_W, H)

    if (cabinet.logoBase64 && cabinet.logoMime) {
      try {
        const fmt = cabinet.logoMime.replace('image/', '').toUpperCase()
        doc.addImage(cabinet.logoBase64, fmt, MARGIN, 4, 16, 16)
      } catch { /* ignore */ }
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor('#666666')
      doc.text(cabinet.nom, PAGE_W - MARGIN, 13.5, { align: 'right' })
    } else {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(TEXT)
      doc.text(cabinet.nom || '', MARGIN, 13.5)
      if (cabinet.adresse) {
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor('#888888')
        doc.text(cabinet.adresse, PAGE_W - MARGIN, 13.5, { align: 'right' })
      }
    }
    doc.setTextColor(TEXT)
  }

  function addFooter(n: number) {
    const FY = 285
    doc.setDrawColor(RULE)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, FY, PAGE_W - MARGIN, FY)
    doc.setFontSize(7.5)
    doc.setTextColor('#AAAAAA')
    doc.text(today, MARGIN, FY + 5)
    doc.text(`Page ${n}`, PAGE_W - MARGIN, FY + 5, { align: 'right' })
    doc.setTextColor(TEXT)
  }

  addHeader()
  let y = 36

  // Titre du document
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(TEXT)
  doc.text(titre.toUpperCase(), MARGIN, y)
  y += 3
  doc.setDrawColor(RULE)
  doc.setLineWidth(0.4)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)
  y += 8

  // Corps — gestion des sauts de page
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(TEXT)

  for (const para of text.split('\n')) {
    if (!para.trim()) { y += 4; continue }

    const isHeading =
      /^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ\s\-—:]{5,}$/.test(para.trim()) ||
      para.startsWith('**')

    if (isHeading) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
    }

    const clean = para.replace(/\*\*/g, '').trim()
    const lines = doc.splitTextToSize(clean, CONTENT_W)
    const blockH = lines.length * 5.5

    if (y + blockH > 280) {
      addFooter(pageNum)
      doc.addPage()
      pageNum++
      addHeader()
      y = 36
    }

    doc.text(lines, MARGIN, y)
    y += blockH + (isHeading ? 3 : 1.5)
  }

  addFooter(pageNum)
  doc.save(`${titre.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`)
}
