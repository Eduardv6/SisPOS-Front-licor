import { useState, useEffect } from "react";
import {
  Plus,
  Layers,
  FolderTree,
  CheckCircle2,
  Edit3,
  Trash2,
  ChevronRight,
  FolderClosed,
  Grid,
  X,
} from "lucide-react";
import clsx from "clsx";
import { categoryService } from "../services/categoryService";
import { useToast } from "../context/ToastContext";

const COLORS = [
  "bg-slate-500",
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
];

export default function Categorias() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form States
  const [categoryForm, setCategoryForm] = useState({
    id: null,
    nombre: "",
    description: "", // Note: Backend schema doesn't have description yet, kept for UI/Future
    color: COLORS[0],
    active: true,
  });

  const [subcategoryForm, setSubcategoryForm] = useState({
    id: null,
    nombre: "",
    active: true,
  });

  const fetchCategories = async (optimisticCategory = null) => {
    try {
      setIsLoading(true);
      const data = await categoryService.getAll();

      let finalData = [...data];

      // If we have an explicitly provided optimistic update, apply it
      if (optimisticCategory) {
        const exists = finalData.find((c) => c.id === optimisticCategory.id);
        if (!exists) {
          finalData.push(optimisticCategory);
        } else {
          // If it exists (e.g. backend returned it), make sure we use the latest version (optimisticCategory)
          // This is important if backend data is stale or if we want to show our optimistic update
          finalData = finalData.map((c) =>
            c.id === optimisticCategory.id ? optimisticCategory : c,
          );
        }
      }

      // Sort: Active first, then alphabetical
      const sortedData = finalData.sort((a, b) => {
        // First sort by status (Active first)
        if (a.activo !== b.activo) {
          return a.activo ? -1 : 1;
        }
        // Then sort by name
        return a.nombre.localeCompare(b.nombre);
      });

      setCategories(sortedData);

      // Always sync selectedCategory with the freshly fetched data so we get the latest subcategories
      if (selectedCategory || optimisticCategory) {
        const idToSync = optimisticCategory
          ? optimisticCategory.id
          : selectedCategory?.id;
        const updatedSelected = sortedData.find((c) => c.id === idToSync);
        if (updatedSelected) {
          setSelectedCategory(updatedSelected);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory?.id]);

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
  };

  // --- Category Actions ---

  const openNewCategoryModal = () => {
    setCategoryForm({
      id: null,
      nombre: "",
      description: "",
      color: COLORS[0],
      active: true,
    });
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = () => {
    if (!selectedCategory) return;
    setCategoryForm({
      id: selectedCategory.id,
      nombre: selectedCategory.nombre,
      description: "",
      color: selectedCategory.color || COLORS[0],
      active: selectedCategory.activo,
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    try {
      const payload = {
        nombre: categoryForm.nombre,
        color: categoryForm.color,
        icono: "default",
        activo: categoryForm.active,
      };

      let savedCategory;
      if (categoryForm.id) {
        await categoryService.update(categoryForm.id, payload);
        // Preserve subcategories when updating
        savedCategory = { ...selectedCategory, ...payload };
      } else {
        const response = await categoryService.create(payload);
        savedCategory = response.data;
      }

      // Optimistically update state
      if (savedCategory) {
        setSelectedCategory(savedCategory);
      }

      // Pass the new category to fetchCategories to ensure it's included/sorted correctly immediately
      await fetchCategories(savedCategory);
      toast.success(
        categoryForm.id ? "Categoría actualizada" : "Categoría creada",
      );
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Error al guardar la categoría");
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return;

    try {
      await categoryService.delete(selectedCategory.id);
      toast.success("Categoría eliminada");
      setSelectedCategory(null);
      await fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Error al eliminar la categoría");
    }
  };

  // --- Subcategory Actions ---

  const openNewSubcategoryModal = () => {
    setSubcategoryForm({ id: null, nombre: "", active: true });
    setIsSubcategoryModalOpen(true);
  };

  const handleSaveSubcategory = async () => {
    if (!selectedCategory) return;

    try {
      const payload = {
        nombre: subcategoryForm.nombre,
        parentId: selectedCategory.id,
        activo: subcategoryForm.active,
      };

      if (subcategoryForm.id) {
        await categoryService.update(subcategoryForm.id, payload);
      } else {
        await categoryService.create(payload);
      }

      await fetchCategories();
      toast.success(
        subcategoryForm.id ? "Subcategoría actualizada" : "Subcategoría creada",
      );
      setIsSubcategoryModalOpen(false);
    } catch (error) {
      console.error("Error saving subcategory:", error);
      toast.error("Error al guardar la subcategoría");
    }
  };

  const openEditSubcategoryModal = (sub) => {
    setSubcategoryForm({
      id: sub.id,
      nombre: sub.nombre,
      active: sub.activo,
    });
    setIsSubcategoryModalOpen(true);
  };

  const handleDeleteSubcategory = async (subId) => {
    if (!confirm("¿Estás seguro de eliminar esta subcategoría?")) return;

    try {
      await categoryService.delete(subId);
      toast.success("Subcategoría eliminada");
      await fetchCategories();
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      toast.error("Error al eliminar la subcategoría");
    }
  };

  return (
    <div className="space-y-8 h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Categorías
          </h1>
          <p className="text-gray-500 mt-1">
            Gestión de categorías y subcategorías
          </p>
        </div>
        <button
          onClick={openNewCategoryModal}
          className="flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30 active:translate-y-0.5"
        >
          <Plus size={20} /> Nueva Categoría
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
            <Layers size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">
              Total Categorías
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {categories.length}
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-info-50 text-info-600 flex items-center justify-center">
            <FolderTree size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">
              Subcategorías
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {categories.reduce(
                (acc, cat) => acc + (cat.subcategorias?.length || 0),
                0,
              )}
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-success-50 text-success-600 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Activas</div>
            <div className="text-2xl font-bold text-gray-900">
              {categories.filter((c) => c.activo).length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Sidebar List */}
        <div className="w-full lg:w-1/3 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-700">Categorías Principales</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat)}
                className={clsx(
                  "w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all",
                  selectedCategory?.id === cat.id
                    ? "bg-primary-50 border border-primary-200 shadow-sm"
                    : "hover:bg-gray-50 border border-transparent",
                )}
              >
                <div
                  className={clsx("w-3 h-10 rounded-full shrink-0", cat.color)}
                ></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span
                      className={clsx(
                        "font-bold",
                        selectedCategory?.id === cat.id
                          ? "text-primary-900"
                          : "text-gray-700",
                      )}
                    >
                      {cat.nombre}
                    </span>
                    {!cat.activo && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-semibold uppercase">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {cat.subcategorias?.length || 0} subcategorías
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className={clsx(
                    "text-gray-400",
                    selectedCategory?.id === cat.id && "text-primary-500",
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full lg:w-2/3 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden relative">
          {selectedCategory ? (
            <div className="flex flex-col h-full">
              {/* Category Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div
                    className={clsx(
                      "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200",
                      selectedCategory.color,
                    )}
                  >
                    <Grid size={32} className="text-white opacity-90" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedCategory.nombre}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={clsx(
                          "w-2 h-2 rounded-full",
                          selectedCategory.activo
                            ? "bg-success-500"
                            : "bg-gray-400",
                        )}
                      ></span>
                      <span className="text-sm font-medium text-gray-500">
                        {selectedCategory.activo ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={openEditCategoryModal}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm"
                  >
                    <Edit3 size={20} />
                  </button>
                  <button
                    onClick={handleDeleteCategory}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="mb-8">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Descripción
                  </h4>
                  <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                    Sin descripción disponible
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <FolderTree size={20} className="text-gray-400" />{" "}
                      Subcategorías
                    </h3>
                    <button
                      onClick={openNewSubcategoryModal}
                      className="text-sm font-bold text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus size={16} /> Nueva Subcategoría
                    </button>
                  </div>

                  {selectedCategory.subcategorias &&
                  selectedCategory.subcategorias.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedCategory.subcategorias.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all group bg-white flex justify-between items-center"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                              <FolderClosed size={16} />
                            </div>
                            <div>
                              <span className="font-bold text-gray-800 block">
                                {sub.nombre}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium uppercase">
                                {sub.activo ? "Activa" : "Inactiva"}
                              </span>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditSubcategoryModal(sub);
                              }}
                              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSubcategory(sub.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                      <FolderClosed
                        size={48}
                        className="mx-auto text-gray-300 mb-2"
                      />
                      <p className="text-gray-500 font-medium">
                        No hay subcategorías registradas
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Crea una nueva para organizar mejor tus productos
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg shadow-gray-200 mb-6 animate-in zoom-in duration-300">
                <Layers size={48} className="text-primary-200" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Selecciona una categoría
              </h3>
              <p className="text-gray-500 max-w-sm mt-2">
                Elige una categoría de la lista para ver sus detalles y
                gestionar sus subcategorías.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Item Modal (Category/Subcategory) */}
      {(isCategoryModalOpen || isSubcategoryModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setIsCategoryModalOpen(false);
              setIsSubcategoryModalOpen(false);
            }}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {isCategoryModalOpen
                  ? categoryForm.id
                    ? "Editar Categoría"
                    : "Nueva Categoría"
                  : "Nueva Subcategoría"}
              </h2>
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setIsSubcategoryModalOpen(false);
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={
                    isCategoryModalOpen
                      ? categoryForm.nombre
                      : subcategoryForm.nombre
                  }
                  onChange={(e) =>
                    isCategoryModalOpen
                      ? setCategoryForm({
                          ...categoryForm,
                          nombre: e.target.value,
                        })
                      : setSubcategoryForm({
                          ...subcategoryForm,
                          nombre: e.target.value,
                        })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  placeholder={
                    isCategoryModalOpen ? "Ej: Bebidas" : "Ej: Gaseosas"
                  }
                />
              </div>

              {/* Description field hidden for now as backend support isn't explicit but UI had it */}

              {isCategoryModalOpen && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Color Distintivo *
                  </label>
                  <div className="grid grid-cols-9 gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() =>
                          setCategoryForm({ ...categoryForm, color })
                        }
                        className={clsx(
                          "w-8 h-8 rounded-full transition-all hover:scale-110",
                          color,
                          categoryForm.color === color
                            ? "ring-2 ring-offset-2 ring-gray-900 scale-110"
                            : "",
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer"
                onClick={() =>
                  (isCategoryModalOpen ? setCategoryForm : setSubcategoryForm)(
                    (prev) => ({
                      ...prev,
                      active: !prev.active,
                    }),
                  )
                }
              >
                <div
                  className={clsx(
                    "w-10 h-6 rounded-full p-1 transition-colors relative",
                    (isCategoryModalOpen ? categoryForm : subcategoryForm)
                      .active
                      ? "bg-success-500"
                      : "bg-gray-300",
                  )}
                >
                  <div
                    className={clsx(
                      "w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                      (isCategoryModalOpen ? categoryForm : subcategoryForm)
                        .active
                        ? "translate-x-4"
                        : "",
                    )}
                  ></div>
                </div>
                <span className="font-semibold text-gray-700 text-sm">
                  {(isCategoryModalOpen ? categoryForm : subcategoryForm).active
                    ? "Activo"
                    : "Inactivo"}
                </span>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setIsSubcategoryModalOpen(false);
                }}
                className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={
                  isCategoryModalOpen
                    ? handleSaveCategory
                    : handleSaveSubcategory
                }
                className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
