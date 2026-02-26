import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layouts/Layout";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

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
      <ToastProvider>
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
              {/* Rutas accesibles para TODOS los usuarios autenticados */}
              <Route path="pos" element={<POS />} />
              <Route path="apertura-caja" element={<AperturaCaja />} />

              {/* Rutas solo para ADMINISTRADOR */}
              <Route
                index
                element={
                  <AdminRoute>
                    <Dashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="inventario"
                element={
                  <AdminRoute>
                    <Inventario />
                  </AdminRoute>
                }
              />
              <Route
                path="productos"
                element={
                  <AdminRoute>
                    <Productos />
                  </AdminRoute>
                }
              />
              <Route
                path="categorias"
                element={
                  <AdminRoute>
                    <Categorias />
                  </AdminRoute>
                }
              />
              <Route
                path="clientes"
                element={
                  <AdminRoute>
                    <Clientes />
                  </AdminRoute>
                }
              />
              <Route
                path="reportes"
                element={
                  <AdminRoute>
                    <Reportes />
                  </AdminRoute>
                }
              />
              <Route
                path="usuarios"
                element={
                  <AdminRoute>
                    <Usuarios />
                  </AdminRoute>
                }
              />
              <Route
                path="configuracion"
                element={
                  <AdminRoute>
                    <Configuracion />
                  </AdminRoute>
                }
              />
            </Route>

            {/* Catch-all: redirect to dashboard (ProtectedRoute will handle auth) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
