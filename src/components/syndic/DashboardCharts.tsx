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
} from 'recharts'

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
                    ? '#0F6E56'
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
    { name: 'À jour', value: aJour, color: '#0F6E56' },
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
