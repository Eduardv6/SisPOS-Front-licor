import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user } = useAuth();

  if (user?.role !== "ADMINISTRADOR") {
    return <Navigate to="/apertura-caja" replace />;
  }

  return children;
}
