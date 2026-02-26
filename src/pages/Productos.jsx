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
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Productos
          </h1>
          <p className="text-gray-500 mt-1">Gestión de catálogo de productos</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("grid")}
            className={clsx(
              "p-2 rounded-md transition-all",
              viewMode === "grid"
                ? "bg-white text-primary-600 shadow-sm"
                : "text-gray-400 hover:text-gray-600",
            )}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={clsx(
              "p-2 rounded-md transition-all",
              viewMode === "list"
                ? "bg-white text-primary-600 shadow-sm"
                : "text-gray-400 hover:text-gray-600",
            )}
          >
            <ListIcon size={20} />
          </button>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30 active:translate-y-0.5"
        >
          <Plus size={20} /> Nuevo Producto
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative group w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors"
            size={20}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, código..."
            className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all w-full"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:border-primary-500 cursor-pointer hover:bg-gray-100 transition-colors"
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
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:border-primary-500 cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <option value="all">Todo el Stock</option>
            <option value="low">Bajo Stock</option>
            <option value="out">Agotado</option>
          </select>
        </div>
      </div>

      {/* Product List/Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product);
            return (
              <div
                key={product.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all group hover:-translate-y-1 flex flex-col"
              >
                <div className="relative h-32 bg-gray-100 flex items-center justify-center p-3">
                  <div
                    className={clsx(
                      "absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide z-10 shadow-sm",
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
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Package
                      size={32}
                      className="text-gray-300 group-hover:text-primary-200 transition-colors"
                    />
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 truncate">
                    {product.categoria?.nombre || "Sin Categoría"}
                    {product.marca && ` • ${product.marca}`}
                  </div>
                  <h3 className="font-bold text-gray-900 leading-tight mb-1 text-xs line-clamp-2 min-h-[2.4em]">
                    {product.nombre}
                  </h3>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 mb-2 font-mono">
                    <span>{product.codigoInterno}</span>
                    <span
                      className={clsx(
                        "font-bold",
                        getStock(product) <= product.stockMinimo
                          ? "text-amber-600"
                          : "text-gray-400",
                      )}
                    >
                      {getStock(product)} {product.unidadMedida.substring(0, 3)}
                      .
                    </span>
                  </div>
                  <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between items-end gap-1">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-400 font-semibold leading-none mb-0.5">
                        Bs. {Number(product.precioCompra).toFixed(1)}
                      </span>
                      <span className="text-base font-black text-primary-600 font-mono leading-none">
                        {Number(product.precioVenta).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="p-1.5 rounded bg-gray-50 text-gray-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(product)}
                        className="p-1.5 rounded bg-gray-50 text-gray-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      >
                        <Trash2 size={14} />
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
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
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">
                          {product.nombre}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {product.codigoInterno}{" "}
                          {product.codigoBarras
                            ? `| ${product.codigoBarras}`
                            : ""}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wide">
                          {product.categoria?.nombre || "Sin Categoría"}
                          {product.marca && (
                            <span className="text-gray-400 mx-1">/</span>
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
                            "px-2 py-1 rounded text-xs font-bold",
                            stockStatus.color,
                          )}
                        >
                          {getStock(product)} {product.unidadMedida}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500">
                        Bs. {Number(product.precioCompra).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-primary-600">
                        Bs. {Number(product.precioVenta).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(product)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          >
                            <Trash2 size={16} />
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
            <div className="p-8 text-center text-gray-500">
              No se encontraron productos que coincidan con los filtros.
            </div>
          )}
        </div>
      )}

      {/* Product Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedProduct ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Package size={16} className="text-primary-500" />
                  Presentaciones de Venta
                  <span className="text-xs font-normal text-gray-400 ml-1">
                    (La "Unidad" se crea automáticamente con el precio de venta)
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
                    className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors"
                    title="Agregar Presentación"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors"
              >
                Guardar Producto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsDeleteModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Eliminar Producto
              </h2>
              <p className="text-gray-500 mb-6">
                ¿Estás seguro de que deseas eliminar{" "}
                <span className="font-bold text-gray-900">
                  {selectedProduct.nombre}
                </span>
                ? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors"
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
