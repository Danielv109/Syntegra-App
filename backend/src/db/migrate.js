import pool from "./connection.js";
import bcrypt from "bcryptjs";

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
        created_at TIMESTAMP DEFAULT NOW(),
        last_analysis TIMESTAMP
      );
    `);

    // Tabla de mensajes con ON DELETE CASCADE
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(50) PRIMARY KEY,
        client_id VARCHAR(50) REFERENCES clients(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        channel VARCHAR(50),
        timestamp TIMESTAMP DEFAULT NOW(),
        sentiment VARCHAR(20),
        topic VARCHAR(100),
        intent VARCHAR(100),
        requires_validation BOOLEAN DEFAULT false,
        validated BOOLEAN DEFAULT false
      );
    `);

    // Tabla de conectores con ON DELETE CASCADE
    await client.query(`
      CREATE TABLE IF NOT EXISTS connectors (
        id VARCHAR(50) PRIMARY KEY,
        client_id VARCHAR(50) REFERENCES clients(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        api_key TEXT NOT NULL,
        enabled BOOLEAN DEFAULT false,
        status VARCHAR(20) DEFAULT 'inactive',
        frequency VARCHAR(20) DEFAULT 'daily',
        last_sync TIMESTAMP,
        total_messages INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabla de trabajos con payload JSONB
    await client.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id VARCHAR(50) PRIMARY KEY,
        client_id VARCHAR(50) REFERENCES clients(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        file_path VARCHAR(500),
        payload JSONB,
        status VARCHAR(20) DEFAULT 'pending',
        total_records INTEGER DEFAULT 0,
        processed_records INTEGER DEFAULT 0,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        last_error TEXT,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        next_retry_at TIMESTAMP
      );
    `);

    // Tabla de fine-tuning dataset con ON DELETE CASCADE
    await client.query(`
      CREATE TABLE IF NOT EXISTS finetuning_dataset (
        id VARCHAR(50) PRIMARY KEY,
        client_id VARCHAR(50) REFERENCES clients(id) ON DELETE CASCADE,
        message_id VARCHAR(50),
        text TEXT NOT NULL,
        ai_sentiment VARCHAR(20),
        ai_topic VARCHAR(100),
        ai_intent VARCHAR(100),
        human_sentiment VARCHAR(20),
        human_topic VARCHAR(100),
        human_intent VARCHAR(100),
        corrected_by VARCHAR(100),
        corrected_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabla de reportes con ON DELETE CASCADE
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(50) PRIMARY KEY,
        client_id VARCHAR(50) REFERENCES clients(id) ON DELETE CASCADE,
        title VARCHAR(255),
        type VARCHAR(50),
        filename VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabla de configuraciones con ON DELETE CASCADE
    await client.query(`
      CREATE TABLE IF NOT EXISTS client_settings (
        client_id VARCHAR(50) PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
        notifications JSONB,
        processing JSONB,
        integrations JSONB,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabla de analytics diarios con ON DELETE CASCADE
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_analytics (
        id SERIAL PRIMARY KEY,
        client_id VARCHAR(50) REFERENCES clients(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        channel VARCHAR(50) NOT NULL,
        total_messages INTEGER DEFAULT 0,
        positive_count INTEGER DEFAULT 0,
        neutral_count INTEGER DEFAULT 0,
        negative_count INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(client_id, date, channel)
      );
    `);

    // Tabla de resumen de topics con ON DELETE CASCADE
    await client.query(`
      CREATE TABLE IF NOT EXISTS topic_summary (
        id SERIAL PRIMARY KEY,
        client_id VARCHAR(50) REFERENCES clients(id) ON DELETE CASCADE,
        topic VARCHAR(100) NOT NULL,
        total_count INTEGER DEFAULT 0,
        positive_count INTEGER DEFAULT 0,
        negative_count INTEGER DEFAULT 0,
        last_7_days_count INTEGER DEFAULT 0,
        last_30_days_count INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(client_id, topic)
      );
    `);

    // Tabla de resumen por canal con ON DELETE CASCADE
    await client.query(`
      CREATE TABLE IF NOT EXISTS channel_summary (
        id SERIAL PRIMARY KEY,
        client_id VARCHAR(50) REFERENCES clients(id) ON DELETE CASCADE,
        channel VARCHAR(50) NOT NULL,
        total_messages INTEGER DEFAULT 0,
        positive_count INTEGER DEFAULT 0,
        neutral_count INTEGER DEFAULT 0,
        negative_count INTEGER DEFAULT 0,
        avg_response_time_hours NUMERIC(10, 2),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(client_id, channel)
      );
    `);

    // Tabla de usuarios (autenticación)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL,
        full_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP
      );
    `);

    // Tabla de membresías de equipo (autorización)
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_memberships (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
        client_id VARCHAR(50) REFERENCES clients(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'viewer',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, client_id)
      );
    `);

    // Generar hash correcto para "admin123"
    const adminPasswordHash = await bcrypt.hash("admin123", 10);

    // Crear usuario admin por defecto
    await client.query(
      `
      INSERT INTO users (id, username, password_hash, role, full_name)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) DO UPDATE SET password_hash = $3;
    `,
      ["user_admin", "admin", adminPasswordHash, "admin", "Administrador"]
    );

    // Dar al admin acceso a todos los clientes existentes
    await client.query(`
      INSERT INTO team_memberships (user_id, client_id, role)
      SELECT 'user_admin', id, 'admin'
      FROM clients
      ON CONFLICT (user_id, client_id) DO NOTHING;
    `);

    // Índice para búsquedas rápidas
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    // Índices para mejor rendimiento
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_client ON messages(client_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sentiment ON messages(sentiment);
      CREATE INDEX IF NOT EXISTS idx_messages_validation ON messages(requires_validation, validated);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
      CREATE INDEX IF NOT EXISTS idx_jobs_client ON jobs(client_id);
      CREATE INDEX IF NOT EXISTS idx_jobs_retry ON jobs(status, next_retry_at);
      CREATE INDEX IF NOT EXISTS idx_finetuning_client ON finetuning_dataset(client_id);
      CREATE INDEX IF NOT EXISTS idx_daily_analytics_client_date ON daily_analytics(client_id, date);
      CREATE INDEX IF NOT EXISTS idx_topic_summary_client ON topic_summary(client_id);
      CREATE INDEX IF NOT EXISTS idx_channel_summary_client ON channel_summary(client_id);
      CREATE INDEX IF NOT EXISTS idx_team_memberships_user ON team_memberships(user_id);
      CREATE INDEX IF NOT EXISTS idx_team_memberships_client ON team_memberships(client_id);
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
