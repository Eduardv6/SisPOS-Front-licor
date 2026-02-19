import { useState } from "react";
import {
  Building2,
  Database,
  CloudUpload,
  Download,
  Save,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  RotateCcw,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import clsx from "clsx";

// Mock Data for Backup History
const BACKUP_HISTORY = [
  {
    id: 1,
    date: "03/02/2026 03:00",
    name: "backup_auto_20260203.json",
    size: "2.4 MB",
    type: "Automático",
  },
  {
    id: 2,
    date: "02/02/2026 18:45",
    name: "backup_manual_20260202.json",
    size: "2.3 MB",
    type: "Manual",
  },
  {
    id: 3,
    date: "02/02/2026 03:00",
    name: "backup_auto_20260202.json",
    size: "2.3 MB",
    type: "Automático",
  },
  {
    id: 4,
    date: "01/02/2026 03:00",
    name: "backup_auto_20260201.json",
    size: "2.2 MB",
    type: "Automático",
  },
];

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState("negocio"); // negocio, backup

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Configuración
        </h1>
        <p className="text-gray-500 mt-1">
          Ajustes generales del sistema y datos del negocio
        </p>
      </header>

      {/* Tabs */}
      <div className="flex bg-gray-100/50 p-1.5 rounded-xl w-fit border border-gray-200">
        <button
          onClick={() => setActiveTab("negocio")}
          className={clsx(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all",
            activeTab === "negocio"
              ? "bg-white text-primary-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50",
          )}
        >
          <Building2 size={18} /> Datos del Negocio
        </button>
        <button
          onClick={() => setActiveTab("backup")}
          className={clsx(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all",
            activeTab === "backup"
              ? "bg-white text-primary-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50",
          )}
        >
          <Database size={18} /> Backup de Datos
        </button>
      </div>

      {/* Section: Negocio */}
      {activeTab === "negocio" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">
              Información General
            </h3>
            <p className="text-gray-500 text-sm">
              Estos datos aparecerán en los recibos y reportes.
            </p>
          </div>

          <div className="p-8">
            <form className="space-y-6 max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Logo Upload */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Logotipo
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group h-64 relative overflow-hidden">
                    <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-gray-100 group-hover:bg-gray-200/50 transition-colors">
                      {/* Placeholder Logo */}
                      <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg flex items-center justify-center text-white">
                        <Building2 size={40} />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1">
                        <ImageIcon size={12} /> Cambiar
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    PNG, JPG o SVG (Max. 2MB)
                  </p>
                </div>

                {/* Form Fields */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      defaultValue="InventiBar"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      NIT / RUC *
                    </label>
                    <input
                      type="text"
                      defaultValue="123456789"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      defaultValue="+591 2 2123456"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Dirección Principal *
                    </label>
                    <input
                      type="text"
                      defaultValue="Av. Principal #123, Zona Central"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Email de Contacto
                    </label>
                    <input
                      type="email"
                      defaultValue="contacto@inventibar.com"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Mensaje en Recibos
                    </label>
                    <textarea
                      rows="2"
                      defaultValue="¡Gracias por su preferencia!"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    ></textarea>
                    <p className="text-xs text-gray-400 mt-1">
                      Este mensaje aparecerá al final de los tickets de venta.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  className="px-5 py-2.5 font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <RotateCcw size={18} /> Restaurar
                </button>
                <button
                  type="button"
                  className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 flex items-center gap-2"
                >
                  <Save size={18} /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section: Backup */}
      {activeTab === "backup" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Create Backup */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-fit">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">
                Generar Copia de Seguridad
              </h3>
              <p className="text-gray-500 text-sm">
                Crea un archivo de respaldo con toda la información.
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-success-50 border border-success-100 rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-success-100 text-success-600 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div className="text-sm font-bold text-success-800 uppercase tracking-wide">
                    Último respaldo automático
                  </div>
                  <div className="text-gray-700 font-medium">Hoy, 03:00 AM</div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-4 text-center">
                  El archivo se descargará en formato .JSON comprimido.
                </p>
                <button className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 active:translate-y-0.5">
                  <Download size={20} /> Descargar Copia Manual
                </button>
              </div>
            </div>
          </div>

          {/* Restore Backup */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-fit">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">
                Restaurar Datos
              </h3>
              <p className="text-danger-600 font-semibold text-sm flex items-center gap-1">
                <AlertTriangle size={14} /> Esta acción reemplazará la base de
                datos actual.
              </p>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                  <CloudUpload size={32} />
                </div>
                <p className="font-medium text-gray-900">
                  Arrastra tu archivo aquí
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  o haz clic para seleccionar
                </p>
                <span className="text-xs text-gray-400 mt-4 bg-gray-100 px-2 py-1 rounded inline-block">
                  .JSON, .ZIP
                </span>
              </div>
            </div>
          </div>

          {/* Backup History */}
          <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">
                Historial de Respaldos
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3">Fecha y Hora</th>
                    <th className="px-6 py-3">Nombre de Archivo</th>
                    <th className="px-6 py-3">Tamaño</th>
                    <th className="px-6 py-3">Tipo</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {BACKUP_HISTORY.map((backup) => (
                    <tr
                      key={backup.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-gray-600">
                        {backup.date}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                        <FileJson size={16} className="text-primary-500" />{" "}
                        {backup.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{backup.size}</td>
                      <td className="px-6 py-4">
                        <span
                          className={clsx(
                            "px-2 py-1 rounded-md text-xs font-bold uppercase",
                            backup.type === "Automático"
                              ? "bg-info-50 text-info-700 border border-info-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200",
                          )}
                        >
                          {backup.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary-600 hover:text-primary-700 font-bold text-xs flex items-center gap-1 justify-end ml-auto hover:underline">
                          <Download size={14} /> Descargar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
