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
  const [error, setError] = useState("");

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
        console.log("📊 Estado del job:", res.data);
        setJobProgress(res.data);

        if (res.data.state === "completed") {
          setCurrentJobId(null);
          setJobProgress(null);
          loadHistory();
          setMessage(
            `✅ Procesamiento completado: ${res.data.processedRecords} mensajes clasificados`
          );
          setError("");
        } else if (res.data.state === "failed") {
          setCurrentJobId(null);
          setJobProgress(null);
          loadHistory();
          setError(
            `❌ Error en procesamiento: ${
              res.data.error || "Error desconocido"
            }`
          );
          setMessage("");
        }
      } catch (error) {
        console.error("Error checking job status:", error);
        // Si el job no existe, probablemente falló al crearse
        if (error.response?.status === 404) {
          setCurrentJobId(null);
          setJobProgress(null);
          setError("❌ El trabajo no se encontró. Intenta de nuevo.");
        }
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
      alert("Por favor selecciona un archivo");
      return;
    }

    setUploading(true);
    setMessage("");
    setError("");

    try {
      // Crear FormData y enviar archivo binario
      const formData = new FormData();
      formData.append("file", file);
      formData.append("clientId", client.id); // IMPORTANTE: Enviar clientId
      formData.append("channel", channel || "csv");

      console.log("📤 Subiendo archivo con clientId:", client.id);

      const res = await axios.post(`${apiUrl}/api/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ Upload exitoso:", res.data);

      setCurrentJobId(res.data.jobId);
      setFile(null);
    } catch (error) {
      console.error("❌ Error en upload:", error);
      const errorMsg = error.response?.data?.error || error.message;
      setError("Error al subir archivo: " + errorMsg);
      alert("Error: " + errorMsg);
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
            <label className="block text-sm font-medium text-text-secondary mb-2">
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
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Archivo CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input-field text-[13px]"
            />
            {file && (
              <div className="mt-2 text-xs text-text-muted">
                Archivo seleccionado: {file.name} (
                {(file.size / 1024).toFixed(2)} KB)
              </div>
            )}
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
                  {jobProgress.state === "processing"
                    ? "Procesando"
                    : "En cola"}
                  : {jobProgress.processedRecords || 0}/
                  {jobProgress.totalRecords || 0} mensajes
                </span>
                <span className="text-[13px] text-accent-primary font-semibold">
                  {jobProgress.progress || 0}%
                </span>
              </div>
              <div className="w-full h-2 bg-dark-border rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-300"
                  style={{ width: `${jobProgress.progress || 0}%` }}
                />
              </div>
              {jobProgress.state === "pending" && (
                <div className="mt-2 text-xs text-text-muted">
                  ⏳ Esperando en cola...
                </div>
              )}
            </div>
          )}

          {message && (
            <div className="mt-4 px-4 py-3 rounded-md text-[13px] bg-accent-success/10 text-accent-success border border-accent-success/20">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-4 px-4 py-3 rounded-md text-[13px] bg-accent-error/10 text-accent-error border border-accent-error/20">
              {error}
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
                  className="py-16 text-center text-text-disabled"
                >
                  No hay cargas recientes
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr
                  key={item.jobId}
                  className="table-row hover:bg-dark-hover transition-colors"
                >
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
                      className={`badge ${
                        item.status === "completed"
                          ? "badge-success"
                          : item.status === "processing"
                          ? "badge-warning"
                          : item.status === "failed"
                          ? "badge-error"
                          : "bg-dark-border text-text-muted border-dark-border"
                      } capitalize font-medium`}
                    >
                      {item.status}
                    </span>
                    {item.error && (
                      <div className="text-xs text-accent-error mt-1">
                        {item.error}
                      </div>
                    )}
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
