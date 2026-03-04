import { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Download,
  CreditCard,
  Briefcase,
  Loader2,
  FileSpreadsheet,
  FileText,
  X,
  CheckCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
  Printer,
  ScanBarcode,
} from "lucide-react";
import clsx from "clsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
} from "recharts";
import reportService from "../services/reportService";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";
import { settingService } from "../services/settingService";
import TicketReceipt from "../components/TicketReceipt";

export default function Reportes() {
  const [activeTab, setActiveTab] = useState("ventas"); // ventas, productos, inventario, cajas
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Data States
  const [dashboardStats, setDashboardStats] = useState(null);
  const [salesChart, setSalesChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [productStats, setProductStats] = useState(null);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [cashStats, setCashStats] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);

  // Pagination State
  const [topProductsPage, setTopProductsPage] = useState(1);
  const [salesHistoryPage, setSalesHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // UI State for exports
  const [showExportMenu, setShowExportMenu] = useState(null); // null, 'topProducts', 'lowStock', 'cashHistory'
  const [modalDetails, setModalDetails] = useState({
    show: false,
    type: "",
    data: [],
    title: "",
    date: "",
    total: 0,
  });

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [settings, setSettings] = useState({
    empresa_nombre: "Licorería",
    empresa_nit: "123456789",
    empresa_direccion: "Sucursal Central",
    empresa_mensaje_recibo: "¡GRACIAS POR SU COMPRA!",
    empresa_logo: null,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await settingService.getSettings();
        const settingsArray = Array.isArray(res) ? res : res.data || [];
        const kv = {};
        settingsArray.forEach((item) => {
          kv[item.clave] = item.valor;
        });
        setSettings((prev) => ({ ...prev, ...kv }));
      } catch (err) {
        console.error("Error cargando configs:", err);
      }
    };
    fetchSettings();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      if (activeTab === "ventas") {
        const [stats, chart, top, history] = await Promise.all([
          reportService.getDashboardStats(params),
          reportService.getSalesChart(params),
          reportService.getTopProducts(params),
          reportService.getSalesHistory(params),
        ]);
        setDashboardStats(stats);
        setSalesChart(chart);
        setTopProducts(top);
        setSalesHistory(history);
      } else if (activeTab === "productos") {
        const res = await reportService.getProductStats();
        setProductStats(res);
      } else if (activeTab === "inventario") {
        const res = await reportService.getInventoryStats(params);
        setInventoryStats(res);
      } else if (activeTab === "cajas") {
        const res = await reportService.getCashStats(params);
        setCashStats(res);
      }
    } catch (err) {
      console.error(err);
      setError("Error al cargar reportes. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleGenerate = () => {
    fetchData();
  };

  // Helper for currency
  const formatCurrency = (val) =>
    `Bs. ${Number(val || 0).toLocaleString("es-BO", { minimumFractionDigits: 2 })}`;

  // Export Handlers
  const handleExportTopProducts = (formatType) => {
    if (formatType === "excel") {
      const data = topProducts.map((p, i) => ({
        Ranking: i + 1,
        Producto: p.name,
        Categoría: p.category,
        Unidades: p.units,
        Ingresos: p.income,
        "% Total": `${p.percent}%`,
      }));
      exportToExcel(data, "productos-mas-vendidos");
    } else {
      const columns = [
        "#",
        "Producto",
        "Categoría",
        "Unidades",
        "Ingresos",
        "%",
      ];
      const data = topProducts.map((p, i) => [
        i + 1,
        p.name,
        p.category,
        p.units,
        formatCurrency(p.income),
        `${p.percent}%`,
      ]);
      exportToPDF({
        columns,
        data,
        title: "Reporte: Productos Más Vendidos",
        fileName: "top-productos",
      });
    }
    setShowExportMenu(null);
  };

  const handleExportLowStock = (formatType) => {
    if (formatType === "excel") {
      const data = productStats.lowStockList.map((p) => ({
        Producto: p.name,
        Código: p.code,
        "Stock Actual": p.stock,
        Mínimo: p.min,
        Estado: p.status,
      }));
      exportToExcel(data, "stock-bajo");
    } else {
      const columns = ["Producto", "Código", "Stock", "Mín.", "Estado"];
      const data = productStats.lowStockList.map((p) => [
        p.name,
        p.code,
        p.stock,
        p.min,
        p.status,
      ]);
      exportToPDF({
        columns,
        data,
        title: "Reporte: Productos con Stock Bajo",
        fileName: "stock-bajo",
      });
    }
    setShowExportMenu(null);
  };

  const handleExportCashHistory = (formatType) => {
    if (formatType === "excel") {
      const data = cashStats.history.map((c) => ({
        "Caja #": c.id,
        Apertura: format(new Date(c.openingDate), "dd/MM/yyyy HH:mm:ss", {
          locale: es,
        }),
        Cierre: format(new Date(c.fullDate), "dd/MM/yyyy HH:mm:ss", {
          locale: es,
        }),
        Cajero: c.cashier,
        "Monto Apertura": c.open,
        "Ventas Efvo": c.salesCash,
        "Ventas QR/Tarjeta":
          (Number(c.salesQr) || 0) + (Number(c.salesTarjeta) || 0),
        Ingresos: c.incomes,
        Retiros: c.retiros,
        "Total Vendido": c.sales,
        "Saldo Sistema": c.expectedBalance,
        Diferencia: c.diff,
        Estado:
          Math.abs(c.diff) < 0.1
            ? "CUADRO PERFECTO"
            : c.diff < 0
              ? `FALTANTE (${formatCurrency(Math.abs(c.diff))})`
              : `SOBRANTE (${formatCurrency(c.diff)})`,
      }));
      exportToExcel(data, "historial-cajas");
    } else {
      const columns = [
        "Apertura",
        "Cajero",
        "M. Apert.",
        "Efvo",
        "QR/Tarj.",
        "Ing.",
        "Ret.",
        "Total",
        "Saldo",
        "Dif.",
        "Estado",
      ];
      const data = cashStats.history.map((c) => [
        format(new Date(c.openingDate), "dd/MM/yy HH:mm", { locale: es }),
        c.cashier,
        formatCurrency(c.open),
        formatCurrency(c.salesCash),
        formatCurrency(
          (Number(c.salesQr) || 0) + (Number(c.salesTarjeta) || 0),
        ),
        formatCurrency(c.incomes),
        formatCurrency(c.retiros),
        formatCurrency(c.sales),
        formatCurrency(c.expectedBalance),
        c.diff,
        Math.abs(c.diff) < 0.1 ? "OK" : c.diff < 0 ? "FALTA" : "SOBRA",
      ]);
      exportToPDF({
        columns,
        data,
        title: "Historial de Cierres de Caja Detailed",
        fileName: "historial-cajas",
      });
    }
    setShowExportMenu(null);
  };

  // Export Sales History
  const handleExportSalesHistory = (formatType) => {
    if (formatType === "excel") {
      const data = salesHistory.map((v) => ({
        "Nro. Venta": `#${v.numeroVenta}`,
        Fecha: format(new Date(v.fecha), "dd/MM/yyyy HH:mm", { locale: es }),
        Productos: v.productos
          .map((p) => `${p.cantidad}x ${p.nombre}`)
          .join(", "),
        Usuario: v.usuario,
        "Método Pago":
          v.metodoPagoTexto ||
          (v.metodoPago === "EFECTIVO"
            ? "Efectivo"
            : v.metodoPago === "TARJETA"
              ? "Tarjeta"
              : "QR"),
        "Monto Total": v.total,
        Descuento: v.descuento > 0 ? v.descuento : "-",
      }));
      exportToExcel(data, "historial-ventas");
    } else {
      const columns = [
        "Nro. Venta",
        "Fecha",
        "Productos",
        "Usuario",
        "Monto",
        "Desc.",
      ];
      const data = salesHistory.map((v) => [
        `#${v.numeroVenta}`,
        format(new Date(v.fecha), "dd/MM/yy HH:mm", { locale: es }),
        v.productos.map((p) => `${p.cantidad}x ${p.nombre}`).join(", "),
        v.usuario,
        formatCurrency(v.total),
        v.descuento > 0 ? formatCurrency(v.descuento) : "-",
      ]);
      exportToPDF({
        columns,
        data,
        title: "Historial de Ventas",
        fileName: "historial-ventas",
      });
    }
    setShowExportMenu(null);
  };

  const DetailsModal = ({
    isOpen,
    onClose,
    type,
    data,
    title,
    date,
    total,
  }) => {
    if (!isOpen) return null;
    const isIncome = type === "ingreso";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-extrabold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 font-medium">{date}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {data.length > 0 ? (
              data.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-gray-100 flex justify-between items-center hover:border-primary-100 transition-colors"
                >
                  <div>
                    <p className="font-bold text-gray-900">
                      {item.description}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                      {format(new Date(item.date), "dd/MM/yyyy, hh:mm:ss a", {
                        locale: es,
                      })}
                    </p>
                  </div>
                  <span
                    className={clsx("font-bold text-lg", "text-primary-600")}
                  >
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8 font-medium">
                No hay registros para mostrar.
              </p>
            )}

            <div className="p-4 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex justify-between items-center">
              <span className="font-bold text-gray-700">Total:</span>
              <span
                className={clsx("font-extrabold text-2xl", "text-primary-600")}
              >
                {formatCurrency(total)}
              </span>
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button
              onClick={onClose}
              className="bg-white text-gray-700 px-6 py-2 rounded-xl font-bold border border-gray-200 hover:bg-gray-100 transition-colors shadow-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Reportes
          </h1>
          <p className="text-gray-500 mt-1">
            Análisis y estadísticas del negocio
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg border border-gray-200">
            <Calendar size={18} className="text-gray-500" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="bg-transparent text-sm text-gray-700 outline-none w-28 md:w-auto"
            />
            <span className="text-gray-400 font-medium">a</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="bg-transparent text-sm text-gray-700 outline-none w-28 md:w-auto"
            />
          </div>
          <button
            onClick={handleGenerate}
            className="flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              "Generar"
            )}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
        {["ventas", "productos", "inventario", "cajas"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all",
              activeTab === tab
                ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-[1.02]"
                : "bg-white text-gray-500 hover:bg-gray-50 border border-transparent hover:border-gray-200",
            )}
          >
            {tab === "ventas" && <TrendingUp size={18} />}
            {tab === "productos" && <Package size={18} />}
            {tab === "inventario" && <Briefcase size={18} />}
            {tab === "cajas" && <DollarSign size={18} />}
            <span className="capitalize">{tab}</span>
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-primary-50 text-primary-600 p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle size={20} /> {error}
        </div>
      )}

      {/* Content: Ventas */}
      {activeTab === "ventas" && dashboardStats && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                  <DollarSign size={24} />
                </div>
              </div>
              <div className="text-sm font-medium text-gray-500">
                Ventas Totales
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardStats.totalVentas)}
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-lg bg-success-50 text-success-600 flex items-center justify-center">
                  <ShoppingCart size={24} />
                </div>
              </div>
              <div className="text-sm font-medium text-gray-500">
                Transacciones
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {dashboardStats.totalTransacciones}
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-lg bg-info-50 text-info-600 flex items-center justify-center">
                  <CreditCard size={24} />
                </div>
              </div>
              <div className="text-sm font-medium text-gray-500">
                Ticket Promedio
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardStats.ticketPromedio)}
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-lg bg-warning-50 text-warning-600 flex items-center justify-center">
                  <Users size={24} />
                </div>
              </div>
              <div className="text-sm font-medium text-gray-500">
                Clientes Atendidos
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {dashboardStats.clientesAtendidos}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-96">
              <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm opacity-70">
                Ventas por Día
              </h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesChart}>
                    <defs>
                      <linearGradient
                        id="colorVentas"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#0ea5e9"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#0ea5e9"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#F3F4F6"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                      tickFormatter={(val) => `Bs.${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(val) => [formatCurrency(val), "Ventas"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="ventas"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorVentas)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="xl:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-96">
              <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm opacity-70">
                Ventas por Categoría
              </h3>
              <div className="flex-1 w-full min-h-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardStats?.salesByCategory || []}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dashboardStats?.salesByCategory?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [formatCurrency(val), "Ventas"]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Products Table */}
          {(() => {
            const totalTopPages = Math.ceil(
              topProducts.length / ITEMS_PER_PAGE,
            );
            const paginatedTop = topProducts.slice(
              (topProductsPage - 1) * ITEMS_PER_PAGE,
              topProductsPage * ITEMS_PER_PAGE,
            );
            const startIdx = (topProductsPage - 1) * ITEMS_PER_PAGE;
            return (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 text-lg">
                    Productos Más Vendidos
                  </h3>
                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowExportMenu(
                          showExportMenu === "topProducts"
                            ? null
                            : "topProducts",
                        )
                      }
                      className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-primary-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors border border-gray-200"
                    >
                      <Download size={16} /> Exportar
                    </button>

                    {showExportMenu === "topProducts" && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowExportMenu(null)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                          <button
                            onClick={() => handleExportTopProducts("excel")}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                          >
                            <FileSpreadsheet
                              size={18}
                              className="text-success-600"
                            />
                            <span className="font-semibold">Excel (.xlsx)</span>
                          </button>
                          <button
                            onClick={() => handleExportTopProducts("pdf")}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                          >
                            <FileText size={18} className="text-primary-600" />
                            <span className="font-semibold">PDF (.pdf)</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4">#</th>
                        <th className="px-6 py-4">Producto</th>
                        <th className="px-6 py-4">Categoría</th>
                        <th className="px-6 py-4 text-center">Unidades</th>
                        <th className="px-6 py-4 text-right">Ingresos</th>
                        <th className="px-6 py-4 text-center">% Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedTop.map((p, i) => (
                        <tr
                          key={p.id}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 font-mono text-gray-400">
                            {startIdx + i + 1}
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900">
                            {p.name}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-semibold">
                              {p.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-medium">
                            {p.units}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900">
                            {formatCurrency(p.income)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary-500 rounded-full"
                                  style={{ width: `${p.percent}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-semibold text-gray-500">
                                {p.percent}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {topProducts.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            No hay datos de ventas en este periodo.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalTopPages > 1 && (
                  <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Mostrando {startIdx + 1}-
                      {Math.min(startIdx + ITEMS_PER_PAGE, topProducts.length)}{" "}
                      de {topProducts.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setTopProductsPage((p) => Math.max(1, p - 1))
                        }
                        disabled={topProductsPage === 1}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      {Array.from(
                        { length: totalTopPages },
                        (_, i) => i + 1,
                      ).map((page) => (
                        <button
                          key={page}
                          onClick={() => setTopProductsPage(page)}
                          className={clsx(
                            "w-8 h-8 rounded-lg text-sm font-bold transition-colors",
                            page === topProductsPage
                              ? "bg-primary-600 text-white"
                              : "text-gray-600 hover:bg-gray-100",
                          )}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setTopProductsPage((p) =>
                            Math.min(totalTopPages, p + 1),
                          )
                        }
                        disabled={topProductsPage === totalTopPages}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Sales History Table */}
          {(() => {
            const totalHistPages = Math.ceil(
              salesHistory.length / ITEMS_PER_PAGE,
            );
            const paginatedHist = salesHistory.slice(
              (salesHistoryPage - 1) * ITEMS_PER_PAGE,
              salesHistoryPage * ITEMS_PER_PAGE,
            );
            const startIdx = (salesHistoryPage - 1) * ITEMS_PER_PAGE;
            return (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 text-lg">
                    Historial de Ventas
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 font-medium">
                      {salesHistory.length} ventas
                    </span>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowExportMenu(
                            showExportMenu === "salesHistory"
                              ? null
                              : "salesHistory",
                          )
                        }
                        className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-primary-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors border border-gray-200"
                      >
                        <Download size={16} /> Exportar
                      </button>
                      {showExportMenu === "salesHistory" && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowExportMenu(null)}
                          ></div>
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                            <button
                              onClick={() => handleExportSalesHistory("excel")}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                            >
                              <FileSpreadsheet
                                size={18}
                                className="text-success-600"
                              />
                              <span className="font-semibold">
                                Excel (.xlsx)
                              </span>
                            </button>
                            <button
                              onClick={() => handleExportSalesHistory("pdf")}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                            >
                              <FileText
                                size={18}
                                className="text-primary-600"
                              />
                              <span className="font-semibold">PDF (.pdf)</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4">Nro. Venta</th>
                        <th className="px-6 py-4">Fecha</th>
                        <th className="px-6 py-4">Productos</th>
                        <th className="px-6 py-4">Usuario</th>
                        <th className="px-6 py-4 text-right">Monto Total</th>
                        <th className="px-6 py-4 text-center">Descuento</th>
                        <th className="px-6 py-4 text-center">Ticket</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedHist.map((venta) => (
                        <tr
                          key={venta.id}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 font-mono text-primary-600 font-bold text-xs">
                            #{venta.numeroVenta}
                          </td>
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                            {format(new Date(venta.fecha), "dd/MM/yyyy HH:mm", {
                              locale: es,
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-0.5 max-w-xs">
                              {(venta.items || venta.productos || []).map(
                                (prod, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs text-gray-700"
                                  >
                                    {prod.quantity || prod.cantidad}x{" "}
                                    {prod.nombre}
                                    {prod.presentacionNombre &&
                                      prod.presentacionNombre !== "Unidad" && (
                                        <span className="text-gray-500 ml-1">
                                          ({prod.presentacionNombre})
                                        </span>
                                      )}
                                  </span>
                                ),
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-800">
                            {venta.usuario}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="font-bold text-gray-900">
                              {formatCurrency(venta.total)}
                            </div>
                            <div className="text-xs text-gray-400 font-medium">
                              {venta.metodoPagoTexto ||
                                (venta.metodoPago === "EFECTIVO"
                                  ? "Efectivo"
                                  : venta.metodoPago === "TARJETA"
                                    ? "Tarjeta"
                                    : "QR")}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {venta.descuento > 0 ? (
                              <span className="px-2 py-1 bg-warning-50 text-warning-700 rounded font-bold text-xs">
                                {formatCurrency(venta.descuento)}
                              </span>
                            ) : (
                              <span className="text-gray-300 font-medium">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedTicket(venta);
                                setIsTicketModalOpen(true);
                              }}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-transparent hover:border-primary-200 inline-flex"
                              title="Imprimir Ticket"
                            >
                              <Printer size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {salesHistory.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            No hay ventas en este periodo.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalHistPages > 1 && (
                  <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Mostrando {startIdx + 1}-
                      {Math.min(startIdx + ITEMS_PER_PAGE, salesHistory.length)}{" "}
                      de {salesHistory.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setSalesHistoryPage((p) => Math.max(1, p - 1))
                        }
                        disabled={salesHistoryPage === 1}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      {Array.from(
                        { length: totalHistPages },
                        (_, i) => i + 1,
                      ).map((page) => (
                        <button
                          key={page}
                          onClick={() => setSalesHistoryPage(page)}
                          className={clsx(
                            "w-8 h-8 rounded-lg text-sm font-bold transition-colors",
                            page === salesHistoryPage
                              ? "bg-primary-600 text-white"
                              : "text-gray-600 hover:bg-gray-100",
                          )}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setSalesHistoryPage((p) =>
                            Math.min(totalHistPages, p + 1),
                          )
                        }
                        disabled={salesHistoryPage === totalHistPages}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Content: Productos */}
      {activeTab === "productos" && productStats && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-1">
                Total Productos
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {productStats.totalProducts}
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-success-500">
              <div className="text-sm font-medium text-gray-500 mb-1">
                Stock Disponible
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {productStats.stockAvailable}
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-warning-500">
              <div className="text-sm font-medium text-gray-500 mb-1">
                Stock Bajo
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {productStats.stockLow}
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-primary-500">
              <div className="text-sm font-medium text-gray-500 mb-1">
                Sin Stock
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {productStats.outOfStock}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[450px]">
              <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm opacity-70">
                Distribución por Categoría
              </h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={productStats.distribution}
                    margin={{ bottom: 100 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#F3F4F6"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#6B7280",
                        fontSize: 10,
                        fontWeight: 600,
                        angle: -45,
                        textAnchor: "end",
                      }}
                      interval={0}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(val) => [`${val} Productos`, "Cantidad"]}
                    />
                    <Bar
                      dataKey="value"
                      fill="#ef4444"
                      radius={[6, 6, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="xl:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[320px]">
              <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm opacity-70">
                Rotación de Productos
              </h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productStats.rotation}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#F3F4F6"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6B7280", fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(val) => [`${val} Productos`, "Total"]}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                      {productStats.rotation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <AlertTriangle size={20} className="text-warning-500" />{" "}
                Productos con Stock Bajo
              </h3>
              <div className="relative">
                <button
                  onClick={() =>
                    setShowExportMenu(
                      showExportMenu === "lowStock" ? null : "lowStock",
                    )
                  }
                  className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-primary-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors border border-gray-200"
                >
                  <Download size={16} /> Exportar
                </button>

                {showExportMenu === "lowStock" && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowExportMenu(null)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                      <button
                        onClick={() => handleExportLowStock("excel")}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                      >
                        <FileSpreadsheet
                          size={18}
                          className="text-success-600"
                        />
                        <span className="font-semibold">Excel (.xlsx)</span>
                      </button>
                      <button
                        onClick={() => handleExportLowStock("pdf")}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                      >
                        <FileText size={18} className="text-primary-600" />
                        <span className="font-semibold">PDF (.pdf)</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Producto</th>
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4 text-center">Stock Actual</th>
                    <th className="px-6 py-4 text-center">Mínimo</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productStats.lowStockList.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {p.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-500 text-xs">
                        {p.code}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-primary-600">
                        {p.stock}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-500">
                        {p.min}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={clsx(
                            "px-2 py-1 rounded text-xs font-bold uppercase",
                            p.status === "Crítico"
                              ? "bg-primary-100 text-primary-700"
                              : "bg-warning-100 text-warning-700",
                          )}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {productStats.lowStockList.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        ¡Excelente! No hay productos con stock bajo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Content: Inventario */}
      {activeTab === "inventario" && inventoryStats && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Total Ingresos
                  </div>
                  <span className="text-xs font-bold text-success-600 bg-success-50 px-2 py-0.5 rounded">
                    +{inventoryStats.totalIngresos}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  {inventoryStats.totalIngresos} Unidades
                </div>
              </div>
              <div className="w-full h-1 bg-gray-100 mt-4 rounded-full overflow-hidden">
                <div className="h-full bg-success-500 w-3/4"></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Total Salidas
                  </div>
                  <span className="text-xs font-bold text-warning-600 bg-warning-50 px-2 py-0.5 rounded">
                    -{inventoryStats.totalSalidas}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  {inventoryStats.totalSalidas} Unidades
                </div>
              </div>
              <div className="w-full h-1 bg-gray-100 mt-4 rounded-full overflow-hidden">
                <div className="h-full bg-warning-500 w-1/2"></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">
                  Diferencia Neta
                </div>
                <div
                  className={clsx(
                    "text-2xl font-bold mt-2",
                    inventoryStats.diferencia >= 0
                      ? "text-success-600"
                      : "text-primary-600",
                  )}
                >
                  {inventoryStats.diferencia >= 0 ? "+" : ""}
                  {inventoryStats.diferencia} Unidades
                </div>
              </div>
              <div className="text-xs font-bold text-gray-400 mt-4 uppercase">
                {inventoryStats.diferencia >= 0 ? "Crecimiento" : "Reducción"}
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">
                  Movimientos
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  {inventoryStats.totalMovimientos}
                </div>
              </div>
              <div className="text-xs font-bold text-gray-400 mt-4 uppercase">
                Este Mes
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-96">
              <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm opacity-70">
                Movimientos por Tipo
              </h3>
              <div className="flex-1 w-full min-h-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryStats.movementsByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {inventoryStats.movementsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="xl:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-96">
              <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm opacity-70">
                Tendencia de Stock
              </h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={inventoryStats.stockTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#F3F4F6"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="stock"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#3b82f6" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content: Cajas */}
      {activeTab === "cajas" && cashStats && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-success-50/50 p-6 rounded-xl border border-success-100">
              <div className="text-sm font-bold text-success-800 uppercase tracking-wide mb-1">
                Efectivo en Caja
              </div>
              <div className="text-3xl font-extrabold text-success-700">
                {formatCurrency(cashStats.efectivoEnCaja)}
              </div>
            </div>
            <div className="bg-info-50/50 p-6 rounded-xl border border-info-100">
              <div className="text-sm font-bold text-info-800 uppercase tracking-wide mb-1">
                Otros Métodos
              </div>
              <div className="text-3xl font-extrabold text-info-700">
                {formatCurrency(cashStats.otrosMetodos)}
              </div>
            </div>
            <div className="bg-primary-50/50 p-6 rounded-xl border border-primary-100">
              <div className="text-sm font-bold text-primary-800 uppercase tracking-wide mb-1">
                Monto Total en Ventas
              </div>
              <div className="text-3xl font-extrabold text-primary-700">
                {formatCurrency(cashStats.totalRecaudado)}
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-center items-center">
              <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">
                Turnos Hoy
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                {cashStats.turnosHoy}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-lg">
                Historial de Cierres de Caja
              </h3>
              <div className="relative">
                <button
                  onClick={() =>
                    setShowExportMenu(
                      showExportMenu === "cashHistory" ? null : "cashHistory",
                    )
                  }
                  className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-primary-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors border border-gray-200"
                >
                  <Download size={16} /> Exportar
                </button>

                {showExportMenu === "cashHistory" && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowExportMenu(null)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                      <button
                        onClick={() => handleExportCashHistory("excel")}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                      >
                        <FileSpreadsheet
                          size={18}
                          className="text-success-600"
                        />
                        <span className="font-semibold">Excel (.xlsx)</span>
                      </button>
                      <button
                        onClick={() => handleExportCashHistory("pdf")}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                      >
                        <FileText size={18} className="text-primary-600" />
                        <span className="font-semibold">PDF (.pdf)</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4">APERTURA / CIERRE</th>
                    <th className="px-6 py-4">CAJA / USUARIO</th>
                    <th className="px-6 py-4 text-center">APERTURA</th>
                    <th className="px-6 py-4 text-center text-success-600">
                      EFECTIVO (VENTAS)
                    </th>
                    <th className="px-6 py-4 text-center text-info-600">
                      QR/TARJETA (VENTAS)
                    </th>
                    <th className="px-6 py-4 text-center text-primary-600">
                      INGRESOS
                    </th>
                    <th className="px-6 py-4 text-center text-primary-600">
                      RETIROS
                    </th>
                    <th className="px-6 py-4 text-center">TOTAL VENDIDO</th>
                    <th className="px-6 py-4 text-center">SALDO SISTEMA</th>
                    <th className="px-6 py-4 text-center">CIERRE DE CAJA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cashStats.history.map((c) => {
                    const diffValue = parseFloat(c.diff || 0);
                    const isPerfect = Math.abs(diffValue) < 0.1;
                    const isFaltante = diffValue < 0;
                    const isSobrante = diffValue > 0;

                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">
                                {format(
                                  new Date(c.openingDate),
                                  "d/M/yyyy, h:mm:ss a",
                                  { locale: es },
                                )}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-400 font-medium">
                              {c.estado === "CERRADA" ? (
                                <>
                                  Cierre:{" "}
                                  {format(
                                    new Date(c.fullDate),
                                    "d/M/yyyy, h:mm:ss a",
                                    { locale: es },
                                  )}
                                </>
                              ) : (
                                "En curso..."
                              )}
                            </div>
                            <span
                              className={clsx(
                                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                c.estado === "ABIERTA"
                                  ? "bg-success-100 text-success-700"
                                  : "bg-gray-100 text-gray-600",
                              )}
                            >
                              {c.estado}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <div className="text-gray-500 font-medium">
                              {c.cashier}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-gray-700">
                          {formatCurrency(c.open)}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-gray-600">
                          {formatCurrency(c.salesCash)}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-gray-600">
                          {formatCurrency(
                            (Number(c.salesQr) || 0) +
                              (Number(c.salesTarjeta) || 0),
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() =>
                              setModalDetails({
                                show: true,
                                type: "ingreso",
                                data: c.incomeDetails || [],
                                title: "Detalle de Ingresos",
                                date: `Caja #${c.id} - ${c.date}`,
                                total: c.incomes,
                              })
                            }
                            className="font-bold text-primary-600 hover:underline decoration-2 underline-offset-4"
                          >
                            {formatCurrency(c.incomes)}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() =>
                              setModalDetails({
                                show: true,
                                type: "retiro",
                                data: c.withdrawalDetails || [],
                                title: "Detalle de Retiros",
                                date: `Caja #${c.id} - ${c.date}`,
                                total: c.retiros,
                              })
                            }
                            className="font-bold text-primary-600 hover:underline decoration-2 underline-offset-4"
                          >
                            {formatCurrency(c.retiros)}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center font-extrabold text-gray-900">
                          {formatCurrency(c.sales)}
                        </td>
                        <td className="px-6 py-4 text-center font-extrabold text-gray-900">
                          {formatCurrency(c.expectedBalance)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {c.estado === "CERRADA" ? (
                            <div className="flex flex-col items-center gap-1">
                              {isPerfect ? (
                                <>
                                  <CheckCircle
                                    size={20}
                                    className="text-success-500"
                                  />
                                  <span className="text-[10px] font-extrabold text-success-600 uppercase">
                                    CUADRO PERFECTO
                                  </span>
                                </>
                              ) : isFaltante ? (
                                <>
                                  <ArrowDownCircle
                                    size={20}
                                    className="text-primary-500"
                                  />
                                  <span className="text-[10px] font-extrabold text-primary-600 uppercase">
                                    FALTANTE
                                  </span>
                                  <span className="text-xs font-black text-primary-600">
                                    {formatCurrency(Math.abs(diffValue))}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <ArrowUpCircle
                                    size={20}
                                    className="text-info-500"
                                  />
                                  <span className="text-[10px] font-extrabold text-info-600 uppercase">
                                    SOBRANTE
                                  </span>
                                  <span className="text-xs font-black text-info-600">
                                    {formatCurrency(diffValue)}
                                  </span>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-gray-400 italic">
                              Caja en curso
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {cashStats.history.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-6 py-8 text-center text-gray-500 font-medium"
                      >
                        No hay cierres de caja registrados en el periodo
                        seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <DetailsModal
            isOpen={modalDetails.show}
            onClose={() => setModalDetails({ ...modalDetails, show: false })}
            {...modalDetails}
          />
        </div>
      )}

      {/* Ticket Modal */}
      {isTicketModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsTicketModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 print:hidden">
              <h3 className="font-bold text-gray-900">Vista Previa Ticket</h3>
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-8 pt-12 bg-gray-50 print:p-0 print:bg-white print:overflow-visible">
              <TicketReceipt saleData={selectedTicket} settings={settings} />
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3 print:hidden bg-white">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                <ScanBarcode size={18} /> Imprimir
              </button>
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
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
