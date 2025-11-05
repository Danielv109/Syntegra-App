import pool from "./connection.js";

async function updateCascade() {
  const client = await pool.connect();

  try {
    console.log("🔄 Actualizando foreign keys a ON DELETE CASCADE...");

    await client.query("BEGIN");

    // Eliminar constraints antiguas y crear nuevas con CASCADE
    const tables = [
      { table: "messages", column: "client_id" },
      { table: "connectors", column: "client_id" },
      { table: "jobs", column: "client_id" },
      { table: "finetuning_dataset", column: "client_id" },
      { table: "reports", column: "client_id" },
      { table: "client_settings", column: "client_id" },
      { table: "daily_analytics", column: "client_id" },
      { table: "topic_summary", column: "client_id" },
      { table: "channel_summary", column: "client_id" },
    ];

    for (const { table, column } of tables) {
      console.log(`  Actualizando ${table}...`);

      // Buscar el nombre de la constraint existente
      const constraintQuery = `
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = $1 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%${column}%'
      `;

      const constraintResult = await client.query(constraintQuery, [table]);

      if (constraintResult.rows.length > 0) {
        const constraintName = constraintResult.rows[0].constraint_name;

        // Eliminar constraint antigua
        await client.query(
          `ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${constraintName}`
        );

        // Crear nueva constraint con CASCADE
        await client.query(`
          ALTER TABLE ${table} 
          ADD CONSTRAINT ${table}_${column}_fkey 
          FOREIGN KEY (${column}) 
          REFERENCES clients(id) 
          ON DELETE CASCADE
        `);

        console.log(`    ✅ ${table} actualizado`);
      }
    }

    await client.query("COMMIT");

    console.log("✅ Todas las foreign keys actualizadas con ON DELETE CASCADE");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error actualizando constraints:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateCascade()
  .then(() => {
    console.log("🎉 Actualización completada exitosamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Error fatal:", error);
    process.exit(1);
  });
