import React from "react";

export default function KPIGrid({ kpis }) {
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}
    >
      {kpis.map((kpi, i) => (
        <div
          key={i}
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
              marginBottom: 10,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}
          >
            {kpi.label}
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              marginBottom: 8,
              color: "#fafafa",
              lineHeight: 1,
            }}
          >
            {kpi.value}
          </div>
          {kpi.delta && (
            <div
              style={{
                fontSize: 13,
                color:
                  kpi.trend === "up"
                    ? "#10b981"
                    : kpi.trend === "down"
                    ? "#ef4444"
                    : "#94a3b8",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontWeight: 500,
              }}
            >
              <span style={{ fontSize: 11 }}>
                {kpi.trend === "up" ? "↑" : kpi.trend === "down" ? "↓" : "→"}
              </span>
              <span>{kpi.delta}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
