import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, FileSearch, ClipboardList, Coins,
  Scale, Bell, CheckCircle2, AlertTriangle, Info, MessageCircle,
  Building2, Ruler, Zap, Flame, ShieldCheck, MapPin, Bug, Volume2,
} from 'lucide-react'

export const metadata = { title: 'Vendre mon lot' }

interface StepProps {
  number: number
  title: string
  description: string
  color: string
  children: React.ReactNode
}

function Step({ number, title, description, color, children }: StepProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={`px-5 py-4 flex items-start gap-4 ${color}`}>
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-sm font-black text-white">{number}</span>
        </div>
        <div>
          <p className="text-xs text-white/60 font-semibold uppercase tracking-wider">Étape {number}</p>
          <h2 className="text-base font-bold text-white mt-0.5">{title}</h2>
          <p className="text-sm text-white/70 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {children}
      </div>
    </div>
  )
}

interface CheckItemProps {
  icon: React.ElementType
  label: string
  detail: string
  required?: boolean
  conditional?: string
}

function CheckItem({ icon: Icon, label, detail, required = true, conditional }: CheckItemProps) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          {required
            ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">Obligatoire</span>
            : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-200">Selon cas</span>
          }
        </div>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{detail}</p>
        {conditional && (
          <p className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
            <Info className="w-3 h-3 flex-shrink-0" />
            {conditional}
          </p>
        )}
      </div>
    </div>
  )
}

