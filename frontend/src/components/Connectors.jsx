import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "./Toast";

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
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    loadConnectors();
  }, [client]);

  const loadConnectors = async () => {
    const res = await axios.get(`${apiUrl}/api/connectors/${client.id}`);
    setConnectors(res.data.connectors || []);
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleCreate = async () => {
    if (!newConnector.type || !newConnector.name || !newConnector.apiKey) {
      showToast("Por favor completa todos los campos", "error");
      return;
    }

    setLoading(true);
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
      showToast("Conector creado exitosamente", "success");
    } catch (error) {
      showToast("Error al crear conector", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleConnector = async (connectorId, enabled) => {
    await axios.put(`${apiUrl}/api/connectors/${connectorId}/toggle`, {
      enabled,
    });
    loadConnectors();
    showToast(
      enabled ? "Conector activado" : "Conector desactivado",
      "success"
    );
  };

  const testConnection = async (connectorId) => {
    const res = await axios.post(
      `${apiUrl}/api/connectors/${connectorId}/test`
    );
    showToast(res.data.message, res.data.success ? "success" : "error");
  };

  const deleteConnector = async (connectorId) => {
    if (!confirm("¿Estás seguro de eliminar este conector?")) return;
    await axios.delete(`${apiUrl}/api/connectors/${connectorId}`);
    loadConnectors();
    showToast("Conector eliminado", "success");
  };

  return (
    <div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl mb-2 text-text-primary font-bold">
            Connectors - {client.name}
          </h1>
          <p className="text-text-muted mb-8 text-sm">
            Conecta APIs externas para ingesta automática de mensajes.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary mb-6">
          + Nuevo Conector
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connectors.map((conn) => (
          <div key={conn.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  {conn.name}
                </h3>
                <p className="text-sm text-text-muted capitalize">
                  {conn.type}
                </p>
              </div>
              <span
                className={`badge ${
                  conn.status === "active"
                    ? "badge-success"
                    : conn.status === "error"
                    ? "badge-error"
                    : "bg-dark-border text-text-muted"
                } capitalize font-medium`}
              >
                {conn.status}
              </span>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-text-disabled">Frecuencia:</span>
                <span className="text-text-muted capitalize">
                  {conn.frequency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-disabled">Mensajes:</span>
                <span className="text-text-muted">
                  {conn.total_messages || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-disabled">Última sync:</span>
                <span className="text-text-muted text-xs">
                  {conn.last_sync
                    ? new Date(conn.last_sync).toLocaleString()
                    : "Nunca"}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => toggleConnector(conn.id, !conn.enabled)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  conn.enabled
                    ? "bg-dark-border text-text-muted hover:bg-dark-hover"
                    : "bg-accent-primary text-white hover:bg-accent-secondary"
                }`}
              >
                {conn.enabled ? "Desactivar" : "Activar"}
              </button>
              <button
                onClick={() => testConnection(conn.id)}
                className="px-3 py-2 bg-dark-border hover:bg-dark-hover text-text-muted rounded-md text-sm font-medium transition-all"
              >
                Probar
              </button>
              <button
                onClick={() => deleteConnector(conn.id)}
                className="px-3 py-2 bg-dark-border hover:bg-dark-hover text-text-muted rounded-md text-sm font-medium transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}

        {connectors.length === 0 && (
          <div className="col-span-full card text-center py-16">
            <div className="text-6xl mb-4">🔌</div>
            <div className="text-xl text-text-primary font-semibold mb-2">
              Sin conectores
            </div>
            <div className="text-text-muted text-sm">
              Crea tu primer conector para automatizar la ingesta
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
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
                <option value="">Seleccionar...</option>
                <option value="whatsapp">WhatsApp Business API</option>
                <option value="gmail">Gmail API</option>
                <option value="instagram">Instagram Graph API</option>
                <option value="facebook">Facebook Messenger</option>
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
                type="password"
                value={newConnector.apiKey}
                onChange={(e) =>
                  setNewConnector({ ...newConnector, apiKey: e.target.value })
                }
                className="input-field"
                placeholder="Tu API key"
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
                <option value="daily">Diaria</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? "Creando..." : "Crear Conector"}
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
