import React, { useState, useEffect } from "react";
import axios from "axios";

export default function ValidationQueue({ client }) {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [corrections, setCorrections] = useState({});

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const res = await axios.get(
        `${apiUrl}/api/validation/queue/${client.id}`
      );
      setQueue(res.data.queue);
      setStats(res.data.stats);
      if (res.data.queue.length > 0) {
        setCurrentMessage(res.data.queue[0]);
        setCorrections({
          sentiment: res.data.queue[0].sentiment,
          topic: res.data.queue[0].topic,
          intent: res.data.queue[0].intent,
        });
      }
    } catch (error) {
      console.error("Error loading queue:", error);
    }
  };

  const handleValidate = async () => {
    try {
      await axios.post(`${apiUrl}/api/validation/validate`, {
        messageId: currentMessage.id,
        clientId: client.id,
        corrections,
      });

      const newQueue = queue.slice(1);
      setQueue(newQueue);

      if (newQueue.length > 0) {
        setCurrentMessage(newQueue[0]);
        setCorrections({
          sentiment: newQueue[0].sentiment,
          topic: newQueue[0].topic,
          intent: newQueue[0].intent,
        });
      } else {
        setCurrentMessage(null);
        loadQueue();
      }
    } catch (error) {
      console.error("Error validating:", error);
    }
  };

  const handleSkip = () => {
    const newQueue = [...queue.slice(1), queue[0]];
    setQueue(newQueue);
    setCurrentMessage(newQueue[0]);
    setCorrections({
      sentiment: newQueue[0].sentiment,
      topic: newQueue[0].topic,
      intent: newQueue[0].intent,
    });
  };

  if (!currentMessage) {
    return (
      <div>
        <h1 className="text-3xl mb-2 text-text-primary font-bold">
          Validation - {client.name}
        </h1>
        <div className="card mt-8 text-center py-16">
          <div className="text-5xl mb-4">✓</div>
          <div className="text-lg text-text-primary font-semibold mb-2">
            Cola de validación vacía
          </div>
          <div className="text-sm text-text-muted">
            Todos los mensajes han sido validados
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl mb-2 text-text-primary font-bold">
            Validation - {client.name}
          </h1>
          <p className="text-text-muted text-sm">
            Revisa y corrige las clasificaciones de IA
          </p>
        </div>
        {stats && (
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">
                {stats.pending}
              </div>
              <div className="text-xs text-text-disabled uppercase">
                Pendientes
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-success">
                {stats.validated}
              </div>
              <div className="text-xs text-text-disabled uppercase">
                Validados
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-6">
        <div className="card">
          <h3 className="text-[15px] font-semibold text-text-primary mb-4">
            Mensaje Original
          </h3>
          <div className="p-4 bg-dark-bg rounded-lg border border-dark-border mb-6">
            <p className="text-text-secondary leading-relaxed">
              {currentMessage.text}
            </p>
            <div className="flex gap-4 mt-4 text-xs text-text-disabled">
              <span>Canal: {currentMessage.channel}</span>
              <span>•</span>
              <span>{new Date(currentMessage.timestamp).toLocaleString()}</span>
            </div>
          </div>

          <h3 className="text-[15px] font-semibold text-text-primary mb-4">
            Clasificación de IA
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-dark-bg rounded-lg border border-dark-border">
              <div className="text-xs text-text-disabled uppercase mb-1">
                Sentimiento
              </div>
              <div className="text-sm font-medium text-text-primary">
                {currentMessage.sentiment}
              </div>
            </div>
            <div className="p-3 bg-dark-bg rounded-lg border border-dark-border">
              <div className="text-xs text-text-disabled uppercase mb-1">
                Tema
              </div>
              <div className="text-sm font-medium text-text-primary">
                {currentMessage.topic}
              </div>
            </div>
            <div className="p-3 bg-dark-bg rounded-lg border border-dark-border">
              <div className="text-xs text-text-disabled uppercase mb-1">
                Intención
              </div>
              <div className="text-sm font-medium text-text-primary">
                {currentMessage.intent}
              </div>
            </div>
          </div>

          <h3 className="text-[15px] font-semibold text-text-primary mb-4">
            Corrección
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-text-disabled uppercase mb-2">
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
              <label className="block text-xs text-text-disabled uppercase mb-2">
                Tema
              </label>
              <select
                value={corrections.topic}
                onChange={(e) =>
                  setCorrections({ ...corrections, topic: e.target.value })
                }
                className="input-field"
              >
                <option value="entrega">Entrega</option>
                <option value="precio">Precio</option>
                <option value="calidad">Calidad</option>
                <option value="atencion">Atención</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-disabled uppercase mb-2">
                Intención
              </label>
              <select
                value={corrections.intent}
                onChange={(e) =>
                  setCorrections({ ...corrections, intent: e.target.value })
                }
                className="input-field"
              >
                <option value="queja">Queja</option>
                <option value="consulta">Consulta</option>
                <option value="elogio">Elogio</option>
                <option value="solicitud">Solicitud</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleValidate}
            className="btn-primary h-14 text-base"
          >
            ✓ Validar y Continuar
          </button>
          <button onClick={handleSkip} className="btn-secondary h-14 text-base">
            → Saltar
          </button>
          <div className="card mt-4">
            <div className="text-xs text-text-disabled uppercase mb-2">
              Progreso
            </div>
            <div className="text-2xl font-bold text-text-primary mb-3">
              {stats.validated} / {stats.total}
            </div>
            <div className="h-2 bg-dark-bg rounded overflow-hidden">
              <div
                className="h-full bg-accent-primary transition-all"
                style={{
                  width: `${(stats.validated / stats.total) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
