import React from "react";

export default function PredictivePanel({ predictive }) {
  if (!predictive || predictive.length === 0) {
    return (
      <div className="card">
        <h3 className="text-text-primary text-base font-semibold mb-4">
          Predicciones
        </h3>
        <div className="text-center py-8 text-text-muted text-sm">
          No hay predicciones disponibles
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-text-primary text-base font-semibold mb-4">
        Predicciones
      </h3>
      <div className="space-y-3">
        {predictive.map((pred, idx) => (
          <div
            key={idx}
            className="p-4 bg-dark-bg border border-dark-border rounded-lg"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-text-primary font-medium text-sm">
                {pred.metric}
              </h4>
              <span
                className={`badge text-xs ${
                  pred.trend === "up"
                    ? "badge-success"
                    : pred.trend === "down"
                    ? "badge-error"
                    : "badge-warning"
                }`}
              >
                {pred.prediction}
              </span>
            </div>
            <p className="text-text-muted text-xs">{pred.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
