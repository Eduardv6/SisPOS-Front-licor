import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  History,
  TrendingUp,
  ArrowRightLeft,
  FileText,
  Calendar,
  Filter,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Minus,
  ChevronDown,
} from "lucide-react";

const MOVEMENT_REASONS = {
  ingreso: ["Aumento de Stock", "Ajuste inventario", "Otro"],
  salida: ["Venta", "Daño/Rotura", "Vencimiento", "Otro"],
  ajuste: [
    "Conteo físico",
    "Productos dañados",
    "Productos vencidos",
    "Error de registro",
    "Otro",
  ],
};
import clsx from "clsx";
import { inventoryService } from "../services/inventoryService";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { productService } from "../services/productService";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

export default function Inventario() {
  const { user } = useAuth();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("ingreso"); // ingreso, salida, ajuste, transferencia
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Data State
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    ingresosHoy: 0,
    salidasHoy: 0,
    totalProductosStock: 0,
    movimientosMes: 0,
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    type: "",
    search: "",
    startDate: "",
    endDate: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    productoId: "",
    cantidad: "",
    almacenOrigenId: "1",
    motivo: "",
    observaciones: "",
    tipoOperacionAjuste: "salida", // 'ingreso' o 'salida'
  });

  // Combobox State
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Filtered Products for Combobox
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm) return products;
    const term = productSearchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        (p.codigoInterno && p.codigoInterno.toLowerCase().includes(term)),
    );
  }, [products, productSearchTerm]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProductDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchMovements();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1, // Reset a página 1 al filtrar
    }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  const fetchInitialData = async () => {
    try {
      const [statsData, productsData] = await Promise.all([
        inventoryService.getStats(),
        productService.getAll(),
      ]);
      // Stats API returns JSON directly, not wrapped in 'data'
      setStats(statsData);
      // check if productsData is wrapped
      setProducts(
        Array.isArray(productsData) ? productsData : productsData.data || [],
      );
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getMovements(filters);
      // API returns { data: [...], meta: {...} }
      setMovements(res.data || []);
      setPagination(res.meta || {});
    } catch (error) {
      console.error("Error loading movements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newState = { ...prev, [name]: value };

      // Lógica especial para motivos de ajuste
      if (name === "motivo" && modalType === "ajuste") {
        if (value === "Productos dañados" || value === "Productos vencidos") {
          newState.tipoOperacionAjuste = "salida";
        }
      }

      return newState;
    });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.productoId || !formData.cantidad) {
        return toast.warning("Por favor complete los campos requeridos");
      }

      const payload = {
        ...formData,
        tipo: modalType,
        usuarioId: user?.id,
        operacion:
          modalType === "ajuste"
            ? formData.tipoOperacionAjuste === "ingreso"
              ? "ENTRADA"
              : "SALIDA"
            : modalType === "ingreso"
              ? "ENTRADA"
              : "SALIDA",
      };

      if (modalType === "transferencia") {
        if (!formData.almacenDestinoId)
          return toast.warning("Seleccione almacén destino");
        await inventoryService.createTransfer(payload);
      } else {
        await inventoryService.createMovement(payload);
      }

      toast.success("Movimiento registrado correctamente");
      setIsModalOpen(false);
      setFormData({
        productoId: "",
        cantidad: "",
        almacenOrigenId: "1",
        almacenDestinoId: "",
        motivo: "",
        observaciones: "",
      });
      fetchMovements();
      fetchInitialData(); // Update stats
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Error al registrar movimiento",
      );
    }
  };

  const openModal = (type = "ingreso") => {
    setModalType(type);
    setFormData((prev) => ({ ...prev, motivo: "" })); // Reset motivo
    setIsModalOpen(true);
  };

  const openDetailModal = (movement) => {
    setSelectedMovement(movement);
    setIsDetailModalOpen(true);
  };

  const fetchAllDataForExport = async () => {
    try {
      setLoading(true);
      // Pedimos un límite muy alto para asegurar traer todos los datos filtrados
      const allData = await inventoryService.getMovements({
        ...filters,
        limit: 10000,
        page: 1,
      });
      return allData.data;
    } catch (error) {
      console.error("Error al obtener datos para exportar:", error);
      toast.error("Error al preparar los datos para la exportación");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    const allMovements = await fetchAllDataForExport();
    if (allMovements.length === 0) return;

    const dataToExport = allMovements.map((mov) => ({
      Fecha: format(new Date(mov.fechaMovimiento), "dd/MM/yyyy HH:mm", {
        locale: es,
      }),
      Tipo: mov.tipo.replace(/_/g, " "),
      Producto: mov.producto?.nombre,
      "Código Interno": mov.producto?.codigoInterno,
      Cantidad: mov.cantidad,
      Motivo: mov.motivo,
      Usuario: mov.usuario?.nombre || "Sistema",
      Observaciones: mov.referencia || "",
    }));

    exportToExcel(dataToExport, "movimientos-inventario");
    setShowExportMenu(false);
  };

  const handleExportPDF = async () => {
    const allMovements = await fetchAllDataForExport();
    if (allMovements.length === 0) return;

    const dataToExport = allMovements.map((mov) => [
      format(new Date(mov.fechaMovimiento), "dd/MM/yyyy HH:mm", {
        locale: es,
      }),
      mov.tipo.replace(/_/g, " "),
      mov.producto?.nombre,
      mov.producto?.codigoInterno || "-",
      mov.cantidad,
      mov.motivo,
      mov.usuario?.nombre || "Sistema",
    ]);

    const columns = [
      "Fecha",
      "Tipo",
      "Producto",
      "Cód. Interno",
      "Cant.",
      "Motivo",
      "Usuario",
    ];

    exportToPDF({
      columns,
      data: dataToExport,
      title: "Historial de Movimientos de Inventario",
      fileName: "reporte-inventario",
    });
    setShowExportMenu(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Inventario
          </h1>
          <p className="text-gray-500 mt-1">Control de movimientos de stock</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar movimientos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all w-full sm:w-64"
            />
          </div>
          <button
            onClick={() => openModal("ingreso")}
            className="flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30 active:translate-y-0.5"
          >
            <Plus size={20} /> Registrar Movimiento
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-lg bg-success-50 text-success-600 flex items-center justify-center">
            <ArrowUp size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">
              Ingresos Hoy
            </div>
            <div className="text-2xl font-bold text-gray-900">
              +{stats.ingresosHoy}
            </div>
            <div className="text-xs font-semibold text-success-600">
              unidades
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-lg bg-warning-50 text-warning-600 flex items-center justify-center">
            <ArrowDown size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Salidas Hoy</div>
            <div className="text-2xl font-bold text-gray-900">
              -{stats.salidasHoy}
            </div>
            <div className="text-xs font-semibold text-primary-600">
              unidades
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">
              Total en Stock
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalProductosStock}
            </div>
            <div className="text-xs font-semibold text-gray-500">productos</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-lg bg-info-50 text-info-600 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">
              Movimientos Mes
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.movimientosMes}
            </div>
            <div className="text-xs font-semibold text-success-600 flex items-center gap-1">
              <TrendingUp size={12} /> +15%
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:border-primary-500"
            >
              <option value="">Todos los movimientos</option>
              <option value="ingreso">Ingresos</option>
              <option value="salida">Salidas</option>
            </select>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
              <Calendar size={16} />
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="bg-transparent border-none outline-none p-0 w-24 sm:w-auto"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="bg-transparent border-none outline-none p-0 w-24 sm:w-auto"
              />
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Download size={18} />
              Exportar
            </button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  >
                    <FileSpreadsheet size={18} className="text-success-600" />
                    <span className="font-semibold">Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  >
                    <FileText size={18} className="text-primary-600" />
                    <span className="font-semibold">PDF (.pdf)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">
              Historial de Movimientos
            </h3>
            <span className="text-sm text-gray-500">
              Mostrando {movements.length} de {pagination.total} movimientos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Cantidad</th>
                  <th className="px-6 py-4">Motivo</th>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((mov) => (
                  <tr
                    key={mov.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">
                        {new Date(mov.fechaMovimiento).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(mov.fechaMovimiento).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={clsx(
                          "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                          mov.tipo.includes("ENTRADA") ||
                            mov.tipo.includes("COMPRA")
                            ? "bg-success-100 text-success-700"
                            : mov.tipo.includes("SALIDA") ||
                                mov.tipo.includes("VENTA")
                              ? "bg-warning-100 text-warning-700"
                              : mov.tipo.includes("AJUSTE")
                                ? "bg-gray-100 text-gray-700"
                                : "bg-info-100 text-info-700",
                        )}
                      >
                        {mov.tipo.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {mov.producto?.nombre}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {mov.producto?.codigoInterno}
                      </div>
                    </td>
                    <td
                      className={clsx(
                        "px-6 py-4 font-bold font-mono",
                        mov.cantidad > 0
                          ? "text-success-600"
                          : mov.cantidad < 0
                            ? "text-primary-600"
                            : "text-gray-900",
                      )}
                    >
                      {mov.cantidad > 0 ? "+" : ""}
                      {mov.cantidad}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{mov.motivo}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                          {(mov.usuario?.nombre || "Sys")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-700">
                          {mov.usuario?.nombre || "Sistema"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openDetailModal(mov)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page === 1}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              Página{" "}
              <span className="text-gray-900 font-bold">{filters.page}</span> de{" "}
              <span className="text-gray-900 font-bold">
                {pagination.totalPages}
              </span>
            </div>
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page === pagination.totalPages}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Movement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                Registrar Movimiento
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Type Selection */}
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {["ingreso", "salida", "ajuste"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setModalType(type);
                      setFormData((prev) => ({ ...prev, motivo: "" })); // Reset motivo on tab change
                    }}
                    className={clsx(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                      modalType === type
                        ? "border-primary-600 bg-primary-50 text-primary-700"
                        : "border-gray-200 hover:border-primary-300 text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    <div
                      className={clsx(
                        "p-2 rounded-full",
                        modalType === type ? "bg-primary-200" : "bg-gray-100",
                      )}
                    >
                      {type === "ingreso" && <ArrowUp size={20} />}
                      {type === "salida" && <ArrowDown size={20} />}
                      {type === "ajuste" && <FileText size={20} />}
                    </div>
                    <span className="text-xs font-bold uppercase">{type}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Producto *
                    </label>
                    <div
                      className={clsx(
                        "w-full bg-gray-50 border rounded-lg flex items-center justify-between cursor-text transition-all",
                        isProductDropdownOpen
                          ? "border-primary-500 ring-2 ring-primary-500/20"
                          : "border-gray-300 hover:border-gray-400",
                      )}
                      onClick={() => setIsProductDropdownOpen(true)}
                    >
                      <div className="flex-1 flex items-center pr-2">
                        {isProductDropdownOpen ? (
                          <input
                            type="text"
                            className="w-full p-2.5 bg-transparent outline-none text-sm text-gray-900"
                            placeholder="Buscar por nombre o código..."
                            value={productSearchTerm}
                            onChange={(e) =>
                              setProductSearchTerm(e.target.value)
                            }
                            autoFocus
                          />
                        ) : (
                          <div className="w-full p-2.5 text-sm truncate text-gray-700">
                            {formData.productoId ? (
                              (() => {
                                const p = products.find(
                                  (prod) => prod.id === formData.productoId,
                                );
                                return p
                                  ? `${p.nombre} (${p.codigoInterno})`
                                  : "Seleccionar producto";
                              })()
                            ) : (
                              <span className="text-gray-500">
                                Seleccionar producto
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="pr-3 text-gray-400 flex items-center">
                        {formData.productoId && !isProductDropdownOpen && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData((prev) => ({
                                ...prev,
                                productoId: "",
                              }));
                              setProductSearchTerm("");
                            }}
                            className="mr-1 hover:text-gray-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                        <ChevronDown size={16} />
                      </div>
                    </div>

                    {isProductDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2">
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map((p) => (
                            <div
                              key={p.id}
                              className={clsx(
                                "px-4 py-2.5 cursor-pointer hover:bg-primary-50 transition-colors flex flex-col",
                                formData.productoId === p.id
                                  ? "bg-primary-50 border-l-2 border-primary-500"
                                  : "border-l-2 border-transparent",
                              )}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setFormData((prev) => ({
                                  ...prev,
                                  productoId: p.id,
                                }));
                                setIsProductDropdownOpen(false);
                                setProductSearchTerm("");
                              }}
                            >
                              <span
                                className={clsx(
                                  "text-sm font-medium",
                                  formData.productoId === p.id
                                    ? "text-primary-700"
                                    : "text-gray-900",
                                )}
                              >
                                {p.nombre}
                              </span>
                              <span className="text-xs text-gray-500 font-mono mt-0.5">
                                {p.codigoInterno} • Stock: {p.stock || 0}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-4 text-sm text-gray-500 text-center flex flex-col items-center">
                            <Package size={24} className="text-gray-300 mb-2" />
                            <p>No se encontraron productos</p>
                            <p className="text-xs mt-1">
                              Intenta con otro término
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      name="cantidad"
                      value={formData.cantidad}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Motivo *
                    </label>
                    <select
                      name="motivo"
                      value={formData.motivo}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    >
                      <option value="">Seleccionar motivo</option>
                      {MOVEMENT_REASONS[modalType]?.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  </div>

                  {modalType === "ajuste" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Tipo de Movimiento *
                      </label>
                      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg border border-gray-200">
                        <button
                          type="button"
                          disabled={
                            formData.motivo === "Productos dañados" ||
                            formData.motivo === "Productos vencidos"
                          }
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              tipoOperacionAjuste: "ingreso",
                            }))
                          }
                          className={clsx(
                            "flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1",
                            formData.tipoOperacionAjuste === "ingreso"
                              ? "bg-white text-success-600 shadow-sm"
                              : "text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent",
                          )}
                        >
                          <Plus size={14} /> Suma (+)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              tipoOperacionAjuste: "salida",
                            }))
                          }
                          className={clsx(
                            "flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1",
                            formData.tipoOperacionAjuste === "salida"
                              ? "bg-white text-primary-600 shadow-sm"
                              : "text-gray-500 hover:bg-gray-200",
                          )}
                        >
                          <Minus size={14} /> Resta (-)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-none"
                    placeholder="Notas adicionales..."
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 flex items-center gap-2"
              >
                <CheckCircle2 size={18} /> Registrar Movimiento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsDetailModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                Detalle del Movimiento
              </h2>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <span
                  className={clsx(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                    selectedMovement.tipo.includes("ENTRADA") ||
                      selectedMovement.tipo.includes("COMPRA")
                      ? "bg-success-100 text-success-700"
                      : selectedMovement.tipo.includes("SALIDA") ||
                          selectedMovement.tipo.includes("VENTA")
                        ? "bg-warning-100 text-warning-700"
                        : "bg-gray-100 text-gray-700",
                  )}
                >
                  {selectedMovement.tipo.replace(/_/g, " ")}
                </span>
                <span className="text-sm font-medium text-gray-500">
                  {new Date(
                    selectedMovement.fechaMovimiento,
                  ).toLocaleDateString()}{" "}
                  -{" "}
                  {new Date(
                    selectedMovement.fechaMovimiento,
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                  <Package size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 leading-tight">
                    {selectedMovement.producto?.nombre}
                  </h4>
                  <span className="text-xs font-mono text-gray-500">
                    {selectedMovement.producto?.codigoInterno}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">
                    Cantidad
                  </span>
                  <div
                    className={clsx(
                      "text-lg font-bold font-mono",
                      selectedMovement.cantidad > 0
                        ? "text-success-600"
                        : "text-primary-600",
                    )}
                  >
                    {selectedMovement.cantidad > 0 ? "+" : ""}
                    {selectedMovement.cantidad} uds
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">
                    Sucursal
                  </span>
                  <div className="text-sm font-semibold text-gray-700">
                    Única
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">
                  Motivo
                </span>
                <div className="text-sm font-medium text-gray-700">
                  {selectedMovement.motivo}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">
                  Registrado Por
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">
                    {selectedMovement.usuario?.nombre
                      ?.substring(0, 2)
                      .toUpperCase() || "AD"}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {selectedMovement.usuario?.nombre}{" "}
                    {selectedMovement.usuario?.apellido}
                  </span>
                </div>
              </div>

              {(selectedMovement.referencia ||
                selectedMovement.observaciones) && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 italic">
                  "
                  {selectedMovement.referencia ||
                    selectedMovement.observaciones}
                  "
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
