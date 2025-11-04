import axios from "axios";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Opción 1: OpenAI (RECOMENDADO para producción)
export async function classifyWithOpenAI(messages) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY no configurada");
  }

  const results = [];

  for (const msg of messages) {
    try {
      const response = await axios.post(
        OPENAI_URL,
        {
          model: "gpt-4o-mini", // Más económico que gpt-4
          messages: [
            {
              role: "system",
              content: `Eres un clasificador experto de mensajes de clientes. Analiza el mensaje y devuelve SOLO un JSON válido con esta estructura exacta:
{
  "sentiment": "positive" | "neutral" | "negative",
  "topic": "entrega" | "precio" | "calidad" | "atencion" | "otro",
  "intent": "queja" | "consulta" | "elogio" | "solicitud",
  "requires_validation": true | false
}

Marca requires_validation como true si el mensaje es crítico, ambiguo o contiene múltiples temas.`,
            },
            {
              role: "user",
              content: `Clasifica este mensaje: "${msg.text}"`,
            },
          ],
          temperature: 0.3,
          max_tokens: 150,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const classification = JSON.parse(
        response.data.choices[0].message.content
      );

      results.push({
        ...msg,
        ...classification,
      });
    } catch (error) {
      console.error(`Error clasificando mensaje ${msg.id}:`, error.message);

      // Fallback: clasificación básica
      results.push({
        ...msg,
        sentiment: "neutral",
        topic: "otro",
        intent: "consulta",
        requires_validation: true,
      });
    }

    // Rate limiting: esperar 100ms entre llamadas
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

// Opción 2: Ollama (GRATIS, local, pero más lento)
export async function classifyWithOllama(messages) {
  const OLLAMA_URL =
    process.env.OLLAMA_URL || "http://host.docker.internal:11434/api/generate";
  const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "deepseek-r1:14b";

  console.log(`🤖 Usando Ollama: ${OLLAMA_MODEL} en ${OLLAMA_URL}`);

  const results = [];

  for (const msg of messages) {
    try {
      const response = await axios.post(
        OLLAMA_URL,
        {
          model: OLLAMA_MODEL,
          prompt: `Clasifica este mensaje de cliente y responde SOLO con JSON puro (sin <think>, sin markdown, sin explicaciones):

Mensaje: "${msg.text}"

Responde exactamente así:
{"sentiment":"positive","topic":"calidad","intent":"elogio","requires_validation":false}

Valores:
- sentiment: positive/neutral/negative
- topic: entrega/precio/calidad/atencion/otro
- intent: queja/consulta/elogio/solicitud
- requires_validation: true/false

JSON:`,
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 150,
            top_p: 0.9,
          },
        },
        {
          timeout: 60000, // 60 segundos (DeepSeek puede tardar)
        }
      );

      let classification;
      let textResponse = response.data.response;

      // DeepSeek R1 puede incluir <think>...</think>, eliminarlo
      textResponse = textResponse
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .trim();

      // Buscar JSON en la respuesta
      const jsonMatch = textResponse.match(/\{[^{}]*\}/);

      if (jsonMatch) {
        try {
          classification = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.warn(
            `⚠️ Error parseando JSON de DeepSeek para mensaje ${msg.id}`
          );
          throw parseError;
        }
      } else {
        throw new Error("No se encontró JSON válido en la respuesta");
      }

      // Validar propiedades
      if (
        !classification.sentiment ||
        !classification.topic ||
        !classification.intent
      ) {
        throw new Error("JSON incompleto");
      }

      results.push({
        ...msg,
        sentiment: classification.sentiment,
        topic: classification.topic,
        intent: classification.intent,
        requires_validation: classification.requires_validation || false,
      });

      console.log(
        `✓ Clasificado con DeepSeek: ${msg.text.substring(0, 40)}... → ${
          classification.sentiment
        }/${classification.topic}`
      );
    } catch (error) {
      console.error(
        `❌ Error con DeepSeek para mensaje ${msg.id}:`,
        error.message
      );

      // Fallback: clasificación por palabras clave
      const text = msg.text.toLowerCase();

      let sentiment = "neutral";
      if (
        text.match(
          /excelente|bueno|genial|perfecto|recomiendo|gracias|feliz|increíble|amor/
        )
      ) {
        sentiment = "positive";
      } else if (
        text.match(
          /mal|problema|queja|tarde|demora|error|pésimo|nunca|horrible|decepcion/
        )
      ) {
        sentiment = "negative";
      }

      let topic = "otro";
      if (text.match(/entrega|envío|llegó|demora|retraso|pedido|paquete/)) {
        topic = "entrega";
      } else if (text.match(/precio|costo|caro|barato|pago|factura|cobro/)) {
        topic = "precio";
      } else if (
        text.match(/calidad|producto|defecto|roto|malo|bueno|excelente/)
      ) {
        topic = "calidad";
      } else if (
        text.match(/atención|servicio|respuesta|ayuda|soporte|empleado/)
      ) {
        topic = "atencion";
      }

      let intent = "consulta";
      if (text.match(/\?|cuánto|cómo|dónde|cuál|puedo/)) {
        intent = "consulta";
      } else if (sentiment === "negative") {
        intent = "queja";
      } else if (sentiment === "positive") {
        intent = "elogio";
      }

      results.push({
        ...msg,
        sentiment,
        topic,
        intent,
        requires_validation: true,
      });

      console.log(
        `⚠️ Fallback (sin IA): ${msg.text.substring(
          0,
          40
        )}... → ${sentiment}/${topic}`
      );
    }

    // Pequeña pausa entre mensajes para no saturar
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return results;
}

// Función principal que usa la IA configurada
export async function classifyMessages(messages) {
  const AI_PROVIDER = process.env.AI_PROVIDER || "openai"; // "openai" o "ollama"

  console.log(
    `🤖 Clasificando ${
      messages.length
    } mensajes con ${AI_PROVIDER.toUpperCase()}...`
  );

  if (AI_PROVIDER === "ollama") {
    return classifyWithOllama(messages);
  } else {
    return classifyWithOpenAI(messages);
  }
}
