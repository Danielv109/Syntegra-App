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

  if (!data) return <div>Cargando analytics...</div>;

  return (
    <div>
      <h1
        style={{
          fontSize: 28,
          marginBottom: 6,
          color: "#ffffff",
          fontWeight: 600,
        }}
      >
        Analytics - {client.name}
      </h1>
      <p style={{ color: "#94a3b8", marginBottom: 32, fontSize: 14 }}>
        Análisis profundo de{" "}
        <span style={{ color: "#ef4444" }}>tendencias</span>, comportamiento y
        métricas clave.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: "#18181b",
            padding: "20px 24px",
            borderRadius: 8,
            border: "1px solid #27272a",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#71717a",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              fontWeight: 500,
            }}
          >
            Total Mensajes
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              marginTop: 10,
              color: "#fafafa",
            }}
          >
            {data.overview.totalMessages}
          </div>
        </div>
        <div
          style={{
            background: "#18181b",
            padding: "20px 24px",
            borderRadius: 8,
            border: "1px solid #27272a",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#71717a",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              fontWeight: 500,
            }}
          >
            Sentimiento Promedio
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              marginTop: 10,
              color: "#fafafa",
            }}
          >
            {data.overview.avgSentiment}%
          </div>
        </div>
        <div
          style={{
            background: "#18181b",
            padding: "20px 24px",
            borderRadius: 8,
            border: "1px solid #27272a",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#71717a",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              fontWeight: 500,
            }}
          >
            Canal Principal
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              marginTop: 10,
              color: "#fafafa",
            }}
          >
            {data.overview.topChannel}
          </div>
        </div>
        <div
          style={{
            background: "#18181b",
            padding: "20px 24px",
            borderRadius: 8,
            border: "1px solid #27272a",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#71717a",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              fontWeight: 500,
            }}
          >
            Tasa de Respuesta
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              marginTop: 10,
              color: "#fafafa",
            }}
          >
            {data.overview.responseRate}%
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div
          style={{
            background: "#18181b",
            padding: 24,
            borderRadius: 8,
            border: "1px solid #27272a",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 24,
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
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

        <div
          style={{
            background: "#18181b",
            padding: 24,
            borderRadius: 8,
            border: "1px solid #27272a",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 24,
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
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

      <div
        style={{
          marginTop: 16,
          background: "#18181b",
          padding: 24,
          borderRadius: 8,
          border: "1px solid #27272a",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 20,
            color: "#ffffff",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          Comparativa por Canal
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #27272a" }}>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 0",
                  color: "#71717a",
                  fontWeight: 500,
                  fontSize: 12,
                }}
              >
                Canal
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 0",
                  color: "#71717a",
                  fontWeight: 500,
                  fontSize: 12,
                }}
              >
                Mensajes
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 0",
                  color: "#71717a",
                  fontWeight: 500,
                  fontSize: 12,
                }}
              >
                Sentimiento
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 0",
                  color: "#71717a",
                  fontWeight: 500,
                  fontSize: 12,
                }}
              >
                Tiempo de Respuesta
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.channelComparison).map(([key, value]) => (
              <tr key={key} style={{ borderBottom: "1px solid #27272a" }}>
                <td
                  style={{
                    padding: "14px 0",
                    fontWeight: 500,
                    color: "#fafafa",
                    fontSize: 13,
                  }}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </td>
                <td
                  style={{ padding: "14px 0", color: "#d4d4d8", fontSize: 13 }}
                >
                  {value.messages}
                </td>
                <td style={{ padding: "14px 0" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: 6,
                        background: "#27272a",
                        borderRadius: 3,
                      }}
                    >
                      <div
                        style={{
                          width: `${value.sentiment}%`,
                          height: "100%",
                          background: "#818cf8",
                          borderRadius: 3,
                          boxShadow: "0 0 8px #818cf840",
                        }}
                      />
                    </div>
                    <span
                      style={{ color: "#d4d4d8", fontSize: 13, minWidth: 40 }}
                    >
                      {value.sentiment}%
                    </span>
                  </div>
                </td>
                <td
                  style={{ padding: "14px 0", color: "#d4d4d8", fontSize: 13 }}
                >
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
