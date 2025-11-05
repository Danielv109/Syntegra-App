import dotenv from "dotenv";
import pg from "pg";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "db",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  user: process.env.POSTGRES_USER || "syntegra",
  password: process.env.POSTGRES_PASSWORD || "syntegra",
  database: process.env.POSTGRES_DB || "syntegra",
});

console.log(
  "🔌 Connector Worker iniciado - Monitoreando conectores activos..."
);

// Fetch mensajes desde WhatsApp Business API
async function fetchWhatsAppMessages(connector) {
  try {
    // Simulación - En producción usar la API real de Meta
    console.log(`📱 Extrayendo mensajes de WhatsApp: ${connector.name}`);

    // Ejemplo de estructura real:
    // const response = await axios.get(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
    //   headers: { Authorization: `Bearer ${connector.api_key}` }
    // });

    // Simulación de mensajes extraídos
    const simulatedMessages = [
      {
        text: "Hola, quisiera información sobre precios",
        timestamp: new Date().toISOString(),
      },
      { text: "Mi pedido aún no llega", timestamp: new Date().toISOString() },
    ];

    return simulatedMessages;
  } catch (error) {
    console.error(`Error extrayendo de WhatsApp:`, error.message);
    return [];
  }
}

// Fetch mensajes desde Gmail API
async function fetchGmailMessages(connector) {
  try {
    console.log(`📧 Extrayendo mensajes de Gmail: ${connector.name}`);

    // En producción, usar Gmail API con OAuth
    // const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    // const response = await gmail.users.messages.list({ userId: 'me', q: 'label:support' });

    const simulatedMessages = [
      { text: "Solicitud de cotización", timestamp: new Date().toISOString() },
    ];

    return simulatedMessages;
  } catch (error) {
    console.error(`Error extrayendo de Gmail:`, error.message);
    return [];
  }
}

// Fetch mensajes desde Instagram
async function fetchInstagramMessages(connector) {
  try {
    console.log(`📸 Extrayendo mensajes de Instagram: ${connector.name}`);

    // En producción, usar Instagram Graph API
    // const response = await axios.get(`https://graph.instagram.com/v18.0/me/conversations`, {
    //   headers: { Authorization: `Bearer ${connector.api_key}` }
    // });

    const simulatedMessages = [
      { text: "Me encanta su producto!", timestamp: new Date().toISOString() },
    ];

    return simulatedMessages;
  } catch (error) {
    console.error(`Error extrayendo de Instagram:`, error.message);
    return [];
  }
}

// Procesar un conector
async function processConnector(connector) {
  const client = await pool.connect();

  try {
    console.log(
      `\n🚀 Procesando conector: ${connector.name} (${connector.type})`
    );

    let messages = [];

    switch (connector.type) {
      case "whatsapp":
        messages = await fetchWhatsAppMessages(connector);
        break;
      case "gmail":
        messages = await fetchGmailMessages(connector);
        break;
      case "instagram":
      case "facebook":
        messages = await fetchInstagramMessages(connector);
        break;
      default:
        console.log(`⚠️ Tipo de conector no soportado: ${connector.type}`);
        return;
    }

    if (messages.length === 0) {
      console.log(`✓ No hay mensajes nuevos en ${connector.name}`);
      return;
    }

    console.log(
      `📊 ${messages.length} mensajes extraídos de ${connector.name}`
    );

    // Crear archivo temporal CSV
    const uploadsDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `connector_${connector.id}_${Date.now()}.csv`;
    const filepath = path.join(uploadsDir, filename);

    // Escribir CSV
    const csvContent = [
      "text,timestamp,channel",
      ...messages.map(
        (m) => `"${m.text}","${m.timestamp}","${connector.type}"`
      ),
    ].join("\n");

    fs.writeFileSync(filepath, csvContent);

    // Crear trabajo en la cola para que el worker principal lo procese
    const jobId = `job_${Date.now()}`;
    await client.query(
      `INSERT INTO jobs (id, client_id, type, file_path, status, total_records)
       VALUES ($1, $2, 'connector', $3, 'pending', $4)`,
      [jobId, connector.client_id, filepath, messages.length]
    );

    // Actualizar conector
    await client.query(
      `UPDATE connectors 
       SET last_sync = NOW(), 
           total_messages = total_messages + $1
       WHERE id = $2`,
      [messages.length, connector.id]
    );

    console.log(
      `✅ Trabajo ${jobId} creado con ${messages.length} mensajes de ${connector.name}`
    );
  } catch (error) {
    console.error(
      `❌ Error procesando conector ${connector.id}:`,
      error.message
    );
  } finally {
    client.release();
  }
}

// Bucle principal
async function connectorLoop() {
  while (true) {
    try {
      // Buscar conectores activos que necesiten sincronización
      const result = await pool.query(
        `SELECT * FROM connectors 
         WHERE enabled = true 
         AND status = 'active'
         AND (
           last_sync IS NULL 
           OR (frequency = 'hourly' AND last_sync < NOW() - INTERVAL '1 hour')
           OR (frequency = 'daily' AND last_sync < NOW() - INTERVAL '1 day')
           OR (frequency = 'weekly' AND last_sync < NOW() - INTERVAL '7 days')
         )`
      );

      if (result.rows.length > 0) {
        console.log(
          `\n📡 ${result.rows.length} conectores listos para sincronización`
        );

        for (const connector of result.rows) {
          await processConnector(connector);
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Pausa entre conectores
        }
      } else {
        console.log("💤 No hay conectores que sincronizar...");
      }

      // Esperar 5 minutos antes del próximo ciclo
      await new Promise((resolve) => setTimeout(resolve, 300000));
    } catch (error) {
      console.error("❌ Error en connector loop:", error);
      await new Promise((resolve) => setTimeout(resolve, 60000)); // Esperar 1 minuto en caso de error
    }
  }
}

process.on("SIGTERM", async () => {
  console.log("👋 Connector Worker cerrando...");
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("👋 Connector Worker cerrando...");
  await pool.end();
  process.exit(0);
});

connectorLoop().catch(console.error);
