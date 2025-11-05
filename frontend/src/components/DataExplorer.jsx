import React, { useState, useEffect } from "react";
import axios from "axios";

export default function DataExplorer({ client }) {
  const [messages, setMessages] = useState([]);
  const [filters, setFilters] = useState({
    sentiment: "all",
    topic: "all",
    channel: "all",
    search: "",
  });
  const [loading, setLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/messages/${client.id}`);
      setMessages(res.data.messages);
      setLoading(false);
    } catch (error) {
      console.error("Error loading messages:", error);
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (filters.sentiment !== "all" && msg.sentiment !== filters.sentiment)
      return false;
    if (filters.topic !== "all" && msg.topic !== filters.topic) return false;
    if (filters.channel !== "all" && msg.channel !== filters.channel)
      return false;
    if (
      filters.search &&
      !msg.text.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    return true;
  });

  const exportToCSV = () => {
    const csv = [
      "ID,Text,Channel,Sentiment,Topic,Intent,Timestamp",
      ...filteredMessages.map(
        (m) =>
          `"${m.id}","${m.text}","${m.channel}","${m.sentiment}","${m.topic}","${m.intent}","${m.timestamp}"`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `messages_${client.name}_${Date.now()}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="text-sm text-text-muted">Cargando mensajes...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl mb-2 text-text-primary font-bold">
            Data Explorer - {client.name}
          </h1>
          <p className="text-text-muted text-sm">
            Explora y filtra todos los mensajes clasificados
          </p>
        </div>
        <button onClick={exportToCSV} className="btn-primary">
          📥 Exportar CSV
        </button>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-disabled uppercase mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              placeholder="Buscar en mensajes..."
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-disabled uppercase mb-2">
              Sentimiento
            </label>
            <select
              value={filters.sentiment}
              onChange={(e) =>
                setFilters({ ...filters, sentiment: e.target.value })
              }
              className="input-field"
            >
              <option value="all">Todos</option>
              <option value="positive">Positivo</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negativo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-disabled uppercase mb-2">
              Tema
            </label>
            <select
              value={filters.topic}
              onChange={(e) =>
                setFilters({ ...filters, topic: e.target.value })
              }
              className="input-field"
            >
              <option value="all">Todos</option>
              <option value="entrega">Entrega</option>
              <option value="precio">Precio</option>
              <option value="calidad">Calidad</option>
              <option value="atencion">Atención</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-disabled uppercase mb-2">
              Canal
            </label>
            <select
              value={filters.channel}
              onChange={(e) =>
                setFilters({ ...filters, channel: e.target.value })
              }
              className="input-field"
            >
              <option value="all">Todos</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="email">Email</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-[15px] font-semibold text-text-primary">
            {filteredMessages.length} mensajes
          </h3>
          {filteredMessages.length !== messages.length && (
            <button
              onClick={() =>
                setFilters({
                  sentiment: "all",
                  topic: "all",
                  channel: "all",
                  search: "",
                })
              }
              className="text-xs text-accent-primary hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="table-header">Mensaje</th>
                <th className="table-header">Canal</th>
                <th className="table-header">Sentimiento</th>
                <th className="table-header">Tema</th>
                <th className="table-header">Intención</th>
                <th className="table-header">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-text-disabled"
                  >
                    No se encontraron mensajes con estos filtros
                  </td>
                </tr>
              ) : (
                filteredMessages.map((msg) => (
                  <tr
                    key={msg.id}
                    className="table-row hover:bg-dark-hover transition-colors"
                  >
                    <td className="py-3.5 text-text-secondary text-[13px] max-w-md truncate">
                      {msg.text}
                    </td>
                    <td className="py-3.5 text-text-secondary text-[13px]">
                      {msg.channel}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`badge ${
                          msg.sentiment === "positive"
                            ? "badge-success"
                            : msg.sentiment === "negative"
                            ? "badge-error"
                            : "badge-warning"
                        }`}
                      >
                        {msg.sentiment}
                      </span>
                    </td>
                    <td className="py-3.5 text-text-secondary text-[13px]">
                      {msg.topic}
                    </td>
                    <td className="py-3.5 text-text-secondary text-[13px]">
                      {msg.intent}
                    </td>
                    <td className="py-3.5 text-xs text-text-disabled">
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