export default async function VendreMonLotPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles')
    .select('lot:lots(numero, copropriete:coproprietes(nom, annee_construction, cabinet:cabinets(nom)))')
    .eq('id', user.id)
    .single()

  const lot = (profile?.lot as {
    numero: string
    copropriete: { nom: string; annee_construction?: number | null; cabinet?: { nom: string } | null }
  } | null) ?? null

  const anneeCopro = lot?.copropriete?.annee_construction ?? null
  const avantJuillet1997 = anneeCopro !== null && anneeCopro < 1997
  const avant1949 = anneeCopro !== null && anneeCopro < 1949

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/mon-logement"
          className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors shadow-sm">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ letterSpacing: '-0.02em' }}>Vendre mon lot</h1>
          {lot && (
            <p className="text-xs text-slate-400 mt-0.5">
              Lot {lot.numero} · {lot.copropriete.nom}
            </p>
          )}
        </div>
      </div>

      {/* Intro */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Info className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-900">Guide de vente en copropriété</p>
          <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
            La vente d'un lot en copropriété est encadrée par la loi. Ce guide liste toutes les étapes
            et documents obligatoires. Votre syndic peut vous fournir certains documents directement.
          </p>
        </div>
      </div>

      {/* ÉTAPE 1 — Diagnostics techniques */}
      <Step
        number={1}
        title="Diagnostics techniques (DDT)"
        description="À réaliser par un diagnostiqueur certifié avant la mise en vente"
        color="bg-[#0f172a]"
      >
        <CheckItem
          icon={Ruler}
          label="Mesurage Loi Carrez"
          detail="Mesure obligatoire de la surface privative de votre lot. Si la surface réelle est inférieure de plus de 5% à celle indiquée, l'acheteur peut exiger une réduction du prix."
          required
        />
        <CheckItem
          icon={Zap}
          label="DPE — Diagnostic de Performance Énergétique"
          detail="Obligatoire pour toute vente. Évalue la consommation énergétique (étiquettes A à G). Doit être affiché dès l'annonce de vente. Valide 10 ans."
          required
        />
        <CheckItem
          icon={Zap}
          label="Diagnostic électricité"
          detail="Obligatoire si l'installation électrique a plus de 15 ans. Valide 3 ans."
          required={false}
          conditional="Applicable si votre installation date d'avant 2009"
        />
        <CheckItem
          icon={Flame}
          label="Diagnostic gaz"
          detail="Obligatoire si l'installation intérieure de gaz a plus de 15 ans. Valide 3 ans."
          required={false}
          conditional="Applicable si votre logement a le gaz avec une installation ancienne"
        />
        <CheckItem
          icon={ShieldCheck}
          label="Diagnostic amiante"
          detail="Obligatoire pour tout immeuble dont le permis de construire est antérieur au 1er juillet 1997. Valide sans limite si négatif."
          required={avantJuillet1997}
          conditional={
            anneeCopro !== null
              ? avantJuillet1997
                ? `Votre immeuble (${anneeCopro}) est concerné`
                : `Votre immeuble (${anneeCopro}) n'est pas concerné`
              : 'Vérifiez l\'année de construction de votre immeuble'
          }
        />
        <CheckItem
          icon={AlertTriangle}
          label="Diagnostic plomb (CREP)"
          detail="Obligatoire pour les immeubles construits avant le 1er janvier 1949. Recherche de plomb dans les revêtements. Valide 1 an si positif, illimité si négatif."
          required={avant1949}
          conditional={
            anneeCopro !== null
              ? avant1949
                ? `Votre immeuble (${anneeCopro}) est concerné`
                : `Votre immeuble (${anneeCopro}) n'est pas concerné`
              : 'Vérifiez l\'année de construction de votre immeuble'
          }
        />
        <CheckItem
          icon={MapPin}
          label="État des Risques et Pollutions (ERP)"
          detail="Obligatoire dans toutes les zones. Informe sur les risques naturels, miniers, technologiques et sismiques. Valide 6 mois — à refaire si expiré."
          required
        />
        <CheckItem
          icon={Bug}
          label="Diagnostic termites"
          detail="Obligatoire uniquement dans les zones déclarées par arrêté préfectoral. Valide 6 mois."
          required={false}
          conditional="Renseignez-vous auprès de votre mairie ou diagnostiqueur"
        />
        <CheckItem
          icon={Volume2}
          label="Diagnostic bruit"
          detail="Obligatoire si le bien est situé dans une zone d'exposition au bruit d'un aérodrome."
          required={false}
          conditional="Consultez le plan d'exposition au bruit de votre commune"
        />
      </Step>

      {/* ÉTAPE 2 — Documents copropriété */}
      <Step
        number={2}
        title="Documents copropriété (Loi ALUR)"
        description="À rassembler avant le compromis de vente — certains sont fournis par le syndic"
        color="bg-blue-600"
      >
        <CheckItem
          icon={ClipboardList}
          label="Règlement de copropriété + état descriptif"
          detail="Décrit les règles de vie et la répartition des charges. Obligatoire. Si vous ne l'avez pas, demandez-le à votre syndic ou au service de la publicité foncière."
          required
        />
        <CheckItem
          icon={FileSearch}
          label="3 derniers PV d'assemblée générale"
          detail="Permettent à l'acheteur de connaître les décisions prises, les travaux votés ou à venir. Disponibles dans l'espace Documents de Coplio."
          required
        />
        <CheckItem
          icon={Building2}
          label="Carnet d'entretien de l'immeuble"
          detail="Recense l'historique des travaux et contrats d'entretien. Fourni par le syndic à la demande."
          required
        />
        <CheckItem
          icon={ClipboardList}
          label="Fiche synthétique de la copropriété"
          detail="Document résumant les données financières et techniques de la copropriété. Obligatoire depuis la loi ALUR. Fourni par le syndic."
          required
        />
        <CheckItem
          icon={FileSearch}
          label="Pré-état daté"
          detail="Document clé fourni par le syndic avant le compromis. Indique vos dettes envers le syndicat, les charges courantes, le fonds de travaux, les procédures judiciaires en cours. Délai légal : 15 jours. Coût variable selon le syndic."
          required
        />
        <CheckItem
          icon={FileSearch}
          label="État daté"
          detail="Version définitive du pré-état daté, fournie par le syndic avant l'acte authentique chez le notaire. Obligatoire. Le notaire le réclame directement au syndic en général."
          required
        />
        <CheckItem
          icon={ClipboardList}
          label="DTG — Diagnostic Technique Global"
          detail="Si votre copropriété en a fait réaliser un, il doit être communiqué à l'acheteur. Ce n'est pas toujours obligatoire selon la taille de la copropriété."
          required={false}
          conditional="Demandez au syndic si un DTG a été réalisé"
        />
        <CheckItem
          icon={ClipboardList}
          label="Plan Pluriannuel de Travaux (PPT)"
          detail="Obligatoire pour les copropriétés de plus de 15 ans (depuis 2023). Si voté, l'acheteur doit en être informé car il implique des appels de fonds futurs."
          required={false}
          conditional="Obligatoire pour les copropriétés de plus de 50 lots depuis jan. 2023"
        />
      </Step>

      {/* ÉTAPE 3 — Situation financière */}
      <Step
        number={3}
        title="Situation financière"
        description="Vérifiez votre situation avant de vendre pour éviter les blocages"
        color="bg-emerald-600"
      >
        <CheckItem
          icon={Coins}
          label="Absence de dettes envers le syndicat"
          detail="Si vous avez des charges impayées, elles doivent être régularisées avant ou lors de la vente (le notaire retiendra les sommes dues sur le prix de vente). Vérifiez votre solde dans Coplio."
          required
        />
        <CheckItem
          icon={Coins}
          label="Quote-part du fonds de travaux"
          detail="Le solde de votre fonds de travaux est acquis au lot (et non remboursé au vendeur). L'acheteur en hérite. Mentionnez-le dans votre annonce."
          required
        />
        <CheckItem
          icon={AlertTriangle}
          label="Appels de fonds exceptionnels votés"
          detail="Si une AG a voté des travaux avec appels de fonds à venir, vous en êtes redevable selon la date du vote (avant ou après le compromis). Point à clarifier avec le notaire."
          required
        />
        <CheckItem
          icon={ClipboardList}
          label="Procédures judiciaires en cours"
          detail="Le syndic doit informer l'acheteur si la copropriété est impliquée dans des litiges (impayés collectifs, sinistres). Figurera dans le pré-état daté."
          required
        />
      </Step>

      {/* ÉTAPE 4 — Chez le notaire */}
      <Step
        number={4}
        title="Démarches notariales"
        description="Le notaire pilote la vente — vous pouvez avoir le vôtre, l'acheteur le sien"
        color="bg-violet-600"
      >
        <CheckItem
          icon={Scale}
          label="Choix du notaire"
          detail="Vous pouvez choisir votre propre notaire. Les honoraires sont réglementés et partagés entre les deux notaires sans surcoût pour vous. Le notaire de l'acheteur est souvent celui qui rédige l'acte."
          required
        />
        <CheckItem
          icon={FileSearch}
          label="Compromis de vente"
          detail="Premier acte engageant les deux parties. Peut être signé sous seing privé ou chez le notaire. Une fois signé, l'acheteur dispose de 10 jours de rétractation (loi SRU)."
          required
        />
        <CheckItem
          icon={CheckCircle2}
          label="Acte authentique de vente"
          detail="Signature définitive chez le notaire. Délai habituel entre compromis et acte : 2 à 3 mois. Le notaire vérifie tous les documents, purge les hypothèques et enregistre la mutation."
          required
        />
        <CheckItem
          icon={Coins}
          label="Droit de préemption urbain (DPU)"
          detail="La commune peut avoir un droit de préemption sur votre lot. Le notaire envoie une Déclaration d'Intention d'Aliéner (DIA) en mairie. La commune a 2 mois pour se prononcer."
          required={false}
          conditional="Selon la zone PLU de votre commune"
        />
      </Step>

      {/* ÉTAPE 5 — Informer le syndic */}
      <Step
        number={5}
        title="Informer votre syndic"
        description="Une fois la vente signée, le syndic doit mettre à jour les données de la copropriété"
        color="bg-amber-500"
      >
        <CheckItem
          icon={Bell}
          label="Notification de mutation"
          detail="Le notaire envoie une notification de mutation au syndic. Cela déclenche la mise à jour du registre des copropriétaires et le transfert du compte de charges au nouveau propriétaire."
          required
        />
        <CheckItem
          icon={Building2}
          label="Mise à jour dans Coplio"
          detail="Votre syndic mettra à jour le lot dans Coplio. L'acheteur pourra être invité sur le portail par le syndic une fois la vente enregistrée."
          required
        />
      </Step>

      {/* CTA Contacter syndic */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Besoin d'un document syndic ?</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Votre syndic peut fournir le pré-état daté, l'état daté, le carnet d'entretien et la fiche synthétique.
              Contactez-le directement via la messagerie.
            </p>
          </div>
        </div>
        <Link
          href="/mes-messages"
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Contacter mon syndic
        </Link>
      </div>

    </div>
  )
}
