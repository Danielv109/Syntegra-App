import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Connectors({ client }) {
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddConnector, setShowAddConnector] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    loadConnectors();
  }, [client]);

  const loadConnectors = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/connectors/${client.id}`);
      setConnectors(res.data.connectors || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading connectors:", error);
      setLoading(false);
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
      alert("Error al eliminar conector");
    }
  };

  const testConnection = async (connectorId) => {
    try {
      const res = await axios.post(
        `${apiUrl}/api/connectors/${connectorId}/test`
      );
      if (res.data.success) {
        alert("✓ " + res.data.message);
        loadConnectors(); // Recargar para ver el nuevo estado
      } else {
        alert("✗ " + res.data.message);
        loadConnectors();
      }
    } catch (error) {
      alert("✗ Error al probar conexión");
    }
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
        <div style={{ fontSize: 14, color: "#71717a" }}>
          Cargando conectores...
        </div>
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
            Conectores e Integraciones
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            Configura fuentes de datos automáticas para {client.name}
          </p>
        </div>
        <button
          onClick={() => setShowAddConnector(!showAddConnector)}
          style={{
            padding: "10px 20px",
            background: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          + Agregar Conector
        </button>
      </header>

      {showAddConnector && (
        <AddConnectorForm
          client={client}
          onClose={() => setShowAddConnector(false)}
          onSuccess={() => {
            loadConnectors();
            setShowAddConnector(false);
          }}
        />
      )}

      <div style={{ display: "grid", gap: 16 }}>
        {connectors.map((connector) => (
          <ConnectorCard
            key={connector.id}
            connector={connector}
            onToggle={(enabled) => toggleConnector(connector.id, enabled)}
            onTest={() => testConnection(connector.id)}
            onDelete={() => deleteConnector(connector.id)}
          />
        ))}

        {connectors.length === 0 && !showAddConnector && (
          <div
            style={{
              background: "#18181b",
              padding: 40,
              borderRadius: 8,
              border: "1px solid #27272a",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
            <div style={{ fontSize: 16, color: "#fafafa", marginBottom: 8 }}>
              No hay conectores configurados
            </div>
            <div style={{ fontSize: 14, color: "#71717a", marginBottom: 20 }}>
              Agrega tu primer conector para automatizar la ingesta de datos
            </div>
            <button
              onClick={() => setShowAddConnector(true)}
              style={{
                padding: "10px 20px",
                background: "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              Agregar Primer Conector
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ConnectorCard({ connector, onToggle, onTest, onDelete }) {
  const statusColors = {
    active: { bg: "#1a231e", color: "#a7f3d0", border: "#273830" },
    error: { bg: "#261a1a", color: "#fca5a5", border: "#3a2626" },
    inactive: { bg: "#1a1d28", color: "#c7d2fe", border: "#272a38" },
  };

  const style = statusColors[connector.status] || statusColors.inactive;

  return (
    <div
      style={{
        background: "#18181b",
        padding: 24,
        borderRadius: 8,
        border: "1px solid #27272a",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              color: "#ffffff",
              fontWeight: 600,
            }}
          >
            {connector.type.toUpperCase()} - {connector.name}
          </h3>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 4,
              fontSize: 11,
              background: style.bg,
              color: style.color,
              border: `1px solid ${style.border}`,
              fontWeight: 500,
              textTransform: "capitalize",
            }}
          >
            {connector.status}
          </span>
        </div>

        <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>
          Última sincronización:{" "}
          {connector.last_sync
            ? new Date(connector.last_sync).toLocaleString()
            : "Nunca"}
        </div>

        <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
          <div>
            <span style={{ color: "#71717a" }}>Frecuencia: </span>
            <span style={{ color: "#d4d4d8" }}>{connector.frequency}</span>
          </div>
          <div>
            <span style={{ color: "#71717a" }}>Mensajes importados: </span>
            <span style={{ color: "#d4d4d8" }}>
              {connector.total_messages || 0}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          onClick={onTest}
          style={{
            padding: "8px 16px",
            background: "#27272a",
            color: "#a1a1aa",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Probar
        </button>

        <button
          onClick={onDelete}
          style={{
            padding: "8px 16px",
            background: "#261a1a",
            color: "#fca5a5",
            border: "1px solid #3a2626",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Eliminar
        </button>

        <label
          style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
        >
          <input
            type="checkbox"
            checked={connector.enabled}
            onChange={(e) => onToggle(e.target.checked)}
            style={{ width: 18, height: 18, cursor: "pointer" }}
          />
          <span style={{ marginLeft: 8, color: "#d4d4d8", fontSize: 13 }}>
            {connector.enabled ? "Activo" : "Inactivo"}
          </span>
        </label>
      </div>
    </div>
  );
}

function AddConnectorForm({ client, onClose, onSuccess }) {
  const [type, setType] = useState("whatsapp");
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [frequency, setFrequency] = useState("hourly");
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const handleSubmit = async () => {
    if (!name.trim() || !apiKey.trim()) {
      alert("Por favor completa todos los campos");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${apiUrl}/api/connectors`, {
        clientId: client.id,
        type,
        name,
        apiKey,
        frequency,
      });
      onSuccess();
    } catch (error) {
      console.error("Error creating connector:", error);
      alert("Error al crear conector");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: "#18181b",
        padding: 24,
        borderRadius: 8,
        border: "1px solid #27272a",
        marginBottom: 24,
      }}
    >
      <h3
        style={{
          marginTop: 0,
          color: "#ffffff",
          fontSize: 16,
          marginBottom: 20,
        }}
      >
        Agregar Nuevo Conector
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
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
            Tipo de Conector
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 6,
              border: "1px solid #27272a",
              background: "#0d0d0d",
              color: "#e4e4e7",
              fontSize: 14,
            }}
          >
            <option value="whatsapp">WhatsApp Business API</option>
            <option value="instagram">Instagram / Meta API</option>
            <option value="gmail">Gmail API</option>
            <option value="facebook">Facebook Pages API</option>
            <option value="google_reviews">Google My Business</option>
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
            Nombre del Conector
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: WhatsApp Principal"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 6,
              border: "1px solid #27272a",
              background: "#0d0d0d",
              color: "#e4e4e7",
              fontSize: 14,
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: "block",
            marginBottom: 8,
            color: "#d4d4d8",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          API Key / Token
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Pega aquí tu API key"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #27272a",
            background: "#0d0d0d",
            color: "#e4e4e7",
            fontSize: 14,
          }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: "block",
            marginBottom: 8,
            color: "#d4d4d8",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Frecuencia de Sincronización
        </label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #27272a",
            background: "#0d0d0d",
            color: "#e4e4e7",
            fontSize: 14,
          }}
        >
          <option value="realtime">Tiempo real</option>
          <option value="hourly">Cada hora</option>
          <option value="daily">Diario</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            padding: "10px 20px",
            background: submitting ? "#27272a" : "#10b981",
            color: submitting ? "#71717a" : "#fff",
            border: "none",
            borderRadius: 6,
            cursor: submitting ? "not-allowed" : "pointer",
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          {submitting ? "Creando..." : "Crear Conector"}
        </button>
        <button
          onClick={onClose}
          style={{
            padding: "10px 20px",
            background: "#27272a",
            color: "#a1a1aa",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
