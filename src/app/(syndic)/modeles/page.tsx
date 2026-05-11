'use client'

import { useState } from 'react'
import {
  FileText, Download, Loader2, ChevronRight, Mail,
  FileStack, Scale, AlertTriangle, CalendarDays,
} from 'lucide-react'

// ─── Template definitions ─────────────────────────────────────

const TEMPLATES = [
  {
    id: 'convocation-ag',
    icon: CalendarDays,
    color: 'bg-blue-50',
    iconColor: 'text-blue-600',
    title: 'Convocation AG',
    description: 'Lettre de convocation pour une assemblée générale ordinaire ou extraordinaire',
    fields: [
      { key: 'cabinetNom', label: 'Nom du cabinet', placeholder: 'Syndic Immo Pro' },
      { key: 'cabinetAdresse', label: 'Adresse du cabinet', placeholder: '10 rue de la Paix, 75001 Paris' },
      { key: 'coproprieteNom', label: 'Nom de la copropriété', placeholder: 'Résidence Les Acacias' },
      { key: 'dateAg', label: 'Date de l\'AG', type: 'date', placeholder: '' },
      { key: 'heureAg', label: 'Heure de l\'AG', type: 'time', placeholder: '18:00' },
      { key: 'lieuAg', label: 'Lieu de l\'AG', placeholder: 'Salle des fêtes, 5 rue...' },
      { key: 'typeAg', label: 'Type d\'AG', type: 'select', options: ['Ordinaire', 'Extraordinaire'] },
      { key: 'ordreJour', label: 'Ordre du jour (1 point par ligne)', type: 'textarea', placeholder: 'Approbation des comptes\nVote du budget\nElection du conseil syndical' },
    ],
  },
  {
    id: 'relance-impaye',
    icon: AlertTriangle,
    color: 'bg-amber-50',
    iconColor: 'text-amber-600',
    title: 'Relance impayé',
    description: 'Courrier de relance amiable pour charges impayées',
    fields: [
      { key: 'cabinetNom', label: 'Nom du cabinet', placeholder: 'Syndic Immo Pro' },
      { key: 'cabinetAdresse', label: 'Adresse du cabinet', placeholder: '10 rue de la Paix, 75001 Paris' },
      { key: 'destinataireNom', label: 'Nom du copropriétaire', placeholder: 'M. Jean Dupont' },
      { key: 'destinataireAdresse', label: 'Adresse du copropriétaire', placeholder: 'Lot A01, Résidence Les Acacias' },
      { key: 'coproprieteNom', label: 'Nom de la copropriété', placeholder: 'Résidence Les Acacias' },
      { key: 'lotNumero', label: 'Numéro de lot', placeholder: 'A01' },
      { key: 'montant', label: 'Montant dû (€)', type: 'number', placeholder: '1250' },
      { key: 'dateEcheance', label: 'Date d\'échéance', type: 'date', placeholder: '' },
      { key: 'referenceRelance', label: 'Numéro de relance', type: 'select', options: ['1ère relance', '2ème relance', 'Mise en demeure'] },
    ],
  },
  {
    id: 'pv-ag',
    icon: Scale,
    color: 'bg-purple-50',
    iconColor: 'text-purple-600',
    title: 'PV d\'AG',
    description: 'Procès-verbal d\'assemblée générale avec les résolutions votées',
    fields: [
      { key: 'cabinetNom', label: 'Nom du cabinet', placeholder: 'Syndic Immo Pro' },
      { key: 'coproprieteNom', label: 'Nom de la copropriété', placeholder: 'Résidence Les Acacias' },
      { key: 'dateAg', label: 'Date de l\'AG', type: 'date', placeholder: '' },
      { key: 'lieuAg', label: 'Lieu de l\'AG', placeholder: 'Salle des fêtes, 5 rue...' },
      { key: 'nbPresents', label: 'Copropriétaires présents', type: 'number', placeholder: '12' },
      { key: 'nbRepresentes', label: 'Copropriétaires représentés', type: 'number', placeholder: '4' },
      { key: 'tantieresPresents', label: 'Tantièmes représentés', type: 'number', placeholder: '750' },
      { key: 'president', label: 'Président de séance', placeholder: 'M. Martin' },
      { key: 'secretaire', label: 'Secrétaire de séance', placeholder: 'Mme Bernard' },
    ],
  },
  {
    id: 'courrier-syndic',
    icon: Mail,
    color: 'bg-coplio-green-light',
    iconColor: 'text-coplio-green',
    title: 'Courrier syndic',
    description: 'Courrier officiel du syndic aux copropriétaires (travaux, informations…)',
    fields: [
      { key: 'cabinetNom', label: 'Nom du cabinet', placeholder: 'Syndic Immo Pro' },
      { key: 'cabinetAdresse', label: 'Adresse du cabinet', placeholder: '10 rue de la Paix, 75001 Paris' },
      { key: 'coproprieteNom', label: 'Nom de la copropriété', placeholder: 'Résidence Les Acacias' },
      { key: 'objet', label: 'Objet du courrier', placeholder: 'Travaux de ravalement de façade' },
      { key: 'corps', label: 'Corps du courrier', type: 'textarea', placeholder: 'Madame, Monsieur,\n\nNous avons le plaisir de vous informer que...' },
      { key: 'signataireNom', label: 'Nom du signataire', placeholder: 'Pierre Durand' },
      { key: 'signataireTitre', label: 'Titre du signataire', placeholder: 'Gestionnaire de copropriété' },
    ],
  },
] as const

