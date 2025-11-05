import React, { useEffect, useState } from "react";
import axios from "axios";
import KPIGrid from "./KPIGrid";
import SentimentChart from "./SentimentChart";
import TopicsPanel from "./TopicsPanel";
import AlertsPanel from "./AlertsPanel";
import PredictivePanel from "./PredictivePanel";
import ActionsPanel from "./ActionsPanel";

export default function Dashboard({ client }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
    axios
      .get(`${apiUrl}/api/insights?clientId=${client.id}`)
      .then((r) => {
        setInsights(r.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading insights:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [client]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="text-lg text-text-muted">Cargando insights...</div>
      </div>
    );

  if (error)
    return (
      <div className="p-6 bg-accent-error/10 rounded-lg text-accent-error border border-accent-error/20">
        Error al cargar datos: {error}
      </div>
    );

  if (!insights) return null;

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl mb-2 text-text-primary font-bold">
          Dashboard - {client.name}
        </h1>
        <p className="text-text-muted text-sm">
          Syntegra convierte{" "}
          <span className="text-accent-error">conversaciones</span> y datos
          dispersos en <span className="text-accent-success">decisiones</span>{" "}
          que impulsan tu negocio.
        </p>
      </header>

      <KPIGrid kpis={insights.kpis} />

      <div className="grid grid-cols-[2fr_1fr] gap-4 mt-6">
        <div className="flex flex-col gap-4">
          <SentimentChart data={insights.sentimentByChannel} />
          <TopicsPanel topics={insights.topics} />
          <ActionsPanel actions={insights.actions} />
        </div>

        <div className="flex flex-col gap-4">
          <AlertsPanel alerts={insights.alerts} />
          <PredictivePanel predictive={insights.predictive} />
        </div>
      </div>
    </div>
  );
}
