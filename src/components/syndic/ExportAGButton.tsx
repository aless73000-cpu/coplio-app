'use client'

import { FileText } from 'lucide-react'
import { exportPDF } from '@/lib/export'

interface Resolution {
  id: string
  ordre: number
  titre: string
  description?: string
  type_vote: string
  voix_pour: number
  voix_contre: number
  voix_abstention: number
  adoptee?: boolean
}

interface ExportAGButtonProps {
  titre: string
  dateAg: string
  lieu?: string
  coproprieteNom?: string
  statut: string
  resolutions: Resolution[]
}

const VOTE_LABELS: Record<string, string> = {
  art_24: 'Art. 24 — Majorité simple',
  art_25: 'Art. 25 — Majorité absolue',
  art_26: 'Art. 26 — Double majorité',
  unanimite: 'Unanimité',
}

const STATUS_LABELS: Record<string, string> = {
  planifiee: 'Planifiée',
  convocations_envoyees: 'Convoquée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
}

export function ExportAGButton({
  titre,
  dateAg,
  lieu,
  coproprieteNom,
  statut,
  resolutions,
}: ExportAGButtonProps) {
  async function handleExport() {
    const date = new Date(dateAg)
    const dateStr = date.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    const heureStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

    await exportPDF({
      title: titre,
      subtitle: `${coproprieteNom ?? ''} · ${dateStr} à ${heureStr}${lieu ? ` · ${lieu}` : ''}`,
      filename: `PV_AG_${titre.replace(/\s+/g, '_')}`,
      columns: [
        { header: '#', key: 'ordre', width: 10 },
        { header: 'Résolution', key: 'titre', width: 55 },
        { header: 'Type de vote', key: 'type_vote', width: 40 },
        { header: 'Pour', key: 'pour', width: 15 },
        { header: 'Contre', key: 'contre', width: 15 },
        { header: 'Abst.', key: 'abstention', width: 15 },
        { header: 'Résultat', key: 'resultat', width: 20 },
      ],
      rows: resolutions.map((r) => ({
        ordre: r.ordre,
        titre: r.titre,
        type_vote: VOTE_LABELS[r.type_vote] ?? r.type_vote,
        pour: r.voix_pour,
        contre: r.voix_contre,
        abstention: r.voix_abstention,
        resultat:
          r.adoptee === true ? '✓ Adoptée' :
          r.adoptee === false ? '✗ Rejetée' :
          STATUS_LABELS[statut] ?? '—',
      })),
    })
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm
                 text-coplio-text hover:bg-coplio-bg transition-colors"
    >
      <FileText className="w-4 h-4" />
      Exporter PV (PDF)
    </button>
  )
}
