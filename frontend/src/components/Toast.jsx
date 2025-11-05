import React, { useEffect } from "react";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M6 10l3 3 5-6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    error: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M10 6v5M10 14h.01"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    info: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M10 10v4M10 6h.01"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  };

  const styles = {
    success: "bg-white border-gray-200 text-gray-900",
    error: "bg-white border-gray-200 text-gray-900",
    info: "bg-white border-gray-200 text-gray-900",
  };

  const iconColors = {
    success: "text-green-600",
    error: "text-red-600",
    info: "text-blue-600",
  };

  return (
    <div className={`fixed top-6 right-6 z-[9999] animate-slide-in`}>
      <div
        className={`${styles[type]} border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-[320px] max-w-md backdrop-blur-sm`}
      >
        <div className={iconColors[type]}>{icons[type]}</div>
        <div className="flex-1 text-sm font-medium">{message}</div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M12 4L4 12M4 4l8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
