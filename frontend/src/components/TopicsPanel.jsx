import React from "react";

const sentimentColors = {
  positive: "#818cf8",
  neutral: "#a78bfa",
  negative: "#94a3b8",
};

export default function TopicsPanel({ topics }) {
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
        Temas recurrentes
      </h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {topics.map((t, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 0",
              borderBottom:
                i < topics.length - 1 ? "1px solid #27272a" : "none",
            }}
          >
            <div>
              <span
                style={{
                  fontWeight: 500,
                  color: "#fafafa",
                  fontSize: 14,
                }}
              >
                {t.topic}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 13, color: "#94a3b8" }}>
                {t.count} menciones
              </span>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: sentimentColors[t.sentiment],
                  boxShadow: `0 0 8px ${sentimentColors[t.sentiment]}40`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
