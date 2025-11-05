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

function calculateBackoff(retryCount) {
  const delays = [5000, 30000, 120000]; // 5s, 30s, 2min
  return delays[Math.min(retryCount, delays.length - 1)];
}

// Actualizar tablas de resumen después de procesar mensajes
async function updateAnalyticsSummaries(client, clientId, messages) {
  console.log(
    `📊 Actualizando tablas de resumen para ${messages.length} mensajes...`
  );

  try {
    // Actualizar resumen diario por canal
    const dailyGroups = {};
    messages.forEach((msg) => {
      const date = new Date(msg.timestamp).toISOString().split("T")[0];
      const key = `${date}_${msg.channel}`;

      if (!dailyGroups[key]) {
        dailyGroups[key] = {
          date,
          channel: msg.channel,
          total: 0,
          positive: 0,
          neutral: 0,
          negative: 0,
        };
      }

      dailyGroups[key].total++;
      if (msg.sentiment === "positive") dailyGroups[key].positive++;
      if (msg.sentiment === "neutral") dailyGroups[key].neutral++;
      if (msg.sentiment === "negative") dailyGroups[key].negative++;
    });

    for (const group of Object.values(dailyGroups)) {
      await client.query(
        `INSERT INTO daily_analytics (client_id, date, channel, total_messages, positive_count, neutral_count, negative_count, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (client_id, date, channel) 
         DO UPDATE SET 
           total_messages = daily_analytics.total_messages + $4,
           positive_count = daily_analytics.positive_count + $5,
           neutral_count = daily_analytics.neutral_count + $6,
           negative_count = daily_analytics.negative_count + $7,
           updated_at = NOW()`,
        [
          clientId,
          group.date,
          group.channel,
          group.total,
          group.positive,
          group.neutral,
          group.negative,
        ]
      );
    }

    // Actualizar resumen por topic
    const topicGroups = {};
    messages.forEach((msg) => {
      if (!topicGroups[msg.topic]) {
        topicGroups[msg.topic] = { total: 0, positive: 0, negative: 0 };
      }
      topicGroups[msg.topic].total++;
      if (msg.sentiment === "positive") topicGroups[msg.topic].positive++;
      if (msg.sentiment === "negative") topicGroups[msg.topic].negative++;
    });

    for (const [topic, counts] of Object.entries(topicGroups)) {
      await client.query(
        `INSERT INTO topic_summary (client_id, topic, total_count, positive_count, negative_count, last_7_days_count, last_30_days_count, updated_at)
         VALUES ($1, $2, $3, $4, $5, $3, $3, NOW())
         ON CONFLICT (client_id, topic)
         DO UPDATE SET
           total_count = topic_summary.total_count + $3,
           positive_count = topic_summary.positive_count + $4,
           negative_count = topic_summary.negative_count + $5,
           updated_at = NOW()`,
        [clientId, topic, counts.total, counts.positive, counts.negative]
      );
    }

    // Actualizar resumen por canal
    const channelGroups = {};
    messages.forEach((msg) => {
      if (!channelGroups[msg.channel]) {
        channelGroups[msg.channel] = {
          total: 0,
          positive: 0,
          neutral: 0,
          negative: 0,
        };
      }
      channelGroups[msg.channel].total++;
      if (msg.sentiment === "positive") channelGroups[msg.channel].positive++;
      if (msg.sentiment === "neutral") channelGroups[msg.channel].neutral++;
      if (msg.sentiment === "negative") channelGroups[msg.channel].negative++;
    });

    for (const [channel, counts] of Object.entries(channelGroups)) {
      await client.query(
        `INSERT INTO channel_summary (client_id, channel, total_messages, positive_count, neutral_count, negative_count, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (client_id, channel)
         DO UPDATE SET
           total_messages = channel_summary.total_messages + $3,
           positive_count = channel_summary.positive_count + $4,
           neutral_count = channel_summary.neutral_count + $5,
           negative_count = channel_summary.negative_count + $6,
           updated_at = NOW()`,
        [
          clientId,
          channel,
          counts.total,
          counts.positive,
          counts.neutral,
          counts.negative,
        ]
      );
    }

    console.log(`✅ Tablas de resumen actualizadas`);
  } catch (error) {
    console.error(`❌ Error actualizando resúmenes:`, error);
    throw error;
  }
}

