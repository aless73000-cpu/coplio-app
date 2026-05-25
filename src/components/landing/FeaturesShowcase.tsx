'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Building2, Users, FileText,
  Check, ArrowRight,
  BarChart3, Receipt,
  AlertTriangle, CalendarDays, MessageCircle, CheckCircle2, ChevronDown,
} from 'lucide-react'

/* ── Preview components ─────────────────────────────────────────── */

function DashboardPreview() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {([
          {v:'12',  l:'Copropriétés', c:'text-[#374151]',  bg:'bg-[#F1F5F9]'},
          {v:'284', l:'Lots gérés',   c:'text-blue-600',   bg:'bg-blue-50'},
          {v:'3',   l:'Sinistres',    c:'text-amber-600',  bg:'bg-amber-50'},
          {v:'1.4k€',l:'Impayés',    c:'text-red-500',    bg:'bg-red-50'},
        ] as const).map(({v,l,c,bg}) => (
          <div key={l} className={`${bg} rounded-xl p-3`}>
            <div className={`text-xl font-bold ${c}`}>{v}</div>
            <div className="text-[10px] text-gray-500">{l}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-3 border border-gray-100">
        <div className="text-xs font-semibold text-gray-500 mb-2">Recouvrement — 6 mois</div>
        <div className="flex items-end gap-1.5 h-16">
          {[62,71,78,74,88,94].map((h,i) => (
            <div key={i} className="flex-1 rounded-md" style={{height:`${h}%`,background:i===5?'#374151':i>=4?'#6DC5A8':'#F1F5F9'}} />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-gray-300 mt-1">
          {['Jan','Fév','Mar','Avr','Mai','Jun'].map(m => <span key={m}>{m}</span>)}
        </div>
      </div>
      <div className="bg-[#FFF7ED] border border-amber-100 rounded-xl p-3 flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-semibold text-amber-700">Résidence du Parc</div>
          <div className="text-[10px] text-amber-600">2 impayés détectés · relance suggérée</div>
        </div>
      </div>
    </div>
  )
}

function CoproprietePreview() {
  return (
    <div className="space-y-2">
      {([
        {nom:'Résidence Bellevue',    ville:'Lyon · 18 lots',      statut:'À jour',   sc:'bg-[#F1F5F9] text-[#374151]'},
        {nom:'Le Clos Saint-Martin',  ville:'Paris · 32 lots',     statut:'Attention',sc:'bg-amber-50 text-amber-700'},
        {nom:'Villa des Pins',        ville:'Marseille · 8 lots',  statut:'Urgent',   sc:'bg-red-50 text-red-600'},
        {nom:'Les Hauts de Vienne',   ville:'Bordeaux · 24 lots',  statut:'À jour',   sc:'bg-[#F1F5F9] text-[#374151]'},
      ] as const).map(({nom,ville,statut,sc}) => (
        <div key={nom} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#F1F5F9] rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-[#374151]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#1D1D1F]">{nom}</div>
              <div className="text-[10px] text-gray-400">{ville}</div>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc}`}>{statut}</span>
        </div>
      ))}
    </div>
  )
}

function CoproprietairesPreview() {
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-3 bg-gray-50 px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
          <span>Copropriétaire</span><span>Lot</span><span>Statut</span>
        </div>
        {([
          {n:'M. Martin',  lot:'A12', s:'À jour',   sc:'text-[#374151]'},
          {n:'Mme Dupont', lot:'B04', s:'En retard',sc:'text-red-500'},
          {n:'M. Leroy',   lot:'C07', s:'À jour',   sc:'text-[#374151]'},
          {n:'Mme Bernard',lot:'A03', s:'À jour',   sc:'text-[#374151]'},
        ] as const).map(({n,lot,s,sc}) => (
          <div key={n} className="grid grid-cols-3 px-3 py-2.5 border-t border-gray-50 text-xs">
            <span className="font-medium text-[#1D1D1F]">{n}</span>
            <span className="text-gray-400">{lot}</span>
            <span className={`font-semibold ${sc}`}>{s}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 bg-[#F1F5F9] rounded-xl p-3">
        <CheckCircle2 className="w-4 h-4 text-[#374151] flex-shrink-0" />
        <span className="text-xs text-[#374151] font-medium">3 invitations envoyées aujourd&apos;hui</span>
      </div>
    </div>
  )
}

function ChargesPreview() {
  return (
    <div className="space-y-2.5">
      {([
        {ref:'ACH-2025-001',cp:'M. Martin', mt:'420 €',s:'Payé',   p:100,pc:'bg-[#374151]', sc:'bg-[#F1F5F9] text-[#374151]'},
        {ref:'ACH-2025-002',cp:'Mme Dupont',mt:'435 €',s:'Partiel',p:60, pc:'bg-amber-400', sc:'bg-amber-50 text-amber-700'},
        {ref:'ACH-2025-003',cp:'M. Leroy',  mt:'390 €',s:'Impayé', p:0,  pc:'bg-red-400',   sc:'bg-red-50 text-red-600'},
      ] as const).map(({ref,cp,mt,s,p,pc,sc}) => (
        <div key={ref} className="bg-white border border-gray-100 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-xs font-semibold text-[#1D1D1F]">{cp}</div>
              <div className="text-[10px] text-gray-400">{ref} · {mt}</div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc}`}>{s}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className={`${pc} h-1.5 rounded-full`} style={{width:`${p}%`}} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DocumentsPreview() {
  return (
    <div className="space-y-2">
      {([
        {emoji:'📋',cat:'Procès-verbaux AG',        nb:'12 docs',date:'15 mai 2025'},
        {emoji:'📄',cat:'Contrats & assurances',    nb:'8 docs', date:'3 avr. 2025'},
        {emoji:'🏗️',cat:'Plans & diagnostics',     nb:'5 docs', date:'12 jan. 2025'},
        {emoji:'📜',cat:'Règlements copropriété',   nb:'4 docs', date:'1 mars 2025'},
      ] as const).map(({emoji,cat,nb,date}) => (
        <div key={cat} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3 group">
          <span className="text-xl">{emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-[#1D1D1F] truncate">{cat}</div>
            <div className="text-[10px] text-gray-400">{nb} · Dernier : {date}</div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
        </div>
      ))}
    </div>
  )
}

function SinistresPreview() {
  return (
    <div className="grid grid-cols-3 gap-2 h-full">
      {([
        {label:'Signalé', bc:'border-amber-200 bg-amber-50',         tc:'text-amber-700',   items:['Dégât des eaux — Bellevue','Fissure façade — Le Clos']},
        {label:'En cours',bc:'border-blue-200 bg-blue-50',           tc:'text-blue-700',    items:['Ascenseur — Villa des Pins']},
        {label:'Clôturé', bc:'border-[#374151]/20 bg-[#F1F5F9]',    tc:'text-[#374151]',   items:['Toiture — Les Hauts','Chaudière — Arc']},
      ] as const).map(({label,bc,tc,items}) => (
        <div key={label} className={`border rounded-xl p-2.5 ${bc}`}>
          <div className={`text-[10px] font-bold mb-2 ${tc}`}>{label}</div>
          <div className="space-y-1.5">
            {items.map(item => (
              <div key={item} className="bg-white rounded-lg p-2 shadow-sm">
                <div className="text-[9px] text-gray-600 font-medium leading-tight">{item}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function AGPreview() {
  return (
    <div className="space-y-3">
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-amber-600 font-bold text-base leading-none">24</span>
            <span className="text-amber-500/70 text-[9px] uppercase">Jun</span>
          </div>
          <div>
            <div className="text-sm font-bold text-[#1D1D1F]">AG Ordinaire 2025</div>
            <div className="text-xs text-gray-400">Résidence Bellevue · 18 copropriétaires</div>
            <span className="inline-block mt-1 text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Convocations envoyées ✓</span>
          </div>
        </div>
        <div className="space-y-1.5">
          {([
            {step:'Planification',done:true},
            {step:'Ordre du jour',done:true},
            {step:'Convocations', done:true},
            {step:"Tenue de l'AG",done:false},
            {step:'PV archivé',   done:false},
          ] as const).map(({step,done}) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${done?'bg-[#F1F5F9]':'bg-gray-100'}`}>
                {done && <Check className="w-2.5 h-2.5 text-[#374151]" />}
              </div>
              <span className={`text-xs ${done?'text-gray-600':'text-gray-300'}`}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MessageriePreview() {
  return (
    <div className="space-y-2.5">
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {([
          {n:'M. Martin', msg:"La fuite dans mon appartement n'est pas réparée...",time:'10:24',unread:true},
          {n:'Mme Dupont',msg:'Merci pour la convocation AG.',                     time:'Hier', unread:false},
          {n:'M. Leroy',  msg:'Pouvez-vous me renvoyer la quittance Q1 ?',         time:'Lun.', unread:false},
        ] as const).map(({n,msg,time,unread}) => (
          <div key={n} className={`flex items-start gap-3 px-3 py-2.5 border-b border-gray-50 last:border-0 ${unread?'bg-[#F5F5F7]':''}`}>
            <div className="w-7 h-7 bg-[#374151] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[9px] font-bold">{n[2]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${unread?'text-[#1D1D1F]':'text-gray-500'}`}>{n}</span>
                <span className="text-[9px] text-gray-300">{time}</span>
              </div>
              <p className="text-[10px] text-gray-400 truncate">{msg}</p>
            </div>
            {unread && <div className="w-1.5 h-1.5 rounded-full bg-[#374151] flex-shrink-0 mt-1.5" />}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input readOnly value="Bonjour M. Martin, notre technicien..." className="flex-1 text-[11px] bg-white border border-gray-100 rounded-xl px-3 py-2 text-gray-400" />
        <button className="bg-[#374151] text-white px-3 py-2 rounded-xl flex-shrink-0">
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

/* ── Features data ──────────────────────────────────────────────── */

const FEATURES_DATA = [
  {
    icon: BarChart3,
    label: 'Tableau de bord',
    color: 'text-[#374151]',
    bg: 'bg-[#F1F5F9]',
    headline: 'Pilotez tout votre portefeuille en temps réel',
    desc: 'Un tableau de bord pensé pour les syndics actifs : KPIs essentiels, graphiques de recouvrement, alertes prioritaires et rapports PDF en un clic.',
    bullets: [
      'KPIs : copropriétés, lots, sinistres ouverts, impayés',
      'Graphique de recouvrement sur les 6 derniers mois',
      'Alertes automatiques sur les copropriétés en difficulté',
      'Génération de rapports PDF mensuel & trimestriel',
    ],
    Preview: DashboardPreview,
  },
  {
    icon: Building2,
    label: 'Copropriétés',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    headline: "Votre portefeuille d'immeubles en un seul endroit",
    desc: 'Centralisez toutes vos résidences, suivez leur statut en temps réel et accédez instantanément à la fiche de chaque copropriété.',
    bullets: [
      'Fiche complète : adresse, lots, copropriétaires, statut',
      'Statuts automatiques : À jour / Attention / Urgent',
      'Accès rapide aux documents, AG et sinistres liés',
      'Vue globale ou détail par résidence',
    ],
    Preview: CoproprietePreview,
  },
  {
    icon: Users,
    label: 'Copropriétaires',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    headline: 'Un portail dédié pour chaque copropriétaire',
    desc: 'Invitez vos copropriétaires en un clic. Ils accèdent à leurs charges, documents et sinistres depuis leur espace personnel, 24h/24.',
    bullets: [
      'Invitation par lien magique — sans mot de passe à créer',
      'Accès aux charges, quittances et documents liés',
      'Messagerie directe syndic ↔ copropriétaire',
      'Historique complet des paiements et communications',
    ],
    Preview: CoproprietairesPreview,
  },
  {
    icon: Receipt,
    label: 'Appels de charges',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    headline: 'Facturation et recouvrement simplifiés',
    desc: "Émettez vos appels de fonds trimestriels, suivez les paiements en temps réel et déclenchez des relances automatiques pour les retards.",
    bullets: [
      "Création d'appels de charges par lot et par copropriété",
      'Suivi des paiements et taux de recouvrement en direct',
      'Relances automatiques à J+30, J+60, J+90',
      'Export PDF des appels et quittances de charges',
    ],
    Preview: ChargesPreview,
  },
  {
    icon: FileText,
    label: 'Documents',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    headline: 'Tous vos documents, organisés et accessibles',
    desc: "Centralisez PV d'AG, contrats, plans et règlements dans un espace sécurisé. Partagez-les automatiquement avec les bons copropriétaires.",
    bullets: [
      'Catégories : PV, contrats, plans, règlements, assurances',
      'Partage sélectif par copropriété ou copropriétaire',
      'Recherche plein-texte dans tous vos documents',
      'Historique des accès et des versions',
    ],
    Preview: DocumentsPreview,
  },
  {
    icon: AlertTriangle,
    label: 'Sinistres',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    headline: 'Suivez chaque sinistre de A à Z',
    desc: 'Déclarez, instruisez et clôturez vos dossiers sinistres dans un espace centralisé. Chaque étape est tracée, chaque interlocuteur notifié.',
    bullets: [
      'Déclaration en ligne avec photos et pièces jointes',
      'Suivi : signalé → expertise → travaux → clôturé',
      'Notification automatique au copropriétaire concerné',
      'Archivage complet du dossier à la clôture',
    ],
    Preview: SinistresPreview,
  },
  {
    icon: CalendarDays,
    label: 'Assemblées générales',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    headline: 'Des AG préparées, animées et archivées sans effort',
    desc: "De la planification à l'archivage du PV, Coplio structure chaque étape de votre assemblée générale pour que rien ne soit oublié.",
    bullets: [
      "Création de l'ordre du jour et des résolutions",
      'Envoi des convocations par email en un clic',
      'Enregistrement des votes et présences',
      'Génération et archivage automatique du PV',
    ],
    Preview: AGPreview,
  },
  {
    icon: MessageCircle,
    label: 'Messagerie',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    headline: 'Toutes vos communications au même endroit',
    desc: "Échangez directement avec vos copropriétaires depuis Coplio. Plus de boîtes email dispersées — tout l'historique est centralisé.",
    bullets: [
      'Messagerie directe syndic ↔ copropriétaire',
      'Notifications push et email pour chaque message',
      'Pièces jointes et documents partagés dans les échanges',
      'Historique complet archivé par copropriété',
    ],
    Preview: MessageriePreview,
  },
]

/* ── Main component ─────────────────────────────────────────────── */

export default function FeaturesShowcase() {
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    const handler = (e: Event) => setActiveTab((e as CustomEvent<number>).detail)
    window.addEventListener('featureTabChange', handler)
    return () => window.removeEventListener('featureTabChange', handler)
  }, [])

  const feature = FEATURES_DATA[activeTab]
  const PreviewComponent = feature.Preview

  return (
    <section id="fonctionnalites" className="py-24 bg-white scroll-mt-[66px]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-[11px] font-bold text-[#374151] uppercase tracking-[0.18em]">Découvrez chaque module</span>
          <h2 className="text-4xl font-bold text-[#1D1D1F] mt-3 mb-4 tracking-tight">
            Une fonctionnalité pour chaque besoin
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Cliquez sur un module pour explorer ce qu&apos;il vous apporte au quotidien.
          </p>
        </div>

        {/* Tab bar — scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {FEATURES_DATA.map(({ icon: Icon, label }, idx) => (
            <button
              key={label}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === idx
                  ? 'bg-[#374151] text-white shadow-md shadow-[#374151]/20'
                  : 'bg-[#F5F5F7] text-gray-500 hover:bg-[#E8E5DC] hover:text-[#1D1D1F]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div
          key={activeTab}
          className="grid md:grid-cols-2 gap-6 md:gap-8 bg-[#F5F5F7] rounded-3xl p-5 sm:p-8 border border-gray-100"
          style={{ animation: 'fadeUp .35s ease both' }}
        >
          {/* Left — description */}
          <div className="flex flex-col justify-center">
            <div className={`w-12 h-12 ${feature.bg} rounded-2xl flex items-center justify-center mb-5`}>
              <feature.icon className={`w-6 h-6 ${feature.color}`} />
            </div>
            <h3 className="text-2xl font-bold text-[#1D1D1F] mb-3 leading-tight">
              {feature.headline}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">{feature.desc}</p>
            <ul className="space-y-3">
              {feature.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 bg-[#F1F5F9] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-[#374151]" />
                  </div>
                  <span className="text-gray-600">{b}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="mt-7 inline-flex items-center gap-2 bg-[#374151] text-white text-sm font-bold px-5 py-3 rounded-xl hover:bg-[#4B5563] transition-colors self-start shadow-md shadow-[#374151]/20"
            >
              Essayer gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right — preview (masqué sur mobile) */}
          <div className="hidden md:block bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
              </div>
              <div className="flex-1 text-center text-[10px] text-gray-300 font-mono">
                app.coplio.fr / {feature.label.toLowerCase().replace(/\s/g, '-')}
              </div>
            </div>
            <PreviewComponent />
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={() => setActiveTab((t) => (t - 1 + FEATURES_DATA.length) % FEATURES_DATA.length)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#374151] transition-colors px-3 py-1.5 rounded-xl hover:bg-[#F5F5F7]"
          >
            <ChevronDown className="w-4 h-4 rotate-90" /> Précédent
          </button>
          <div className="flex gap-1.5">
            {FEATURES_DATA.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`rounded-full transition-all ${activeTab === idx ? 'w-5 h-2 bg-[#374151]' : 'w-2 h-2 bg-gray-200 hover:bg-gray-300'}`}
              />
            ))}
          </div>
          <button
            onClick={() => setActiveTab((t) => (t + 1) % FEATURES_DATA.length)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#374151] transition-colors px-3 py-1.5 rounded-xl hover:bg-[#F5F5F7]"
          >
            Suivant <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
        </div>
      </div>
    </section>
  )
}
