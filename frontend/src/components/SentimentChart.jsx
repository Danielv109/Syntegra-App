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
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="channel"
            stroke="#a1a1aa"
            tick={{ fill: "#a1a1aa" }}
          />
          <YAxis stroke="#a1a1aa" tick={{ fill: "#a1a1aa" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#fafafa" }}
            itemStyle={{ color: "#d4d4d8" }}
          />
          <Legend wrapperStyle={{ color: "#a1a1aa" }} />
          <Bar dataKey="positive" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="neutral" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="negative" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
