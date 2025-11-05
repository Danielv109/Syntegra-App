/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Modo oscuro (dashboard)
        dark: {
          bg: "#0d0d0d",
          card: "#18181b",
          border: "#27272a",
          hover: "#1f1f23",
        },
        // Modo claro (login)
        light: {
          bg: "#FFFFFF",
          panel: "#F9FAFB",
          border: "#E5E7EB",
          input: "#F3F4F6",
        },
        text: {
          primary: "#fafafa",
          secondary: "#d4d4d8",
          muted: "#a1a1aa",
          disabled: "#71717a",
          dark: "#111827",
          gray: "#6B7280",
        },
        accent: {
          primary: "#6366f1",
          secondary: "#8b5cf6",
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
