import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si el usuario es cajero y está accediendo a la raíz "/", redirigir a apertura-caja
  if (user.role === "CAJERO" && location.pathname === "/") {
    return <Navigate to="/apertura-caja" replace />;
  }

  return children;
}
