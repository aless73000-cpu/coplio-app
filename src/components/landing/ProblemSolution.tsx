import { X, Check } from 'lucide-react'
import { Reveal } from './Reveal'

const items = [
  { before: 'Documents éparpillés dans des dizaines de dossiers',              after: 'Tous vos documents centralisés, accessibles en un clic.' },
  { before: 'Relances manuelles qui prennent des heures chaque mois',          after: 'Coplio détecte les impayés et déclenche les relances automatiquement.' },
  { before: "Copropriétaires qui appellent pour tout et n'importe quoi",       after: 'Le portail leur donne un accès autonome à leurs charges et documents.' },
  { before: "AG laborieuses à préparer, animer et archiver",                   after: "Préparez l'ordre du jour, envoyez les convocations, archivez les PV — depuis Coplio." },
]

export default function ProblemSolution() {
  return (
    <section id="besoins" className="py-32 bg-white">
      <div className="max-w-5xl mx-auto px-6">

        <Reveal className="max-w-2xl mb-20">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.18em] mb-4">Vos besoins</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#374151] mb-5" style={{ letterSpacing: '-0.03em', lineHeight: 1.08 }}>
            On connaît<br />vos problèmes
          </h2>
          <p className="text-lg text-slate-400">
            Conçu main dans la main avec des syndics indépendants.
          </p>
        </Reveal>

        <div className="space-y-3">
          {items.map(({ before, after }, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="grid md:grid-cols-2 overflow-hidden rounded-2xl border border-slate-100">
                <div className="flex gap-4 p-6 bg-slate-50">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="w-3 h-3 text-red-400" />
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{before}</p>
                </div>
                <div className="flex gap-4 p-6 bg-white">
                  <div className="w-6 h-6 rounded-full bg-[#374151] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-sm text-[#374151] font-medium leading-relaxed">{after}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  )
}
