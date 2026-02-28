import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function SalesChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tickFormatter={(value) => {
          const date = new Date(value);
          return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        }} />
        <YAxis />
        <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} />
        <Legend />
        <Line type="monotone" dataKey="total" stroke="#8884d8" name="Chiffre d'affaires (CDF)" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RegistrationsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short' })} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#82ca9d" name="Inscriptions" />
      </BarChart>
    </ResponsiveContainer>
  );
}