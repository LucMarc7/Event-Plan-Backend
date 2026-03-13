import React from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Graphique des ventes (courbe)
export function SalesChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="month"
          tickFormatter={(value) =>
            new Date(value).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
          }
          tick={{ fill: '#0f172a', fontSize: 12 }}
          axisLine={{ stroke: '#cbd5e1' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#0f172a', fontSize: 12 }}
          axisLine={{ stroke: '#cbd5e1' }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0f172a',
            border: 'none',
            borderRadius: '8px',
            color: '#f8fafc',
            padding: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
          labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
          itemStyle={{ color: '#10b981' }}
          labelFormatter={(value) =>
            new Date(value).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
          }
        />
        <Legend
          wrapperStyle={{ color: '#0f172a', paddingTop: 10 }}
          formatter={(value) => <span style={{ color: '#0f172a', fontWeight: 500 }}>{value}</span>}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#10b981"
          strokeWidth={3}
          dot={{ fill: '#10b981', stroke: '#10b981', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
          name="Chiffre d'affaires (CDF)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Graphique des inscriptions (barres)
export function RegistrationsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="month"
          tickFormatter={(value) =>
            new Date(value).toLocaleDateString('fr-FR', { month: 'short' })
          }
          tick={{ fill: '#0f172a', fontSize: 12 }}
          axisLine={{ stroke: '#cbd5e1' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#0f172a', fontSize: 12 }}
          axisLine={{ stroke: '#cbd5e1' }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0f172a',
            border: 'none',
            borderRadius: '8px',
            color: '#f8fafc',
            padding: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
          labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
          itemStyle={{ color: '#10b981' }}
          labelFormatter={(value) =>
            new Date(value).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
          }
        />
        <Legend
          wrapperStyle={{ color: '#0f172a', paddingTop: 10 }}
          formatter={(value) => <span style={{ color: '#0f172a', fontWeight: 500 }}>{value}</span>}
        />
        <Bar
          dataKey="count"
          fill="#10b981"
          radius={[4, 4, 0, 0]}
          barSize={30}
          name="Inscriptions"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}