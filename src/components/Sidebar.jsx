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

export default function Sidebar({ isOpen, setIsOpen }) {
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
      <aside
        className={clsx(
          "fixed left-0 top-0 bottom-0 w-[280px] bg-white border-r border-gray-100 flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="h-20 border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-inner shadow-primary-400/20 border border-primary-400 shrink-0 transform rotate-3 transition-transform hover:rotate-6">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <path d="M16 8L20 12H12L16 8Z" fill="white" />
                <rect x="13" y="12" width="6" height="12" rx="1" fill="white" />
              </svg>
            </div>
            <span className="text-[19px] font-black text-gray-900 tracking-tight leading-none">
              Licorería<br /><span className="text-primary-600">Brasil</span>
            </span>
          </div>
          <button
            className="md:hidden p-2 text-gray-400 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setIsOpen && setIsOpen(false)}
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen && setIsOpen(false)}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-[14px] transition-all duration-200 group relative overflow-hidden",
                  isActive
                    ? "bg-primary-50 text-primary-700 shadow-sm border border-primary-100/50"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:scale-[1.02]",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-500 rounded-r-full shadow-[0_0_12px_rgba(14,165,233,0.8)]" />
                  )}
                  <item.icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={clsx(
                      "transition-colors z-10",
                      isActive
                        ? "text-primary-600"
                        : "text-gray-400 group-hover:text-primary-500",
                    )}
                  />
                  <span className="z-10">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-5 border-t border-gray-100 space-y-4 shrink-0 bg-gray-50/50">
          <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-black text-sm shrink-0 border border-primary-200">
              {user?.nombre
                ? user.nombre.substring(0, 2).toUpperCase()
                : user?.username?.substring(0, 2).toUpperCase() || "US"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-gray-900 truncate">
                {user?.nombre
                  ? `${user.nombre} ${user.apellido || ""}`.trim()
                  : user?.username || "Usuario"}
              </div>
              <div className="text-[11px] font-bold text-primary-600 uppercase tracking-wider truncate">
                {user?.role === "ADMINISTRADOR" ? "Administrador" : "Cajero"}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-[13px] uppercase tracking-wider border-2 border-danger-100 text-danger-600 bg-danger-50 hover:bg-danger-600 hover:text-white hover:border-danger-600 transition-all duration-200 group"
          >
            <LogOut size={18} strokeWidth={2.5} className="transition-transform group-hover:-translate-x-1" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsLogoutModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-danger-50 text-danger-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-danger-100 transform -rotate-3">
                <LogOut size={36} className="transform rotate-3" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                Cerrar Sesión
              </h3>
              <p className="text-sm font-medium text-gray-500 mb-8">
                ¿Estás seguro de que deseas cerrar sesión? Tendrás que volver a ingresar tus credenciales para acceder al sistema.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={performLogout}
                  className="w-full py-4 px-4 font-black uppercase tracking-wider text-[13px] text-white bg-danger-500 rounded-xl hover:bg-danger-600 shadow-[0_8px_20px_-6px_rgba(239,68,68,0.5)] transition-all hover:-translate-y-0.5"
                >
                  Sí, Cerrar Sesión
                </button>
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="w-full py-4 px-4 font-bold uppercase tracking-wider text-[13px] text-gray-600 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
