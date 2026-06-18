export default function TrustBar() {
  const stats = [
    { value: 'Early adopter', label: 'Accès fondateur à tarif bloqué' },
    { value: '30 jours',      label: 'Essai gratuit, sans carte'       },
    { value: '< 1 jour',      label: 'Mise en service complète'        },
    { value: '100 % FR',      label: 'Données hébergées en Europe'     },
  ]

  return (
    <section className="py-16 bg-white border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-center text-[11px] font-semibold text-slate-300 uppercase tracking-[0.2em] mb-10">
          Pensé pour les syndics indépendants
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-[#374151] mb-1" style={{ letterSpacing: '-0.02em' }}>
                {value}
              </div>
              <div className="text-xs text-slate-400 leading-snug">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
