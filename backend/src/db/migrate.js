import pool from "./connection.js";

async function migrate() {
  const client = await pool.connect();

  try {
    console.log("🔄 Running migrations...");

    // Tabla de clientes
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        industry VARCHAR(100),
        active BOOLEAN DEFAULT true,
        total_messages INTEGER DEFAULT 0,
        last_analysis TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabla de mensajes
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(50) PRIMARY KEY,
        client_id VARCHAR(50) REFERENCES clients(id),
        text TEXT NOT NULL,
        channel VARCHAR(50),
        timestamp TIMESTAMP DEFAULT NOW(),
        sentiment VARCHAR(20),
        topic VARCHAR(100),
        intent VARCHAR(50),
        requires_validation BOOLEAN DEFAULT false,
        validated BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabla de conectores
    await client.query(`
      CREATE TABLE IF NOT EXISTS connectors (
        id VARCHAR(50) PRIMARY KEY,
        client_id VARCHAR(50) REFERENCES clients(id),
        type VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        enabled BOOLEAN DEFAULT false,
        status VARCHAR(20) DEFAULT 'inactive',
        frequency VARCHAR(20) DEFAULT 'daily',
        api_key TEXT,
        last_sync TIMESTAMP,
        total_messages INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabla de reportes
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(50) PRIMARY KEY,
        client_id VARCHAR(50) REFERENCES clients(id),
        title VARCHAR(255),
        type VARCHAR(50),
        filename VARCHAR(255),
        status VARCHAR(20) DEFAULT 'processing',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabla de trabajos (Job Queue)
    await client.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id VARCHAR(50) PRIMARY KEY,
        client_id VARCHAR(50) REFERENCES clients(id),
        type VARCHAR(50) NOT NULL,
        file_path VARCHAR(500),
        status VARCHAR(20) DEFAULT 'pending',
        total_records INTEGER DEFAULT 0,
        processed_records INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        started_at TIMESTAMP,
        completed_at TIMESTAMP
      );
    `);

    // Tabla de dataset para fine-tuning (base de datos de oro)
    await client.query(`
      CREATE TABLE IF NOT EXISTS finetuning_dataset (
        id VARCHAR(50) PRIMARY KEY,
        client_id VARCHAR(50) REFERENCES clients(id),
        message_id VARCHAR(50) REFERENCES messages(id),
        text TEXT NOT NULL,
        ai_sentiment VARCHAR(20),
        ai_topic VARCHAR(100),
        ai_intent VARCHAR(50),
        human_sentiment VARCHAR(20),
        human_topic VARCHAR(100),
        human_intent VARCHAR(50),
        corrected_by VARCHAR(100),
        corrected_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Índices para rendimiento
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_client ON messages(client_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sentiment ON messages(sentiment);
      CREATE INDEX IF NOT EXISTS idx_messages_validation ON messages(requires_validation, validated);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
      CREATE INDEX IF NOT EXISTS idx_jobs_client ON jobs(client_id);
      CREATE INDEX IF NOT EXISTS idx_finetuning_client ON finetuning_dataset(client_id);
    `);

    console.log("✅ Migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration error:", error);
    throw error;
  } finally {
    client.release();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
