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
  const [currentClient, setCurrentClient] = useState(null);
  const [currentPage, setCurrentPage] = useState("Dashboard");

  if (!currentClient) {
    return <ClientSelector onClientSelect={setCurrentClient} />;
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
        return <Settings client={currentClient} />;
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
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}
