import { Check, Heart } from 'lucide-react'

export default function QuiSommesNous() {
  return (
    <section id="qui-sommes-nous" className="py-24 bg-[#F5F5F7]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-[11px] font-bold text-[#0F6E56] uppercase tracking-[0.18em]">Qui sommes-nous</span>
            <h2 className="text-4xl font-bold text-[#1D1D1F] mt-3 mb-6 tracking-tight">
              Nés de la frustration<br />des syndics indépendants
            </h2>
            <p className="text-gray-500 leading-relaxed mb-5">
              Coplio est né d&apos;un constat simple : les outils de gestion de copropriété existants sont trop complexes,
              trop chers, ou pensés pour les grandes structures. Les syndics indépendants méritent mieux.
            </p>
            <p className="text-gray-500 leading-relaxed mb-8">
              Nous avons travaillé main dans la main avec des syndics pour concevoir une solution intuitive,
              abordable et vraiment utile au quotidien. Coplio, c&apos;est le logiciel qu&apos;on aurait voulu avoir.
            </p>
            <div className="space-y-3">
              {[
                'Fondé en France, pour le marché français',
                'Données hébergées en Europe (RGPD)',
                'Support disponible par messagerie',
                'Mises à jour régulières basées sur vos retours',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-[#E5F5EF] rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-[#0F6E56]" />
                  </div>
                  <span className="text-sm text-gray-600">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#E5F5EF] rounded-3xl p-6 col-span-2 border border-[#0F6E56]/10">
              <Heart className="w-8 h-8 text-[#0F6E56] mb-3" />
              <h3 className="font-bold text-[#0F6E56] text-lg mb-2">Notre mission</h3>
              <p className="text-[#0F6E56]/75 text-sm leading-relaxed">
                Permettre à chaque syndic indépendant de se concentrer sur ce qui compte vraiment :
                le service à ses copropriétaires, pas l&apos;administration.
              </p>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-[#0F6E56] mb-1">2025</div>
              <div className="text-sm text-gray-500">Année de création</div>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-[#0F6E56] mb-1">100 %</div>
              <div className="text-sm text-gray-500">Indépendant & français</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
