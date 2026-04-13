import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

const ToastContext = createContext(null);
let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, "success", dur),
    error: (msg, dur) => addToast(msg, "error", dur),
    info: (msg, dur) => addToast(msg, "info", dur),
    warning: (msg, dur) => addToast(msg, "warning", dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}

const TYPE_CONFIG = {
  success: { bg: "#DCFCE7", border: "#86EFAC", text: "#166534", icon: "✓" },
  error:   { bg: "#FEE2E2", border: "#FCA5A5", text: "#991B1B", icon: "✕" },
  warning: { bg: "#FEF3C7", border: "#FCD34D", text: "#92400E", icon: "⚠" },
  info:    { bg: "#DBEAFE", border: "#93C5FD", text: "#1E40AF", icon: "ℹ" },
};

function ToastItem({ toast, onRemove }) {
  const cfg = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info;
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // animate in
    requestAnimationFrame(() => setVisible(true));
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "12px 16px",
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: "10px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
        cursor: "pointer",
        maxWidth: "360px",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(32px)",
      }}
    >
      <span style={{ fontSize: "15px", fontWeight: "700", color: cfg.text, flexShrink: 0, marginTop: "1px" }}>
        {cfg.icon}
      </span>
      <span style={{ fontSize: "14px", fontWeight: "500", color: cfg.text, lineHeight: 1.5 }}>
        {toast.message}
      </span>
    </div>
  );
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: "auto" }}>
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
