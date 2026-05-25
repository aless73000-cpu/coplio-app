import { Check, X, ArrowRight } from 'lucide-react'

const items = [
  {
    before: 'Des documents éparpillés dans des dizaines de dossiers',
    after:  'Tous vos documents centralisés, accessibles en un clic, partagés avec les bons copropriétaires.',
  },
  {
    before: 'Des relances manuelles qui prennent des heures chaque mois',
    after:  'Coplio détecte les impayés et déclenche des relances au bon moment — zéro intervention de votre part.',
  },
  {
    before: "Des copropriétaires qui vous appellent pour tout et n'importe quoi",
    after:  'Le portail leur donne un accès autonome à leurs charges, travaux, documents et messagerie.',
  },
  {
    before: "Des AG laborieuses à préparer, animer et archiver",
    after:  "Préparez l'ordre du jour, envoyez les convocations et archivez les PV — directement depuis Coplio.",
  },
]

export default function ProblemSolution() {
  return (
    <section id="besoins" className="py-28 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[11px] font-bold text-[#0F6E56] uppercase tracking-[0.18em]">Vos besoins</span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1D1D1F] mt-3 mb-4 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
            On connaît vos problèmes
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Coplio a été conçu main dans la main avec des syndics indépendants.
          </p>
        </div>

        <div className="space-y-4">
          {items.map(({ before, after }, i) => (
            <div key={i} className="group grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:shadow-black/[0.06] transition-all duration-300">
              {/* Before */}
              <div className="flex items-start gap-4 p-6 bg-[#FFF5F5]">
                <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1.5">Avant</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{before}</p>
                </div>
              </div>
              {/* Arrow */}
              <div className="relative flex items-start gap-4 p-6 bg-[#F0FAF6]">
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full border border-gray-100 flex items-center justify-center shadow-sm z-10">
                  <ArrowRight className="w-3.5 h-3.5 text-[#0F6E56]" />
                </div>
                <div className="w-8 h-8 bg-[#E5F5EF] rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-[#0F6E56]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#0F6E56] uppercase tracking-widest mb-1.5">Avec Coplio</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{after}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
