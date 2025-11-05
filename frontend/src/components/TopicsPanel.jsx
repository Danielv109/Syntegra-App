import React from "react";

const sentimentColors = {
  positive: "#818cf8",
  neutral: "#a78bfa",
  negative: "#94a3b8",
};

export default function TopicsPanel({ topics }) {
  return (
    <div className="card">
      <h3 className="mb-5 text-[15px] font-semibold text-text-primary">
        Temas recurrentes
      </h3>
      <ul className="list-none p-0 m-0">
        {topics.map((t, i) => (
          <li
            key={i}
            className={`flex justify-between items-center py-3.5 ${
              i < topics.length - 1 ? "border-b border-dark-border" : ""
            }`}
          >
            <div>
              <span className="font-medium text-text-primary text-sm">
                {t.topic}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-text-disabled">
                {t.count} menciones
              </span>
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
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
