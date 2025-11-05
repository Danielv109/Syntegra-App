import React from "react";

export default function KPIGrid({ kpis }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <div
          key={i}
          className="card transition-all hover:bg-dark-hover hover:border-dark-border"
        >
          <div className="text-xs text-text-disabled mb-2 uppercase tracking-wider font-medium">
            {kpi.label}
          </div>
          <div className="text-[32px] font-bold mb-1.5 text-text-primary leading-none">
            {kpi.value}
          </div>
          {kpi.delta && (
            <div
              className={`text-sm flex items-center gap-1 font-medium ${
                kpi.trend === "up"
                  ? "text-accent-success"
                  : kpi.trend === "down"
                  ? "text-accent-error"
                  : "text-text-disabled"
              }`}
            >
              <span className="text-xs">
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
