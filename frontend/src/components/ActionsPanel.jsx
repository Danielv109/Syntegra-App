import React from "react";

export default function ActionsPanel({ actions }) {
  if (!actions || actions.length === 0) {
    return (
      <div className="card">
        <h3 className="text-text-primary text-base font-semibold mb-4">
          Acciones Recomendadas
        </h3>
        <div className="text-center py-8 text-text-muted text-sm">
          No hay acciones disponibles
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-text-primary text-base font-semibold mb-4">
        Acciones Recomendadas
      </h3>
      <div className="space-y-3">
        {actions.map((action, idx) => (
          <div
            key={idx}
            className="p-4 bg-dark-bg border border-dark-border rounded-lg hover:border-accent-primary transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-text-primary font-medium text-sm">
                {action.title}
              </h4>
              <span
                className={`badge text-xs ${
                  action.priority === "high"
                    ? "badge-error"
                    : action.priority === "medium"
                    ? "badge-warning"
                    : "badge-success"
                }`}
              >
                {action.priority}
              </span>
            </div>
            <p className="text-text-muted text-xs leading-relaxed">
              {action.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
