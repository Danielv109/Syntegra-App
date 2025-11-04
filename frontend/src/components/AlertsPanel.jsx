import React from "react";

const severityStyles = {
  high: {
    bg: "#261a1a",
    color: "#fca5a5",
    border: "#3a2626",
    badge: "#ef4444",
  },
  medium: {
    bg: "#1a1d28",
    color: "#c7d2fe",
    border: "#272a38",
    badge: "#818cf8",
  },
  low: { bg: "#1a231e", color: "#a7f3d0", border: "#273830", badge: "#10b981" },
};

export default function AlertsPanel({ alerts }) {
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
        Alertas críticas
      </h3>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {alerts.map((a, i) => {
          const style = severityStyles[a.severity];
          return (
            <li
              key={i}
              style={{
                padding: "14px 16px",
                borderRadius: 6,
                background: style.bg,
                border: `1px solid ${style.border}`,
                display: "flex",
                alignItems: "start",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: style.badge,
                  marginTop: 6,
                  flexShrink: 0,
                  boxShadow: `0 0 10px ${style.badge}60`,
                }}
              />
              <span
                style={{
                  fontSize: 13,
                  color: style.color,
                  lineHeight: 1.6,
                  fontWeight: 400,
                }}
              >
                {a.message}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