async function processJob(job) {
  const client = await pool.connect();

  try {
    console.log(
      `\n🚀 Procesando trabajo: ${job.id} (Tipo: ${job.type}, Intento ${
        job.retry_count + 1
      }/${job.max_retries})`
    );

    // ============================================
    // TRANSACCIÓN ATÓMICA - TODO O NADA
    // ============================================
    await client.query("BEGIN");

    // Marcar como procesando DENTRO de la transacción
    await client.query(
      "UPDATE jobs SET status = 'processing', started_at = NOW() WHERE id = $1",
      [job.id]
    );

    let messages = [];

    // ============================================
    // SOPORTE PARA CSV Y API
    // ============================================

    if (job.type === "api_ingest" || job.type === "connector") {
      // Mensajes vienen del payload JSON
      console.log(`📦 Procesando mensajes de API desde payload`);
      const payload =
        typeof job.payload === "string" ? JSON.parse(job.payload) : job.payload;
      messages = payload.map((msg, idx) => ({
        id: `msg_${job.id}_${idx}`,
        client_id: job.client_id,
        text: msg.text || "",
        channel: msg.channel || "api",
        timestamp: msg.timestamp || new Date().toISOString(),
      }));
    } else if (job.type === "upload" || job.type === "csv_upload") {
      // Mensajes vienen de archivo CSV
      console.log(`📄 Procesando mensajes de CSV: ${job.file_path}`);
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
    } else {
      throw new Error(`Tipo de trabajo no soportado: ${job.type}`);
    }

    console.log(`📊 ${messages.length} mensajes extraídos`);

    await client.query("UPDATE jobs SET total_records = $1 WHERE id = $2", [
      messages.length,
      job.id,
    ]);

    if (messages.length === 0) {
      throw new Error("No se encontraron mensajes válidos");
    }

    // Clasificar con IA
    console.log(`🤖 Clasificando con IA...`);
    const classified = await classifyMessagesBatch(messages, 50);

    let processedCount = 0;
    for (const msg of classified) {
      await client.query(
        "INSERT INTO messages (id, client_id, text, channel, timestamp, sentiment, topic, intent, requires_validation) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING",
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

      if (processedCount % 10 === 0) {
        await client.query(
          "UPDATE jobs SET processed_records = $1 WHERE id = $2",
          [processedCount, job.id]
        );
      }
    }

    // Actualizar resúmenes analíticos
    await updateAnalyticsSummaries(client, job.client_id, classified);

    // Actualizar cliente
    await client.query(
      "UPDATE clients SET total_messages = (SELECT COUNT(*) FROM messages WHERE client_id = $1), last_analysis = NOW() WHERE id = $1",
      [job.client_id]
    );

    // Marcar como completado DENTRO de la transacción
    await client.query(
      "UPDATE jobs SET status = 'completed', processed_records = $1, completed_at = NOW(), last_error = NULL WHERE id = $2",
      [processedCount, job.id]
    );

    // COMMIT FINAL - Si esto falla, todo se revierte
    await client.query("COMMIT");

    console.log(
      `✅ Trabajo ${job.id} completado: ${processedCount} mensajes procesados`
    );

    // Limpiar archivo DESPUÉS del commit exitoso
    if (
      (job.type === "upload" || job.type === "csv_upload") &&
      job.file_path &&
      fs.existsSync(job.file_path)
    ) {
      fs.unlinkSync(job.file_path);
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`❌ Error en trabajo ${job.id}:`, error.message);

    const retryCount = job.retry_count + 1;

    if (retryCount < job.max_retries) {
      const backoffMs = calculateBackoff(retryCount);
      const nextRetry = new Date(Date.now() + backoffMs);

      await client.query(
        "UPDATE jobs SET status = 'pending', retry_count = $1, last_error = $2, next_retry_at = $3 WHERE id = $4",
        [retryCount, error.message, nextRetry, job.id]
      );

      console.log(
        `⏳ Reintento ${retryCount}/${job.max_retries} programado en ${
          backoffMs / 1000
        }s`
      );
    } else {
      await client.query(
        "UPDATE jobs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2",
        [error.message, job.id]
      );
      console.log(
        `💀 Trabajo ${job.id} falló permanentemente después de ${job.max_retries} intentos`
      );
    }
  } finally {
    client.release();
  }
}

// Bucle principal
async function workerLoop() {
  while (true) {
    try {
      const result = await pool.query(
        `SELECT * FROM jobs 
         WHERE status = 'pending' 
         AND (next_retry_at IS NULL OR next_retry_at <= NOW())
         ORDER BY created_at ASC 
         LIMIT 1 
         FOR UPDATE SKIP LOCKED`
      );

      if (result.rows.length > 0) {
        await processJob(result.rows[0]);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error("❌ Error en worker loop:", error);
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
}

process.on("SIGTERM", async () => {
  console.log("👋 Worker cerrando...");
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("👋 Worker cerrando...");
  await pool.end();
  process.exit(0);
});

workerLoop().catch(console.error);
