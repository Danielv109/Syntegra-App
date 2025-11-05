import React, { useState } from "react";
import axios from "axios";

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${apiUrl}/api/auth/login`, {
        username,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      onLoginSuccess(res.data.user);
    } catch (error) {
      setError(error.response?.data?.error || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8 relative overflow-hidden">
      {/* Gradiente Aurora en todo el fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[700px] h-[700px] bg-blue-400/50 rounded-full blur-[140px]"></div>
        <div className="absolute top-[-5%] right-[-5%] w-[800px] h-[800px] bg-purple-400/40 rounded-full blur-[140px]"></div>
        <div className="absolute top-[20%] left-[35%] w-[600px] h-[600px] bg-pink-400/40 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[700px] h-[700px] bg-indigo-400/35 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[-5%] right-[20%] w-[600px] h-[600px] bg-cyan-400/30 rounded-full blur-[140px]"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo y título perfectamente centrado */}
        <div className="flex items-center justify-center mb-10">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#3b82f6" opacity="0.9" />
            <path
              d="M2 17L12 22L22 17"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <h1 className="text-5xl font-semibold text-gray-900 ml-4">
            Syntegra
          </h1>
        </div>

        {/* Panel de login */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg text-gray-900 text-sm transition-all outline-none"
                placeholder="Ingresa tu usuario"
                autoFocus
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg text-gray-900 text-sm transition-all outline-none"
                placeholder="Ingresa tu contraseña"
                required
              />
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-50 text-red-600 border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full px-4 py-3 bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold rounded-lg transition-all text-sm"
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
          </form>

          {/* Credenciales de prueba */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              Credenciales de prueba:{" "}
              <span className="font-mono text-gray-700">admin</span> /{" "}
              <span className="font-mono text-gray-700">admin123</span>
            </div>
          </div>
        </div>

        {/* Footer simplificado */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>© 2025 Syntegra. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
