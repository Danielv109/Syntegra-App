import React, { useState, useEffect } from "react";
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
      await axios.post(`${apiUrl}/api/reports/generate`, {
        clientId: client.id,
        title: `Reporte ${new Date().toLocaleDateString()}`,
        type: "custom",
      });
      loadReports();
    } catch (error) {
      alert("Error al generar reporte");
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = (report) => {
    window.open(`${apiUrl}/api/reports/download/${report.filename}`, "_blank");
  };

  return (
    <div>
      <h1 className="text-3xl mb-2 text-text-primary font-bold">
        Reports - {client.name}
      </h1>
      <p className="text-text-muted mb-8 text-sm">
        Genera reportes en PDF con análisis completos y visualizaciones.
      </p>

      <button
        onClick={generateReport}
        disabled={generating}
        className="btn-primary mb-6"
      >
        {generating ? "Generando..." : "+ Generar Reporte"}
      </button>

      <div className="card">
        <h3 className="text-text-primary text-base font-semibold mb-5">
          Reportes Generados
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="table-header">Título</th>
                <th className="table-header">Tipo</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Fecha</th>
                <th className="table-header">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-16 text-center text-text-disabled"
                  >
                    No hay reportes generados
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr
                    key={report.id}
                    className="table-row hover:bg-dark-hover transition-colors"
                  >
                    <td className="py-3.5 text-text-secondary text-sm">
                      {report.title}
                    </td>
                    <td className="py-3.5 text-text-muted text-sm capitalize">
                      {report.type}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`badge ${
                          report.status === "ready"
                            ? "badge-success"
                            : "bg-dark-border text-text-muted"
                        } capitalize font-medium`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-text-disabled text-xs">
                      {new Date(report.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5">
                      {report.status === "ready" && (
                        <button
                          onClick={() => downloadReport(report)}
                          className="px-3 py-1.5 bg-accent-primary hover:bg-accent-secondary text-white rounded-md text-xs font-medium transition-all"
                        >
                          Descargar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
