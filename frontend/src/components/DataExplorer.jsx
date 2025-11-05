import React, { useState, useEffect } from "react";
import axios from "axios";

export default function DataExplorer({ client }) {
  const [messages, setMessages] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    sentiment: "",
    topic: "",
    channel: "",
  });
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    loadMessages();
  }, [client, filters]);

  const loadMessages = async () => {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.sentiment) params.append("sentiment", filters.sentiment);
    if (filters.topic) params.append("topic", filters.topic);
    if (filters.channel) params.append("channel", filters.channel);

    const res = await axios.get(
      `${apiUrl}/api/messages/${client.id}?${params.toString()}`
    );
    setMessages(res.data.messages || []);
  };

  const exportCSV = () => {
    const csvContent = [
      [
        "ID",
        "Text",
        "Channel",
        "Sentiment",
        "Topic",
        "Intent",
        "Timestamp",
      ].join(","),
      ...messages.map((m) =>
        [
          m.id,
          `"${m.text.replace(/"/g, '""')}"`,
          m.channel,
          m.sentiment,
          m.topic,
          m.intent,
          m.timestamp,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `messages_${client.name}_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div>
      <h1 className="text-3xl mb-2 text-text-primary font-bold">
        Data Explorer - {client.name}
      </h1>
      <p className="text-text-muted mb-8 text-sm">
        Explora, filtra y exporta los mensajes clasificados.
      </p>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Buscar en mensajes..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="input-field lg:col-span-2"
          />
          <select
            value={filters.sentiment}
            onChange={(e) =>
              setFilters({ ...filters, sentiment: e.target.value })
            }
            className="input-field"
          >
            <option value="">Todos los sentimientos</option>
            <option value="positive">Positivo</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negativo</option>
          </select>
          <input
            type="text"
            placeholder="Filtrar por tema..."
            value={filters.topic}
            onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
            className="input-field"
          />
          <select
            value={filters.channel}
            onChange={(e) =>
              setFilters({ ...filters, channel: e.target.value })
            }
            className="input-field"
          >
            <option value="">Todos los canales</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
          </select>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() =>
              setFilters({ search: "", sentiment: "", topic: "", channel: "" })
            }
            className="btn-secondary"
          >
            Limpiar filtros
          </button>
          <button onClick={exportCSV} className="btn-primary">
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-text-primary font-semibold text-base">
            {messages.length} mensajes encontrados
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="table-header w-12">#</th>
                <th className="table-header">Mensaje</th>
                <th className="table-header w-28">Canal</th>
                <th className="table-header w-28">Sentimiento</th>
                <th className="table-header w-32">Tema</th>
                <th className="table-header w-32">Intención</th>
                <th className="table-header w-40">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-text-disabled"
                  >
                    No se encontraron mensajes con los filtros aplicados
                  </td>
                </tr>
              ) : (
                messages.map((msg, idx) => (
                  <tr
                    key={msg.id}
                    className="table-row hover:bg-dark-hover transition-colors"
                  >
                    <td className="py-3.5 text-text-disabled text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 text-text-secondary text-sm max-w-md truncate">
                      {msg.text}
                    </td>
                    <td className="py-3.5">
                      <span className="badge bg-dark-border text-text-muted capitalize">
                        {msg.channel}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`badge ${
                          msg.sentiment === "positive"
                            ? "badge-success"
                            : msg.sentiment === "neutral"
                            ? "badge-warning"
                            : "badge-error"
                        } capitalize`}
                      >
                        {msg.sentiment}
                      </span>
                    </td>
                    <td className="py-3.5 text-text-muted text-sm capitalize">
                      {msg.topic}
                    </td>
                    <td className="py-3.5 text-text-muted text-sm capitalize">
                      {msg.intent}
                    </td>
                    <td className="py-3.5 text-text-disabled text-xs">
                      {new Date(msg.timestamp).toLocaleString()}
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
