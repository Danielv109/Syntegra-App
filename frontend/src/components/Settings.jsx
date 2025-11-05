import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Settings({ client }) {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    axios
      .get(`${apiUrl}/api/settings?clientId=${client.id}`)
      .then((r) => setSettings(r.data));
  }, [client]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await axios.put(`${apiUrl}/api/settings`, {
        clientId: client.id,
        ...settings,
      });
      setMessage("✅ Configuración guardada correctamente");
    } catch (error) {
      setMessage("❌ Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  if (!settings)
    return (
      <div className="text-sm text-text-muted">Cargando configuración...</div>
    );

  return (
    <div>
      <h1 className="text-3xl mb-2 text-text-primary font-bold">
        Settings - {client.name}
      </h1>
      <p className="text-text-muted mb-8 text-sm">
        Configura notificaciones,{" "}
        <span className="text-accent-error">integraciones</span> y preferencias
        del sistema.
      </p>

      <div className="flex flex-col gap-4">
        <div className="card">
          <h3 className="mt-0 text-text-primary text-[15px] font-semibold mb-5">
            Notificaciones
          </h3>
          <div className="flex flex-col gap-3.5">
            <label className="flex items-center gap-2.5 cursor-pointer text-text-secondary text-sm">
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
                className="w-4 h-4 cursor-pointer"
              />
              Notificaciones por Email
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-text-secondary text-sm">
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
                className="w-4 h-4 cursor-pointer"
              />
              Notificaciones por Slack
            </label>
          </div>
        </div>

        <div className="card">
          <h3 className="mt-0 text-text-primary text-[15px] font-semibold mb-5">
            Procesamiento
          </h3>
          <div className="flex flex-col gap-3.5">
            <label className="flex items-center gap-2.5 cursor-pointer text-text-secondary text-sm">
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
                className="w-4 h-4 cursor-pointer"
              />
              Clasificación automática con IA
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-text-secondary text-sm">
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
                className="w-4 h-4 cursor-pointer"
              />
              Validación humana para casos críticos
            </label>
          </div>
        </div>

        <div className="card">
          <h3 className="mt-0 text-text-primary text-[15px] font-semibold mb-5">
            Integraciones
          </h3>
          <div className="flex flex-col gap-3.5">
            {Object.entries(settings.integrations).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="font-medium text-text-secondary text-sm">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </span>
                <span
                  className={`badge ${
                    value.enabled ? "badge-success" : "badge-error"
                  } font-medium`}
                >
                  {value.enabled ? "Conectado" : "Desconectado"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? "Guardando..." : "Guardar Configuración"}
        </button>

        {message && (
          <div
            className={`mt-4 px-4 py-3 rounded-md text-[13px] inline-block ${
              message.startsWith("✅") ? "badge-success" : "badge-error"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
