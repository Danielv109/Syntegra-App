// Copiar exactamente el contenido de backend/src/services/ai-classifier.js
import axios from "axios";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export async function classifyBatchWithOpenAI(messages) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY no configurada");
  }

  const batchPrompt = messages
    .map((msg, idx) => `${idx + 1}. "${msg.text}"`)
    .join("\n");

  try {
    const response = await axios.post(
      OPENAI_URL,
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Eres un clasificador experto. Recibirás una lista numerada de mensajes de clientes.
Responde SOLO con un array JSON, un objeto por cada mensaje en el mismo orden.

Formato exacto:
[
  {"sentiment":"positive","topic":"calidad","intent":"elogio","requires_validation":false},
  {"sentiment":"negative","topic":"entrega","intent":"queja","requires_validation":true}
]

Valores permitidos:
- sentiment: positive/neutral/negative
- topic: entrega/precio/calidad/atencion/otro
- intent: queja/consulta/elogio/solicitud
- requires_validation: true si es crítico o ambiguo`,
          },
          {
            role: "user",
            content: `Clasifica estos ${messages.length} mensajes:\n\n${batchPrompt}`,
          },
        ],
        temperature: 0.3,
        max_tokens: messages.length * 50,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error("No se encontró array JSON en respuesta");
    }

    const classifications = JSON.parse(jsonMatch[0]);

    return messages.map((msg, idx) => ({
      ...msg,
      ...(classifications[idx] || {
        sentiment: "neutral",
        topic: "otro",
        intent: "consulta",
        requires_validation: true,
      }),
    }));
  } catch (error) {
    console.error("Error en batch OpenAI:", error.message);
    throw error;
  }
}

export async function classifyBatchWithOllama(messages) {
  const OLLAMA_URL =
    process.env.OLLAMA_URL || "http://host.docker.internal:11434/api/generate";
  const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "deepseek-r1:14b";

  const batchPrompt = messages
    .map((msg, idx) => `${idx + 1}. "${msg.text}"`)
    .join("\n");

  try {
    const response = await axios.post(
      OLLAMA_URL,
      {
        model: OLLAMA_MODEL,
        prompt: `Clasifica estos mensajes y responde SOLO con un array JSON (sin <think>, sin markdown):

Mensajes:
${batchPrompt}

Responde exactamente así:
[
  {"sentiment":"positive","topic":"calidad","intent":"elogio","requires_validation":false},
  {"sentiment":"negative","topic":"entrega","intent":"queja","requires_validation":true}
]

Valores:
- sentiment: positive/neutral/negative
- topic: entrega/precio/calidad/atencion/otro
- intent: queja/consulta/elogio/solicitud
- requires_validation: true/false

Array JSON:`,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: messages.length * 60,
        },
      },
      {
        timeout: 120000,
      }
    );

    let textResponse = response.data.response;
    textResponse = textResponse.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    const jsonMatch = textResponse.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error("No se encontró array JSON");
    }

    const classifications = JSON.parse(jsonMatch[0]);

    return messages.map((msg, idx) => ({
      ...msg,
      ...(classifications[idx] || {
        sentiment: "neutral",
        topic: "otro",
        intent: "consulta",
        requires_validation: true,
      }),
    }));
  } catch (error) {
    console.error("Error en batch Ollama:", error.message);
    throw error;
  }
}

export async function classifyMessagesBatch(messages, batchSize = 50) {
  const AI_PROVIDER = process.env.AI_PROVIDER || "openai";
  const results = [];

  console.log(
    `🤖 Clasificando ${
      messages.length
    } mensajes con ${AI_PROVIDER.toUpperCase()} en lotes de ${batchSize}...`
  );

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);

    console.log(
      `📦 Procesando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        messages.length / batchSize
      )} (${batch.length} mensajes)`
    );

    try {
      let classified;

      if (AI_PROVIDER === "ollama") {
        classified = await classifyBatchWithOllama(batch);
      } else {
        classified = await classifyBatchWithOpenAI(batch);
      }

      results.push(...classified);
      console.log(`✓ Lote ${Math.floor(i / batchSize) + 1} completado`);

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(
        `❌ Error en lote ${Math.floor(i / batchSize) + 1}, usando fallback`
      );

      for (const msg of batch) {
        results.push(classifyWithFallback(msg));
      }
    }
  }

  return results;
}

function classifyWithFallback(msg) {
  const text = msg.text.toLowerCase();

  let sentiment = "neutral";
  if (text.match(/excelente|bueno|genial|perfecto|recomiendo|gracias|feliz/)) {
    sentiment = "positive";
  } else if (
    text.match(/mal|problema|queja|tarde|demora|error|pésimo|nunca|horrible/)
  ) {
    sentiment = "negative";
  }

  let topic = "otro";
  if (text.match(/entrega|envío|llegó|demora|retraso|pedido/)) {
    topic = "entrega";
  } else if (text.match(/precio|costo|caro|barato|pago|factura/)) {
    topic = "precio";
  } else if (text.match(/calidad|producto|defecto|roto/)) {
    topic = "calidad";
  } else if (text.match(/atención|servicio|respuesta|ayuda/)) {
    topic = "atencion";
  }

  let intent = "consulta";
  if (text.match(/\?/)) {
    intent = "consulta";
  } else if (sentiment === "negative") {
    intent = "queja";
  } else if (sentiment === "positive") {
    intent = "elogio";
  }

  return {
    ...msg,
    sentiment,
    topic,
    intent,
    requires_validation: true,
  };
}
