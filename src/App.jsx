import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layouts/Layout";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import AperturaCaja from "./pages/AperturaCaja";
import Inventario from "./pages/Inventario";
import Productos from "./pages/Productos";
import Categorias from "./pages/Categorias";
import Clientes from "./pages/Clientes";
import Reportes from "./pages/Reportes";
import Usuarios from "./pages/Usuarios";
import Configuracion from "./pages/Configuracion";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Login route - without Layout/Sidebar */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes - with Layout/Sidebar */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="pos" element={<POS />} />
            <Route path="apertura-caja" element={<AperturaCaja />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="productos" element={<Productos />} />
            <Route path="categorias" element={<Categorias />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="configuracion" element={<Configuracion />} />
          </Route>

          {/* Catch-all: redirect to dashboard (ProtectedRoute will handle auth) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
