import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search,
  Bell,
  DollarSign,
  Package,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ChevronDown,
  MoreHorizontal,
  CheckCircle,
  Clock,
  Info,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import clsx from "clsx";
import dashboardService from "../services/dashboardService";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "../context/AuthContext";

const StatCard = ({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  colorClass,
  loading,
}) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 flex gap-4 hover:-translate-y-2 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 relative overflow-hidden group">
    <div
      className={clsx(
        "absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-r from-transparent via-current to-transparent",
        colorClass,
      )}
    ></div>
    <div
      className={clsx(
        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-opacity-10 transition-transform duration-300 group-hover:scale-110",
        colorClass.replace("text-", "bg-").replace("500", "500/10"),
        colorClass,
      )}
    >
      <Icon size={24} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 truncate">
        {title}
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-gray-100 animate-pulse rounded mb-2"></div>
      ) : (
        <div className="text-2xl font-black text-gray-900 mb-2 tracking-tight leading-none group-hover:text-primary-600 transition-colors">
          {value}
        </div>
      )}
      {loading ? (
        <div className="h-4 w-16 bg-gray-50 animate-pulse rounded"></div>
      ) : (
        <div
          className={clsx(
            "flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full inline-flex",
            isPositive
              ? "bg-success-50 text-success-600"
              : "bg-danger-50 text-danger-600",
          )}
        >
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {change}
        </div>
      )}
    </div>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("semana");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchData = async (currentPeriod) => {
    try {
      setLoading(true);
      const response = await dashboardService.getDashboardData(
        currentPeriod || period,
      );
      // El servicio 'api.js' ya devuelve response.json() directamente
      setData(response);
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("No se pudo cargar la información del dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
    // Auto refresh every 5 minutes
    const interval = setInterval(() => fetchData(period), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [period]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper safe date formatter
  const formatTime = (timeStr) => {
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return "Recientemente";
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: es,
      });
    } catch (err) {
      return "Recientemente";
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="p-4 bg-danger-50 text-primary-600 rounded-full">
          <AlertTriangle size={32} />
        </div>
        <p className="text-gray-600 font-medium">{error}</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold"
        >
          <RefreshCw size={18} />
          Reintentar
        </button>
      </div>
    );
  }

  const {
    stats,
    salesChart,
    topProducts,
    transactions,
    alerts,
    lowStockProducts,
  } = data || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <div className="flex items-center gap-2 text-gray-500 text-sm mt-2 font-medium">
            <Activity size={16} className="text-primary-500" />
            <span>Resumen general del sistema</span>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div
            className="flex items-center gap-2 relative"
            ref={notificationRef}
          >
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
              aria-label="Notificaciones"
            >
              <Bell size={22} className="text-gray-700" />
              {lowStockProducts?.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-danger-500 text-white text-[11px] font-bold w-5 h-5 flex justify-center items-center rounded-full border-2 border-white shadow-sm animate-pulse">
                  {lowStockProducts.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute left-0 md:left-auto md:right-0 top-14 w-80 md:w-96 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center rounded-t-xl">
                  <h3 className="font-bold text-gray-900 text-sm">
                    Notificaciones
                  </h3>
                  <span className="text-[10px] font-bold bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full uppercase">
                    {lowStockProducts?.length || 0} Alertas
                  </span>
                </div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {lowStockProducts?.length > 0 ? (
                    lowStockProducts.map((product) => (
                      <div
                        key={product.id}
                        className="p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1 p-2 bg-warning-50 text-warning-600 rounded-lg">
                            <Package size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate uppercase">
                              {product.nombre}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Stock crítico:{" "}
                              <span className="text-primary-600 font-bold">
                                {product.stockActual}
                              </span>{" "}
                              de {product.stockMinimo}
                            </p>
                            <Link
                              to="/productos"
                              className="text-xs font-bold text-primary-600 hover:underline mt-2 inline-block"
                              onClick={() => setIsNotificationsOpen(false)}
                            >
                              Reabastecer ahora
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      No hay alertas de stock bajo
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-gray-100 text-center">
                  <Link
                    to="/reportes"
                    className="text-xs font-bold text-gray-500 hover:text-primary-600 transition-colors"
                    onClick={() => setIsNotificationsOpen(false)}
                  >
                    Ver todos los reportes
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Ventas del Día"
          value={
            stats?.salesToday?.value !== undefined
              ? String(stats.salesToday.value).includes("Bs.")
                ? stats.salesToday.value
                : `Bs. ${stats.salesToday.value}`
              : "Bs. 0.00"
          }
          change={stats?.salesToday?.change}
          isPositive={stats?.salesToday?.isPositive}
          icon={DollarSign}
          colorClass="text-primary-500"
          loading={loading}
        />
        <StatCard
          title="Productos en Stock"
          value={stats?.stockTotal?.value}
          change={stats?.stockTotal?.change}
          isPositive={stats?.stockTotal?.isPositive}
          icon={Package}
          colorClass="text-success-500"
          loading={loading}
        />
        <StatCard
          title="Stock Bajo"
          value={stats?.lowStock?.value}
          change={stats?.lowStock?.change}
          isPositive={stats?.lowStock?.isPositive}
          icon={AlertTriangle}
          colorClass="text-warning-500"
          loading={loading}
        />
        <StatCard
          title="Transacciones Hoy"
          value={stats?.transactionsToday?.value}
          change={stats?.transactionsToday?.change}
          isPositive={stats?.transactionsToday?.isPositive}
          icon={Activity}
          colorClass="text-info-500"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <RefreshCw size={32} className="text-primary-500 animate-spin" />
            </div>
          )}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Ventas de los Últimos 7 Días
            </h3>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:border-primary-500 focus:outline-none transition-colors cursor-pointer"
            >
              <option value="semana">Última semana</option>
              <option value="mes">Último mes</option>
              <option value="trimestre">Último trimestre</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChart || []}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  itemStyle={{ color: "#111827", fontWeight: 600 }}
                  labelStyle={{ color: "#6B7280", marginBottom: "4px" }}
                  formatter={(val) => [`Bs. ${val}`, "Ventas"]}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <RefreshCw size={32} className="text-primary-500 animate-spin" />
            </div>
          )}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Productos Más Vendidos
            </h3>
          </div>
          <div className="space-y-4">
            {topProducts?.map((product, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 hover:bg-gray-50/80 rounded-xl transition-all duration-200 group border border-transparent hover:border-gray-100"
              >
                <div
                  className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm transition-transform group-hover:scale-110",
                    index === 0
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-orange-500/20"
                      : index === 1
                        ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-gray-400/20"
                        : index === 2
                          ? "bg-gradient-to-br from-amber-700 to-amber-800 text-white shadow-amber-800/20"
                          : "bg-gray-100 text-gray-600",
                  )}
                >
                  #{product.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-gray-900 leading-tight truncate group-hover:text-primary-600 transition-colors">
                    {product.name}
                  </div>
                  <div className="text-xs font-medium text-gray-500 mt-0.5 truncate uppercase tracking-wide">
                    {product.category}
                  </div>
                </div>
                <div className="text-right min-w-[100px]">
                  <div className="text-[13px] font-black text-gray-700 mb-1.5">
                    {product.sales}{" "}
                    <span className="text-gray-400 font-medium text-xs">
                      unid.
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        "h-full rounded-full transition-all duration-1000 ease-out",
                        index === 0
                          ? "bg-gradient-to-r from-orange-400 to-orange-500"
                          : "bg-gradient-to-r from-primary-400 to-primary-600",
                      )}
                      style={{ width: `${product.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
            {(!topProducts || topProducts.length === 0) && !loading && (
              <div className="text-center py-8 text-gray-500 text-sm">
                No hay datos disponibles
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Transactions */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <RefreshCw size={32} className="text-primary-500 animate-spin" />
            </div>
          )}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Transacciones Recientes
            </h3>
          </div>
          <div className="space-y-4">
            {transactions?.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 p-3 hover:bg-gray-50/80 rounded-xl transition-all duration-200 group border border-transparent hover:border-gray-100"
              >
                <div
                  className={clsx(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110",
                    tx.type === "sale"
                      ? "bg-success-50 text-success-600 border border-success-100"
                      : tx.type === "income"
                        ? "bg-info-50 text-info-600 border border-info-100"
                        : "bg-warning-50 text-warning-600 border border-warning-100",
                  )}
                >
                  {tx.type === "sale" ? (
                    <DollarSign size={20} />
                  ) : tx.type === "income" ? (
                    <Package size={20} />
                  ) : (
                    <AlertTriangle size={20} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                    {tx.title}
                  </div>
                  <div className="text-xs font-medium text-gray-500 mt-0.5 flex items-center gap-1">
                    <Clock size={12} />
                    {formatTime(tx.time)}
                  </div>
                </div>
                <div
                  className={clsx(
                    "font-black text-sm bg-gray-50/50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm",
                    tx.amount.startsWith("+")
                      ? "text-success-600"
                      : "text-primary-600",
                  )}
                >
                  {tx.amount}
                </div>
              </div>
            ))}
            {(!transactions || transactions.length === 0) && !loading && (
              <div className="text-center py-8 text-gray-500 text-sm">
                No hay transacciones recientes
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <RefreshCw size={32} className="text-primary-500 animate-spin" />
            </div>
          )}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Alertas del Sistema
            </h3>
          </div>
          <div className="space-y-4">
            {alerts?.map((alert, index) => (
              <div
                key={index}
                className={clsx(
                  "flex items-start gap-4 p-4 rounded-md border-l-[3px] transition-all hover:translate-x-1",
                  alert.type === "warning"
                    ? "bg-warning-50 text-warning-600 border-warning-500"
                    : alert.type === "info"
                      ? "bg-info-50 text-info-600 border-info-500"
                      : "bg-success-50 text-success-600 border-success-500",
                )}
              >
                <div className="shrink-0 mt-0.5">
                  {alert.type === "warning" ? (
                    <AlertTriangle size={20} />
                  ) : alert.type === "info" ? (
                    <Info size={20} />
                  ) : (
                    <CheckCircle size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-gray-900 mb-1">
                    {alert.title}
                  </div>
                  <div className="text-[13px] text-gray-600">
                    {alert.message}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (alert.type === "warning") navigate("/productos");
                    else if (alert.type === "success")
                      navigate("/configuracion");
                    else navigate("/reportes");
                  }}
                  className={clsx(
                    "px-3 py-1 bg-white border rounded text-xs font-semibold transition-colors",
                    alert.type === "warning"
                      ? "border-warning-500 text-warning-600 hover:bg-warning-500 hover:text-white"
                      : alert.type === "info"
                        ? "border-info-500 text-info-600 hover:bg-info-500 hover:text-white"
                        : "border-success-500 text-success-600 hover:bg-success-500 hover:text-white",
                  )}
                >
                  {alert.type === "warning"
                    ? "Revisar"
                    : alert.type === "info"
                      ? "Descargar"
                      : "Ver"}
                </button>
              </div>
            ))}
            {(!alerts || alerts.length === 0) && !loading && (
              <div className="text-center py-8 text-gray-500 text-sm">
                No hay alertas activas
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
