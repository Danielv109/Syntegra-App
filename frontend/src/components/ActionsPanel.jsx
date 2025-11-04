import React from "react";

const priorityColors = {
  high: "#ef4444",
  medium: "#a78bfa",
  low: "#818cf8",
};

export default function ActionsPanel({ actions }) {
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
        Acciones sugeridas
      </h3>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {actions.map((a, i) => (
          <li
            key={i}
            style={{
              paddingBottom: 16,
              borderBottom:
                i < actions.length - 1 ? "1px solid #27272a" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "start", gap: 12 }}>
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: priorityColors[a.priority],
                  marginTop: 8,
                  flexShrink: 0,
                  boxShadow: `0 0 8px ${priorityColors[a.priority]}60`,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 500,
                    fontSize: 14,
                    marginBottom: 6,
                    color: "#ffffff",
                  }}
                >
                  {a.title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#a1a1aa",
                    lineHeight: 1.6,
                  }}
                >
                  {a.description}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
