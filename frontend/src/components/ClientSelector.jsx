import React, { useState, useEffect } from "react";
import axios from "axios";
import Toast from "./Toast";

export default function ClientSelector({ onClientSelect, onLogout, user }) {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", industry: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/clients`);
      setClients(res.data.clients || []);
    } catch (error) {
      console.error("❌ Error loading clients:", error);
      setError("Error al cargar clientes: " + error.message);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleCreate = async () => {
    if (!newClient.name || !newClient.industry) {
      showToast("Por favor completa todos los campos", "error");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post(`${apiUrl}/api/clients`, newClient);
      setShowModal(false);
      setNewClient({ name: "", industry: "" });
      loadClients();
      showToast("Cliente creado exitosamente", "success");
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setError("Error al crear cliente: " + errorMsg);
      showToast("Error: " + errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen technical-grid">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Navbar Superior Fija */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#1a1a1a]">
        <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between">
          {/* Logo a la izquierda */}
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                fill="#3b82f6"
                opacity="0.9"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Syntegra
            </h1>
          </div>

          {/* Usuario y logout a la derecha */}
          <div className="flex items-center gap-4">
            <div className="text-right px-4 py-2 bg-[#0f0f0f] border border-[#1f1f1f] rounded-md">
              <div className="text-sm text-white font-medium">
                {user?.fullName || user?.username}
              </div>
              <div className="text-xs text-[#666666] capitalize">
                Rol: {user?.role}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-[#0f0f0f] border border-[#1f1f1f] hover:border-[#3b82f6] hover:bg-[#1a2332] rounded-md transition-all flex items-center gap-2 text-[#999999] hover:text-white group"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:text-[#3b82f6]"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="text-sm font-medium">Salir</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Panel Central */}
      <div className="pt-24 pb-12 px-8">
        <div className="max-w-[1400px] mx-auto">
          {/* Título centrado */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-white mb-2">
              Selecciona un cliente
            </h2>
            <p className="text-[#888888] text-base font-normal">
              Elige un cliente para acceder a sus datos y análisis
            </p>
          </div>

          {error && (
            <div className="mb-8 max-w-2xl mx-auto p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Grid de clientes - tarjetas sólidas y uniformes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {clients.map((client) => (
              <div
                key={client.id}
                onClick={() => onClientSelect(client)}
                className="group bg-[#0f0f0f] border border-[#1f1f1f] hover:border-[#3b82f6] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] rounded-lg p-6 cursor-pointer transition-all duration-200"
              >
                <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-[#3b82f6] transition-colors">
                  {client.name}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#666666]">Industria:</span>
                    <span className="text-[#999999] font-medium capitalize">
                      {client.industry}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#666666]">Mensajes:</span>
                    <span className="text-[#999999] font-medium">
                      {client.total_messages || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#555555]">Creado:</span>
                    <span className="text-[#777777]">
                      {new Date(client.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Botón nuevo cliente - sólido y reactivo */}
            <div
              onClick={() => setShowModal(true)}
              className="group bg-[#0a0a0a] border-2 border-[#1f1f1f] hover:border-[#3b82f6] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] rounded-lg p-6 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[180px]"
            >
              <div className="w-12 h-12 rounded-full bg-[#1a1a1a] group-hover:bg-[#1a2332] border border-[#2a2a2a] group-hover:border-[#3b82f6] flex items-center justify-center mb-3 transition-all">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#666666] group-hover:text-[#3b82f6]"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <span className="text-[#999999] group-hover:text-white font-medium text-sm transition-colors">
                Nuevo Cliente
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal - mismo estilo técnico */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Crear Nuevo Cliente
            </h2>

            <div className="mb-5">
              <label className="block text-sm font-medium text-[#999999] mb-2">
                Nombre del Cliente
              </label>
              <input
                type="text"
                value={newClient.name}
                onChange={(e) =>
                  setNewClient({ ...newClient, name: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] rounded-md text-white text-sm transition-all outline-none"
                placeholder="Ej: Empresa ABC"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[#999999] mb-2">
                Industria
              </label>
              <select
                value={newClient.industry}
                onChange={(e) =>
                  setNewClient({ ...newClient, industry: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] rounded-md text-white text-sm transition-all outline-none"
              >
                <option value="">Seleccionar...</option>
                <option value="retail">Retail / E-commerce</option>
                <option value="healthcare">Salud</option>
                <option value="finance">Finanzas</option>
                <option value="restaurant">Restaurante</option>
                <option value="technology">Tecnología</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={!newClient.name || !newClient.industry || loading}
                className="flex-1 px-4 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-[#1a1a1a] disabled:text-[#555555] text-white font-medium rounded-md transition-all"
              >
                {loading ? "Creando..." : "Crear Cliente"}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
                className="flex-1 px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#252525] text-[#999999] hover:text-white font-medium rounded-md transition-all"
                disabled={loading}
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
