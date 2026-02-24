import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Monitor,
  CircleDollarSign,
  TrendingUp,
  Clock,
  Eye,
  Lock,
  Unlock,
  User,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import clsx from "clsx";
import { cashRegisterService } from "../services/cashRegisterService";

export default function AperturaCaja() {
  const navigate = useNavigate();
  const [cajas, setCajas] = useState([]);
  const [stats, setStats] = useState({
    abiertas: 0,
    cerradas: 0,
    totalEnCaja: 0,
    ventasHoy: 0,
  });
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Modals
  const [modalOpen, setModalOpen] = useState(null); // 'abrir', 'cerrar', 'detalle'
  const [selectedCaja, setSelectedCaja] = useState(null);
  const [montoInicial, setMontoInicial] = useState("");
  const [montoFinal, setMontoFinal] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCajas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await cashRegisterService.getAll();
      setCajas(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await cashRegisterService.getStats();
      setStats(res);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchMovimientos = useCallback(async () => {
    try {
      const res = await cashRegisterService.getRecentMovements();
      setMovimientos(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchCajas();
    fetchStats();
    fetchMovimientos();
  }, [fetchCajas, fetchStats, fetchMovimientos]);

  const closeModal = () => {
    setModalOpen(null);
    setSelectedCaja(null);
    setMontoInicial("");
    setMontoFinal("");
    setObservaciones("");
    setError("");
    setDetailData(null);
  };

  const handleOpenModal = async (type, caja) => {
    setSelectedCaja(caja);
    setError("");

    if (type === "detalle") {
      setModalOpen("detalle");
      setDetailLoading(true);
      try {
        const res = await cashRegisterService.getDetail(caja.id);
        setDetailData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setDetailLoading(false);
      }
    } else {
      setModalOpen(type);
    }
  };

  const handleAbrirCaja = async () => {
    if (!montoInicial || parseFloat(montoInicial) < 0) {
      setError("Ingrese un monto inicial válido");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await cashRegisterService.open({
        montoInicial: parseFloat(montoInicial),
      });
      closeModal();
      fetchCajas();
      fetchStats();
      navigate("/pos");
    } catch (err) {
      setError(err.message || "Error al abrir caja");
    } finally {
      setSaving(false);
    }
  };

  const handleCerrarCaja = async () => {
    if (!montoFinal || parseFloat(montoFinal) < 0) {
      setError("Ingrese el monto en caja física");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await cashRegisterService.close(selectedCaja.id, {
        montoFinal: parseFloat(montoFinal),
        observaciones,
      });
      closeModal();
      fetchCajas();
      fetchStats();
      fetchMovimientos();
    } catch (err) {
      setError(err.message || "Error al cerrar caja");
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleTimeString("es-BO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const now = new Date().toLocaleDateString("es-BO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const tipoColors = {
    VENTA: "bg-success-100 text-success-700",
    INGRESO_EXTRA: "bg-info-100 text-info-700",
    RETIRO: "bg-warning-100 text-warning-700",
    GASTO: "bg-primary-100 text-primary-700",
  };

  const tipoLabels = {
    VENTA: "Venta",
    INGRESO_EXTRA: "Ingreso",
    RETIRO: "Retiro",
    GASTO: "Gasto",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Apertura de Caja
          </h1>
          <p className="text-gray-500 mt-1">Gestión de cajas registradoras</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 shadow-sm">
          <Clock size={18} className="text-primary-500" />
          <span>{now}</span>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-lg bg-success-50 text-success-600 flex items-center justify-center">
            <Monitor size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">
              Cajas Abiertas
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.abiertas}
            </div>
            <div className="text-xs font-semibold text-success-600">
              En operación
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-lg bg-warning-50 text-warning-600 flex items-center justify-center">
            <Lock size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">
              Cajas Cerradas
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.cerradas}
            </div>
            <div className="text-xs font-semibold text-gray-500">Hoy</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
            <CircleDollarSign size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">
              Total en Caja
            </div>
            <div className="text-2xl font-bold text-gray-900">
              Bs.{" "}
              {stats.totalEnCaja.toLocaleString("es-BO", {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="text-xs font-semibold text-success-600 flex items-center gap-1">
              <TrendingUp size={12} /> Saldo actual
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-lg bg-info-50 text-info-600 flex items-center justify-center">
            <Monitor size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Ventas Hoy</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.ventasHoy}
            </div>
            <div className="text-xs font-semibold text-success-600">
              Transacciones
            </div>
          </div>
        </div>
      </div>

      {/* Cajas Grid */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Cajas Registradoras
          </h2>
          <p className="text-gray-500 text-sm">
            Seleccione una caja para abrir o ver su estado
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <Loader2
              size={32}
              className="animate-spin mx-auto text-primary-500"
            />
            <p className="text-gray-400 mt-2">Cargando cajas...</p>
          </div>
        ) : cajas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Monitor size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No hay cajas abiertas hoy</p>
            <button
              onClick={() => {
                setModalOpen("abrir");
                setSelectedCaja(null);
              }}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 inline-flex items-center gap-2"
            >
              <Unlock size={16} /> Abrir Caja
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {cajas.map((caja) => (
              <div
                key={caja.cajeroId}
                className={clsx(
                  "bg-white rounded-xl border transition-all duration-300 overflow-hidden group hover:shadow-lg",
                  caja.estado === "ABIERTA"
                    ? "border-success-200 hover:border-success-400"
                    : "border-gray-200 hover:border-gray-400 opacity-90 hover:opacity-100",
                )}
              >
                <div
                  className={clsx(
                    "p-4 border-b flex justify-between items-center",
                    caja.estado === "ABIERTA"
                      ? "bg-success-50/50 border-success-100"
                      : "bg-gray-50 border-gray-100",
                  )}
                >
                  <div
                    className={clsx(
                      "flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                      caja.estado === "ABIERTA"
                        ? "bg-success-100 text-success-700"
                        : "bg-gray-200 text-gray-600",
                    )}
                  >
                    <span
                      className={clsx(
                        "w-2 h-2 rounded-full",
                        caja.estado === "ABIERTA"
                          ? "bg-success-500"
                          : "bg-gray-500",
                      )}
                    ></span>
                    {caja.estado}
                  </div>
                  <div className="font-bold text-gray-700">{caja.cajero}</div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium text-xs uppercase tracking-wider flex items-center gap-1">
                        <User size={12} /> Cajero
                      </span>
                      <span className="font-semibold text-gray-900">
                        {caja.cajero}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium text-xs uppercase tracking-wider flex items-center gap-1">
                        <Clock size={12} />{" "}
                        {caja.estado === "ABIERTA" ? "Apertura" : "Cierre"}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {caja.estado === "ABIERTA"
                          ? formatTime(caja.fechaApertura)
                          : formatDate(caja.fechaCierre)}
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100"></div>

                  <div className="flex justify-between items-end">
                    <span className="text-sm font-semibold text-gray-500">
                      {caja.estado === "ABIERTA"
                        ? "Saldo Actual"
                        : "Monto Final"}
                    </span>
                    <span
                      className={clsx(
                        "text-2xl font-bold font-mono tracking-tight",
                        caja.estado === "ABIERTA"
                          ? "text-gray-900"
                          : "text-gray-400",
                      )}
                    >
                      Bs.{" "}
                      {caja.estado === "ABIERTA"
                        ? caja.saldo.toLocaleString("es-BO", {
                            minimumFractionDigits: 2,
                          })
                        : (caja.montoFinal || 0).toLocaleString("es-BO", {
                            minimumFractionDigits: 2,
                          })}
                    </span>
                  </div>

                  {caja.estado === "ABIERTA" && (
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg text-center">
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {caja.ventas}
                        </div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">
                          Ventas
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {caja.ingresos}
                        </div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">
                          Ingresos
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {caja.retiros}
                        </div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">
                          Retiros
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                  {caja.estado === "ABIERTA" ? (
                    <>
                      <button
                        onClick={() => handleOpenModal("detalle", caja)}
                        className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye size={16} /> Ver Detalle
                      </button>
                      <button
                        onClick={() => handleOpenModal("cerrar", caja)}
                        className="flex-1 py-2 bg-white border border-primary-200 rounded-lg text-sm font-bold text-primary-600 hover:bg-primary-50 hover:border-primary-500 transition-colors flex items-center justify-center gap-2"
                      >
                        <Lock size={16} /> Cerrar Caja
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleOpenModal("abrir", caja)}
                      className="w-full py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
                    >
                      <Unlock size={16} /> Abrir Caja
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Movements Table */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">
            Movimientos Recientes
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Hora</th>
                <th className="px-6 py-4">Caja</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4">Monto</th>
                <th className="px-6 py-4">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movimientos.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    No hay movimientos hoy
                  </td>
                </tr>
              ) : (
                movimientos.map((mov) => {
                  const isPositive =
                    mov.tipo === "VENTA" || mov.tipo === "INGRESO_EXTRA";
                  return (
                    <tr
                      key={mov.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-gray-600 font-medium">
                        {mov.hora}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">
                        {mov.caja}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={clsx(
                            "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                            tipoColors[mov.tipo] || "bg-gray-100 text-gray-700",
                          )}
                        >
                          {tipoLabels[mov.tipo] || mov.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {mov.desc || "-"}
                      </td>
                      <td
                        className={clsx(
                          "px-6 py-4 font-bold font-mono",
                          isPositive ? "text-success-600" : "text-primary-600",
                        )}
                      >
                        {isPositive ? "+" : "-"}Bs.{" "}
                        {Math.abs(mov.monto).toLocaleString("es-BO", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold">
                            {mov.usuario.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-700">
                            {mov.usuario}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Abrir Caja Modal */}
      {modalOpen === "abrir" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold mb-4">Abrir Caja</h2>
            <div className="bg-info-50 p-4 rounded-lg flex gap-3 text-info-700 mb-4">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm">
                Ingrese el monto inicial para abrir la caja.
              </p>
            </div>

            {error && (
              <div className="bg-primary-50 border border-primary-200 text-primary-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Monto Inicial (Bs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-3 border border-gray-300 rounded font-bold font-mono focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAbrirCaja}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Unlock size={16} />
                  )}{" "}
                  Abrir Caja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cerrar Caja Modal */}
      {modalOpen === "cerrar" && selectedCaja && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold mb-4">
              Cerrar Caja de {selectedCaja.cajero}
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                Resumen
              </h3>
              <div className="flex justify-between text-sm mb-1 text-gray-600">
                <span>Apertura</span>
                <span className="font-mono font-semibold">
                  Bs.{" "}
                  {selectedCaja.montoInicial.toLocaleString("es-BO", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm mb-1 text-success-600">
                <span>Ventas ({selectedCaja.ventas})</span>
                <span className="font-mono font-bold">+ Movimientos</span>
              </div>
              <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold text-gray-900">
                <span>Saldo Calculado</span>
                <span className="font-mono">
                  Bs.{" "}
                  {selectedCaja.saldo.toLocaleString("es-BO", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {error && (
              <div className="bg-primary-50 border border-primary-200 text-primary-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Monto en Caja Física (Bs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={montoFinal}
                  onChange={(e) => setMontoFinal(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-3 border border-gray-300 rounded font-bold font-mono focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Observaciones (opcional)
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={2}
                  className="w-full p-3 border border-gray-300 rounded text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none resize-none"
                  placeholder="Notas sobre el cierre..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCerrarCaja}
                disabled={saving}
                className="flex-1 py-2.5 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Lock size={16} />
                )}{" "}
                Cerrar Caja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {modalOpen === "detalle" && selectedCaja && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                Detalle — Caja de {selectedCaja.cajero}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {detailLoading ? (
                <div className="text-center py-8">
                  <Loader2
                    size={32}
                    className="animate-spin mx-auto text-primary-500"
                  />
                  <p className="text-gray-400 mt-2">Cargando detalle...</p>
                </div>
              ) : detailData ? (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        Cajero
                      </p>
                      <p className="text-sm font-bold text-gray-900 mt-1">
                        {detailData.usuario.nombre}{" "}
                        {detailData.usuario.apellido}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        Apertura
                      </p>
                      <p className="text-sm font-bold text-gray-900 mt-1">
                        {formatDate(detailData.fechaApertura)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        Monto Inicial
                      </p>
                      <p className="text-lg font-bold text-gray-900 font-mono mt-1">
                        Bs.{" "}
                        {parseFloat(detailData.montoInicial).toLocaleString(
                          "es-BO",
                          {
                            minimumFractionDigits: 2,
                          },
                        )}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        Saldo Actual
                      </p>
                      <p className="text-lg font-bold text-success-600 font-mono mt-1">
                        Bs.{" "}
                        {selectedCaja.saldo.toLocaleString("es-BO", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Movimientos */}
                  <div>
                    <h3 className="font-bold text-gray-800 mb-3">
                      Movimientos ({detailData.movimientos.length})
                    </h3>
                    {detailData.movimientos.length === 0 ? (
                      <p className="text-center text-gray-400 py-4">
                        Sin movimientos
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {detailData.movimientos.map((m) => {
                          const isPos =
                            m.tipo === "VENTA" || m.tipo === "INGRESO_EXTRA";
                          return (
                            <div
                              key={m.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={clsx(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                    tipoColors[m.tipo] ||
                                      "bg-gray-100 text-gray-600",
                                  )}
                                >
                                  {tipoLabels[m.tipo] || m.tipo}
                                </span>
                                <span className="text-sm text-gray-700">
                                  {m.concepto}
                                </span>
                              </div>
                              <span
                                className={clsx(
                                  "font-bold font-mono text-sm",
                                  isPos
                                    ? "text-success-600"
                                    : "text-primary-600",
                                )}
                              >
                                {isPos ? "+" : "-"}Bs.{" "}
                                {parseFloat(m.monto).toLocaleString("es-BO", {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-center">
                  No se pudo cargar el detalle
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
