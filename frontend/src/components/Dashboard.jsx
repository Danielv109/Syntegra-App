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
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <div style={{ fontSize: 14, color: "#71717a" }}>
          Cargando insights...
        </div>
      </div>
    );

  if (error)
    return (
      <div
        style={{
          padding: 24,
          background: "#18181b",
          borderRadius: 8,
          color: "#fca5a5",
          border: "1px solid #3f2528",
        }}
      >
        Error al cargar datos: {error}
      </div>
    );

  if (!insights) return null;

  return (
    <div>
      <header style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 28,
            marginBottom: 6,
            color: "#ffffff",
            fontWeight: 600,
          }}
        >
          Dashboard - {client.name}
        </h1>
        <p
          style={{
            color: "#94a3b8",
            fontSize: 14,
            fontWeight: 400,
          }}
        >
          Syntegra convierte{" "}
          <span style={{ color: "#ef4444" }}>conversaciones</span> y datos
          dispersos en <span style={{ color: "#10b981" }}>decisiones</span> que
          impulsan tu negocio.
        </p>
      </header>

      <KPIGrid kpis={insights.kpis} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 16,
          marginTop: 24,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SentimentChart data={insights.sentimentByChannel} />
          <TopicsPanel topics={insights.topics} />
          <ActionsPanel actions={insights.actions} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <AlertsPanel alerts={insights.alerts} />
          <PredictivePanel predictive={insights.predictive} />
        </div>
      </div>
    </div>
  );
}
