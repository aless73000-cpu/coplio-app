'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'

// ─── Évolution mensuelle des charges ──────────────────────────

interface EvolutionData {
  mois: string
  emis: number
  recouvre: number
}

interface EvolutionProps {
  data: EvolutionData[]
}

export function EvolutionChart({ data }: EvolutionProps) {
  if (data.length === 0) return null

  return (
    <div className="coplio-card">
      <h2 className="font-semibold text-coplio-text mb-1">Évolution des charges</h2>
      <p className="text-xs text-muted-foreground mb-4">Charges émises vs recouvrées (6 derniers mois)</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
          <XAxis
            dataKey="mois"
            tick={{ fontSize: 11, fill: '#888' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#888' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value.toLocaleString('fr-FR')} €`,
              name === 'emis' ? 'Émis' : 'Recouvré',
            ]}
            contentStyle={{
              fontSize: 12,
              border: '1px solid #e5e5e5',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          />
          <Line
            type="monotone"
            dataKey="emis"
            stroke="#E6A93A"
            strokeWidth={2}
            dot={{ fill: '#E6A93A', strokeWidth: 0, r: 3 }}
            name="emis"
          />
          <Line
            type="monotone"
            dataKey="recouvre"
            stroke="#64748B"
            strokeWidth={2}
            dot={{ fill: "#64748B", strokeWidth: 0, r: 3 }}
            name="recouvre"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-coplio-amber rounded" />
          <span className="text-xs text-muted-foreground">Émis</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-[#64748B] rounded" />
          <span className="text-xs text-muted-foreground">Recouvré</span>
        </div>
      </div>
    </div>
  )
}

// ─── Taux de recouvrement global ──────────────────────────────

interface TauxGlobalProps {
  taux: number
  montantRecouvre: number
  montantTotal: number
}

export function TauxGlobalCard({ taux, montantRecouvre, montantTotal }: TauxGlobalProps) {
  const color = taux >= 90 ? '#64748B' : taux >= 70 ? '#E6A93A' : '#D04040'
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (taux / 100) * circumference

  return (
    <div className="coplio-card flex flex-col items-center justify-center text-center">
      <h2 className="font-semibold text-coplio-text mb-1 self-start">Taux global</h2>
      <p className="text-xs text-muted-foreground mb-4 self-start">Recouvrement sur l&apos;ensemble du portefeuille</p>

      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#F1EFE8" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-coplio-text">{taux}%</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 w-full">
        <div className="bg-slate-100 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">Recouvré</p>
          <p className="text-sm font-bold text-[#374151]">
            {montantRecouvre.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-coplio-red-bg rounded-lg p-2">
          <p className="text-xs text-muted-foreground">Restant</p>
          <p className="text-sm font-bold text-coplio-red">
            {(montantTotal - montantRecouvre).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Taux de recouvrement par copropriété ─────────────────────

interface TauxData {
  nom: string
  taux: number
  impayes: number
}

interface RecouvrementProps {
  data: TauxData[]
}

export function RecouvrementChart({ data }: RecouvrementProps) {
  if (data.length === 0) return null

  return (
    <div className="coplio-card">
      <h2 className="font-semibold text-coplio-text mb-1">Taux de recouvrement</h2>
      <p className="text-xs text-muted-foreground mb-4">Par copropriété (charges réglées / charges totales)</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="nom"
            tick={{ fontSize: 11, fill: '#888' }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#888' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(0)}%`, 'Taux']}
            contentStyle={{
              fontSize: 12,
              border: '1px solid #e5e5e5',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          />
          <Bar dataKey="taux" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.nom}
                fill={
                  entry.taux >= 90
                    ? '#64748B'
                    : entry.taux >= 70
                    ? '#E6A93A'
                    : '#D04040'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Répartition des copropriétés par statut ──────────────────

interface StatutData {
  name: string
  value: number
  color: string
}

interface StatutProps {
  aJour: number
  attention: number
  urgent: number
}

const RADIAN = Math.PI / 180
function renderLabel({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: {
  cx: number; cy: number; midAngle: number
  innerRadius: number; outerRadius: number; percent: number
}) {
  if (percent < 0.08) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function StatutChart({ aJour, attention, urgent }: StatutProps) {
  const total = aJour + attention + urgent
  if (total === 0) return null

  const data: StatutData[] = [
    { name: 'À jour', value: aJour, color: '#64748B' },
    { name: 'Attention', value: attention, color: '#E6A93A' },
    { name: 'Urgent', value: urgent, color: '#D04040' },
  ].filter((d) => d.value > 0)

  return (
    <div className="coplio-card">
      <h2 className="font-semibold text-coplio-text mb-1">État des copropriétés</h2>
      <p className="text-xs text-muted-foreground mb-2">Répartition par statut</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={renderLabel}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: 12, color: '#444441' }}>{value}</span>
            )}
          />
          <Tooltip
            formatter={(value: number) => [value, 'Copropriétés']}
            contentStyle={{
              fontSize: 12,
              border: '1px solid #e5e5e5',
              borderRadius: 8,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