type TemplateId = typeof TEMPLATES[number]['id']

// ─── PDF generation ───────────────────────────────────────────

async function generatePDF(templateId: TemplateId, values: Record<string, string>) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const GREEN = '#0F6E56'
  const TEXT = '#1C1C1A'
  const MUTED = '#888'
  const PAGE_W = 210
  const MARGIN = 20
  const CONTENT_W = PAGE_W - MARGIN * 2
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  function addHeader() {
    // Header bar
    doc.setFillColor(GREEN)
    doc.rect(0, 0, PAGE_W, 18, 'F')
    doc.setTextColor('#FFFFFF')
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('COPLIO — Logiciel de gestion syndic', MARGIN, 12)

    // Cabinet name on right
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    if (values.cabinetNom) {
      doc.text(values.cabinetNom, PAGE_W - MARGIN, 12, { align: 'right' })
    }
    doc.setTextColor(TEXT)
  }

  function addFooter(pageNum: number) {
    doc.setFontSize(8)
    doc.setTextColor(MUTED)
    doc.text(`Document généré par Coplio · ${today} · Page ${pageNum}`, PAGE_W / 2, 288, { align: 'center' })
    doc.setDrawColor('#E5E5E5')
    doc.line(MARGIN, 283, PAGE_W - MARGIN, 283)
  }

  if (templateId === 'convocation-ag') {
    addHeader()
    let y = 30

    // Expéditeur
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(TEXT)
    doc.text(values.cabinetNom || 'Cabinet syndic', MARGIN, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(MUTED)
    if (values.cabinetAdresse) doc.text(values.cabinetAdresse, MARGIN, y)
    y += 6
    doc.text(`Paris, le ${today}`, MARGIN, y)
    y += 15

    // Objet
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(GREEN)
    doc.text(`CONVOCATION À L'ASSEMBLÉE GÉNÉRALE ${(values.typeAg || 'ORDINAIRE').toUpperCase()}`, MARGIN, y)
    y += 7
    doc.setFontSize(10)
    doc.setTextColor(TEXT)
    doc.text(`${values.coproprieteNom || 'Copropriété'}`, MARGIN, y)
    y += 12

    // Corps
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const intro = `Madame, Monsieur,\n\nNous avons l'honneur de vous convoquer à l'Assemblée Générale ${values.typeAg || 'Ordinaire'} de la copropriété ${values.coproprieteNom || ''} qui se tiendra le :\n\n`
    const introLines = doc.splitTextToSize(intro, CONTENT_W)
    doc.text(introLines, MARGIN, y)
    y += introLines.length * 5 + 2

    // Date / heure / lieu
    doc.setFillColor('#F7F6F2')
    doc.roundedRect(MARGIN, y, CONTENT_W, 22, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(GREEN)
    const dateStr = values.dateAg ? new Date(values.dateAg).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'
    doc.text(`${dateStr} à ${values.heureAg || '—'}`, MARGIN + 6, y + 9)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(TEXT)
    doc.text(`Lieu : ${values.lieuAg || '—'}`, MARGIN + 6, y + 16)
    y += 30

    // Ordre du jour
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(GREEN)
    doc.text('ORDRE DU JOUR', MARGIN, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(TEXT)
    const points = (values.ordreJour || '').split('\n').filter(Boolean)
    points.forEach((point, i) => {
      doc.text(`${i + 1}. ${point}`, MARGIN + 5, y)
      y += 6
    })
    y += 8

    // Signature
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(TEXT)
    doc.text('Veuillez agréer, Madame, Monsieur, l\'expression de nos salutations distinguées.', MARGIN, y)
    y += 10
    doc.text(`Le Syndic — ${values.cabinetNom || ''}`, MARGIN, y)

    addFooter(1)

  } else if (templateId === 'relance-impaye') {
    addHeader()
    let y = 30

    // Expéditeur
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(values.cabinetNom || 'Cabinet syndic', MARGIN, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(MUTED)
    if (values.cabinetAdresse) doc.text(values.cabinetAdresse, MARGIN, y)
    y += 6
    doc.text(`Paris, le ${today}`, MARGIN, y)
    y += 12

    // Destinataire
    doc.setTextColor(TEXT)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    if (values.destinataireNom) doc.text(values.destinataireNom, PAGE_W - MARGIN - 80, y)
    y += 5
    if (values.destinataireAdresse) {
      const lines = doc.splitTextToSize(values.destinataireAdresse, 80)
      doc.text(lines, PAGE_W - MARGIN - 80, y)
      y += lines.length * 5
    }
    y += 10

    // Objet / ref
    const niveauRelance = values.referenceRelance || '1ère relance'
    doc.setFont('helvetica', 'bold')
    doc.text(`Objet : ${niveauRelance} — Charges impayées — Lot ${values.lotNumero || ''}`, MARGIN, y)
    y += 4
    doc.setDrawColor(GREEN)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, y, MARGIN + 100, y)
    y += 10

    // Corps
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(TEXT)
    const corps = `Madame, Monsieur,\n\nNous avons le regret de constater que votre compte au titre de la copropriété ${values.coproprieteNom || ''} présente un solde débiteur.\n\nNous vous rappelons que la somme de ${parseFloat(values.montant || '0').toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} était due au ${values.dateEcheance ? new Date(values.dateEcheance).toLocaleDateString('fr-FR') : '—'}.\n\nNous vous prions de bien vouloir régulariser cette situation dans les meilleurs délais en effectuant un virement au compte de la copropriété.\n\nA défaut de règlement sous 15 jours, nous nous verrons dans l'obligation d'engager les démarches contentieuses nécessaires au recouvrement de cette créance.`

    const lines = doc.splitTextToSize(corps, CONTENT_W)
    doc.text(lines, MARGIN, y)
    y += lines.length * 5 + 10

    // Montant encadré
    doc.setFillColor('#FEF3C7')
    doc.roundedRect(MARGIN, y, CONTENT_W, 16, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor('#92400E')
    doc.text(`Montant dû : ${parseFloat(values.montant || '0').toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`, PAGE_W / 2, y + 10, { align: 'center' })
    y += 25

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(TEXT)
    doc.text('Veuillez agréer, Madame, Monsieur, l\'expression de nos salutations distinguées.', MARGIN, y)
    y += 10
    doc.text(`Le Syndic — ${values.cabinetNom || ''}`, MARGIN, y)

    addFooter(1)

  } else if (templateId === 'courrier-syndic') {
    addHeader()
    let y = 30

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(values.cabinetNom || 'Cabinet syndic', MARGIN, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(MUTED)
    if (values.cabinetAdresse) doc.text(values.cabinetAdresse, MARGIN, y)
    y += 6
    doc.text(`Paris, le ${today}`, MARGIN, y)
    y += 12

    doc.setTextColor(TEXT)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(`Objet : ${values.objet || ''}`, MARGIN, y)
    y += 4
    doc.setDrawColor(GREEN)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, y, MARGIN + 120, y)
    y += 10

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const bodyLines = doc.splitTextToSize(values.corps || '', CONTENT_W)
    doc.text(bodyLines, MARGIN, y)
    y += bodyLines.length * 5 + 15

    doc.text(values.signataireNom || '', MARGIN, y)
    y += 5
    doc.setTextColor(MUTED)
    doc.text(values.signataireTitre || '', MARGIN, y)

    addFooter(1)

  } else if (templateId === 'pv-ag') {
    addHeader()
    let y = 30

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(GREEN)
    doc.text('PROCÈS-VERBAL D\'ASSEMBLÉE GÉNÉRALE', PAGE_W / 2, y, { align: 'center' })
    y += 7
    doc.setFontSize(11)
    doc.setTextColor(TEXT)
    doc.text(values.coproprieteNom || '', PAGE_W / 2, y, { align: 'center' })
    y += 4
    doc.setFontSize(9)
    doc.setTextColor(MUTED)
    const dateStr = values.dateAg ? new Date(values.dateAg).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
    doc.text(`${dateStr} — ${values.lieuAg || ''}`, PAGE_W / 2, y, { align: 'center' })
    y += 12

    // Quorum
    doc.setFillColor('#F7F6F2')
    doc.roundedRect(MARGIN, y, CONTENT_W, 28, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(TEXT)
    doc.text('QUORUM', MARGIN + 6, y + 7)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(MUTED)
    doc.text(`Présents : ${values.nbPresents || 0} copropriétaires`, MARGIN + 6, y + 14)
    doc.text(`Représentés : ${values.nbRepresentes || 0} copropriétaires`, MARGIN + 6, y + 20)
    doc.text(`Tantièmes représentés : ${values.tantieresPresents || 0}`, MARGIN + 80, y + 14)
    doc.text(`Président : ${values.president || ''}  ·  Secrétaire : ${values.secretaire || ''}`, MARGIN + 6, y + 26)
    y += 36

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(TEXT)
    doc.text('L\'assemblée générale a délibéré sur les points suivants :', MARGIN, y)
    y += 10

    doc.setTextColor(MUTED)
    doc.setFontSize(9)
    doc.text('[ Ajouter les résolutions et résultats de votes dans Coplio > Assemblées ]', MARGIN, y)
    y += 20

    // Signature area
    doc.setDrawColor('#E5E5E5')
    doc.rect(MARGIN, y, 70, 25)
    doc.rect(PAGE_W - MARGIN - 70, y, 70, 25)
    doc.setFontSize(8)
    doc.setTextColor(MUTED)
    doc.text('Président de séance', MARGIN + 5, y + 5)
    doc.text('Secrétaire de séance', PAGE_W - MARGIN - 65, y + 5)
    doc.text(values.president || '', MARGIN + 5, y + 20)
    doc.text(values.secretaire || '', PAGE_W - MARGIN - 65, y + 20)

    addFooter(1)
  }

  const filename = `${templateId}_${Date.now()}.pdf`
  doc.save(filename)
}

// ─── Field component ──────────────────────────────────────────

type FieldDef = {
  key: string
  label: string
  type?: string
  placeholder?: string
  options?: readonly string[]
}

function Field({ field, value, onChange }: {
  field: FieldDef
  value: string
  onChange: (v: string) => void
}) {
  const cls = `w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
    focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent
    placeholder:text-muted-foreground`

  if (field.type === 'textarea') {
    return (
      <div>
        <label className="block text-sm font-medium text-coplio-text mb-1.5">{field.label}</label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className={cls + ' resize-y'}
        />
      </div>
    )
  }
  if (field.type === 'select' && field.options) {
    return (
      <div>
        <label className="block text-sm font-medium text-coplio-text mb-1.5">{field.label}</label>
        <select value={value} onChange={(e) => onChange(e.target.value)} className={cls}>
          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    )
  }
  return (
    <div>
      <label className="block text-sm font-medium text-coplio-text mb-1.5">{field.label}</label>
      <input
        type={field.type || 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className={cls}
      />
    </div>
  )
}

// ─── Template card ────────────────────────────────────────────

function TemplateCard({ template }: { template: typeof TEMPLATES[number] }) {
  const [expanded, setExpanded] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)

  const Icon = template.icon

  async function handleGenerate() {
    setGenerating(true)
    try {
      await generatePDF(template.id, values)
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la génération du PDF')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="coplio-card">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 ${template.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${template.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-coplio-text">{template.title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{template.description}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-sm font-medium text-coplio-green hover:underline flex-shrink-0"
        >
          Utiliser
          <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {expanded && (
        <div className="mt-6 pt-5 border-t border-border space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {template.fields.map((rawField) => {
              const field = rawField as FieldDef
              return (
                <div key={field.key} className={field.type === 'textarea' ? 'col-span-2' : ''}>
                  <Field
                    field={field}
                    value={values[field.key] ?? (field.type === 'select' && field.options ? field.options[0] : '')}
                    onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
                  />
                </div>
              )
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 bg-coplio-green text-white font-medium rounded-xl
                hover:bg-coplio-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Génération…</>
              ) : (
                <><Download className="w-4 h-4" /> Télécharger le PDF</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function ModelesPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Modèles de documents</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Générez des courriers professionnels en PDF en quelques clics
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-3 p-4 bg-coplio-green-light border border-coplio-green/20 rounded-xl">
        <FileStack className="w-5 h-5 text-coplio-green flex-shrink-0" />
        <p className="text-sm text-coplio-text">
          <strong>4 modèles disponibles.</strong> Remplissez le formulaire et téléchargez un PDF prêt à envoyer.
          Les convocations AG et PV sont également accessibles directement depuis la page de chaque assemblée.
        </p>
      </div>

      <div className="space-y-4">
        {TEMPLATES.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      <div className="coplio-card border-dashed">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-medium text-coplio-text text-sm">D&apos;autres modèles arrivent bientôt</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Règlement de copropriété, mandat de gestion, état daté…
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
