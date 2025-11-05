import React, { useState, useEffect } from "react";
import axios from "axios";

export default function ValidationQueue({ client }) {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ total: 0, validated: 0, pending: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [corrections, setCorrections] = useState({});
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    loadQueue();
  }, [client]);

  const loadQueue = async () => {
    const res = await axios.get(`${apiUrl}/api/validation/queue/${client.id}`);
    setQueue(res.data.queue);
    setStats(res.data.stats);
    if (res.data.queue.length > 0) {
      setCorrections({
        sentiment: res.data.queue[0].sentiment,
        topic: res.data.queue[0].topic,
        intent: res.data.queue[0].intent,
      });
    }
  };

  const handleValidate = async () => {
    const current = queue[currentIndex];
    await axios.post(`${apiUrl}/api/validation/validate`, {
      messageId: current.id,
      clientId: client.id,
      corrections,
    });

    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
      const next = queue[currentIndex + 1];
      setCorrections({
        sentiment: next.sentiment,
        topic: next.topic,
        intent: next.intent,
      });
    } else {
      loadQueue();
      setCurrentIndex(0);
    }
  };

  if (queue.length === 0) {
    return (
      <div>
        <h1 className="text-3xl mb-2 text-text-primary font-bold">
          Validation - {client.name}
        </h1>
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">✓</div>
          <div className="text-xl text-text-primary font-semibold mb-2">
            Todo validado
          </div>
          <div className="text-text-muted text-sm">
            No hay mensajes pendientes de revisión
          </div>
        </div>
      </div>
    );
  }

  const current = queue[currentIndex];
  const progress = ((currentIndex + 1) / queue.length) * 100;

  return (
    <div>
      <h1 className="text-3xl mb-2 text-text-primary font-bold">
        Validation - {client.name}
      </h1>
      <p className="text-text-muted mb-8 text-sm">
        Revisa y corrige las clasificaciones de la IA para mejorar la precisión
        del modelo.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-text-disabled text-xs font-semibold uppercase mb-2">
            Total
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {stats.total}
          </div>
        </div>
        <div className="card text-center">
          <div className="text-text-disabled text-xs font-semibold uppercase mb-2">
            Validados
          </div>
          <div className="text-2xl font-bold text-accent-success">
            {stats.validated}
          </div>
        </div>
        <div className="card text-center">
          <div className="text-text-disabled text-xs font-semibold uppercase mb-2">
            Pendientes
          </div>
          <div className="text-2xl font-bold text-accent-warning">
            {stats.pending}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-text-primary font-semibold text-base">
            Mensaje {currentIndex + 1} de {queue.length}
          </h3>
          <div className="text-sm text-text-muted">
            Progreso: {Math.round(progress)}%
          </div>
        </div>

        <div className="w-full h-2 bg-dark-border rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="bg-dark-bg border border-dark-border rounded-lg p-6 mb-6">
          <div className="text-xs text-text-disabled uppercase font-semibold mb-2">
            Mensaje Original
          </div>
          <div className="text-text-primary leading-relaxed">
            {current.text}
          </div>
          <div className="mt-4 flex gap-4 text-xs text-text-disabled">
            <span>
              Canal:{" "}
              <span className="text-text-muted capitalize">
                {current.channel}
              </span>
            </span>
            <span>
              Fecha:{" "}
              <span className="text-text-muted">
                {new Date(current.timestamp).toLocaleString()}
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Sentimiento
            </label>
            <select
              value={corrections.sentiment}
              onChange={(e) =>
                setCorrections({ ...corrections, sentiment: e.target.value })
              }
              className="input-field"
            >
              <option value="positive">Positivo</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negativo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Tema
            </label>
            <input
              type="text"
              value={corrections.topic}
              onChange={(e) =>
                setCorrections({ ...corrections, topic: e.target.value })
              }
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Intención
            </label>
            <input
              type="text"
              value={corrections.intent}
              onChange={(e) =>
                setCorrections({ ...corrections, intent: e.target.value })
              }
              className="input-field"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleValidate} className="btn-primary flex-1">
            Validar y Continuar
          </button>
          <button
            onClick={() => {
              if (currentIndex < queue.length - 1) {
                setCurrentIndex(currentIndex + 1);
                const next = queue[currentIndex + 1];
                setCorrections({
                  sentiment: next.sentiment,
                  topic: next.topic,
                  intent: next.intent,
                });
              }
            }}
            className="btn-secondary"
          >
            Omitir
          </button>
        </div>
      </div>
    </div>
  );
}
