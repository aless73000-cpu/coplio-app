import { X, Check } from 'lucide-react'

const items = [
  {
    before: 'Documents éparpillés dans des dizaines de dossiers',
    after:  'Tous vos documents centralisés, accessibles en un clic.',
  },
  {
    before: 'Relances manuelles qui prennent des heures chaque mois',
    after:  'Coplio détecte les impayés et déclenche les relances automatiquement.',
  },
  {
    before: "Copropriétaires qui appellent pour tout et n'importe quoi",
    after:  'Le portail leur donne un accès autonome à leurs charges et documents.',
  },
  {
    before: "AG laborieuses à préparer, animer et archiver",
    after:  "Préparez l'ordre du jour, envoyez les convocations, archivez les PV — depuis Coplio.",
  },
]

export default function ProblemSolution() {
  return (
    <section id="besoins" className="py-32 bg-white">
      <div className="max-w-5xl mx-auto px-6">

        {/* Header */}
        <div className="max-w-2xl mb-20">
          <p className="text-xs font-semibold text-[#0A3D2B] uppercase tracking-[0.18em] mb-4">Vos besoins</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#1D1D1F] mb-5" style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            On connaît<br />vos problèmes
          </h2>
          <p className="text-lg text-gray-400">
            Coplio a été conçu main dans la main avec des syndics indépendants.
          </p>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {items.map(({ before, after }, i) => (
            <div key={i} className="grid md:grid-cols-2 overflow-hidden rounded-2xl border border-gray-100">
              {/* Avant */}
              <div className="flex gap-4 p-6 bg-[#FAFAFA]">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X className="w-3 h-3 text-red-500" />
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{before}</p>
              </div>
              {/* Après */}
              <div className="flex gap-4 p-6 bg-[#F0FAF5]">
                <div className="w-6 h-6 rounded-full bg-[#0A3D2B] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <p className="text-sm text-[#1D1D1F] leading-relaxed">{after}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
