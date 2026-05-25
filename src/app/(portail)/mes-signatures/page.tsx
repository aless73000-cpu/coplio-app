import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  PenLine, FileText, CheckCircle2, Clock, ExternalLink,
  AlertTriangle, Calendar, ChevronRight, Download,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { getSignedDocumentUrl } from '@/lib/storage'

const AG_STATUS_LABELS: Record<string, string> = {
  planifiee: 'Planifiée',
  convocations_envoyees: 'Convoquée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
}

export default async function MesSignaturesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles')
    .select('lot_id, lot:lots(copropriete_id)')
    .eq('id', user.id)
    .single()

  const coproprieteId = (profile?.lot as { copropriete_id?: string } | null)?.copropriete_id

  // Documents à signer : PV d'AG, contrats et règlements
  const { data: documents } = coproprieteId
    ? await supabase
        .from('documents')
        .select('id, nom, categorie, storage_path, storage_bucket, taille_bytes, created_at')
        .eq('copropriete_id', coproprieteId)
        .eq('visible_coproprietaires', true)
        .in('categorie', ['pv_ag', 'contrat', 'reglement'])
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: [] }

  // Assemblées générales terminées / PV publié
  const { data: assemblees } = coproprieteId
    ? await supabase
        .from('assemblees_generales')
        .select('id, titre, type, status, date_ag, pv_document_id')
        .eq('copropriete_id', coproprieteId)
        .in('status', ['terminee', 'annulee'])
        .order('date_ag', { ascending: false })
        .limit(10)
    : { data: [] }

  // Générer les signed URLs pour chaque document (cachées 45 min)
  type DocWithUrl = { id: string; nom: string; categorie: string | null; created_at: string | null; signedUrl: string | null }
  const docsWithUrls: DocWithUrl[] = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const signedUrl = await getSignedDocumentUrl(doc.storage_bucket ?? 'documents', doc.storage_path)
      return { ...doc, signedUrl }
    })
  )

  const asSigned = docsWithUrls.filter((d) => d.categorie === 'pv_ag' || d.categorie === 'contrat')
  const reglements = docsWithUrls.filter((d) => d.categorie === 'reglement')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Signatures électroniques</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Documents importants nécessitant votre attention
        </p>
      </div>

      {/* Aucun lot */}
      {!profile?.lot_id && (
        <div className="coplio-card text-center py-12">
          <AlertTriangle className="w-10 h-10 text-coplio-amber mx-auto mb-3" />
          <p className="font-semibold text-coplio-text">Aucun lot associé</p>
          <p className="text-sm text-muted-foreground mt-1">Contactez votre syndic pour accéder à vos documents.</p>
        </div>
      )}

      {/* PV d'AG & Contrats */}
      {asSigned.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <PenLine className="w-4 h-4 text-purple-600" />
            <h2 className="font-semibold text-coplio-text text-sm uppercase tracking-wide">
              Documents importants
            </h2>
          </div>
          <div className="space-y-3">
            {asSigned.map((doc) => (
              <div key={doc.id} className="coplio-card flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-coplio-text">{doc.nom}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground capitalize">{(doc.categorie ?? '').replace('_', ' ')}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{formatDate(doc.created_at ?? '')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-coplio-amber bg-coplio-amber-bg px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" /> À consulter
                  </span>
                  {doc.signedUrl && (
                    <a
                      href={doc.signedUrl}
                      download={doc.nom}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium text-[#111827] bg-slate-100 hover:bg-[#111827] hover:text-white px-2.5 py-1 rounded-full transition-colors"
                    >
                      <Download className="w-3 h-3" /> Télécharger
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PV d'Assemblées générales */}
      {(assemblees ?? []).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-[#111827]" />
            <h2 className="font-semibold text-coplio-text text-sm uppercase tracking-wide">
              Procès-verbaux d&apos;assemblée générale
            </h2>
          </div>
          <div className="space-y-3">
            {(assemblees ?? []).map((ag) => (
              <div key={ag.id} className="coplio-card flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-[#111827]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-coplio-text">{ag.titre}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground capitalize">{ag.type?.replace('_', ' ')}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{formatDate(ag.date_ag)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    ag.status === 'terminee'
                      ? 'bg-slate-100 text-[#111827]'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {AG_STATUS_LABELS[ag.status ?? ''] ?? ag.status}
                  </span>
                  {ag.pv_document_id && (
                    <Link
                      href="/mes-assemblees"
                      className="flex items-center gap-1 text-xs font-medium text-[#111827] bg-slate-100 px-2.5 py-1 rounded-full hover:bg-[#111827] hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> PV <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Règlement de copropriété */}
      {reglements.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-coplio-text text-sm uppercase tracking-wide">
              Règlement de copropriété
            </h2>
          </div>
          <div className="space-y-3">
            {reglements.map((doc) => (
              <div key={doc.id} className="coplio-card flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-coplio-text">{doc.nom}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(doc.created_at ?? '')}</p>
                </div>
                {doc.signedUrl && (
                  <a
                    href={doc.signedUrl}
                    download={doc.nom}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors flex-shrink-0"
                  >
                    <Download className="w-3 h-3" /> Télécharger
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vide */}
      {profile?.lot_id && asSigned.length === 0 && (assemblees ?? []).length === 0 && reglements.length === 0 && (
        <div className="coplio-card text-center py-16">
          <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <PenLine className="w-7 h-7 text-purple-400" />
          </div>
          <p className="font-medium text-coplio-text">Aucun document à consulter</p>
          <p className="text-sm text-muted-foreground mt-1">
            Les PV d&apos;AG, contrats et documents importants apparaîtront ici.
          </p>
          <Link
            href="/mes-assemblees"
            className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-[#111827] hover:underline"
          >
            Voir mes assemblées générales <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
