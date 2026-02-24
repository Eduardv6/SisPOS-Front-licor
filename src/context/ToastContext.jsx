import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";
import clsx from "clsx";

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const TOAST_TYPES = {
  success: {
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    progressBarColor: "bg-emerald-500",
  },
  error: {
    icon: XCircle,
    color: "bg-sky-50 text-sky-600 border-sky-100",
    progressBarColor: "bg-sky-500",
  },
  warning: {
    icon: AlertCircle,
    color: "bg-amber-50 text-amber-600 border-amber-100",
    progressBarColor: "bg-amber-500",
  },
  info: {
    icon: Info,
    color: "bg-sky-50 text-sky-600 border-sky-100",
    progressBarColor: "bg-sky-500",
  },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, "success", dur),
    error: (msg, dur) => addToast(msg, "error", dur),
    warning: (msg, dur) => addToast(msg, "warning", dur),
    info: (msg, dur) => addToast(msg, "info", dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <Toast key={t.id} {...t} onRemove={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const Toast = ({ message, type, duration, onRemove }) => {
  const { icon: Icon, color, progressBarColor } = TOAST_TYPES[type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={clsx(
        "pointer-events-auto relative flex items-center gap-3 p-4 pr-10 min-w-[300px] max-w-md bg-white border rounded-xl shadow-2xl",
        color,
      )}
    >
      <div className="shrink-0">
        <Icon size={24} />
      </div>
      <div>
        <p className="font-bold text-sm tracking-tight">{message}</p>
      </div>

      <button
        onClick={onRemove}
        className="absolute top-1/2 -translate-y-1/2 right-3 p-1 rounded-full hover:bg-black/5 transition-colors text-current/40 hover:text-current"
      >
        <X size={16} />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-black/5 w-full rounded-b-xl overflow-hidden">
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: 0 }}
          transition={{ duration: duration / 1000, ease: "linear" }}
          className={clsx("h-full", progressBarColor)}
        />
      </div>
    </motion.div>
  );
};
