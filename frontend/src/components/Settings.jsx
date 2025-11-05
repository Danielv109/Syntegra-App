import React, { useState, useEffect } from "react";
import axios from "axios";
import Toast from "./Toast";

export default function Settings({ client, onClientDeleted }) {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    axios
      .get(`${apiUrl}/api/settings?clientId=${client.id}`)
      .then((r) => setSettings(r.data));
  }, [client]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await axios.put(`${apiUrl}/api/settings`, {
        clientId: client.id,
        ...settings,
      });
      showToast("Configuración guardada correctamente", "success");
    } catch (error) {
      showToast("Error al guardar configuración", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${apiUrl}/api/clients/${client.id}`);
      setShowDeleteModal(false);
      showToast("Cliente eliminado correctamente", "success");
      setTimeout(() => {
        onClientDeleted();
      }, 1000);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      showToast("Error al eliminar cliente: " + errorMsg, "error");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!settings)
    return (
      <div className="text-sm text-text-muted">Cargando configuración...</div>
    );

  return (
    <div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <h1 className="text-3xl mb-2 text-text-primary font-bold">
        Settings - {client.name}
      </h1>
      <p className="text-text-muted mb-8 text-sm">
        Configura notificaciones, integraciones y preferencias del sistema.
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

        {/* Zona de Peligro - Diseño minimalista */}
        <div className="card border-[#2a2a2a] bg-[#0a0a0a]">
          <h3 className="mt-0 text-text-primary text-[15px] font-semibold mb-3">
            Eliminar Cliente
          </h3>
          <p className="text-text-muted text-sm mb-4">
            Esta acción eliminará permanentemente todos los datos, mensajes,
            reportes y configuraciones asociadas. No se puede deshacer.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] text-text-muted hover:text-white border border-[#2a2a2a] rounded-md transition-all font-medium text-sm"
          >
            Eliminar cliente permanentemente
          </button>
        </div>
      </div>

      <div className="mt-6">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? "Guardando..." : "Guardar Configuración"}
        </button>
      </div>

      {/* Modal de Confirmación - Diseño limpio */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white mb-3">
                Confirmar eliminación
              </h2>
              <p className="text-text-muted text-sm leading-relaxed">
                Esta acción eliminará permanentemente{" "}
                <span className="text-white font-semibold">{client.name}</span>{" "}
                y todos sus datos asociados.
              </p>
            </div>

            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 mb-6">
              <div className="text-xs text-text-disabled mb-2">
                Se eliminarán:
              </div>
              <ul className="text-sm text-text-muted space-y-1.5">
                <li>• {client.total_messages || 0} mensajes clasificados</li>
                <li>• Todos los reportes generados</li>
                <li>• Configuraciones y conectores</li>
                <li>• Datos de fine-tuning</li>
                <li>• Historial de análisis</li>
              </ul>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-6">
              <p className="text-amber-400 text-xs font-medium text-center">
                Esta acción no se puede deshacer
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#252525] text-text-secondary hover:text-white border border-[#2a2a2a] rounded-md transition-all font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#252525] text-text-muted hover:text-white border border-[#2a2a2a] rounded-md transition-all font-medium text-sm"
              >
                {deleting ? "Eliminando..." : "Confirmar eliminación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
