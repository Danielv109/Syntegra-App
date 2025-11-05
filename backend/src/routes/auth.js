import { Router } from "express";
import pool from "../db/connection.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "syntegra-secret-key-change-in-production";

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username y password son requeridos" });
    }

    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    await pool.query("UPDATE users SET last_login = NOW() WHERE id = $1", [
      user.id,
    ]);

    console.log("✅ Login exitoso:", user.username);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

router.post("/change-password", async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      newHash,
      user.id,
    ]);

    res.json({ success: true, message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error("Error cambiando contraseña:", error);
    res.status(500).json({ error: "Error al cambiar contraseña" });
  }
});

router.post("/create-user", async (req, res) => {
  try {
    const { username, password, role, fullName } = req.body;

    if (!username || !password || !role) {
      return res
        .status(400)
        .json({ error: "Username, password y role son requeridos" });
    }

    if (!["admin", "reader"].includes(role)) {
      return res
        .status(400)
        .json({ error: "Role debe ser 'admin' o 'reader'" });
    }

    const existing = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = "user_" + Date.now();

    await pool.query(
      "INSERT INTO users (id, username, password_hash, role, full_name) VALUES ($1, $2, $3, $4, $5)",
      [userId, username, passwordHash, role, fullName || username]
    );

    res.json({ success: true, message: "Usuario creado exitosamente" });
  } catch (error) {
    console.error("Error creando usuario:", error);
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, role, full_name, created_at, last_login FROM users ORDER BY created_at DESC"
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

export default router;
