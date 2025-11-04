import React, { useState } from "react";
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
  const [currentPage, setCurrentPage] = useState("ClientSelector");
  const [selectedClient, setSelectedClient] = useState(null);

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setCurrentPage("Dashboard");
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
    setCurrentPage("ClientSelector");
  };

  const renderPage = () => {
    if (!selectedClient) {
      return <ClientSelector onSelectClient={handleClientSelect} />;
    }

    switch (currentPage) {
      case "Dashboard":
        return <Dashboard client={selectedClient} />;
      case "Data Import":
        return <DataImport client={selectedClient} />;
      case "Analytics":
        return <Analytics client={selectedClient} />;
      case "Reports":
        return <Reports client={selectedClient} />;
      case "Validation":
        return <ValidationQueue client={selectedClient} />;
      case "Data Explorer":
        return <DataExplorer client={selectedClient} />;
      case "Connectors":
        return <Connectors client={selectedClient} />;
      case "Settings":
        return <Settings client={selectedClient} />;
      default:
        return <Dashboard client={selectedClient} />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      selectedClient={selectedClient}
      onBackToClients={handleBackToClients}
    >
      {renderPage()}
    </Layout>
  );
}
