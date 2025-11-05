import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Analytics({ client }) {
  const [analytics, setAnalytics] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    axios
      .get(`${apiUrl}/api/analytics?clientId=${client.id}`)
      .then((r) => setAnalytics(r.data));
  }, [client]);

  if (!analytics)
    return <div className="text-sm text-text-muted">Cargando analytics...</div>;

  return (
    <div>
      <h1 className="text-3xl mb-2 text-text-primary font-bold">
        Analytics - {client.name}
      </h1>
      <p className="text-text-muted mb-8 text-sm">
        Análisis detallado de tendencias y comparativas por canal.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="card">
          <div className="text-text-disabled text-xs font-semibold uppercase tracking-wider mb-2">
            Total Mensajes
          </div>
          <div className="text-3xl font-bold text-text-primary">
            {analytics.overview.totalMessages}
          </div>
        </div>
        <div className="card">
          <div className="text-text-disabled text-xs font-semibold uppercase tracking-wider mb-2">
            Sentimiento Promedio
          </div>
          <div className="text-3xl font-bold text-accent-success">
            {analytics.overview.avgSentiment}%
          </div>
        </div>
        <div className="card">
          <div className="text-text-disabled text-xs font-semibold uppercase tracking-wider mb-2">
            Canal Principal
          </div>
          <div className="text-2xl font-semibold text-text-primary capitalize">
            {analytics.overview.topChannel}
          </div>
        </div>
        <div className="card">
          <div className="text-text-disabled text-xs font-semibold uppercase tracking-wider mb-2">
            Tasa de Respuesta
          </div>
          <div className="text-3xl font-bold text-text-primary">
            {analytics.overview.responseRate}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="text-text-primary text-base font-semibold mb-5">
            Tendencia Diaria (Últimos 7 días)
          </h3>
          <div className="space-y-3">
            {analytics.trends.daily.map((day, idx) => {
              const total = day.positive + day.neutral + day.negative;
              return (
                <div key={idx}>
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>{day.date}</span>
                    <span>{total} mensajes</span>
                  </div>
                  <div className="flex h-6 rounded overflow-hidden">
                    {day.positive > 0 && (
                      <div
                        className="bg-accent-success flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${(day.positive / total) * 100}%` }}
                      >
                        {day.positive}
                      </div>
                    )}
                    {day.neutral > 0 && (
                      <div
                        className="bg-accent-warning flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${(day.neutral / total) * 100}%` }}
                      >
                        {day.neutral}
                      </div>
                    )}
                    {day.negative > 0 && (
                      <div
                        className="bg-accent-error flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${(day.negative / total) * 100}%` }}
                      >
                        {day.negative}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="text-text-primary text-base font-semibold mb-5">
            Tendencia Semanal (Últimas 4 semanas)
          </h3>
          <div className="space-y-3">
            {analytics.trends.weekly.map((week, idx) => {
              const total = week.positive + week.neutral + week.negative;
              return (
                <div key={idx}>
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>{week.week}</span>
                    <span>{total} mensajes</span>
                  </div>
                  <div className="flex h-6 rounded overflow-hidden">
                    {week.positive > 0 && (
                      <div
                        className="bg-accent-success flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${(week.positive / total) * 100}%` }}
                      >
                        {week.positive}
                      </div>
                    )}
                    {week.neutral > 0 && (
                      <div
                        className="bg-accent-warning flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${(week.neutral / total) * 100}%` }}
                      >
                        {week.neutral}
                      </div>
                    )}
                    {week.negative > 0 && (
                      <div
                        className="bg-accent-error flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${(week.negative / total) * 100}%` }}
                      >
                        {week.negative}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-text-primary text-base font-semibold mb-5">
          Comparativa por Canal
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="table-header">Canal</th>
                <th className="table-header">Mensajes</th>
                <th className="table-header">Sentimiento</th>
                <th className="table-header">Tiempo Respuesta</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analytics.channelComparison).map(
                ([channel, data]) => (
                  <tr
                    key={channel}
                    className="table-row hover:bg-dark-hover transition-colors"
                  >
                    <td className="py-3.5 text-text-secondary text-sm capitalize font-medium">
                      {channel}
                    </td>
                    <td className="py-3.5 text-text-secondary text-sm">
                      {data.messages}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`badge ${
                          data.sentiment >= 60
                            ? "badge-success"
                            : data.sentiment >= 40
                            ? "badge-warning"
                            : "badge-error"
                        } font-medium`}
                      >
                        {data.sentiment}%
                      </span>
                    </td>
                    <td className="py-3.5 text-text-secondary text-sm">
                      {data.responseTime}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
