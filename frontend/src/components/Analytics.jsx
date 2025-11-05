import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Analytics({ client }) {
  const [data, setData] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    axios
      .get(`${apiUrl}/api/analytics?clientId=${client.id}`)
      .then((r) => setData(r.data));
  }, [client]);

  if (!data)
    return <div className="text-sm text-text-muted">Cargando analytics...</div>;

  return (
    <div>
      <h1 className="text-3xl mb-2 text-text-primary font-bold">
        Analytics - {client.name}
      </h1>
      <p className="text-text-muted mb-8 text-sm">
        Análisis profundo de{" "}
        <span className="text-accent-error">tendencias</span>, comportamiento y
        métricas clave.
      </p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="text-xs text-text-disabled uppercase tracking-wider font-medium">
            Total Mensajes
          </div>
          <div className="text-[32px] font-bold mt-2 text-text-primary">
            {data.overview.totalMessages}
          </div>
        </div>
        <div className="card">
          <div className="text-xs text-text-disabled uppercase tracking-wider font-medium">
            Sentimiento Promedio
          </div>
          <div className="text-[32px] font-bold mt-2 text-text-primary">
            {data.overview.avgSentiment}%
          </div>
        </div>
        <div className="card">
          <div className="text-xs text-text-disabled uppercase tracking-wider font-medium">
            Canal Principal
          </div>
          <div className="text-[32px] font-bold mt-2 text-text-primary">
            {data.overview.topChannel}
          </div>
        </div>
        <div className="card">
          <div className="text-xs text-text-disabled uppercase tracking-wider font-medium">
            Tasa de Respuesta
          </div>
          <div className="text-[32px] font-bold mt-2 text-text-primary">
            {data.overview.responseRate}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h3 className="mt-0 mb-6 text-text-primary text-[15px] font-semibold">
            Tendencia Diaria
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.trends.daily}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272a"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="#71717a"
                style={{ fontSize: 12 }}
                tick={{ fill: "#71717a" }}
              />
              <YAxis
                stroke="#71717a"
                style={{ fontSize: 12 }}
                tick={{ fill: "#71717a" }}
              />
              <Tooltip
                contentStyle={{
                  background: "#27272a",
                  border: "1px solid #3f3f46",
                  borderRadius: 6,
                  color: "#fafafa",
                  fontSize: 13,
                }}
              />
              <Legend
                wrapperStyle={{ color: "#a1a1aa", fontSize: 13 }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="positive"
                stroke="#818cf8"
                name="Positivo"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="neutral"
                stroke="#a78bfa"
                name="Neutral"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="negative"
                stroke="#94a3b8"
                name="Negativo"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mt-0 mb-6 text-text-primary text-[15px] font-semibold">
            Tendencia Semanal
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.trends.weekly}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272a"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                stroke="#71717a"
                style={{ fontSize: 12 }}
                tick={{ fill: "#71717a" }}
              />
              <YAxis
                stroke="#71717a"
                style={{ fontSize: 12 }}
                tick={{ fill: "#71717a" }}
              />
              <Tooltip
                contentStyle={{
                  background: "#27272a",
                  border: "1px solid #3f3f46",
                  borderRadius: 6,
                  color: "#fafafa",
                  fontSize: 13,
                }}
                cursor={{ fill: "#27272a", opacity: 0.3 }}
              />
              <Legend
                wrapperStyle={{ color: "#a1a1aa", fontSize: 13 }}
                iconType="circle"
              />
              <Bar
                dataKey="positive"
                fill="#818cf8"
                name="Positivo"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="neutral"
                fill="#a78bfa"
                name="Neutral"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="negative"
                fill="#94a3b8"
                name="Negativo"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card mt-4">
        <h3 className="mt-0 mb-5 text-text-primary text-[15px] font-semibold">
          Comparativa por Canal
        </h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-dark-border">
              <th className="table-header">Canal</th>
              <th className="table-header">Mensajes</th>
              <th className="table-header">Sentimiento</th>
              <th className="table-header">Tiempo de Respuesta</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.channelComparison).map(([key, value]) => (
              <tr key={key} className="table-row">
                <td className="py-3.5 font-semibold text-text-primary text-[13px]">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </td>
                <td className="py-3.5 text-text-secondary text-[13px]">
                  {value.messages}
                </td>
                <td className="py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1 h-2 bg-dark-bg rounded">
                      <div
                        className="h-full bg-accent-primary rounded"
                        style={{ width: `${value.sentiment}%` }}
                      />
                    </div>
                    <span className="text-text-secondary text-[13px] min-w-[40px]">
                      {value.sentiment}%
                    </span>
                  </div>
                </td>
                <td className="py-3.5 text-text-secondary text-[13px]">
                  {value.responseTime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
