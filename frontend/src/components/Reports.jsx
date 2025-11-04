import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Reports({ client }) {
  const [reports, setReports] = useState([]);
  const [generating, setGenerating] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    loadReports();
  }, [client]);

  const loadReports = async () => {
    const res = await axios.get(`${apiUrl}/api/reports?clientId=${client.id}`);
    setReports(res.data.reports || []);
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const res = await axios.post(`${apiUrl}/api/reports/generate`, {
        title: "Reporte Personalizado",
        type: "custom",
        clientId: client.id,
      });

      if (res.data.success) {
        alert(`✅ Reporte generado exitosamente`);
        setTimeout(() => {
          loadReports();
          setGenerating(false);
        }, 1000);
      }
    } catch (error) {
      console.error(error);
      alert(`❌ Error: ${error.response?.data?.error || error.message}`);
      setGenerating(false);
    }
  };

  const handleDownload = (reportId) => {
    const downloadUrl = `${apiUrl}/api/reports/download/${reportId}`;
    console.log("Descargando desde:", downloadUrl);

    // Crear elemento <a> temporal para forzar descarga
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `reporte_${reportId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              marginBottom: 6,
              color: "#ffffff",
              fontWeight: 600,
            }}
          >
            Reports - {client.name}
          </h1>
          <p style={{ color: "#94a3b8", margin: 0, fontSize: 14 }}>
            Genera reportes <span style={{ color: "#ef4444" }}>ejecutivos</span>{" "}
            en PDF, listos para compartir.
          </p>
        </div>
        <button
          onClick={generateReport}
          disabled={generating}
          style={{
            padding: "10px 20px",
            background: generating ? "#27272a" : "#6366f1",
            color: generating ? "#71717a" : "#fff",
            border: "none",
            borderRadius: 6,
            cursor: generating ? "not-allowed" : "pointer",
            fontWeight: 500,
            fontSize: 14,
            transition: "all 0.15s",
          }}
        >
          {generating ? "Generando..." : "Generar Reporte"}
        </button>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {reports.map((report) => (
          <div
            key={report.id}
            style={{
              background: "#18181b",
              padding: 24,
              borderRadius: 8,
              border: "1px solid #27272a",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 18,
                    color: "#ffffff",
                    fontWeight: 600,
                  }}
                >
                  {report.title}
                </h3>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 4,
                    fontSize: 11,
                    background: "#27272a",
                    color: "#a1a1aa",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    fontWeight: 500,
                  }}
                >
                  {report.type}
                </span>
              </div>
              <p
                style={{
                  color: "#94a3b8",
                  margin: 0,
                  fontSize: 14,
                  marginBottom: 6,
                }}
              >
                {report.filename || "Reporte generado"}
              </p>
              <p
                style={{
                  color: "#71717a",
                  margin: 0,
                  fontSize: 12,
                }}
              >
                Generado: {new Date(report.created_at).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => handleDownload(report.id)}
              style={{
                padding: "10px 20px",
                background: report.status === "ready" ? "#6366f1" : "#27272a",
                color: report.status === "ready" ? "#fff" : "#71717a",
                border: "none",
                borderRadius: 6,
                cursor: report.status === "ready" ? "pointer" : "not-allowed",
                fontWeight: 500,
                fontSize: 14,
              }}
              disabled={report.status !== "ready"}
            >
              {report.status === "ready" ? "Descargar PDF" : "Procesando..."}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
