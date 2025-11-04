import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Settings({ client }) {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState("client"); // "client" o "global"
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    axios
      .get(`${apiUrl}/api/settings?clientId=${client.id}&mode=${viewMode}`)
      .then((r) => setSettings(r.data));
  }, [client, viewMode]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await axios.put(`${apiUrl}/api/settings`, settings);
      setMessage("✅ Configuración guardada exitosamente");
    } catch (error) {
      setMessage("❌ Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div>Cargando configuración...</div>;

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
        Settings - {client.name}
      </h1>
      <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: 14 }}>
        Configura notificaciones,{" "}
        <span style={{ color: "#ef4444" }}>integraciones</span> y preferencias
        del sistema.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        <button
          onClick={() => setViewMode("client")}
          style={{
            padding: "8px 20px",
            background: viewMode === "client" ? "#6366f1" : "#27272a",
            color: viewMode === "client" ? "#fff" : "#a1a1aa",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          Configuración del Cliente
        </button>
        <button
          onClick={() => setViewMode("global")}
          style={{
            padding: "8px 20px",
            background: viewMode === "global" ? "#6366f1" : "#27272a",
            color: viewMode === "global" ? "#fff" : "#a1a1aa",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          Configuración Global
        </button>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
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
            Notificaciones
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                color: "#d4d4d8",
                fontSize: 14,
              }}
            >
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      email: e.target.checked,
                    },
                  })
                }
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              Notificaciones por Email
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                color: "#d4d4d8",
                fontSize: 14,
              }}
            >
              <input
                type="checkbox"
                checked={settings.notifications.slack}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      slack: e.target.checked,
                    },
                  })
                }
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              Notificaciones por Slack
            </label>
          </div>
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
              marginBottom: 20,
            }}
          >
            Procesamiento
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                color: "#d4d4d8",
                fontSize: 14,
              }}
            >
              <input
                type="checkbox"
                checked={settings.processing.autoClassify}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    processing: {
                      ...settings.processing,
                      autoClassify: e.target.checked,
                    },
                  })
                }
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              Clasificación automática con IA
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                color: "#d4d4d8",
                fontSize: 14,
              }}
            >
              <input
                type="checkbox"
                checked={settings.processing.humanValidation}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    processing: {
                      ...settings.processing,
                      humanValidation: e.target.checked,
                    },
                  })
                }
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              Validación humana para casos críticos
            </label>
          </div>
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
              marginBottom: 20,
            }}
          >
            Integraciones
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {Object.entries(settings.integrations).map(([key, value]) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{ fontWeight: 500, color: "#d4d4d8", fontSize: 14 }}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </span>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 4,
                    fontSize: 11,
                    background: value.enabled ? "#1a231e" : "#261a1a",
                    color: value.enabled ? "#a7f3d0" : "#fca5a5",
                    border: `1px solid ${
                      value.enabled ? "#273830" : "#3a2626"
                    }`,
                    fontWeight: 500,
                  }}
                >
                  {value.enabled ? "Conectado" : "Desconectado"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "10px 20px",
            background: saving ? "#27272a" : "#6366f1",
            color: saving ? "#71717a" : "#fff",
            border: "none",
            borderRadius: 6,
            cursor: saving ? "not-allowed" : "pointer",
            fontWeight: 500,
            fontSize: 14,
            transition: "all 0.15s",
          }}
        >
          {saving ? "Guardando..." : "Guardar Configuración"}
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
              display: "inline-block",
              fontSize: 13,
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
