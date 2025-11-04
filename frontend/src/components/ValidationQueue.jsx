import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ValidationQueue({ client }) {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, validated: 0, pending: 0 });

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    loadQueue();
  }, [client]);

  const loadQueue = async () => {
    try {
      const res = await axios.get(
        `${apiUrl}/api/validation/queue/${client.id}`
      );
      setQueue(res.data.queue || []);
      setStats(res.data.stats || { total: 0, validated: 0, pending: 0 });
      setLoading(false);
    } catch (error) {
      console.error("Error loading queue:", error);
      setLoading(false);
    }
  };

  const handleValidate = async (corrections) => {
    const current = queue[currentIndex];

    try {
      await axios.post(`${apiUrl}/api/validation/validate`, {
        messageId: current.id,
        clientId: client.id,
        corrections,
      });

      if (currentIndex < queue.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        loadQueue();
        setCurrentIndex(0);
      }

      setStats({
        ...stats,
        validated: stats.validated + 1,
        pending: stats.pending - 1,
      });
    } catch (error) {
      console.error("Error validating:", error);
    }
  };

  const handleSkip = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
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
          Cargando cola de validación...
        </div>
      </div>
    );
  }

  if (queue.length === 0) {
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
          Validación Humana
        </h1>
        <p style={{ color: "#94a3b8", marginBottom: 32, fontSize: 14 }}>
          No hay mensajes pendientes de validación para {client.name}.
        </p>
        <div
          style={{
            background: "#18181b",
            padding: 40,
            borderRadius: 8,
            border: "1px solid #27272a",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <div style={{ fontSize: 16, color: "#fafafa", marginBottom: 8 }}>
            Todo validado
          </div>
          <div style={{ fontSize: 14, color: "#71717a" }}>
            Todos los mensajes críticos han sido revisados
          </div>
        </div>
      </div>
    );
  }

  const current = queue[currentIndex];

  return (
    <div>
      <header style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 28,
            marginBottom: 6,
            color: "#ffffff",
            fontWeight: 600,
          }}
        >
          Validación Humana
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 14 }}>
          Revisa y corrige las clasificaciones de IA para garantizar{" "}
          <span style={{ color: "#10b981" }}>95%+ precisión</span>
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: "#18181b",
            padding: 20,
            borderRadius: 8,
            border: "1px solid #27272a",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#71717a",
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            Total
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: "#fafafa" }}>
            {stats.total}
          </div>
        </div>
        <div
          style={{
            background: "#18181b",
            padding: 20,
            borderRadius: 8,
            border: "1px solid #27272a",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#71717a",
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            Validados
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: "#10b981" }}>
            {stats.validated}
          </div>
        </div>
        <div
          style={{
            background: "#18181b",
            padding: 20,
            borderRadius: 8,
            border: "1px solid #27272a",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#71717a",
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            Pendientes
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: "#818cf8" }}>
            {stats.pending}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#18181b",
          padding: 32,
          borderRadius: 8,
          border: "1px solid #27272a",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 14, color: "#71717a" }}>
            Mensaje {currentIndex + 1} de {queue.length}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSkip}
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
              Saltar →
            </button>
          </div>
        </div>

        <ValidationCard message={current} onValidate={handleValidate} />
      </div>
    </div>
  );
}

function ValidationCard({ message, onValidate }) {
  const [sentiment, setSentiment] = useState(message.sentiment);
  const [topic, setTopic] = useState(message.topic);
  const [intent, setIntent] = useState(message.intent);

  const handleConfirm = () => {
    const corrections = {
      sentiment,
      topic,
      intent,
    };
    onValidate(corrections);
  };

  const hasChanges =
    sentiment !== message.sentiment ||
    topic !== message.topic ||
    intent !== message.intent;

  return (
    <div>
      <div
        style={{
          background: "#0d0d0d",
          padding: 20,
          borderRadius: 6,
          border: "1px solid #27272a",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#71717a",
            marginBottom: 8,
            textTransform: "uppercase",
          }}
        >
          Mensaje Original
        </div>
        <div style={{ fontSize: 15, color: "#e4e4e7", lineHeight: 1.6 }}>
          {message.text}
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "#71717a" }}>
          Canal: {message.channel} • Fecha:{" "}
          {new Date(message.timestamp).toLocaleDateString()}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          marginBottom: 24,
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 10,
              color: "#d4d4d8",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Sentimiento
            {sentiment !== message.sentiment && (
              <span style={{ color: "#10b981", marginLeft: 8, fontSize: 11 }}>
                ● Modificado
              </span>
            )}
          </label>
          <select
            value={sentiment}
            onChange={(e) => setSentiment(e.target.value)}
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
            <option value="positive">Positivo</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negativo</option>
          </select>
          <div style={{ fontSize: 11, color: "#71717a", marginTop: 6 }}>
            IA sugirió: {message.sentiment}
          </div>
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: 10,
              color: "#d4d4d8",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Tema
            {topic !== message.topic && (
              <span style={{ color: "#10b981", marginLeft: 8, fontSize: 11 }}>
                ● Modificado
              </span>
            )}
          </label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
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
            <option value="entrega">Entrega / Logística</option>
            <option value="precio">Precio</option>
            <option value="calidad">Calidad del Producto</option>
            <option value="atencion">Atención al Cliente</option>
            <option value="otro">Otro</option>
          </select>
          <div style={{ fontSize: 11, color: "#71717a", marginTop: 6 }}>
            IA sugirió: {message.topic}
          </div>
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: 10,
              color: "#d4d4d8",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Intención
            {intent !== message.intent && (
              <span style={{ color: "#10b981", marginLeft: 8, fontSize: 11 }}>
                ● Modificado
              </span>
            )}
          </label>
          <select
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
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
            <option value="queja">Queja</option>
            <option value="consulta">Consulta</option>
            <option value="elogio">Elogio</option>
            <option value="solicitud">Solicitud</option>
          </select>
          <div style={{ fontSize: 11, color: "#71717a", marginTop: 6 }}>
            IA sugirió: {message.intent}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={handleConfirm}
          style={{
            flex: 1,
            padding: "12px 24px",
            background: hasChanges ? "#10b981" : "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          {hasChanges
            ? "Guardar Correcciones y Continuar"
            : "Confirmar y Continuar"}
        </button>
      </div>

      {hasChanges && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "#1a231e",
            border: "1px solid #273830",
            borderRadius: 6,
            color: "#a7f3d0",
            fontSize: 13,
          }}
        >
          ✓ Has realizado correcciones. Esto mejorará el modelo de IA.
        </div>
      )}
    </div>
  );
}
