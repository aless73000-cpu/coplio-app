import { Check, X } from 'lucide-react'

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
    <section id="besoins" className="py-24 bg-[#F5F5F7]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-[11px] font-bold text-[#0F6E56] uppercase tracking-[0.18em]">Vos besoins</span>
          <h2 className="text-4xl font-bold text-[#1D1D1F] mt-3 mb-4 tracking-tight">
            On connaît vos problèmes
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Coplio a été conçu main dans la main avec des syndics indépendants.
          </p>
        </div>

        <div className="space-y-3">
          {items.map(({ before, after }, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#0F6E56]/20 transition-all hover:shadow-md">
              <div className="grid md:grid-cols-2 gap-4 items-center">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">{before}</p>
                </div>
                <div className="flex items-start gap-3 bg-[#F5F5F7] rounded-xl p-4">
                  <div className="w-6 h-6 bg-[#E5F5EF] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#0F6E56]" />
                  </div>
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
