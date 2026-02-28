import { useState, useEffect } from "react";
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
import { settingService } from "../services/settingService";
import { backupService } from "../services/backupService";
import { useToast } from "../context/ToastContext";

// El historial se manejará por estado local para la sesión actual
// Para persistencia real, se requeriría una tabla 'Backups' en la DB

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState("negocio"); // negocio, backup
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    empresa_nombre: "InventiBar",
    empresa_nit: "123456789",
    empresa_telefono: "+591 2 2123456",
    empresa_direccion: "Av. Principal #123, Zona Central",
    empresa_email: "contacto@inventibar.com",
    empresa_mensaje_recibo: "¡Gracias por su preferencia!",
  });
  const [originalSettings, setOriginalSettings] = useState({});
  const [backups, setBackups] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchSettings();
    fetchBackupHistory();
  }, []);

  const fetchBackupHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await backupService.getHistory();
      setBackups(data);
    } catch (error) {
      console.error("Error fetching backup history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingService.getSettings();
      if (Object.keys(data).length > 0) {
        setSettings((prev) => ({ ...prev, ...data }));
        setOriginalSettings(data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Error al cargar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await settingService.updateSettings(settings);
      toast.success("Configuración guardada correctamente");
      setOriginalSettings(settings);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Error al guardar la configuración");
    }
  };

  const handleReset = () => {
    setSettings((prev) => ({ ...prev, ...originalSettings }));
    setLogoPreview(null);
    toast.info("Cambios restaurados");
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload inmediato
    try {
      setUploadingLogo(true);
      const response = await settingService.uploadLogo(file);
      if (response.success) {
        toast.success("Logotipo actualizado");
        setSettings((prev) => ({ ...prev, empresa_logo: response.logoUrl }));
        setOriginalSettings((prev) => ({
          ...prev,
          empresa_logo: response.logoUrl,
        }));
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Error al subir el logotipo");
      setLogoPreview(null); // Revertir previa
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await backupService.exportData();
      const content = JSON.stringify(response, null, 2);
      const blob = new Blob([content], { type: "application/json" });
      const filename = `backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Respaldo descargado correctamente");
      // Refrescar el historial desde la DB
      fetchBackupHistory();
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Error al generar el respaldo");
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (
      !window.confirm(
        "¿Estás seguro de que deseas restaurar los datos? Esta acción reemplazará toda la información actual y no se puede deshacer.",
      )
    ) {
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        await backupService.importData(jsonData);
        toast.success("Base de datos restaurada con éxito");
        // Recargar la página para reflejar los cambios globales si es necesario,
        // o al menos refrescar los settings actuales.
        fetchSettings();
      } catch (error) {
        console.error("Import Error:", error);
        toast.error(
          "Error al restaurar los datos: " +
            (error.response?.data?.message || "Archivo inválido"),
        );
      } finally {
        e.target.value = null;
      }
    };
    reader.readAsText(file);
  };

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
            <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Logo Upload */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Logotipo
                  </label>
                  <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group h-64 relative overflow-hidden">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                    <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-gray-100 group-hover:bg-gray-200/50 transition-colors">
                      {uploadingLogo ? (
                        <RefreshCcw
                          className="animate-spin text-primary-500"
                          size={40}
                        />
                      ) : logoPreview || settings.empresa_logo ? (
                        <img
                          src={
                            logoPreview ||
                            (settings.empresa_logo?.startsWith("http")
                              ? settings.empresa_logo
                              : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${settings.empresa_logo}`)
                          }
                          alt="Logo Preview"
                          className="max-w-full max-h-full object-contain p-4"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg flex items-center justify-center text-white text-center flex-col gap-2">
                          <Building2 size={40} />
                          <span className="text-[10px] font-bold">
                            SIN LOGO
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1">
                        <ImageIcon size={12} />{" "}
                        {settings.empresa_logo || logoPreview
                          ? "Cambiar"
                          : "Subir"}
                      </span>
                    </div>
                  </label>
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
                      name="empresa_nombre"
                      value={settings.empresa_nombre}
                      onChange={handleChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      NIT / RUC *
                    </label>
                    <input
                      type="text"
                      name="empresa_nit"
                      value={settings.empresa_nit}
                      onChange={handleChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="empresa_telefono"
                      value={settings.empresa_telefono}
                      onChange={handleChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Dirección Principal *
                    </label>
                    <input
                      type="text"
                      name="empresa_direccion"
                      value={settings.empresa_direccion}
                      onChange={handleChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Email de Contacto
                    </label>
                    <input
                      type="email"
                      name="empresa_email"
                      value={settings.empresa_email}
                      onChange={handleChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Mensaje en Recibos
                    </label>
                    <textarea
                      rows="2"
                      name="empresa_mensaje_recibo"
                      value={settings.empresa_mensaje_recibo}
                      onChange={handleChange}
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
                  onClick={handleReset}
                  className="px-5 py-2.5 font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <RotateCcw size={18} /> Restaurar
                </button>
                <button
                  type="submit"
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
                  <div className="text-gray-700 font-medium">
                    {backups.find((b) => b.tipo === "Automático")
                      ? new Date(
                          backups.find((b) => b.tipo === "Automático").fecha,
                        ).toLocaleString()
                      : "Nunca"}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-4 text-center">
                  El archivo se descargará en formato .JSON comprimido.
                </p>
                <button
                  onClick={handleExport}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 active:translate-y-0.5"
                >
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
              <p className="text-primary-600 font-semibold text-sm flex items-center gap-1">
                <AlertTriangle size={14} /> Esta acción reemplazará la base de
                datos actual.
              </p>
            </div>
            <div className="p-6">
              <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
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
                  .JSON
                </span>
              </label>
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
                  {backups.length > 0 ? (
                    backups.map((backup) => (
                      <tr
                        key={backup.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-gray-600">
                          {new Date(backup.fecha).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                          <FileJson size={16} className="text-primary-500" />{" "}
                          {backup.nombre}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {backup.tamano}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={clsx(
                              "px-2 py-1 rounded-md text-xs font-bold uppercase",
                              backup.tipo === "Automático"
                                ? "bg-info-50 text-info-700 border border-info-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200",
                            )}
                          >
                            {backup.tipo}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={handleExport}
                            className="text-primary-600 hover:text-primary-700 font-bold text-xs flex items-center gap-1 justify-end ml-auto hover:underline"
                          >
                            <Download size={14} /> Nueva Copia
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-8 text-center text-gray-400 italic"
                      >
                        {historyLoading
                          ? "Cargando historial..."
                          : "No hay respaldos generados todavía."}
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
