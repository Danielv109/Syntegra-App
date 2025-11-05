import React from "react";

const severityStyles = {
  high: {
    bg: "#1e1315",
    color: "#fca5a5",
    border: "#3a2626",
    badge: "#ef4444",
    icon: "⚠️",
  },
  medium: {
    bg: "#1e1a15",
    color: "#fcd34d",
    border: "#3a3226",
    badge: "#f59e0b",
    icon: "📊",
  },
  low: {
    bg: "#151e1a",
    color: "#86efac",
    border: "#263a32",
    badge: "#10b981",
    icon: "💡",
  },
};

const typeIcons = {
  spike: "📈",
  pattern: "🔄",
  trend: "📉",
  channel: "📱",
  opportunity: "✨",
  action_required: "👤",
  data_gap: "📭",
};

export default function AlertsPanel({ alerts }) {
  if (!alerts || alerts.length === 0) {
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
          Alertas inteligentes
        </h3>
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#71717a",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          <div style={{ fontSize: 14 }}>No hay alertas críticas</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>
            Todo funcionando correctamente
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#18181b",
        padding: 24,
        borderRadius: 8,
        border: "1px solid #27272a",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h3
          style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#ffffff" }}
        >
          Alertas inteligentes
        </h3>
        <span
          style={{
            fontSize: 11,
            color: "#71717a",
            background: "#27272a",
            padding: "4px 8px",
            borderRadius: 4,
          }}
        >
          {alerts.length} {alerts.length === 1 ? "alerta" : "alertas"}
        </span>
      </div>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {alerts.map((alert, i) => {
          const style = severityStyles[alert.severity];
          const icon = typeIcons[alert.type] || style.icon;

          return (
            <li
              key={i}
              style={{
                padding: "16px 18px",
                borderRadius: 8,
                background: style.bg,
                border: `1px solid ${style.border}`,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <div style={{ display: "flex", alignItems: "start", gap: 12 }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 600,
                        color: style.color,
                        lineHeight: 1.4,
                      }}
                    >
                      {alert.title}
                    </h4>
                    <span
                      style={{
                        padding: "2px 6px",
                        borderRadius: 3,
                        fontSize: 9,
                        background: style.badge,
                        color: "#fff",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        fontWeight: 600,
                      }}
                    >
                      {alert.severity}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: 13,
                      color: style.color,
                      lineHeight: 1.6,
                      opacity: 0.9,
                    }}
                  >
                    {alert.message}
                  </p>

                  {alert.action && (
                    <div
                      style={{
                        padding: "8px 12px",
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: 6,
                        borderLeft: `3px solid ${style.badge}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: "#94a3b8",
                          marginBottom: 4,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Acción recomendada
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#d4d4d8",
                          lineHeight: 1.5,
                        }}
                      >
                        {alert.action}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {alert.timestamp && (
                <div style={{ fontSize: 10, color: "#71717a", marginLeft: 30 }}>
                  {new Date(alert.timestamp).toLocaleString("es-ES", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
