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
      <h1
        style={{
          fontSize: 28,
          marginBottom: 6,
          color: "#ffffff",
          fontWeight: 600,
        }}
      >
        Data Import - {client.name}
      </h1>
      <p style={{ color: "#94a3b8", marginBottom: 32, fontSize: 14 }}>
        Sube archivos CSV. El procesamiento se realiza en segundo plano por el
        sistema de colas.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24,
        }}
      >
        <div
          style={{
            background: "#18181b",
            padding: 24,
            borderRadius: 8,
            border: "1px solid #27272a",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            Subir archivo
          </h3>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 500,
                color: "#d4d4d8",
                fontSize: 13,
              }}
            >
              Canal
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 6,
                border: "1px solid #27272a",
                fontSize: 14,
                background: "#0d0d0d",
                color: "#d4d4d8",
              }}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="email">Email</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 500,
                color: "#d4d4d8",
                fontSize: 13,
              }}
            >
              Archivo CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 6,
                border: "1px solid #27272a",
                background: "#0d0d0d",
                color: "#d4d4d8",
                fontSize: 13,
              }}
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading || !file || currentJobId}
            style={{
              padding: "10px 20px",
              background:
                uploading || !file || currentJobId ? "#27272a" : "#6366f1",
              color: uploading || !file || currentJobId ? "#71717a" : "#fff",
              border: "none",
              borderRadius: 6,
              cursor:
                uploading || !file || currentJobId ? "not-allowed" : "pointer",
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            {uploading
              ? "Subiendo..."
              : currentJobId
              ? "Procesando..."
              : "Subir archivo"}
          </button>

          {/* Barra de progreso */}
          {jobProgress && (
            <div style={{ marginTop: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: "#d4d4d8",
                  }}
                >
                  Procesando: {jobProgress.processedRecords}/
                  {jobProgress.totalRecords} mensajes
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: "#6366f1",
                    fontWeight: 600,
                  }}
                >
                  {jobProgress.progress}%
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 8,
                  background: "#27272a",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${jobProgress.progress}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          )}

          {message && (
            <div
              style={{
                marginTop: 16,
                padding: "12px 16px",
                borderRadius: 6,
                background: message.startsWith("✅") ? "#1a231e" : "#261a1a",
                color: message.startsWith("✅") ? "#a7f3d0" : "#fca5a5",
                border: `1px solid ${
                  message.startsWith("✅") ? "#273830" : "#3a2626"
                }`,
                fontSize: 13,
              }}
            >
              {message}
            </div>
          )}
        </div>

        <div
          style={{
            background: "#18181b",
            padding: 24,
            borderRadius: 8,
            border: "1px solid #27272a",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            Ejemplo de CSV
          </h3>
          <pre
            style={{
              background: "#0d0d0d",
              padding: 16,
              borderRadius: 6,
              fontSize: 12,
              overflow: "auto",
              color: "#a1a1aa",
              border: "1px solid #27272a",
              lineHeight: 1.6,
            }}
          >
            {`text,timestamp,channel
Muy buen servicio,2025-01-01,whatsapp
El producto llegó tarde,2025-01-02,whatsapp
Excelente calidad,2025-01-03,email`}
          </pre>
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          background: "#18181b",
          padding: 24,
          borderRadius: 8,
          border: "1px solid #27272a",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            color: "#ffffff",
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          Historial de cargas
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #27272a" }}>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 0",
                  color: "#71717a",
                  fontWeight: 500,
                  fontSize: 12,
                }}
              >
                Archivo
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 0",
                  color: "#71717a",
                  fontWeight: 500,
                  fontSize: 12,
                }}
              >
                Total
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 0",
                  color: "#71717a",
                  fontWeight: 500,
                  fontSize: 12,
                }}
              >
                Procesados
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 0",
                  color: "#71717a",
                  fontWeight: 500,
                  fontSize: 12,
                }}
              >
                Estado
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 0",
                  color: "#71717a",
                  fontWeight: 500,
                  fontSize: 12,
                }}
              >
                Fecha
              </th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "#71717a",
                    fontSize: 13,
                  }}
                >
                  No hay cargas recientes
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr
                  key={item.jobId}
                  style={{ borderBottom: "1px solid #27272a" }}
                >
                  <td
                    style={{
                      padding: "14px 0",
                      color: "#d4d4d8",
                      fontSize: 13,
                    }}
                  >
                    {item.filename}
                  </td>
                  <td
                    style={{
                      padding: "14px 0",
                      color: "#d4d4d8",
                      fontSize: 13,
                    }}
                  >
                    {item.recordCount}
                  </td>
                  <td
                    style={{
                      padding: "14px 0",
                      color: "#d4d4d8",
                      fontSize: 13,
                    }}
                  >
                    {item.processedCount}
                  </td>
                  <td style={{ padding: "14px 0" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 4,
                        fontSize: 11,
                        background:
                          item.status === "completed"
                            ? "#1a231e"
                            : item.status === "processing"
                            ? "#1e1a15"
                            : item.status === "failed"
                            ? "#261a1a"
                            : "#1a1d28",
                        color:
                          item.status === "completed"
                            ? "#a7f3d0"
                            : item.status === "processing"
                            ? "#fcd34d"
                            : item.status === "failed"
                            ? "#fca5a5"
                            : "#c7d2fe",
                        border: `1px solid ${
                          item.status === "completed"
                            ? "#273830"
                            : item.status === "processing"
                            ? "#3a3226"
                            : item.status === "failed"
                            ? "#3a2626"
                            : "#272a38"
                        }`,
                        fontWeight: 500,
                        textTransform: "capitalize",
                      }}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "14px 0",
                      fontSize: 12,
                      color: "#71717a",
                    }}
                  >
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
