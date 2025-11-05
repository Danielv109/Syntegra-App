import React from "react";

const priorityColors = {
  high: "#ef4444",
  medium: "#a78bfa",
  low: "#818cf8",
};

export default function ActionsPanel({ actions }) {
  return (
    <div className="card">
      <h3 className="mb-5 text-[15px] font-semibold text-text-primary">
        Acciones sugeridas
      </h3>
      <ul className="flex flex-col gap-4 list-none p-0 m-0">
        {actions.map((a, i) => (
          <li
            key={i}
            className={`pb-4 ${
              i < actions.length - 1 ? "border-b border-dark-border" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-1 h-1 rounded-full mt-2 flex-shrink-0"
                style={{
                  background: priorityColors[a.priority],
                  boxShadow: `0 0 8px ${priorityColors[a.priority]}60`,
                }}
              />
              <div className="flex-1">
                <div className="font-medium text-sm mb-1.5 text-text-primary">
                  {a.title}
                </div>
                <div className="text-[13px] text-text-muted leading-relaxed">
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
