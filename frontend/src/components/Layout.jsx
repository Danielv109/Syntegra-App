import React from "react";

const menuItems = [
  "Dashboard",
  "Validation",
  "Data Explorer",
  "Data Import",
  "Connectors",
  "Analytics",
  "Reports",
  "Settings",
];

export default function Layout({
  children,
  currentPage,
  onNavigate,
  selectedClient,
  onBackToClients,
}) {
  if (!selectedClient) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0d0d0d",
          padding: "40px 48px",
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0d0d0d" }}>
      <aside
        style={{
          width: 220,
          background: "transparent",
          padding: "40px 20px 32px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            paddingLeft: 8,
            marginBottom: 8,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              fill="url(#gradient1)"
              opacity="0.9"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="url(#gradient2)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="url(#gradient2)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient1" x1="2" y1="2" x2="22" y2="12">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="gradient2" x1="2" y1="12" x2="22" y2="22">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "#fafafa",
              letterSpacing: "-0.4px",
            }}
          >
            Syntegra
          </div>
        </div>

        <div
          style={{
            background: "#18181b",
            borderRadius: 12,
            border: "1px solid #27272a",
            padding: "20px 16px",
          }}
        >
          <div
            onClick={onBackToClients}
            style={{
              padding: "10px 12px",
              borderRadius: 6,
              background: "#27272a",
              marginBottom: 16,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#3f3f46";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#27272a";
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#71717a",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: "0.3px",
              }}
            >
              Cliente Actual
            </div>
            <div
              style={{
                fontSize: 14,
                color: "#fafafa",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>←</span>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selectedClient.name}
              </span>
            </div>
          </div>

          <nav>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {menuItems.map((item) => (
                <li
                  key={item}
                  onClick={() => onNavigate(item)}
                  style={{
                    padding: "9px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                    background:
                      currentPage === item ? "#27272a" : "transparent",
                    color: currentPage === item ? "#fafafa" : "#a1a1aa",
                    fontWeight: currentPage === item ? 500 : 400,
                    fontSize: 14,
                    transition: "all 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== item) {
                      e.currentTarget.style.background = "#1f1f23";
                      e.currentTarget.style.color = "#d4d4d8";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== item) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#a1a1aa";
                    }
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          padding: "40px 48px",
          background: "#0d0d0d",
          maxWidth: "1600px",
        }}
      >
        {children}
      </main>
    </div>
  );
}
