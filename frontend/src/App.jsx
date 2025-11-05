import React, { useState, useEffect } from "react";
import axios from "axios";
import Login from "./components/Login";
import Layout from "./components/Layout";
import ClientSelector from "./components/ClientSelector";
import Dashboard from "./components/Dashboard";
import DataImport from "./components/DataImport";
import Analytics from "./components/Analytics";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import ValidationQueue from "./components/ValidationQueue";
import DataExplorer from "./components/DataExplorer";
import Connectors from "./components/Connectors";

export default function App() {
  const [user, setUser] = useState(null);
  const [currentClient, setCurrentClient] = useState(null);
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Esperar un momento antes de verificar localStorage
    const checkSession = () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      console.log("🔍 Verificando sesión:", {
        token: token
          ? "existe (" + token.substring(0, 20) + "...)"
          : "no existe",
        user: savedUser ? "existe" : "no existe",
      });

      if (token && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          setUser(userData);
          console.log("✅ Sesión restaurada para:", userData.username);
        } catch (error) {
          console.error("❌ Error al parsear usuario:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      } else {
        console.log("ℹ️ No hay sesión guardada");
      }

      setIsLoading(false);
    };

    // Ejecutar después de un pequeño delay para asegurar que localStorage esté listo
    setTimeout(checkSession, 100);
  }, []);

  const handleLoginSuccess = (userData) => {
    console.log("📢 handleLoginSuccess llamado con:", userData);

    const token = localStorage.getItem("token");
    console.log(
      "🔍 Token en localStorage al momento del callback:",
      token ? "EXISTE" : "NO EXISTE"
    );

    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      console.log("🔑 Token configurado en axios desde handleLoginSuccess");
      setUser(userData);
      setIsLoading(false); // Asegurar que no esté en estado de carga
      console.log("✅ Usuario establecido en estado:", userData.username);
    } else {
      console.error(
        "❌ ERROR CRÍTICO: Token no está en localStorage después del login"
      );
    }
  };

  const handleLogout = () => {
    console.log("👋 Cerrando sesión");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    setCurrentClient(null);
  };

  const handleBackToClients = () => {
    setCurrentClient(null);
    setCurrentPage("Dashboard");
  };

  const handleClientDeleted = () => {
    handleBackToClients();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-text-primary">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (!currentClient) {
    return (
      <ClientSelector
        onClientSelect={setCurrentClient}
        onLogout={handleLogout}
        user={user}
      />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "Dashboard":
        return <Dashboard client={currentClient} />;
      case "Data Import":
        return <DataImport client={currentClient} />;
      case "Analytics":
        return <Analytics client={currentClient} />;
      case "Reports":
        return <Reports client={currentClient} />;
      case "Settings":
        return (
          <Settings
            client={currentClient}
            onClientDeleted={handleClientDeleted}
          />
        );
      case "Validation":
        return <ValidationQueue client={currentClient} />;
      case "Data Explorer":
        return <DataExplorer client={currentClient} />;
      case "Connectors":
        return <Connectors client={currentClient} />;
      default:
        return <Dashboard client={currentClient} />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onBackToClients={handleBackToClients}
      onLogout={handleLogout}
      currentClient={currentClient}
      user={user}
    >
      {renderPage()}
    </Layout>
  );
}
