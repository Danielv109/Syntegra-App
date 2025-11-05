import React, { useEffect, useState } from "react";
import axios from "axios";

function ConnectorCard({ connector, onToggle, onTest, onDelete }) {
  return (
    <div className="card flex justify-between items-center">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-lg text-text-primary font-semibold">
            {connector.type.toUpperCase()} - {connector.name}
          </h3>
          <span
            className={`badge font-medium capitalize ${
              connector.status === "active"
                ? "badge-success"
                : connector.status === "error"
                ? "badge-error"
                : "badge-warning"
            }`}
          >
            {connector.status}
          </span>
        </div>

        <div className="text-text-muted text-[13px] mb-3">
          Última sincronización:{" "}
          {connector.last_sync
            ? new Date(connector.last_sync).toLocaleString()
            : "Nunca"}
        </div>

        <div className="flex gap-4 text-[13px]">
          <div>
            <span className="text-text-disabled">Frecuencia: </span>
            <span className="text-text-secondary">{connector.frequency}</span>
          </div>
          <div>
            <span className="text-text-disabled">Mensajes importados: </span>
            <span className="text-text-secondary">
              {connector.total_messages || 0}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <button
          onClick={onTest}
          className="btn-secondary px-4 py-2 text-[13px]"
        >
          Probar
        </button>

        <button
          onClick={onDelete}
          className="px-4 py-2 bg-accent-error/10 text-accent-error border border-accent-error/20 rounded-md cursor-pointer text-[13px] font-medium hover:bg-accent-error/20 transition-all"
        >
          Eliminar
        </button>

        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={connector.enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="w-[18px] h-[18px] cursor-pointer"
          />
          <span className="ml-2 text-text-secondary text-[13px]">
            {connector.enabled ? "Activo" : "Inactivo"}
          </span>
        </label>
      </div>
    </div>
  );
}

export default function Connectors({ client }) {
  const [connectors, setConnectors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newConnector, setNewConnector] = useState({
    type: "whatsapp",
    name: "",
    apiKey: "",
    frequency: "hourly",
  });

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/connectors/${client.id}`);
      setConnectors(res.data.connectors);
    } catch (error) {
      console.error("Error loading connectors:", error);
    }
  };

  const handleCreate = async () => {
    try {
      await axios.post(`${apiUrl}/api/connectors`, {
        clientId: client.id,
        ...newConnector,
      });
      setShowModal(false);
      setNewConnector({
        type: "whatsapp",
        name: "",
        apiKey: "",
        frequency: "hourly",
      });
      loadConnectors();
    } catch (error) {
      console.error("Error creating connector:", error);
    }
  };

  const toggleConnector = async (connectorId, enabled) => {
    try {
      await axios.put(`${apiUrl}/api/connectors/${connectorId}/toggle`, {
        enabled,
      });
      loadConnectors();
    } catch (error) {
      console.error("Error toggling connector:", error);
    }
  };

  const deleteConnector = async (connectorId) => {
    if (!confirm("¿Estás seguro de eliminar este conector?")) return;

    try {
      await axios.delete(`${apiUrl}/api/connectors/${connectorId}`);
      loadConnectors();
    } catch (error) {
      console.error("Error deleting connector:", error);
    }
  };

  const testConnection = async (connectorId) => {
    try {
      const res = await axios.post(
        `${apiUrl}/api/connectors/${connectorId}/test`
      );
      if (res.data.success) {
        alert("✅ " + res.data.message);
      } else {
        alert("⚠️ " + res.data.message);
      }
      // Recargar para ver cualquier cambio de estado (aunque ahora no debería haber)
      loadConnectors();
    } catch (error) {
      alert("❌ Error al probar conexión");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl mb-2 text-text-primary font-bold">
            Connectors - {client.name}
          </h1>
          <p className="text-text-muted text-sm">
            Conecta tus canales de comunicación para importación automática
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Nuevo Conector
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {connectors.map((connector) => (
          <ConnectorCard
            key={connector.id}
            connector={connector}
            onToggle={(enabled) => toggleConnector(connector.id, enabled)}
            onTest={() => testConnection(connector.id)}
            onDelete={() => deleteConnector(connector.id)}
          />
        ))}

        {connectors.length === 0 && (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">🔌</div>
            <div className="text-lg text-text-primary font-semibold mb-2">
              No hay conectores configurados
            </div>
            <div className="text-sm text-text-muted">
              Crea tu primer conector para automatizar la importación de datos
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-dark-card border border-dark-border rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-text-primary mb-6">
              Nuevo Conector
            </h2>

            <div className="mb-5">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Tipo
              </label>
              <select
                value={newConnector.type}
                onChange={(e) =>
                  setNewConnector({ ...newConnector, type: e.target.value })
                }
                className="input-field"
              >
                <option value="whatsapp">WhatsApp Business API</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="gmail">Gmail</option>
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={newConnector.name}
                onChange={(e) =>
                  setNewConnector({ ...newConnector, name: e.target.value })
                }
                className="input-field"
                placeholder="Ej: WhatsApp Principal"
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                API Key
              </label>
              <input
                type="text"
                value={newConnector.apiKey}
                onChange={(e) =>
                  setNewConnector({ ...newConnector, apiKey: e.target.value })
                }
                className="input-field"
                placeholder="Tu clave de API"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Frecuencia
              </label>
              <select
                value={newConnector.frequency}
                onChange={(e) =>
                  setNewConnector({
                    ...newConnector,
                    frequency: e.target.value,
                  })
                }
                className="input-field"
              >
                <option value="hourly">Cada hora</option>
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={!newConnector.name || !newConnector.apiKey}
                className="btn-primary flex-1"
              >
                Crear Conector
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
