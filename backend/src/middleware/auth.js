import jwt from "jsonwebtoken";
import pool from "../db/connection.js";

// IMPORTANTE: Leer JWT_SECRET del .env
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error(
    "❌ FATAL: JWT_SECRET no está definido en .env o docker-compose.yml"
  );
  process.exit(1);
}

console.log(
  "🔑 JWT_SECRET configurado correctamente:",
  JWT_SECRET.substring(0, 20) + "..."
);

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Token no proporcionado o formato inválido" });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET);

    // Añadir usuario al request
    req.user = decoded;

    console.log(
      `✅ Usuario autenticado: ${decoded.username} (${decoded.role})`
    );

    next();
  } catch (error) {
    console.error("❌ Token inválido:", error.message);
    return res.status(401).json({
      error: "Token inválido o expirado. Por favor inicia sesión nuevamente.",
    });
  }
}

export async function verifyClientAccess(userId, clientId, role) {
  try {
    // Admin tiene acceso total
    if (role === "admin") {
      return true;
    }

    // Verificar membresía en team_memberships
    const result = await pool.query(
      "SELECT * FROM team_memberships WHERE user_id = $1 AND client_id = $2",
      [userId, clientId]
    );

    return result.rows.length > 0;
  } catch (error) {
    console.error("❌ Error verificando acceso:", error);
    return false;
  }
}

export async function authorizeClient(req, res, next) {
  try {
    const clientId =
      req.query.clientId || req.params.clientId || req.body.clientId;

    if (!clientId) {
      return res.status(400).json({ error: "clientId es requerido" });
    }

    const userId = req.user.userId;

    // Verificar acceso usando la función helper
    const hasAccess = await verifyClientAccess(userId, clientId, req.user.role);

    if (!hasAccess) {
      console.log(
        `❌ Usuario ${req.user.username} NO tiene acceso a cliente ${clientId}`
      );
      return res.status(403).json({
        error: "No tienes permiso para acceder a este cliente",
      });
    }

    console.log(
      `✅ Usuario ${req.user.username} autorizado para cliente ${clientId}`
    );
    next();
  } catch (error) {
    console.error("❌ Error en autorización:", error);
    return res.status(403).json({ error: "Error al verificar permisos" });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "No autenticado" });
  }

  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Acceso denegado. Se requiere rol de administrador." });
  }

  next();
}
