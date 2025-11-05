import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "syntegra-secret-key-change-in-production";

export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Token no proporcionado o formato inválido" });
    }

    const token = authHeader.replace("Bearer ", "");

    const decoded = jwt.verify(token, JWT_SECRET);
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
