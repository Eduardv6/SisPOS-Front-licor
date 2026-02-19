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

const salesData = [
  { name: "Lun", sales: 4000 },
  { name: "Mar", sales: 3000 },
  { name: "Mie", sales: 2000 },
  { name: "Jue", sales: 2780 },
  { name: "Vie", sales: 1890 },
  { name: "Sab", sales: 2390 },
  { name: "Dom", sales: 3490 },
];

const topProducts = [
  {
    rank: 1,
    name: "Cerveza Paceña 620ml",
    category: "Cervezas",
    sales: 143,
    percentage: 85,
  },
  {
    rank: 2,
    name: "Singani Rujero 750ml",
    category: "Licores",
    sales: 98,
    percentage: 65,
  },
  {
    rank: 3,
    name: "Vino Kohlberg Tinto",
    category: "Vinos",
    sales: 76,
    percentage: 50,
  },
  {
    rank: 4,
    name: "Ron Santa Teresa",
    category: "Licores",
    sales: 64,
    percentage: 42,
  },
  {
    rank: 5,
    name: "Whisky Johnnie Walker",
    category: "Whisky",
    sales: 52,
    percentage: 35,
  },
];

const transactions = [
  {
    id: 1,
    title: "Venta #1247",
    time: "Hace 5 minutos",
    amount: "+Bs. 85.00",
    type: "sale",
    icon: DollarSign,
  },
  {
    id: 2,
    title: "Ingreso de stock",
    time: "Hace 2 horas",
    amount: "+150 unid.",
    type: "income",
    icon: Package,
  },
  {
    id: 3,
    title: "Venta #1246",
    time: "Hace 3 horas",
    amount: "+Bs. 120.00",
    type: "sale",
    icon: DollarSign,
  },
  {
    id: 4,
    title: "Ajuste de inventario",
    time: "Hace 5 horas",
    amount: "-12 unid.",
    type: "adjustment",
    icon: AlertTriangle,
  },
];

const alerts = [
  {
    type: "warning",
    title: "Stock bajo en 23 productos",
    message: "Se recomienda realizar pedido de reabastecimiento",
  },
  {
    type: "info",
    title: "Reporte quincenal disponible",
    message: "Período del 01/02 al 15/02/2026",
  },
  {
    type: "success",
    title: "Respaldo completado",
    message: "Último respaldo: Hoy a las 03:00",
  },
];

const StatCard = ({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  colorClass,
}) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 flex gap-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
    <div
      className={clsx(
        "absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-current to-transparent",
        colorClass,
      )}
    ></div>
    <div
      className={clsx(
        "w-14 h-14 rounded-md flex items-center justify-center shrink-0 bg-opacity-10",
        colorClass.replace("text-", "bg-").replace("500", "500/10"),
        colorClass,
      )}
    >
      <Icon size={24} />
    </div>
    <div className="flex-1">
      <div className="text-sm text-gray-600 font-medium mb-1">{title}</div>
      <div className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">
        {value}
      </div>
      <div
        className={clsx(
          "flex items-center gap-1 text-sm font-semibold",
          isPositive ? "text-success-600" : "text-danger-600",
        )}
      >
        {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        {change}
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Resumen general del sistema</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg flex-1 md:w-[300px] focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/10 transition-all shadow-sm">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              className="border-none outline-none text-sm w-full text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <button className="relative p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-colors">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-gray-50">
              3
            </span>
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Ventas del Día"
          value="Bs. 4,250.00"
          change="+12.5%"
          isPositive={true}
          icon={DollarSign}
          colorClass="text-primary-500"
        />
        <StatCard
          title="Productos en Stock"
          value="1,247"
          change="95% capacidad"
          isPositive={true} // Neural in original, but using positive for now
          icon={Package}
          colorClass="text-success-500"
        />
        <StatCard
          title="Stock Bajo"
          value="23"
          change="Requiere atención"
          isPositive={false}
          icon={AlertTriangle}
          colorClass="text-warning-500"
        />
        <StatCard
          title="Transacciones Hoy"
          value="87"
          change="+8.3%"
          isPositive={true}
          icon={Activity}
          colorClass="text-info-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Ventas de los Últimos 7 Días
            </h3>
            <select className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:border-primary-500 focus:outline-none transition-colors cursor-pointer">
              <option>Última semana</option>
              <option>Último mes</option>
              <option>Último trimestre</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E63946" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#E63946" stopOpacity={0} />
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
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#E63946"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Productos Más Vendidos
            </h3>
            <button className="text-sm font-semibold text-primary-500 hover:text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-md transition-colors">
              Ver todos
            </button>
          </div>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-md transition-colors"
              >
                <div
                  className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                    index === 0
                      ? "bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-white"
                      : "bg-gray-100 text-gray-700",
                  )}
                >
                  {product.rank}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900 leading-tight">
                    {product.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {product.category}
                  </div>
                </div>
                <div className="text-right min-w-[100px]">
                  <div className="text-xs font-semibold text-gray-600 mb-1">
                    {product.sales} unidades
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                      style={{ width: `${product.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Transactions */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Transacciones Recientes
            </h3>
            <button className="text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors">
              Ver todas
            </button>
          </div>
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-md transition-colors"
              >
                <div
                  className={clsx(
                    "w-10 h-10 rounded-md flex items-center justify-center shrink-0",
                    tx.type === "sale"
                      ? "bg-success-50 text-success-600"
                      : tx.type === "income"
                        ? "bg-info-50 text-info-600"
                        : "bg-warning-50 text-warning-600",
                  )}
                >
                  <tx.icon size={16} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">
                    {tx.title}
                  </div>
                  <div className="text-xs text-gray-500">{tx.time}</div>
                </div>
                <div
                  className={clsx(
                    "font-bold text-sm font-mono",
                    tx.amount.startsWith("+")
                      ? "text-success-600"
                      : "text-danger-600",
                  )}
                >
                  {tx.amount}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Alertas del Sistema
            </h3>
            <button className="text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors">
              Descartar todas
            </button>
          </div>
          <div className="space-y-4">
            {alerts.map((alert, index) => (
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
                <button className="px-3 py-1 bg-white border border-current rounded text-xs font-semibold hover:bg-current hover:text-white transition-colors">
                  {alert.type === "warning"
                    ? "Revisar"
                    : alert.type === "info"
                      ? "Descargar"
                      : "Ver"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
