import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ClientSelector({ onSelectClient }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientIndustry, setNewClientIndustry] = useState("retail");

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/clients`);
      setClients(res.data.clients || []);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;

    try {
      const res = await axios.post(`${apiUrl}/api/clients`, {
        name: newClientName,
        industry: newClientIndustry,
      });
      setClients([...clients, res.data.client]);
      setShowNewClient(false);
      setNewClientName("");
    } catch (error) {
      console.error("Error creating client:", error);
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
          Cargando clientes...
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ marginBottom: 40 }}>
        <h1
          style={{
            fontSize: 32,
            marginBottom: 8,
            color: "#ffffff",
            fontWeight: 600,
          }}
        >
          Gestión de Clientes
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 14 }}>
          Selecciona un cliente para ver su dashboard o crea uno nuevo.
        </p>
      </header>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div style={{ color: "#a1a1aa", fontSize: 14 }}>
          {clients.length} {clients.length === 1 ? "cliente" : "clientes"}{" "}
          activos
        </div>
        <button
          onClick={() => setShowNewClient(!showNewClient)}
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
          + Nuevo Cliente
        </button>
      </div>

      {showNewClient && (
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
            Crear Nuevo Cliente
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 20,
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
                Nombre del Cliente
              </label>
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Ej: Hospital Municipal"
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
                Industria
              </label>
              <select
                value={newClientIndustry}
                onChange={(e) => setNewClientIndustry(e.target.value)}
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
                <option value="retail">Retail / E-commerce</option>
                <option value="healthcare">Salud / Hospitales</option>
                <option value="restaurant">Restaurantes</option>
                <option value="services">Servicios Profesionales</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleCreateClient}
              style={{
                padding: "10px 20px",
                background: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              Crear Cliente
            </button>
            <button
              onClick={() => {
                setShowNewClient(false);
                setNewClientName("");
              }}
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
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        {clients.map((client) => (
          <div
            key={client.id}
            onClick={() => onSelectClient(client)}
            style={{
              background: "#18181b",
              padding: 24,
              borderRadius: 8,
              border: "1px solid #27272a",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#3f3f46";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#27272a";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                marginBottom: 16,
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 18,
                    color: "#ffffff",
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  {client.name}
                </h3>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 4,
                    fontSize: 11,
                    background: "#27272a",
                    color: "#a1a1aa",
                    textTransform: "capitalize",
                    fontWeight: 500,
                  }}
                >
                  {client.industry}
                </span>
              </div>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: client.active ? "#10b981" : "#71717a",
                  boxShadow: client.active ? "0 0 8px #10b98160" : "none",
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginTop: 20,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#71717a",
                    marginBottom: 4,
                    textTransform: "uppercase",
                  }}
                >
                  Mensajes
                </div>
                <div
                  style={{ fontSize: 20, fontWeight: 600, color: "#fafafa" }}
                >
                  {client.totalMessages || 0}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#71717a",
                    marginBottom: 4,
                    textTransform: "uppercase",
                  }}
                >
                  Último análisis
                </div>
                <div style={{ fontSize: 13, color: "#a1a1aa" }}>
                  {client.lastAnalysis
                    ? new Date(client.lastAnalysis).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
