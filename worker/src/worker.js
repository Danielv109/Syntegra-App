import dotenv from "dotenv";

dotenv.config();

console.log("🔧 Worker started successfully");
console.log("⏳ Waiting for jobs...");

// Simula procesamiento cada 30 segundos
setInterval(() => {
  console.log(
    `✅ [${new Date().toISOString()}] Worker health check - Ready to process jobs`
  );
}, 30000);

// Mantener proceso vivo
process.on("SIGINT", () => {
  console.log("👋 Worker shutting down gracefully...");
  process.exit(0);
});
