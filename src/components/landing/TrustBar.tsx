import { ShieldCheck, Zap, Users, Star } from 'lucide-react'

const stats = [
  { icon: Zap,         value: 'Lancement',    label: 'En phase de lancement',  sub: 'Soyez parmi les premiers adoptants' },
  { icon: Star,        value: 'Prix bloqué',  label: 'Tarif early adopter',    sub: 'Garanti à vie dès aujourd\'hui' },
  { icon: Users,       value: '100 %',        label: 'Conçu avec des syndics', sub: 'Chaque fonction validée terrain' },
  { icon: ShieldCheck, value: 'RGPD',         label: '100 % français',         sub: 'Données hébergées en Europe' },
]

export default function TrustBar() {
  return (
    <section className="py-16 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-10">
          Rejoignez les premiers syndics à moderniser leur gestion
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(({ icon: Icon, value, label, sub }) => (
            <div key={label}
              className="group relative flex flex-col gap-3 p-5 rounded-2xl border border-gray-100 bg-[#FAFAFA] hover:border-[#0F6E56]/20 hover:bg-white transition-all duration-200 hover:shadow-lg hover:shadow-black/[0.04] hover:-translate-y-0.5">
              <div className="w-10 h-10 bg-[#E5F5EF] rounded-xl flex items-center justify-center group-hover:bg-[#0F6E56] transition-colors">
                <Icon className="w-4.5 h-4.5 text-[#0F6E56] group-hover:text-white transition-colors" style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <div className="text-base font-bold text-[#0F6E56]" style={{ letterSpacing: '-0.01em' }}>{value}</div>
                <div className="text-sm font-semibold text-[#1D1D1F] leading-tight mt-0.5">{label}</div>
                <div className="text-xs text-gray-400 mt-1 leading-relaxed">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
