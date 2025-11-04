import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function SentimentChart({ data }) {
  return (
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
          marginBottom: 24,
          fontSize: 15,
          fontWeight: 600,
          color: "#fafafa",
        }}
      >
        Sentimiento por canal
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#27272a"
            vertical={false}
          />
          <XAxis
            dataKey="channel"
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
            labelStyle={{ color: "#fafafa", fontWeight: 500 }}
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
  );
}
