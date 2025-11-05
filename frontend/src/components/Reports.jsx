import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Reports({ client }) {
  const [reports, setReports] = useState([]);
  const [generating, setGenerating] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    loadReports();
  }, []);

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
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `reporte_${reportId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl mb-2 text-text-primary font-bold">
            Reports - {client.name}
          </h1>
          <p className="text-text-muted text-sm">
            Genera reportes{" "}
            <span className="text-accent-error">ejecutivos</span> en PDF, listos
            para compartir.
          </p>
        </div>
        <button
          onClick={generateReport}
          disabled={generating}
          className="btn-primary"
        >
          {generating ? "Generando..." : "Generar Reporte"}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="card flex justify-between items-center"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg text-text-primary font-medium">
                  {report.title}
                </h3>
                <span className="badge bg-dark-border text-text-muted border-dark-border uppercase text-[11px] tracking-wider font-semibold">
                  {report.type}
                </span>
              </div>
              <p className="text-text-muted text-sm mb-1.5">
                {report.filename || "Reporte generado"}
              </p>
              <p className="text-text-disabled text-xs">
                Generado: {new Date(report.created_at).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => handleDownload(report.id)}
              disabled={report.status !== "ready"}
              className={
                report.status === "ready"
                  ? "btn-primary"
                  : "btn-secondary cursor-not-allowed"
              }
            >
              {report.status === "ready" ? "Descargar PDF" : "Procesando..."}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
