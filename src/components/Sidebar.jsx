import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Banknote,
  Package,
  Tag,
  Layers,
  Users,
  FileText,
  UserCog,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", adminOnly: true },
  { icon: Tag, label: "Productos", path: "/productos", adminOnly: true },
  { icon: Layers, label: "Categorías", path: "/categorias", adminOnly: true },
  { icon: Package, label: "Inventario", path: "/inventario", adminOnly: true },
  { icon: Users, label: "Clientes", path: "/clientes", adminOnly: true },
  { icon: UserCog, label: "Usuarios", path: "/usuarios", adminOnly: true },
  {
    icon: Banknote,
    label: "Apertura de Caja",
    path: "/apertura-caja",
    adminOnly: false,
  },
  {
    icon: ShoppingCart,
    label: "Punto de Venta",
    path: "/pos",
    adminOnly: false,
  },
  { icon: FileText, label: "Reportes", path: "/reportes", adminOnly: true },
  {
    icon: Settings,
    label: "Configuración",
    path: "/configuracion",
    adminOnly: true,
  },
];

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { cashRegisterService } from "../services/cashRegisterService";

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const toast = useToast();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const isAdmin = user?.role === "ADMINISTRADOR";

  // Filtrar items del menú según el rol
  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  const handleLogout = async () => {
    try {
      const status = await cashRegisterService.checkStatus();
      if (status.isOpen) {
        return toast.warning("Debes cerrar caja antes de salir");
      }
      setIsLogoutModalOpen(true);
    } catch (error) {
      console.error("Logout check error:", error);
      toast.error("Error al verificar estado de caja");
    }
  };

  const performLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-white border-r border-gray-200 flex flex-col z-50 shadow-sm transition-transform -translate-x-full md:translate-x-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#gradient)" />
              <path d="M16 8L20 12H12L16 8Z" fill="white" />
              <rect x="13" y="12" width="6" height="12" rx="1" fill="white" />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#0369a1" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-xl font-extrabold text-gray-900 tracking-tighter">
              Licoreria Brasíl
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-4 px-4 py-3 rounded-md font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-sm hidden" />
                  )}
                  <item.icon
                    size={20}
                    className={clsx(
                      "transition-colors",
                      isActive ? "text-white" : "text-current",
                    )}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-md font-medium text-primary-600 hover:bg-primary-50 hover:translate-x-1 transition-all duration-200 group"
          >
            <LogOut size={20} className="transition-colors" />
            <span>Cerrar Sesión</span>
          </button>

          <div className="flex items-center gap-4 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.username?.substring(0, 2).toUpperCase() || "US"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-900 truncate">
                {user?.username || "Usuario"}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.role === "ADMINISTRADOR" ? "Administrador" : "Cajero"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsLogoutModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogOut size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Cerrar Sesión
              </h3>
              <p className="text-gray-500 mb-8">
                ¿Estás seguro de que deseas cerrar sesión?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 py-3 px-4 font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={performLogout}
                  className="flex-1 py-3 px-4 font-bold text-white bg-danger-500 rounded-lg hover:bg-danger-600 shadow-lg shadow-danger-500/30 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
