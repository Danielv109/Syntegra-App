import React, { useState, useEffect } from "react";
import axios from "axios";

export default function DataImport({ client }) {
  const [file, setFile] = useState(null);
  const [channel, setChannel] = useState("whatsapp");
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [currentJobId, setCurrentJobId] = useState(null);
  const [jobProgress, setJobProgress] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    loadHistory();
  }, []);

  // Monitorear progreso del trabajo actual
  useEffect(() => {
    if (!currentJobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(
          `${apiUrl}/api/process/status/${currentJobId}`
        );
        setJobProgress(res.data);

        if (res.data.state === "completed" || res.data.state === "failed") {
          setCurrentJobId(null);
          setJobProgress(null);
          loadHistory();

          if (res.data.state === "completed") {
            setMessage(
              `✅ Procesamiento completado: ${res.data.processedRecords} mensajes clasificados`
            );
          } else {
            setMessage(`❌ Error en procesamiento: ${res.data.error}`);
          }
        }
      } catch (error) {
        console.error("Error checking job status:", error);
      }
    }, 2000); // Check cada 2 segundos

    return () => clearInterval(interval);
  }, [currentJobId]);

  const loadHistory = async () => {
    try {
      const res = await axios.get(
        `${apiUrl}/api/upload/history?clientId=${client.id}`
      );
      setHistory(res.data.uploads || []);
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Por favor selecciona un archivo");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      // Crear FormData y enviar archivo binario
      const formData = new FormData();
      formData.append("file", file);
      formData.append("clientId", client.id);
      formData.append("channel", channel);

      const res = await axios.post(`${apiUrl}/api/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage(`✅ ${res.data.message}`);
      setCurrentJobId(res.data.jobId);
      setFile(null);
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl mb-2 text-text-primary font-bold">
        Data Import - {client.name}
      </h1>
      <p className="text-text-muted mb-8 text-sm">
        Sube archivos CSV. El procesamiento se realiza en segundo plano por el
        sistema de colas.
      </p>

      <div className="grid grid-cols-[2fr_1fr] gap-6">
        <div className="card">
          <h3 className="mt-0 text-text-primary text-[15px] font-semibold mb-5">
            Subir archivo
          </h3>

          <div className="mb-5">
            <label className="block mb-2 font-medium text-text-secondary text-[13px]">
              Canal
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="input-field"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="email">Email</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>

          <div className="mb-5">
            <label className="block mb-2 font-medium text-text-secondary text-[13px]">
              Archivo CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input-field text-[13px]"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading || !file || currentJobId}
            className="btn-primary"
          >
            {uploading
              ? "Subiendo..."
              : currentJobId
              ? "Procesando..."
              : "Subir archivo"}
          </button>

          {jobProgress && (
            <div className="mt-5">
              <div className="flex justify-between mb-2">
                <span className="text-[13px] text-text-secondary">
                  Procesando: {jobProgress.processedRecords}/
                  {jobProgress.totalRecords} mensajes
                </span>
                <span className="text-[13px] text-accent-primary font-semibold">
                  {jobProgress.progress}%
                </span>
              </div>
              <div className="w-full h-2 bg-dark-border rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-300"
                  style={{ width: `${jobProgress.progress}%` }}
                />
              </div>
            </div>
          )}

          {message && (
            <div
              className={`mt-4 px-4 py-3 rounded-md text-[13px] ${
                message.startsWith("✅")
                  ? "bg-accent-success/10 text-accent-success border border-accent-success/20"
                  : "bg-accent-error/10 text-accent-error border border-accent-error/20"
              }`}
            >
              {message}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="mt-0 text-text-primary text-[15px] font-semibold mb-4">
            Ejemplo de CSV
          </h3>
          <pre className="bg-dark-bg p-4 rounded-md text-xs overflow-auto text-text-muted border border-dark-border leading-relaxed">
            {`text,timestamp,channel
Muy buen servicio,2025-01-01,whatsapp
El producto llegó tarde,2025-01-02,whatsapp
Excelente calidad,2025-01-03,email`}
          </pre>
        </div>
      </div>

      <div className="card mt-6">
        <h3 className="mt-0 text-text-primary text-[15px] font-semibold mb-5">
          Historial de cargas
        </h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-dark-border">
              <th className="table-header">Archivo</th>
              <th className="table-header">Total</th>
              <th className="table-header">Procesados</th>
              <th className="table-header">Estado</th>
              <th className="table-header">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-text-disabled text-[13px]"
                >
                  No hay cargas recientes
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr key={item.jobId} className="table-row">
                  <td className="py-3.5 text-text-secondary text-[13px]">
                    {item.filename}
                  </td>
                  <td className="py-3.5 text-text-secondary text-[13px]">
                    {item.recordCount}
                  </td>
                  <td className="py-3.5 text-text-secondary text-[13px]">
                    {item.processedCount}
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`badge capitalize font-medium ${
                        item.status === "completed"
                          ? "badge-success"
                          : item.status === "processing"
                          ? "badge-warning"
                          : item.status === "failed"
                          ? "badge-error"
                          : "bg-dark-border text-text-muted border border-dark-border"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-xs text-text-disabled">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
