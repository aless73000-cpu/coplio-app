import { Check } from 'lucide-react'

export default function QuiSommesNous() {
  return (
    <section id="qui-sommes-nous" className="py-32 bg-[#F7F8F7]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-20 items-center">

          {/* Left */}
          <div>
            <p className="text-xs font-semibold text-[#0A3D2B] uppercase tracking-[0.18em] mb-4">Qui sommes-nous</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#1D1D1F] mb-6" style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Nés de la frustration<br />des syndics indépendants
            </h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Coplio est né d&apos;un constat simple : les outils existants sont trop complexes, trop chers, ou pensés pour les grandes structures.
            </p>
            <p className="text-gray-400 leading-relaxed mb-10">
              Nous avons travaillé avec des syndics pour concevoir une solution intuitive, abordable et vraiment utile au quotidien.
            </p>
            <div className="space-y-3">
              {[
                'Fondé en France, pour le marché français',
                'Données hébergées en Europe (RGPD)',
                'Support disponible par messagerie',
                'Mises à jour basées sur vos retours',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-[#0A3D2B] rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-gray-500">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 bg-[#0A3D2B] rounded-3xl p-8">
              <p className="text-[#3CC49A] text-xs font-semibold uppercase tracking-widest mb-3">Notre mission</p>
              <p className="text-white text-lg font-semibold leading-relaxed" style={{ letterSpacing: '-0.015em' }}>
                Permettre à chaque syndic indépendant de se concentrer sur ses copropriétaires, pas sur l&apos;administration.
              </p>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-gray-100">
              <div className="text-4xl font-bold text-[#0A3D2B] mb-1" style={{ letterSpacing: '-0.03em' }}>2025</div>
              <div className="text-sm text-gray-400">Année de création</div>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-gray-100">
              <div className="text-4xl font-bold text-[#0A3D2B] mb-1" style={{ letterSpacing: '-0.03em' }}>100 %</div>
              <div className="text-sm text-gray-400">Indépendant & français</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
