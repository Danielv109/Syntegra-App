import React, { useState, useEffect } from "react";
import axios from "axios";

export default function DataImport({ client }) {
  const [file, setFile] = useState(null);
  const [channel, setChannel] = useState("whatsapp");
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/upload/history`);
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
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      const data = lines.slice(1).map((line) => {
        const [text, timestamp] = line.split(",");
        return { text: text?.trim(), timestamp: timestamp?.trim() };
      });

      const res = await axios.post(`${apiUrl}/api/upload`, {
        filename: file.name,
        channel,
        data,
      });

      setMessage(`✅ ${res.data.message} (${res.data.recordCount} registros)`);
      setFile(null);
      loadHistory();
    } catch (error) {
      setMessage("❌ Error al subir archivo");
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
      <p style={{ color: "#71717a", marginBottom: 32, fontSize: 14 }}>
        Sube archivos CSV, JSON o conecta tus canales de comunicación
        directamente.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
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
              accept=".csv,.txt"
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
            disabled={uploading || !file}
            style={{
              padding: "10px 20px",
              background: uploading || !file ? "#27272a" : "#6366f1",
              color: uploading || !file ? "#71717a" : "#fff",
              border: "none",
              borderRadius: 6,
              cursor: uploading || !file ? "not-allowed" : "pointer",
              fontWeight: 500,
              fontSize: 14,
              transition: "all 0.15s",
            }}
          >
            {uploading ? "Subiendo..." : "Subir archivo"}
          </button>

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
            {`text,timestamp
Muy buen servicio,2025-01-01
El producto llegó tarde,2025-01-02
Excelente calidad,2025-01-03`}
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
                Canal
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
                Registros
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
                    {item.channel}
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
                  <td style={{ padding: "14px 0" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 4,
                        fontSize: 11,
                        background:
                          item.status === "completed" ? "#1a231e" : "#261a1a",
                        color:
                          item.status === "completed" ? "#a7f3d0" : "#fca5a5",
                        border: `1px solid ${
                          item.status === "completed" ? "#273830" : "#3a2626"
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
