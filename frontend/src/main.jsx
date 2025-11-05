import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App.jsx";
import "./index.css";

// Configurar axios ANTES de cualquier cosa
const token = localStorage.getItem("token");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  console.log("🔑 Token restaurado en axios al iniciar app");
}

// Configurar interceptor de axios
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo cerrar sesión si es error 401 con token inválido
    if (
      error.response?.status === 401 &&
      error.response?.data?.error?.includes("Token")
    ) {
      console.error("🔒 Token inválido detectado. Cerrando sesión...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete axios.defaults.headers.common["Authorization"];
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
