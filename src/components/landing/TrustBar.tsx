export default function TrustBar() {
  return (
    <section className="py-14 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-8">
          Rejoignez les premiers syndics à moderniser leur gestion
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { emoji: '🚀', label: 'En phase de lancement',       sub: 'Soyez parmi les premiers adoptants' },
            { emoji: '💰', label: 'Prix bloqué à vie',            sub: 'Tarif early adopter garanti' },
            { emoji: '🎯', label: 'Conçu avec des syndics',       sub: 'Chaque fonction validée terrain' },
            { emoji: '🇫🇷', label: '100 % français',             sub: 'Données hébergées en Europe · RGPD' },
          ].map(({ emoji, label, sub }) => (
            <div key={label} className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#F4F2EB] hover:bg-[#ECEAE2] transition-colors">
              <span className="text-2xl leading-none flex-shrink-0 mt-0.5">{emoji}</span>
              <div>
                <div className="text-sm font-bold text-[#1C1C1A] leading-tight">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
