import React, { useEffect, useState } from "react";
import axios from "axios";

export default function DataExplorer({ client }) {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [dateRange, setDateRange] = useState("7d");
  const [channelFilter, setChannelFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    loadMessages();
  }, [client]);

  useEffect(() => {
    applyFilters();
  }, [
    messages,
    dateRange,
    channelFilter,
    sentimentFilter,
    topicFilter,
    searchTerm,
  ]);

  const loadMessages = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/messages/${client.id}`);
      setMessages(res.data.messages || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading messages:", error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...messages];

    // Filtro de fecha
    if (dateRange !== "all") {
      const days = parseInt(dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter((m) => new Date(m.timestamp) >= cutoff);
    }

    // Filtro de canal
    if (channelFilter !== "all") {
      filtered = filtered.filter((m) => m.channel === channelFilter);
    }

    // Filtro de sentimiento
    if (sentimentFilter !== "all") {
      filtered = filtered.filter((m) => m.sentiment === sentimentFilter);
    }

    // Filtro de tema
    if (topicFilter !== "all") {
      filtered = filtered.filter((m) => m.topic === topicFilter);
    }

    // Búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter((m) =>
        m.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMessages(filtered);
  };

  const exportToCSV = () => {
    const headers = [
      "Fecha",
      "Canal",
      "Mensaje",
      "Sentimiento",
      "Tema",
      "Intención",
    ];
    const rows = filteredMessages.map((m) => [
      new Date(m.timestamp).toLocaleString(),
      m.channel,
      `"${m.text.replace(/"/g, '""')}"`,
      m.sentiment,
      m.topic,
      m.intent,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${client.name.replace(
      /\s+/g,
      "_"
    )}_data_export_${Date.now()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <div style={{ fontSize: 14, color: "#71717a" }}>Cargando datos...</div>
      </div>
    );
  }

  return (
    <div>
      <header
        style={{
          marginBottom: 32,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
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
            Explorador de Datos
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            Explora, filtra y exporta todos los mensajes de {client.name}
          </p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={filteredMessages.length === 0}
          style={{
            padding: "10px 20px",
            background: filteredMessages.length === 0 ? "#27272a" : "#6366f1",
            color: filteredMessages.length === 0 ? "#71717a" : "#fff",
            border: "none",
            borderRadius: 6,
            cursor: filteredMessages.length === 0 ? "not-allowed" : "pointer",
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          Exportar CSV ({filteredMessages.length})
        </button>
      </header>

      {/* Filtros */}
      <div
        style={{
          background: "#18181b",
          padding: 24,
          borderRadius: 8,
          border: "1px solid #27272a",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                color: "#d4d4d8",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Rango de Fecha
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #27272a",
                background: "#0d0d0d",
                color: "#e4e4e7",
                fontSize: 13,
              }}
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="all">Todo</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                color: "#d4d4d8",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Canal
            </label>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #27272a",
                background: "#0d0d0d",
                color: "#e4e4e7",
                fontSize: 13,
              }}
            >
              <option value="all">Todos</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="email">Email</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                color: "#d4d4d8",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Sentimiento
            </label>
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #27272a",
                background: "#0d0d0d",
                color: "#e4e4e7",
                fontSize: 13,
              }}
            >
              <option value="all">Todos</option>
              <option value="positive">Positivo</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negativo</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                color: "#d4d4d8",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Tema
            </label>
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #27272a",
                background: "#0d0d0d",
                color: "#e4e4e7",
                fontSize: 13,
              }}
            >
              <option value="all">Todos</option>
              <option value="entrega">Entrega</option>
              <option value="precio">Precio</option>
              <option value="calidad">Calidad</option>
              <option value="atencion">Atención</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                color: "#d4d4d8",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Buscar
            </label>
            <input
              type="text"
              placeholder="Buscar en mensajes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #27272a",
                background: "#0d0d0d",
                color: "#e4e4e7",
                fontSize: 13,
              }}
            />
          </div>
        </div>

        <div style={{ fontSize: 13, color: "#71717a" }}>
          Mostrando {filteredMessages.length} de {messages.length} mensajes
        </div>
      </div>

      {/* Tabla de resultados */}
      <div
        style={{
          background: "#18181b",
          borderRadius: 8,
          border: "1px solid #27272a",
          overflow: "hidden",
        }}
      >
        <div
          style={{ overflowX: "auto", maxHeight: "600px", overflowY: "auto" }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead
              style={{
                position: "sticky",
                top: 0,
                background: "#18181b",
                zIndex: 1,
              }}
            >
              <tr style={{ borderBottom: "1px solid #27272a" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    color: "#71717a",
                    fontWeight: 500,
                    fontSize: 12,
                    minWidth: 120,
                  }}
                >
                  Fecha
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    color: "#71717a",
                    fontWeight: 500,
                    fontSize: 12,
                    minWidth: 100,
                  }}
                >
                  Canal
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    color: "#71717a",
                    fontWeight: 500,
                    fontSize: 12,
                    minWidth: 300,
                  }}
                >
                  Mensaje
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    color: "#71717a",
                    fontWeight: 500,
                    fontSize: 12,
                    minWidth: 100,
                  }}
                >
                  Sentimiento
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    color: "#71717a",
                    fontWeight: 500,
                    fontSize: 12,
                    minWidth: 100,
                  }}
                >
                  Tema
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    color: "#71717a",
                    fontWeight: 500,
                    fontSize: 12,
                    minWidth: 100,
                  }}
                >
                  Intención
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "#71717a",
                      fontSize: 14,
                    }}
                  >
                    No se encontraron mensajes con los filtros aplicados
                  </td>
                </tr>
              ) : (
                filteredMessages.map((msg) => (
                  <tr
                    key={msg.id}
                    style={{ borderBottom: "1px solid #27272a" }}
                  >
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: 13,
                        color: "#a1a1aa",
                      }}
                    >
                      {new Date(msg.timestamp).toLocaleDateString()}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: 13,
                        color: "#d4d4d8",
                      }}
                    >
                      {msg.channel}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: 13,
                        color: "#e4e4e7",
                        maxWidth: 400,
                      }}
                    >
                      {msg.text}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          background:
                            msg.sentiment === "positive"
                              ? "#1a231e"
                              : msg.sentiment === "negative"
                              ? "#261a1a"
                              : "#1a1d28",
                          color:
                            msg.sentiment === "positive"
                              ? "#a7f3d0"
                              : msg.sentiment === "negative"
                              ? "#fca5a5"
                              : "#c7d2fe",
                          border: `1px solid ${
                            msg.sentiment === "positive"
                              ? "#273830"
                              : msg.sentiment === "negative"
                              ? "#3a2626"
                              : "#272a38"
                          }`,
                          fontWeight: 500,
                        }}
                      >
                        {msg.sentiment}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: 13,
                        color: "#d4d4d8",
                      }}
                    >
                      {msg.topic}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: 13,
                        color: "#d4d4d8",
                      }}
                    >
                      {msg.intent}
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
