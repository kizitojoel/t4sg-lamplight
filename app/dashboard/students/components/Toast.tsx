"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        backgroundColor: type === "success" ? "#10b981" : "#ef4444",
        color: "white",
        padding: "16px 24px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        zIndex: 10000,
        minWidth: "300px",
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Icon */}
        <div style={{ fontSize: "24px" }}>{type === "success" ? "✓" : "✕"}</div>

        {/* Message */}
        <div style={{ flex: 1, fontSize: "14px", fontWeight: "500" }}>{message}</div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: "18px",
            padding: "0",
            lineHeight: "1",
          }}
        >
          ×
        </button>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
