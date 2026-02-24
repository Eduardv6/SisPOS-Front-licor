import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Users,
  UserCheck,
  UserX,
  Edit3,
  Trash2,
  ShieldCheck,
  Phone,
  Mail,
  X,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import clsx from "clsx";
import { userService } from "../services/userService";

const initialForm = {
  username: "",
  email: "",
  password: "",
  nombre: "",
  apellido: "",
  cedula: "",
  telefono: "",
  rol: "CAJERO",
  activo: true,
};

export default function Usuarios() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    cajeros: 0,
    activos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form
  const [form, setForm] = useState(initialForm);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await userService.getAll(params);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await userService.getStats();
      setStats(res);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleCreateNew = () => {
    setSelectedUser(null);
    setForm(initialForm);
    setError("");
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setForm({
      username: user.username,
      email: user.email,
      password: "",
      nombre: user.nombre,
      apellido: user.apellido,
      cedula: user.cedula,
      telefono: user.telefono || "",
      rol: user.rol,
      activo: user.activo,
    });
    setError("");
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    // Validations
    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError("Nombre y apellido son obligatorios");
      return;
    }
    if (!form.username.trim()) {
      setError("El nombre de usuario es obligatorio");
      return;
    }
    if (!form.email.trim()) {
      setError("El email es obligatorio");
      return;
    }
    if (!form.cedula.trim()) {
      setError("La cédula es obligatoria");
      return;
    }
    if (!selectedUser && !form.password) {
      setError("La contraseña es obligatoria para nuevos usuarios");
      return;
    }
    if (form.password && form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = { ...form };
      // Don't send empty password on edit
      if (selectedUser && !payload.password) {
        delete payload.password;
      }

      if (selectedUser) {
        await userService.update(selectedUser.id, payload);
      } else {
        await userService.create(payload);
      }
      setIsModalOpen(false);
      fetchUsers();
      fetchStats();
    } catch (err) {
      setError(err.message || "Error al guardar usuario");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await userService.delete(selectedUser.id);
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Usuarios
          </h1>
          <p className="text-gray-500 mt-1">Gestión de usuarios y permisos</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all w-full sm:w-64"
            />
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30 active:translate-y-0.5"
          >
            <Plus size={20} /> Nuevo Usuario
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Total
            </div>
            <div className="text-xl font-black text-gray-900 leading-tight">
              {stats.total}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
            <Users size={18} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Admin
            </div>
            <div className="text-xl font-black text-gray-900 leading-tight">
              {stats.admins}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldCheck size={18} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Cajeros
            </div>
            <div className="text-xl font-black text-gray-900 leading-tight">
              {stats.cajeros}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <Users size={18} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Activos
            </div>
            <div className="text-xl font-black text-gray-900 leading-tight">
              {stats.activos}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-success-50 text-success-600 flex items-center justify-center">
            <UserCheck size={18} />
          </div>
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2
            size={32}
            className="animate-spin mx-auto text-primary-500"
          />
          <p className="text-gray-400 mt-2">Cargando usuarios...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No se encontraron usuarios</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all group relative flex flex-col"
            >
              <div className="p-4 flex items-center gap-4 border-b border-gray-100 bg-gray-50/30">
                <div
                  className={clsx(
                    "w-12 h-12 rounded-full flex items-center justify-center text-xl font-black shrink-0 shadow-sm",
                    user.rol === "ADMINISTRADOR"
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-teal-100 text-teal-600",
                  )}
                >
                  {user.nombre.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-gray-900 truncate">
                    {user.nombre} {user.apellido}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-mono truncate">
                    @{user.username}
                  </p>
                  <span
                    className={clsx(
                      "inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mt-1",
                      user.rol === "ADMINISTRADOR"
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-teal-50 text-teal-700",
                    )}
                  >
                    {user.rol === "ADMINISTRADOR" ? "ADMIN" : "CAJERO"}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2 flex-1">
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <Mail size={14} className="text-gray-400 shrink-0" />{" "}
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <Phone size={14} className="text-gray-400 shrink-0" />{" "}
                  <span>{user.telefono || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <Lock size={14} className="text-gray-400 shrink-0" />{" "}
                  <span>CI: {user.cedula}</span>
                </div>
                <div className="flex items-center gap-2 mt-auto pt-2">
                  <div
                    className={clsx(
                      "w-2 h-2 rounded-full",
                      user.activo ? "bg-success-500" : "bg-primary-500",
                    )}
                  ></div>
                  <span
                    className={clsx(
                      "text-[10px] font-bold uppercase tracking-tight",
                      user.activo ? "text-success-700" : "text-primary-700",
                    )}
                  >
                    {user.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 flex gap-2 border-t border-gray-100">
                <button
                  onClick={() => handleOpenEdit(user)}
                  className="flex-1 py-1.5 text-[11px] font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-primary-50 hover:text-primary-700 hover:border-primary-100 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Edit3 size={14} /> Editar
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setIsDeleteModalOpen(true);
                  }}
                  className="flex-1 py-1.5 text-[11px] font-bold text-primary-700 bg-white border border-gray-200 rounded-lg hover:bg-primary-50 hover:border-primary-100 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedUser ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="bg-primary-50 border border-primary-200 text-primary-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Row: Nombre + Apellido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Apellido *
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
              </div>

              {/* Row: Username + Cédula */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Usuario *
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    placeholder="ej: juan.perez"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Cédula *
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
              </div>

              {/* Row: Email + Teléfono */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email *
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
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Teléfono
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
              </div>

              {/* Row: Rol + Estado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Rol *
                  </label>
                  <select
                    value={form.rol}
                    onChange={(e) => setForm({ ...form, rol: e.target.value })}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  >
                    <option value="CAJERO">Cajero</option>
                    <option value="ADMINISTRADOR">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={form.activo ? "true" : "false"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        activo: e.target.value === "true",
                      })
                    }
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Contraseña{" "}
                  {selectedUser ? "(dejar en blanco para mantener)" : "*"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder={
                      selectedUser ? "••••••••" : "Mínimo 8 caracteres"
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
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
                    <CheckCircle2 size={18} /> Guardar Usuario
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsDeleteModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                ¿Desactivar Usuario?
              </h3>
              <p className="text-gray-500 mb-6">
                Se desactivará a{" "}
                <strong>
                  {selectedUser.nombre} {selectedUser.apellido}
                </strong>
                . El usuario no podrá iniciar sesión.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2 font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-colors"
                >
                  Desactivar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
