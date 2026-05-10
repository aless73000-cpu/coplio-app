'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { month: string; mrr: number }[]
}

export function MRRChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `${v}€`}
        />
        <Tooltip
          formatter={(value: number) => [`${value}€`, 'MRR']}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 13 }}
        />
        <Line
          type="monotone"
          dataKey="mrr"
          stroke="#0F6E56"
          strokeWidth={2.5}
          dot={{ fill: '#0F6E56', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
