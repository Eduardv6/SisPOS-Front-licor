import { useState } from "react";
import {
  Plus,
  Store,
  DollarSign,
  Package,
  AlertTriangle,
  MapPin,
  Phone,
  Clock,
  Users,
  MoreVertical,
  Edit3,
  Trash2,
  BarChart2,
  Search,
  Download,
  X,
  ArrowRight,
  TrendingUp,
  Box,
  CheckCircle2,
} from "lucide-react";
import clsx from "clsx";

// Mock Data
const BRANCHES = [
  {
    id: 1,
    name: "Sucursal Principal",
    code: "SUC-001",
    address: "Av. 16 de Julio #1234",
    phone: "+591 2 2123456",
    manager: "Carlos Administrador",
    hours: "08:00 - 20:00",
    active: true,
    salesToday: 8450,
    products: 428,
    employees: 4,
    stockLow: 5,
  },
  {
    id: 2,
    name: "Sucursal Centro",
    code: "SUC-002",
    address: "Calle Comercio #567",
    phone: "+591 70000001",
    manager: "María García",
    hours: "09:00 - 21:00",
    active: true,
    salesToday: 5200,
    products: 356,
    employees: 3,
    stockLow: 2,
  },
  {
    id: 3,
    name: "Sucursal Zona Sur",
    code: "SUC-003",
    address: "Av. Ballivián #890",
    phone: "+591 70000002",
    manager: "Juan Pérez",
    hours: "10:00 - 22:00",
    active: true,
    salesToday: 4800,
    products: 464,
    employees: 5,
    stockLow: 5,
  },
];

const STOCK_COMPARISON = [
  {
    id: 1,
    product: "Cerveza Paceña 620ml",
    branches: { 1: 120, 2: 80, 3: 150 },
  },
  { id: 2, product: "Singani Rujero 750ml", branches: { 1: 45, 2: 30, 3: 50 } },
  { id: 3, product: "Vino Kohlberg Tinto", branches: { 1: 60, 2: 40, 3: 70 } },
  { id: 4, product: "Ron Abuelo 7 años", branches: { 1: 24, 2: 15, 3: 30 } },
  { id: 5, product: "Whisky Grant's", branches: { 1: 18, 2: 12, 3: 20 } },
];

