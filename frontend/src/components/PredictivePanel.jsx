import React from "react";

export default function PredictivePanel({ predictive }) {
  return (
    <div className="card">
      <h3 className="mb-5 text-[15px] font-semibold text-text-primary">
        Alertas predictivas
      </h3>
      <ul className="flex flex-col gap-4 list-none p-0 m-0">
        {predictive.map((p, i) => {
          const color =
            p.score > 60 ? "#10b981" : p.score > 30 ? "#a78bfa" : "#ef4444";
          return (
            <li key={i} className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-medium text-text-secondary">
                  {p.name}
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {p.score}%
                </span>
              </div>
              <div className="h-1 bg-dark-bg rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all"
                  style={{
                    width: `${p.score}%`,
                    background: color,
                    boxShadow: `0 0 8px ${color}40`,
                  }}
                />
              </div>
              <div className="text-[11px] text-text-disabled font-medium">
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
