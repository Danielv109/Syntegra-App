import dotenv from "dotenv";
import pg from "pg";
import fs from "fs";
import csv from "csv-parser";
import { classifyMessagesBatch } from "./ai-classifier.js";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "db",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  user: process.env.POSTGRES_USER || "syntegra",
  password: process.env.POSTGRES_PASSWORD || "syntegra",
  database: process.env.POSTGRES_DB || "syntegra",
});

console.log("🔧 Worker iniciado - Esperando trabajos en la cola...");

async function processJob(job) {
  const client = await pool.connect();

  try {
    console.log(`\n🚀 Procesando trabajo: ${job.id}`);
    console.log(`📁 Archivo: ${job.file_path}`);

    // Marcar como iniciado
    await client.query(
      "UPDATE jobs SET status = 'processing', started_at = NOW() WHERE id = $1",
      [job.id]
    );

    // Leer y parsear CSV
    const messages = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(job.file_path)
        .pipe(csv())
        .on("data", (row) => {
          if (row.text || row.message) {
            messages.push({
              id: `msg_${job.id}_${messages.length}`,
              client_id: job.client_id,
              text: row.text || row.message || "",
              channel: row.channel || "csv",
              timestamp: row.timestamp || new Date().toISOString(),
            });
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    console.log(`📊 ${messages.length} mensajes extraídos del CSV`);

    // Actualizar total de registros
    await client.query("UPDATE jobs SET total_records = $1 WHERE id = $2", [
      messages.length,
      job.id,
    ]);

    if (messages.length === 0) {
      throw new Error("No se encontraron mensajes válidos en el archivo");
    }

    // Clasificar en lotes
    console.log(`🤖 Iniciando clasificación con IA...`);
    const classified = await classifyMessagesBatch(messages, 50);

    // Guardar en base de datos en transacción
    await client.query("BEGIN");

    let processedCount = 0;
    for (const msg of classified) {
      await client.query(
        `INSERT INTO messages (id, client_id, text, channel, timestamp, sentiment, topic, intent, requires_validation)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          msg.id,
          msg.client_id,
          msg.text,
          msg.channel,
          msg.timestamp,
          msg.sentiment,
          msg.topic,
          msg.intent,
          msg.requires_validation,
        ]
      );

      processedCount++;

      // Actualizar progreso cada 10 mensajes
      if (processedCount % 10 === 0) {
        await client.query(
          "UPDATE jobs SET processed_records = $1 WHERE id = $2",
          [processedCount, job.id]
        );
      }
    }

    // Actualizar contador del cliente
    await client.query(
      `UPDATE clients 
       SET total_messages = (SELECT COUNT(*) FROM messages WHERE client_id = $1),
           last_analysis = NOW()
       WHERE id = $1`,
      [job.client_id]
    );

    await client.query("COMMIT");

    // Marcar trabajo como completado
    await client.query(
      "UPDATE jobs SET status = 'completed', processed_records = $1, completed_at = NOW() WHERE id = $2",
      [processedCount, job.id]
    );

    console.log(
      `✅ Trabajo ${job.id} completado: ${processedCount} mensajes procesados`
    );

    // Limpiar archivo temporal
    fs.unlinkSync(job.file_path);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`❌ Error en trabajo ${job.id}:`, error.message);

    await client.query(
      "UPDATE jobs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2",
      [error.message, job.id]
    );
  } finally {
    client.release();
  }
}

// Bucle principal del worker
async function workerLoop() {
  while (true) {
    try {
      // Buscar trabajos pendientes
      const result = await pool.query(
        `SELECT * FROM jobs 
         WHERE status = 'pending' 
         ORDER BY created_at ASC 
         LIMIT 1 
         FOR UPDATE SKIP LOCKED`
      );

      if (result.rows.length > 0) {
        await processJob(result.rows[0]);
      } else {
        // No hay trabajos, esperar 5 segundos
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error("❌ Error en worker loop:", error);
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
}

// Manejo de señales para apagado graceful
process.on("SIGTERM", async () => {
  console.log("👋 Worker recibió SIGTERM, cerrando...");
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("👋 Worker recibió SIGINT, cerrando...");
  await pool.end();
  process.exit(0);
});

// Iniciar worker
workerLoop().catch(console.error);
