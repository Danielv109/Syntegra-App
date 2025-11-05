import React from "react";

const menuItems = [
  "Dashboard",
  "Data Import",
  "Data Explorer",
  "Validation",
  "Analytics",
  "Connectors",
  "Reports",
  "Settings",
];

export default function Layout({ children, currentPage, onNavigate }) {
  return (
    <div className="flex min-h-screen bg-dark-bg">
      <aside className="w-[220px] bg-transparent p-8 flex flex-col gap-6">
        <div className="flex items-center gap-2.5 pl-2 mb-2">
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
          <div className="text-[22px] font-semibold text-text-primary tracking-tight">
            Syntegra
          </div>
        </div>

        <nav>
          <ul className="flex flex-col gap-0.5 list-none p-0 m-0">
            {menuItems.map((item) => (
              <li
                key={item}
                onClick={() => onNavigate(item)}
                className={`
                  px-3 py-2.5 rounded-md cursor-pointer text-sm transition-all
                  ${
                    currentPage === item
                      ? "bg-dark-hover text-text-primary font-medium border-l-[3px] border-accent-primary"
                      : "text-text-muted hover:bg-dark-hover hover:text-text-secondary border-l-[3px] border-transparent"
                  }
                `}
              >
                {item}
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className="flex-1 p-10 bg-dark-bg max-w-[1600px]">{children}</main>
    </div>
  );
}
