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
  AreaChart,
  Area,
} from "recharts";
import reportService from "../services/reportService";
import { format } from "date-fns";
import { es } from "date-fns/locale"; // Ensure locale ES is available or remove if not needed

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

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      if (activeTab === "ventas") {
        const [stats, chart, top] = await Promise.all([
          reportService.getDashboardStats(params),
          reportService.getSalesChart(params),
          reportService.getTopProducts(params),
        ]);
        setDashboardStats(stats);
        setSalesChart(chart);
        setTopProducts(top);
      } else if (activeTab === "productos") {
        const res = await reportService.getProductStats();
        setProductStats(res);
      } else if (activeTab === "inventario") {
        const res = await reportService.getInventoryStats(params);
        setInventoryStats(res);
      } else if (activeTab === "cajas") {
        const res = await reportService.getCashStats();
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-96">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Gráfico de Ventas por Día
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
          </div>

          {/* Top Products Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-lg">
                Productos Más Vendidos
              </h3>
              <button className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-primary-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">
                <Download size={16} /> Exportar
              </button>
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
                  {topProducts.map((p, i) => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-gray-400">
                        {i + 1}
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
          </div>
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

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <AlertTriangle size={20} className="text-warning-500" />{" "}
                Productos con Stock Bajo
              </h3>
              <button className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-primary-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">
                <Download size={16} /> Exportar
              </button>
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
                <div className="flex justify-between items-start">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Diferencia
                  </div>
                  <TrendingUp size={16} className="text-info-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  {inventoryStats.diferencia > 0 ? "+" : ""}
                  {inventoryStats.diferencia} Unidades
                </div>
              </div>
              <div className="w-full h-1 bg-gray-100 mt-4 rounded-full overflow-hidden">
                <div className="h-full bg-info-500 w-full"></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Movimientos
                  </div>
                  <Briefcase size={16} className="text-primary-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  {inventoryStats.totalMovimientos}
                </div>
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
                Total Recaudado
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
              <button className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-primary-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">
                <Download size={16} /> Exportar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Cajero</th>
                    <th className="px-6 py-4 text-center">Apertura</th>
                    <th className="px-6 py-4 text-center text-success-600">
                      Ventas Efvo
                    </th>
                    <th className="px-6 py-4 text-center text-info-600">
                      Ventas QR
                    </th>
                    <th className="px-6 py-4 text-center">Ventas Total</th>
                    <th className="px-6 py-4 text-center">Cierre</th>
                    <th className="px-6 py-4 text-center">Diferencia</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cashStats.history.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-gray-600">
                        {c.date}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {c.cashier}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {formatCurrency(c.open)}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-success-600">
                        +{formatCurrency(c.salesCash)}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-info-600">
                        +{formatCurrency(c.salesQr)}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-900">
                        +{formatCurrency(c.sales)}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-900">
                        {formatCurrency(c.close)}
                      </td>
                      <td
                        className={clsx(
                          "px-6 py-4 text-center font-bold",
                          c.diff < 0 ? "text-primary-600" : "text-gray-400",
                        )}
                      >
                        {c.diff}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={clsx(
                            "px-2 py-1 rounded text-xs font-bold uppercase",
                            c.status === "Correcto"
                              ? "bg-success-100 text-success-700"
                              : "bg-primary-100 text-primary-700",
                          )}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {cashStats.history.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No hay cierres de caja registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
