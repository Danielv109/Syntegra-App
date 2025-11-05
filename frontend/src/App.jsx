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

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Configurar token en TODAS las peticiones axios
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    const token = localStorage.getItem("token");
    // Configurar token en TODAS las peticiones axios
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Eliminar token de los headers
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
