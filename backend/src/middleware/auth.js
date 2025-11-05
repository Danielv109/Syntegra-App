import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "syntegra-secret-key-change-in-production";

export function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Acceso denegado. Se requiere rol de administrador." });
  }
  next();
}
