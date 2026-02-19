import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Users,
  TrendingUp,
  UserCheck,
  Star,
  Download,
  Edit3,
  History,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Mail,
  ShoppingBag,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import { customerService } from "../services/customerService";

const TIPOS_MAP = {
  REGULAR: "Regular",
  FRECUENTE: "Frecuente",
  MAYORISTA: "Mayorista",
};

const initialForm = {
  nombre: "",
  apellido: "",
  cedula: "",
  telefono: "",
  email: "",
  tipo: "REGULAR",
  descuento: 0,
};

export default function Clientes() {
  // Data state
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({
    totalClientes: 0,
    ventasMes: 0,
    clientesActivos: 0,
    conDescuento: 0,
  });
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Form state
  const [form, setForm] = useState(initialForm);

  // History state
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterTipo) params.tipo = filterTipo;

      const res = await customerService.getAll(params);
      setClients(res.data);
      setMeta(res.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, filterTipo]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await customerService.getStats();
      setStats(res);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterTipo]);

  const handleOpenEdit = (client) => {
    setSelectedClient(client);
    setForm({
      nombre: client.nombre,
      apellido: client.apellido,
      cedula: client.cedula,
      telefono: client.telefono,
      email: client.email || "",
      tipo: client.tipo,
      descuento: parseFloat(client.descuento) || 0,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedClient(null);
    setForm(initialForm);
    setError("");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.telefono.trim()) {
      setError("Nombre y teléfono son obligatorios");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (selectedClient) {
        await customerService.update(selectedClient.id, form);
      } else {
        await customerService.create(form);
      }
      setIsModalOpen(false);
      fetchClients();
      fetchStats();
    } catch (err) {
      setError(err.message || "Error al guardar cliente");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    try {
      await customerService.delete(selectedClient.id);
      setIsDeleteModalOpen(false);
      setSelectedClient(null);
      fetchClients();
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenHistory = async (client) => {
    setSelectedClient(client);
    setHistoryLoading(true);
    setHistoryData(null);
    setIsHistoryModalOpen(true);

    try {
      const res = await customerService.getHistory(client.id, {
        page: 1,
        limit: 10,
      });
      setHistoryData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (val) => {
    return `Bs. ${parseFloat(val || 0).toLocaleString("es-BO", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Clientes
          </h1>
          <p className="text-gray-500 mt-1">
            Gestión de clientes y precios especiales
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all w-full sm:w-64"
            />
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30 active:translate-y-0.5"
          >
            <Plus size={20} /> Nuevo Cliente
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">
              Total Clientes
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalClientes}
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-lg bg-success-50 text-success-600 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">
              Ventas del Mes
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.ventasMes)}
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-lg bg-info-50 text-info-600 flex items-center justify-center">
            <UserCheck size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">
              Clientes Activos
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.clientesActivos}
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-lg bg-warning-50 text-warning-600 flex items-center justify-center">
            <Star size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">
              Con Descuento
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.conDescuento}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:border-primary-500"
          >
            <option value="">Todos los tipos</option>
            <option value="FRECUENTE">Frecuente</option>
            <option value="MAYORISTA">Mayorista</option>
            <option value="REGULAR">Regular</option>
          </select>
        </div>
        <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
          <Download size={16} /> Exportar
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Teléfono</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Compras</th>
                <th className="px-6 py-4">Total Gastado</th>
                <th className="px-6 py-4">Descuento</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2
                      size={24}
                      className="animate-spin mx-auto text-primary-500"
                    />
                    <p className="text-gray-400 mt-2 text-sm">
                      Cargando clientes...
                    </p>
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Users size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">
                      No se encontraron clientes
                    </p>
                  </td>
                </tr>
              ) : (
                clients.map((client) => {
                  const discount = parseFloat(client.descuento) || 0;
                  const tipoLabel = TIPOS_MAP[client.tipo] || client.tipo;
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">
                          {client.nombre} {client.apellido}
                        </div>
                        <div className="text-xs text-gray-500">
                          {client.cedula &&
                            !client.cedula.startsWith("AUTO-") &&
                            `CI: ${client.cedula}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono">
                        {client.telefono}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={clsx(
                            "px-2 py-1 rounded text-xs font-semibold",
                            client.tipo === "MAYORISTA"
                              ? "bg-purple-100 text-purple-700"
                              : client.tipo === "FRECUENTE"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700",
                          )}
                        >
                          {tipoLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {client._count?.ventas || 0}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {formatCurrency(client.totalCompras)}
                      </td>
                      <td className="px-6 py-4">
                        {discount > 0 ? (
                          <span className="flex items-center gap-1 text-success-600 font-bold text-xs bg-success-50 px-2 py-1 rounded w-fit">
                            <Star size={12} fill="currentColor" /> {discount}%
                            desc.
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleOpenHistory(client)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-info-600"
                            title="Ver Historial"
                          >
                            <History size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(client)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-primary-600"
                            title="Editar"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-danger-600"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={clsx(
                "px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold flex items-center gap-2",
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-50",
              )}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
              let pageNum;
              if (meta.totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= meta.totalPages - 2) {
                pageNum = meta.totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={clsx(
                    "w-10 h-10 rounded-lg font-bold",
                    pageNum === currentPage
                      ? "bg-primary-600 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50",
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              disabled={currentPage === meta.totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(meta.totalPages, p + 1))
              }
              className={clsx(
                "px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold flex items-center gap-2",
                currentPage === meta.totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-50",
              )}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedClient ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-8">
              {error && (
                <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Personal Info */}
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={(e) =>
                        setForm({ ...form, nombre: e.target.value })
                      }
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={form.apellido}
                      onChange={(e) =>
                        setForm({ ...form, apellido: e.target.value })
                      }
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      CI/NIT
                    </label>
                    <input
                      type="text"
                      value={form.cedula}
                      onChange={(e) =>
                        setForm({ ...form, cedula: e.target.value })
                      }
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={form.telefono}
                      onChange={(e) =>
                        setForm({ ...form, telefono: e.target.value })
                      }
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Commercial Config */}
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                  Configuración Comercial
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Tipo de Cliente
                    </label>
                    <select
                      value={form.tipo}
                      onChange={(e) =>
                        setForm({ ...form, tipo: e.target.value })
                      }
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    >
                      <option value="REGULAR">Regular</option>
                      <option value="FRECUENTE">Frecuente</option>
                      <option value="MAYORISTA">Mayorista</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Descuento General (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.descuento}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          descuento: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 flex items-center gap-2 disabled:opacity-70"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} /> Guardar Cliente
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsHistoryModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0 bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Historial de {selectedClient.nombre} {selectedClient.apellido}
                </h2>
                <span className="text-sm font-semibold text-gray-500">
                  {TIPOS_MAP[selectedClient.tipo] || selectedClient.tipo}
                </span>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-8">
              {historyLoading ? (
                <div className="py-12 text-center">
                  <Loader2
                    size={32}
                    className="animate-spin mx-auto text-primary-500"
                  />
                  <p className="text-gray-400 mt-2">Cargando historial...</p>
                </div>
              ) : historyData ? (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 text-center">
                      <div className="text-2xl font-bold text-primary-700">
                        {historyData.stats.totalCompras}
                      </div>
                      <div className="text-xs font-bold text-primary-400 uppercase tracking-wide">
                        Compras
                      </div>
                    </div>
                    <div className="bg-success-50 p-4 rounded-xl border border-success-100 text-center">
                      <div className="text-2xl font-bold text-success-700">
                        {formatCurrency(historyData.stats.totalGastado)}
                      </div>
                      <div className="text-xs font-bold text-success-400 uppercase tracking-wide">
                        Total Gastado
                      </div>
                    </div>
                    <div className="bg-info-50 p-4 rounded-xl border border-info-100 text-center">
                      <div className="text-2xl font-bold text-info-700">
                        {formatCurrency(historyData.stats.ticketPromedio)}
                      </div>
                      <div className="text-xs font-bold text-info-400 uppercase tracking-wide">
                        Ticket Promedio
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                      <div className="text-xl font-bold text-gray-700">
                        {formatDate(historyData.stats.ultimaCompra)}
                      </div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                        Última Compra
                      </div>
                    </div>
                  </div>

                  {/* History Table */}
                  <section>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <History size={18} className="text-gray-400" /> Últimas
                      Compras
                    </h3>
                    {historyData.ventas.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        <ShoppingBag
                          size={32}
                          className="mx-auto text-gray-300 mb-2"
                        />
                        <p className="text-sm text-gray-500">
                          Este cliente no tiene compras registradas
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs">
                            <tr>
                              <th className="px-4 py-3">Fecha</th>
                              <th className="px-4 py-3"># Venta</th>
                              <th className="px-4 py-3">Total</th>
                              <th className="px-4 py-3">Método</th>
                              <th className="px-4 py-3 text-right">Items</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {historyData.ventas.map((venta) => (
                              <tr
                                key={venta.id}
                                className="hover:bg-gray-50/50"
                              >
                                <td className="px-4 py-3 text-gray-600">
                                  {formatDate(venta.fecha)}
                                </td>
                                <td className="px-4 py-3 font-mono text-gray-500">
                                  {venta.numeroVenta}
                                </td>
                                <td className="px-4 py-3 font-bold text-gray-900">
                                  {formatCurrency(venta.total)}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                    {venta.metodoPago === "EFECTIVO"
                                      ? "Efectivo"
                                      : "QR"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-600">
                                  {venta.itemsCount}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Error al cargar el historial
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsDeleteModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-danger-50 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-danger-500" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">
                ¿Eliminar cliente?
              </h3>
              <p className="text-gray-500 text-sm">
                Se eliminará a{" "}
                <strong>
                  {selectedClient.nombre} {selectedClient.apellido}
                </strong>
                . Esta acción se puede revertir.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 bg-danger-600 text-white font-bold rounded-lg hover:bg-danger-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
