import React from "react";

export default function TopicsPanel({ topics }) {
  if (!topics || topics.length === 0) {
    return (
      <div className="card">
        <h3 className="text-text-primary text-base font-semibold mb-4">
          Topics Principales
        </h3>
        <div className="text-center py-8 text-text-muted text-sm">
          No hay topics disponibles
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...topics.map((t) => t.count));

  return (
    <div className="card">
      <h3 className="text-text-primary text-base font-semibold mb-4">
        Topics Principales
      </h3>
      <div className="space-y-3">
        {topics.map((topic, idx) => {
          const widthPercentage = (topic.count / maxCount) * 100;
          const sentimentColor =
            topic.sentiment === "positive"
              ? "bg-accent-success"
              : topic.sentiment === "negative"
              ? "bg-accent-error"
              : "bg-accent-warning";

          return (
            <div key={idx}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-text-secondary text-sm font-medium capitalize">
                  {topic.topic}
                </span>
                <span className="text-text-muted text-xs">{topic.count}</span>
              </div>
              <div className="w-full h-2 bg-dark-border rounded overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${sentimentColor}`}
                  style={{ width: `${widthPercentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
