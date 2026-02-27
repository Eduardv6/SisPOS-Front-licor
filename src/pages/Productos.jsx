import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Download,
  MoreVertical,
  Edit3,
  Eye,
  Trash2,
  Package,
  Layers,
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";
import clsx from "clsx";
import { productService } from "../services/productService";
import { categoryService } from "../services/categoryService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Productos() {
  const toast = useToast();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState("grid");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    nombre: "",
    codigoInterno: "",
    codigoBarras: "",
    categoriaId: "",
    stockMinimo: 10,
    precioCompra: "",
    precioVenta: "",
    unidadMedida: "UNIDAD",
    stockInicial: "",
    marca: "",
    imagen: null,
  });

  // Presentaciones State
  const [presentaciones, setPresentaciones] = useState([]);
  const [newPres, setNewPres] = useState({
    nombre: "",
    cantidadBase: "",
    precioVenta: "",
  });

  const addPresentacion = () => {
    if (!newPres.nombre || !newPres.cantidadBase || !newPres.precioVenta)
      return;
    setPresentaciones((prev) => [
      ...prev,
      {
        ...newPres,
        cantidadBase: parseInt(newPres.cantidadBase),
        precioVenta: parseFloat(newPres.precioVenta),
      },
    ]);
    setNewPres({ nombre: "", cantidadBase: "", precioVenta: "" });
  };

  const removePresentacion = (index) => {
    setPresentaciones((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // We know backend returns all now, but let's sort them active first just in case
      const data = await categoryService.getAll();
      setCategories(
        data.sort((a, b) => (a.activo === b.activo ? 0 : a.activo ? -1 : 1)),
      );
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleOpenDetail = (product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      nombre: product.nombre,
      codigoInterno: product.codigoInterno,
      codigoBarras: product.codigoBarras || "",
      categoriaId: product.categoriaId,
      stockMinimo: product.stockMinimo,
      precioCompra: product.precioCompra,
      precioVenta: product.precioVenta,
      unidadMedida: product.unidadMedida,
      marca: product.marca || "",
      stockInicial: "",
      imagen: null,
    });
    // Load existing presentaciones (exclude default "Unidad")
    const existingPres = (product.presentaciones || [])
      .filter((p) => !p.esDefault)
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        cantidadBase: p.cantidadBase,
        precioVenta: Number(p.precioVenta),
      }));
    setPresentaciones(existingPres);
    setNewPres({ nombre: "", cantidadBase: "", precioVenta: "" });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedProduct(null);
    setFormData({
      nombre: "",
      codigoInterno: "",
      codigoBarras: "",
      categoriaId: "",
      stockMinimo: 10,
      precioCompra: "",
      precioVenta: "",
      unidadMedida: "UNIDAD",
      stockInicial: "",
      marca: "",
      imagen: null,
    });
    setPresentaciones([]);
    setNewPres({ nombre: "", cantidadBase: "", precioVenta: "" });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "imagen") {
          if (formData.imagen) data.append("imagen", formData.imagen);
        } else if (key === "stockInicial" && !formData.stockInicial) {
          // Skip empty stockInicial
        } else {
          data.append(key, formData[key]);
        }
      });

      if (user?.id) data.append("usuarioId", user.id);

      // Append presentaciones as JSON
      if (presentaciones.length > 0) {
        data.append("presentaciones", JSON.stringify(presentaciones));
      }

      if (selectedProduct) {
        // For update, also include the default "Unidad" presentation
        const defaultPres = (selectedProduct.presentaciones || []).find(
          (p) => p.esDefault,
        );
        if (defaultPres) {
          const allPres = [
            {
              id: defaultPres.id,
              nombre: "Unidad",
              cantidadBase: 1,
              precioVenta: parseFloat(formData.precioVenta),
            },
            ...presentaciones,
          ];
          data.set("presentaciones", JSON.stringify(allPres));
        }
        await productService.update(selectedProduct.id, data);
        toast.success("Producto actualizado correctamente");
        await fetchProducts();
        setIsModalOpen(false);
      } else {
        await productService.create(data);
        toast.success("Producto creado correctamente");
        await fetchProducts();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(error.message || "Error al guardar producto");
    }
  };

  const handleDelete = async () => {
    try {
      if (selectedProduct) {
        await productService.delete(selectedProduct.id);
        toast.success("Producto eliminado correctamente");
        await fetchProducts();
        setIsDeleteModalOpen(false);
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Error al eliminar");
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imagen") {
      setFormData((prev) => ({ ...prev, imagen: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  /* State for Filters */
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStock, setFilterStock] = useState("all"); // all, low, out
  const [sortBy, setSortBy] = useState("name"); // name, priceAsc, priceDesc, stock

  /* Derived State / Stats */
  const totalProducts = products.length;
  const activeCategories = categories.length; // Simplified
  const lowStockCount = products.filter((p) => {
    const stock =
      p.inventarios?.reduce((acc, inv) => acc + inv.stockActual, 0) || 0;
    return stock <= p.stockMinimo;
  }).length;

  // Filter Logic
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.codigoInterno
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        product.codigoBarras?.includes(searchTerm);
      const matchesCategory = filterCategory
        ? product.categoriaId === Number(filterCategory)
        : true;

      const stock =
        product.inventarios?.reduce((acc, inv) => acc + inv.stockActual, 0) ||
        0;
      let matchesStock = true;
      if (filterStock === "low")
        matchesStock = stock <= product.stockMinimo && stock > 0;
      if (filterStock === "out") matchesStock = stock === 0;

      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.nombre.localeCompare(b.nombre);
      if (sortBy === "priceAsc") return a.precioVenta - b.precioVenta;
      if (sortBy === "priceDesc") return b.precioVenta - a.precioVenta;
      if (sortBy === "stock") {
        const stockA =
          a.inventarios?.reduce((acc, inv) => acc + inv.stockActual, 0) || 0;
        const stockB =
          b.inventarios?.reduce((acc, inv) => acc + inv.stockActual, 0) || 0;
        return stockA - stockB;
      }
      return 0;
    });

  const getStock = (product) =>
    product.inventarios?.reduce((acc, inv) => acc + inv.stockActual, 0) || 0;
  const getStockStatus = (product) => {
    const stock = getStock(product);
    if (stock === 0)
      return { label: "Agotado", color: "bg-primary-100 text-primary-700" };
    if (stock <= product.stockMinimo)
      return { label: "Bajo Stock", color: "bg-amber-100 text-amber-700" };
    return { label: "En Stock", color: "bg-emerald-100 text-emerald-700" };
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-0">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Productos
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Gestión de catálogo de productos e inventario</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100">
            <button
              onClick={() => setViewMode("grid")}
              className={clsx(
                "flex-1 md:flex-none p-2 rounded-lg transition-all flex justify-center items-center gap-2",
                viewMode === "grid"
                  ? "bg-white text-primary-600 shadow-sm font-bold border border-gray-100"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50",
              )}
            >
              <LayoutGrid size={20} /> <span className="md:hidden text-sm">Cuadrícula</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={clsx(
                "flex-1 md:flex-none p-2 rounded-lg transition-all flex justify-center items-center gap-2",
                viewMode === "list"
                  ? "bg-white text-primary-600 shadow-sm font-bold border border-gray-100"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50",
              )}
            >
              <ListIcon size={20} /> <span className="md:hidden text-sm">Lista</span>
            </button>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-black hover:bg-primary-700 transition-all shadow-[0_8px_20px_-6px_rgba(14,165,233,0.5)] active:scale-95 text-sm uppercase tracking-wider w-full sm:w-auto"
          >
            <Plus size={20} strokeWidth={2.5} /> Nuevo Producto
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Package size={20} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Total
            </span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 leading-tight">
            {totalProducts}
          </div>
          <p className="text-[11px] text-gray-500">Productos</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Layers size={20} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Categorías
            </span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 leading-tight">
            {activeCategories}
          </div>
          <p className="text-[11px] text-gray-500">Categorías activas</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle size={20} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Atención
            </span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 leading-tight">
            {lowStockCount}
          </div>
          <p className="text-[11px] text-gray-500">Bajo o agotado</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Estado
            </span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 leading-tight">
            Activo
          </div>
          <p className="text-[11px] text-gray-500">Sistema en línea</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        <div className="relative group w-full lg:w-96">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors"
            size={20}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, código..."
            className="pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm md:text-base font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all w-full"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 cursor-pointer hover:bg-white transition-colors w-full sm:w-auto appearance-none"
          >
            <option value="">Todas las Categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>

          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 cursor-pointer hover:bg-white transition-colors w-full sm:w-auto appearance-none"
          >
            <option value="all">Todo el Stock</option>
            <option value="low">Bajo Stock</option>
            <option value="out">Agotado</option>
          </select>
        </div>
      </div>

      {/* Product List/Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product);
            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all group hover:-translate-y-1 flex flex-col hover:border-primary-200"
              >
                <div className="relative h-28 md:h-36 bg-gray-50/80 flex items-center justify-center p-3">
                  <div
                    className={clsx(
                      "absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-wider z-10 shadow-sm",
                      stockStatus.color,
                    )}
                  >
                    {stockStatus.label}
                  </div>
                  {product.imagen ? (
                    <img
                      src={
                        product.imagen.startsWith("http")
                          ? product.imagen
                          : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${product.imagen}`
                      }
                      alt={product.nombre}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <Package
                      size={40}
                      className="text-gray-300 group-hover:text-primary-300 transition-colors"
                      strokeWidth={1.5}
                    />
                  )}
                </div>
                <div className="p-3 md:p-4 flex-1 flex flex-col bg-white">
                  <div className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 truncate">
                    {product.categoria?.nombre || "Sin Categoría"}
                    {product.marca && <span className="text-primary-400"> • {product.marca}</span>}
                  </div>
                  <h3 className="font-bold text-gray-900 leading-tight mb-2 text-xs md:text-sm line-clamp-2 min-h-[2.4em] md:min-h-[2.8em]">
                    {product.nombre}
                  </h3>
                  <div className="flex justify-between items-center text-[10px] md:text-[11px] text-gray-500 mb-3 font-mono">
                    <span className="truncate max-w-[50%]">{product.codigoInterno}</span>
                    <span
                      className={clsx(
                        "font-black tracking-tight",
                        getStock(product) <= product.stockMinimo
                          ? "text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded"
                          : "text-gray-500",
                      )}
                    >
                      {getStock(product)} {product.unidadMedida.substring(0, 3)}
                    </span>
                  </div>
                  <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-end gap-1">
                    <div className="flex flex-col">
                      <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                        Precio
                      </span>
                      <span className="text-sm md:text-base font-black text-primary-600 font-mono leading-none">
                        Bs. {Number(product.precioVenta).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="p-2 md:p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-primary-50 hover:text-primary-600 focus:ring-2 focus:ring-primary-500/20 transition-all active:scale-95"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(product)}
                        className="p-2 md:p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-danger-50 hover:text-danger-600 focus:ring-2 focus:ring-danger-500/20 transition-all active:scale-95"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
              <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-100 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                  <th className="px-6 py-4 text-right">Costo</th>
                  <th className="px-6 py-4 text-right">Precio</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-primary-50/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {product.nombre}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-1">
                          {product.codigoInterno}{" "}
                          {product.codigoBarras
                            ? `| ${product.codigoBarras}`
                            : ""}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1.5 rounded-lg bg-gray-50/80 text-gray-600 text-[10px] font-bold uppercase tracking-wide border border-gray-200/60">
                          {product.categoria?.nombre || "Sin Categoría"}
                          {product.marca && (
                            <span className="text-gray-300 mx-1.5">/</span>
                          )}
                          {product.marca && (
                            <span className="text-primary-600">
                              {product.marca}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={clsx(
                            "px-3 py-1.5 rounded-lg text-xs font-black shadow-sm",
                            stockStatus.color,
                          )}
                        >
                          {getStock(product)} {product.unidadMedida}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500 font-mono text-xs font-semibold">
                        Bs. {Number(product.precioCompra).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-primary-600 font-mono text-sm">
                        Bs. {Number(product.precioVenta).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-2 rounded-xl text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors bg-gray-50"
                          >
                            <Edit3 size={18} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(product)}
                            className="p-2 rounded-xl text-gray-400 hover:text-danger-600 hover:bg-danger-50 transition-colors bg-gray-50"
                          >
                            <Trash2 size={18} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 && (
            <div className="p-12 text-center text-gray-400 font-medium">
              <div className="mb-4 flex justify-center opacity-50"><Search size={48} strokeWidth={1} /></div>
              No se encontraron productos que coincidan con los filtros.
            </div>
          )}
        </div>
      )}

      {/* Product Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative bg-white md:rounded-2xl shadow-2xl w-full h-full md:h-auto md:max-h-[90vh] max-w-2xl flex flex-col animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-white md:rounded-t-2xl shrink-0 z-10 shadow-sm">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                {selectedProduct ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 md:p-2.5 rounded-xl hover:bg-gray-100/80 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={22} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-gray-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nombre del producto *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    placeholder="Ej: Cerveza Paceña 620ml"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Código Interno / SKU *
                  </label>
                  <input
                    type="text"
                    name="codigoInterno"
                    value={formData.codigoInterno}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    placeholder="Ej: CRV-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    name="codigoBarras"
                    autoFocus={!selectedProduct}
                    value={formData.codigoBarras}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault(); // Evitar que el modal se cierre o el form se envíe si se añade uno luego
                        // El código ya está en formData gracias al onChange
                      }
                    }}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    placeholder="Ej: 7890123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    name="categoriaId"
                    value={formData.categoriaId}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Costo (Bs.) *
                  </label>
                  <input
                    type="number"
                    name="precioCompra"
                    value={formData.precioCompra}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Precio Venta (Bs.) *
                  </label>
                  <input
                    type="number"
                    name="precioVenta"
                    value={formData.precioVenta}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    name="stockMinimo"
                    value={formData.stockMinimo}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>
                {!selectedProduct && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Stock Inicial
                    </label>
                    <input
                      type="number"
                      name="stockInicial"
                      value={formData.stockInicial}
                      onChange={handleChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Unidad de Medida
                  </label>
                  <select
                    name="unidadMedida"
                    value={formData.unidadMedida}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  >
                    <option value="UNIDAD">Unidad</option>
                    <option value="CAJA">Caja</option>
                    <option value="PAQUETE">Paquete</option>
                    <option value="BOTELLA">Botella</option>
                    <option value="LITRO">Litro</option>
                    <option value="KILO">Kilo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Marca / Subcategoría
                  </label>
                  {(() => {
                    const selectedCat = categories.find(
                      (c) => c.id === Number(formData.categoriaId),
                    );
                    const subcategories = selectedCat?.subcategorias || [];

                    if (subcategories.length > 0) {
                      return (
                        <select
                          name="marca"
                          value={formData.marca}
                          onChange={handleChange}
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                        >
                          <option value="">
                            Seleccionar marca/subcategoría
                          </option>
                          {subcategories.map((sub) => (
                            <option key={sub.id} value={sub.nombre}>
                              {sub.nombre}
                            </option>
                          ))}
                        </select>
                      );
                    }
                    return (
                      <input
                        type="text"
                        name="marca"
                        value={formData.marca}
                        onChange={handleChange}
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                        placeholder="Ej: Paceña (o seleccione categoría primero)"
                      />
                    );
                  })()}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Imagen del Producto
                  </label>
                  <input
                    type="file"
                    name="imagen"
                    onChange={handleChange}
                    accept="image/*"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                </div>
              </div>

              {/* Presentaciones Section */}
              <div className="mt-2 pt-6 border-t border-gray-200">
                <h3 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Package size={18} className="text-primary-500" />
                  Presentaciones de Venta
                  <span className="text-xs font-medium text-gray-400 ml-1 hidden sm:inline">
                    (La "Unidad" se crea automáticamente)
                  </span>
                </h3>

                {/* Existing presentations */}
                {presentaciones.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {presentaciones.map((pres, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1 font-medium text-sm text-gray-800">
                          {pres.nombre}
                        </div>
                        <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                          x{pres.cantidadBase} unid.
                        </div>
                        <div className="text-sm font-bold text-primary-600 font-mono">
                          Bs. {Number(pres.precioVenta).toFixed(2)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removePresentacion(index)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new presentation row */}
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Caja x20"
                      value={newPres.nombre}
                      onChange={(e) =>
                        setNewPres((p) => ({ ...p, nombre: e.target.value }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs text-gray-500 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      placeholder="20"
                      min="2"
                      value={newPres.cantidadBase}
                      onChange={(e) =>
                        setNewPres((p) => ({
                          ...p,
                          cantidadBase: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-xs text-gray-500 mb-1">
                      Precio (Bs.)
                    </label>
                    <input
                      type="number"
                      placeholder="25.00"
                      step="0.01"
                      value={newPres.precioVenta}
                      onChange={(e) =>
                        setNewPres((p) => ({
                          ...p,
                          precioVenta: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addPresentacion}
                    className="p-3 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-all active:scale-95 border border-primary-100 mt-5 md:mt-0"
                    title="Agregar Presentación"
                  >
                    <Plus size={20} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0 md:rounded-b-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 md:flex-none px-6 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 md:flex-none px-6 py-3 bg-primary-600 text-white font-black uppercase tracking-wider text-sm rounded-xl hover:bg-primary-700 transition-all shadow-[0_8px_20px_-6px_rgba(14,165,233,0.5)] active:scale-95"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setIsDeleteModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 md:p-8 text-center">
              <div className="w-20 h-20 bg-danger-50 text-danger-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-danger-100">
                <AlertTriangle size={36} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                Eliminar Producto
              </h2>
              <p className="text-gray-500 mb-8 font-medium">
                ¿Estás seguro de que deseas eliminar{" "}
                <span className="font-bold text-gray-900 block mt-1">
                  "{selectedProduct.nombre}"
                </span>
                Esta acción no se puede deshacer.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full py-3.5 font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full py-3.5 bg-danger-500 text-white font-black uppercase tracking-wider text-sm rounded-xl hover:bg-danger-600 transition-all shadow-[0_8px_20px_-6px_rgba(239,68,68,0.5)] active:scale-95"
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
