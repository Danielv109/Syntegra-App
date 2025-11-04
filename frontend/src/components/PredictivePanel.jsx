import React from "react";

export default function PredictivePanel({ predictive }) {
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
          marginBottom: 20,
          fontSize: 15,
          fontWeight: 600,
          color: "#ffffff",
        }}
      >
        Alertas predictivas
      </h3>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {predictive.map((p, i) => {
          const color =
            p.score > 60 ? "#10b981" : p.score > 30 ? "#818cf8" : "#ef4444";
          return (
            <li
              key={i}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#e4e4e7",
                  }}
                >
                  {p.name}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#ffffff",
                  }}
                >
                  {p.score}%
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  background: "#27272a",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${p.score}%`,
                    background: color,
                    borderRadius: 2,
                    boxShadow: `0 0 8px ${color}40`,
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  fontWeight: 500,
                }}
              >
                {p.trend === "up"
                  ? "↑ Tendencia al alza"
                  : p.trend === "down"
                  ? "↓ Tendencia a la baja"
                  : "→ Estable"}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
