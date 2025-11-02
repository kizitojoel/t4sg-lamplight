"use client";

interface LoadingOverlayProps {
  message: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      {/* Spinner */}
      <div
        style={{
          width: "60px",
          height: "60px",
          border: "6px solid rgba(255, 255, 255, 0.3)",
          borderTop: "6px solid #ffffff",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />

      {/* Message */}
      <p
        style={{
          color: "white",
          marginTop: "24px",
          fontSize: "18px",
          fontWeight: "500",
          textAlign: "center",
          maxWidth: "400px",
          padding: "0 20px",
        }}
      >
        {message}
      </p>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
