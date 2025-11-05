import React from "react";

const severityConfig = {
  high: { icon: "⚠️", badge: "badge-error" },
  medium: { icon: "📊", badge: "badge-warning" },
  low: { icon: "💡", badge: "badge-success" },
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
      <div className="card">
        <h3 className="mb-5 text-[15px] font-semibold text-text-primary">
          Alertas inteligentes
        </h3>
        <div className="text-center py-10 px-5 text-text-disabled">
          <div className="text-[40px] mb-3">✓</div>
          <div className="text-sm">No hay alertas críticas</div>
          <div className="text-xs mt-2">Todo funcionando correctamente</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-[15px] font-semibold text-text-primary">
          Alertas inteligentes
        </h3>
        <span className="text-xs text-text-disabled bg-dark-border px-2 py-1 rounded">
          {alerts.length} {alerts.length === 1 ? "alerta" : "alertas"}
        </span>
      </div>

      <ul className="flex flex-col gap-3.5 list-none p-0 m-0">
        {alerts.map((alert, i) => {
          const config = severityConfig[alert.severity];
          const icon = typeIcons[alert.type] || config.icon;

          return (
            <li
              key={i}
              className="p-4 rounded-lg bg-dark-bg border border-dark-border flex flex-col gap-2.5 transition-transform hover:translate-x-1"
            >
              <div className="flex items-start gap-3">
                <span className="text-lg leading-none">{icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h4 className="text-sm font-semibold text-text-secondary leading-tight">
                      {alert.title}
                    </h4>
                    <span
                      className={`${config.badge} uppercase text-[9px] font-semibold tracking-wide`}
                    >
                      {alert.severity}
                    </span>
                  </div>

                  <p className="text-[13px] text-text-muted leading-relaxed mb-2 opacity-90">
                    {alert.message}
                  </p>

                  {alert.action && (
                    <div className="p-3 bg-white/5 rounded-md border-l-[3px] border-accent-primary">
                      <div className="text-[10px] text-text-disabled mb-1 uppercase tracking-wider">
                        Acción recomendada
                      </div>
                      <div className="text-xs text-text-secondary leading-relaxed">
                        {alert.action}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {alert.timestamp && (
                <div className="text-[10px] text-text-disabled ml-8">
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
