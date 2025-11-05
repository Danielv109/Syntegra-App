import React, { useState, useEffect } from "react";
import axios from "axios";

export default function ClientSelector({ onClientSelect }) {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", industry: "" });

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/clients`);
      setClients(res.data.clients);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const handleCreate = async () => {
    try {
      await axios.post(`${apiUrl}/api/clients`, newClient);
      setShowModal(false);
      setNewClient({ name: "", industry: "" });
      loadClients();
    } catch (error) {
      console.error("Error creating client:", error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-8">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-text-primary mb-4">
            Syntegra
          </h1>
          <p className="text-text-muted text-lg">
            Selecciona un cliente para comenzar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {clients.map((client) => (
            <div
              key={client.id}
              onClick={() => onClientSelect(client)}
              className="card cursor-pointer transition-all hover:border-accent-primary hover:bg-dark-hover"
            >
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                {client.name}
              </h3>
              <p className="text-sm text-text-muted mb-4">{client.industry}</p>
              <div className="flex justify-between items-center text-xs text-text-disabled">
                <span>{client.total_messages || 0} mensajes</span>
                <span>{new Date(client.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}

          <div
            onClick={() => setShowModal(true)}
            className="card cursor-pointer border-dashed border-2 flex flex-col items-center justify-center min-h-[180px] transition-all hover:border-accent-primary hover:bg-dark-hover"
          >
            <div className="text-5xl text-accent-primary mb-3">+</div>
            <div className="text-text-primary font-medium">Nuevo Cliente</div>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-dark-card border border-dark-border rounded-xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                Crear Nuevo Cliente
              </h2>

              <div className="mb-5">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="Ej: Empresa ABC"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Industria
                </label>
                <select
                  value={newClient.industry}
                  onChange={(e) =>
                    setNewClient({ ...newClient, industry: e.target.value })
                  }
                  className="input-field"
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
                  disabled={!newClient.name || !newClient.industry}
                  className="btn-primary flex-1"
                >
                  Crear Cliente
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
    </div>
  );
}