export default function Sucursales() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [detailTab, setDetailTab] = useState("stock"); // stock, ventas, empleados

  const handleOpenEdit = (branch) => {
    setSelectedBranch(branch);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (branch) => {
    setSelectedBranch(branch);
    setIsDetailModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedBranch(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Sucursales
          </h1>
          <p className="text-gray-500 mt-1">
            Gestión de sucursales y almacenes
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-bold hover:bg-gray-50 transition-colors shadow-sm"
          >
            <BarChart2 size={20} /> Comparar Stock
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30 active:translate-y-0.5"
          >
            <Plus size={20} /> Nueva Sucursal
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
            <Store size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">
              Sucursales Activas
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {BRANCHES.length}
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-lg bg-success-50 text-success-600 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">
              Ventas Totales Hoy
            </div>
            <div className="text-2xl font-bold text-gray-900">Bs. 18,450</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-lg bg-info-50 text-info-600 flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">
              Productos en Stock
            </div>
            <div className="text-2xl font-bold text-gray-900">1,248</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-lg bg-warning-50 text-warning-600 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Stock Bajo</div>
            <div className="text-2xl font-bold text-gray-900">12</div>
          </div>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {BRANCHES.map((branch) => (
          <div
            key={branch.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gradient-to-br from-white to-gray-50">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-primary-600 font-bold text-xl">
                  {branch.name.charAt(0)}
                </div>
                <div>
                  <h3
                    className="font-bold text-lg text-gray-900 leading-tight group-hover:text-primary-600 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetail(branch)}
                  >
                    {branch.name}
                  </h3>
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                    {branch.code}
                  </span>
                </div>
              </div>
              <div className="relative">
                <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <span>{branch.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={16} className="text-gray-400 shrink-0" />
                  <span>{branch.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} className="text-gray-400 shrink-0" />
                  <span>{branch.hours}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase font-semibold">
                    Ventas
                  </div>
                  <div className="font-bold text-gray-900">
                    Bs. {branch.salesToday.toLocaleString()}
                  </div>
                </div>
                <div className="text-center border-l border-gray-100">
                  <div className="text-xs text-gray-500 uppercase font-semibold">
                    Stock
                  </div>
                  <div className="font-bold text-gray-900">
                    {branch.products}
                  </div>
                </div>
                <div className="text-center border-l border-gray-100">
                  <div className="text-xs text-gray-500 uppercase font-semibold">
                    Pers.
                  </div>
                  <div className="font-bold text-gray-900">
                    {branch.employees}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center gap-3">
              <button
                onClick={() => handleOpenEdit(branch)}
                className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-1"
              >
                <Edit3 size={16} /> Editar
              </button>
              <button
                onClick={() => handleOpenDetail(branch)}
                className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-3 py-1.5 rounded transition-colors flex items-center gap-1"
              >
                Gestionar <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Stock Summary Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50">
          <h3 className="font-bold text-gray-900">Resumen de Stock Global</h3>
          <select className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:border-primary-500">
            <option value="">Todas las sucursales</option>
            {BRANCHES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-500 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Producto</th>
                <th className="px-6 py-3 text-center">Suc. Principal</th>
                <th className="px-6 py-3 text-center">Suc. Centro</th>
                <th className="px-6 py-3 text-center">Suc. Sur</th>
                <th className="px-6 py-3 text-center">Total</th>
                <th className="px-6 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {STOCK_COMPARISON.map((item) => {
                const total = Object.values(item.branches).reduce(
                  (a, b) => a + b,
                  0,
                );
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {item.product}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-600">
                      {item.branches[1]}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-600">
                      {item.branches[2]}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-600">
                      {item.branches[3]}
                    </td>
                    <td className="px-6 py-3 text-center font-bold text-gray-900 bg-gray-50">
                      {total}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={clsx(
                          "px-2 py-1 rounded text-xs font-semibold uppercase",
                          total > 100
                            ? "bg-success-100 text-success-700"
                            : total > 50
                              ? "bg-info-100 text-info-700"
                              : "bg-warning-100 text-warning-700",
                        )}
                      >
                        {total > 100 ? "Alto" : total > 50 ? "Normal" : "Bajo"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedBranch ? "Editar Sucursal" : "Nueva Sucursal"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nombre de Sucursal *
                </label>
                <input
                  type="text"
                  defaultValue={selectedBranch?.name}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Código
                </label>
                <input
                  type="text"
                  defaultValue={selectedBranch?.code}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  defaultValue={selectedBranch?.phone}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Dirección *
                </label>
                <input
                  type="text"
                  defaultValue={selectedBranch?.address}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Encargado
                </label>
                <select className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none">
                  <option>Seleccionar...</option>
                  <option>Carlos Administrador</option>
                  <option>María García</option>
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Apertura
                  </label>
                  <input
                    type="time"
                    defaultValue="08:00"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Cierre
                  </label>
                  <input
                    type="time"
                    defaultValue="20:00"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>
              <div className="md:col-span-2 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer">
                <div className="w-10 h-6 rounded-full p-1 bg-success-500 transition-colors relative">
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm translate-x-4 transition-transform"></div>
                </div>
                <span className="font-semibold text-gray-700 text-sm">
                  Sucursal Activa
                </span>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20"
              >
                Guardar Sucursal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsDetailModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0 bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedBranch.name}
                </h2>
                <span className="text-sm font-semibold text-gray-500 flex items-center gap-1">
                  <MapPin size={14} /> {selectedBranch.address}
                </span>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 border-b border-gray-100 bg-white grid grid-cols-4 gap-4">
              <div className="bg-primary-50 p-3 rounded-xl border border-primary-100 text-center">
                <div className="text-xl font-bold text-primary-700">
                  Bs. {selectedBranch.salesToday.toLocaleString()}
                </div>
                <div className="text-[10px] font-bold text-primary-400 uppercase tracking-wide">
                  Ventas Hoy
                </div>
              </div>
              <div className="bg-info-50 p-3 rounded-xl border border-info-100 text-center">
                <div className="text-xl font-bold text-info-700">
                  {selectedBranch.products}
                </div>
                <div className="text-[10px] font-bold text-info-400 uppercase tracking-wide">
                  Productos
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-center">
                <div className="text-xl font-bold text-purple-700">2</div>
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">
                  Cajas
                </div>
              </div>
              <div className="bg-primary-50 p-3 rounded-xl border border-primary-100 text-center">
                <div className="text-xl font-bold text-primary-700">
                  {selectedBranch.employees}
                </div>
                <div className="text-[10px] font-bold text-primary-400 uppercase tracking-wide">
                  Empleados
                </div>
              </div>
            </div>

            <div className="flex border-b border-gray-100 px-6">
              <button
                onClick={() => setDetailTab("stock")}
                className={clsx(
                  "px-4 py-3 text-sm font-bold border-b-2 transition-colors",
                  detailTab === "stock"
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700",
                )}
              >
                Stock
              </button>
              <button
                onClick={() => setDetailTab("ventas")}
                className={clsx(
                  "px-4 py-3 text-sm font-bold border-b-2 transition-colors",
                  detailTab === "ventas"
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700",
                )}
              >
                Ventas
              </button>
              <button
                onClick={() => setDetailTab("empleados")}
                className={clsx(
                  "px-4 py-3 text-sm font-bold border-b-2 transition-colors",
                  detailTab === "empleados"
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700",
                )}
              >
                Empleados
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1 bg-gray-50/30">
              {detailTab === "stock" && (
                <div className="space-y-4">
                  <div className="flex gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Buscar en inventario..."
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 outline-none"
                    />
                    <select className="p-2 bg-white border border-gray-300 rounded-lg outline-none">
                      <option>Todos</option>
                      <option>Stock Bajo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center text-sm"
                      >
                        <span className="font-medium text-gray-900">
                          Cerveza Paceña 620ml
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-500">
                            Almacén: Principal
                          </span>
                          <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                            124 uds
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailTab === "ventas" && (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <BarChart2 size={48} className="text-gray-300 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Gráfico de Ventas
                  </h3>
                  <p className="text-gray-500">
                    Visualización de ventas semanales (Placeholder)
                  </p>
                </div>
              )}

              {detailTab === "empleados" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
                      CA
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">
                        Carlos Administrador
                      </div>
                      <div className="text-xs text-gray-500">
                        Gerente de Sucursal
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCompareModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart2 size={24} className="text-primary-600" /> Comparación
                de Stock
              </h2>
              <button onClick={() => setIsCompareModalOpen(false)}>
                <X size={24} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-100 bg-white flex gap-4">
              <input
                type="text"
                placeholder="Buscar producto..."
                className="flex-1 p-2 border border-gray-300 rounded-lg outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
              <select className="p-2 border border-gray-300 rounded-lg outline-none bg-white">
                <option>Todas las categorías</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-gray-700 transition-colors">
                <Download size={18} /> Exportar
              </button>
            </div>
            <div className="overflow-auto p-0 flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-bold sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4">Producto</th>
                    <th className="px-6 py-4 text-center bg-blue-50/50">
                      <div className="text-xs uppercase text-gray-500">
                        Principal
                      </div>
                      <div className="text-lg text-primary-700">428</div>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <div className="text-xs uppercase text-gray-500">
                        Centro
                      </div>
                      <div className="text-lg text-gray-700">356</div>
                    </th>
                    <th className="px-6 py-4 text-center bg-primary-50/50">
                      <div className="text-xs uppercase text-gray-500">Sur</div>
                      <div className="text-lg text-primary-700">464</div>
                    </th>
                    <th className="px-6 py-4 text-center bg-gray-100">
                      Diferencia Max
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {STOCK_COMPARISON.map((row) => {
                    const values = Object.values(row.branches);
                    const max = Math.max(...values);
                    const min = Math.min(...values);
                    const diff = max - min;

                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {row.product}
                        </td>
                        <td className="px-6 py-4 text-center bg-blue-50/10 font-mono text-gray-600">
                          {row.branches[1]}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-gray-600">
                          {row.branches[2]}
                        </td>
                        <td className="px-6 py-4 text-center bg-primary-50/10 font-mono text-gray-600">
                          {row.branches[3]}
                        </td>
                        <td className="px-6 py-4 text-center bg-gray-50 font-bold text-gray-800">
                          {diff}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
