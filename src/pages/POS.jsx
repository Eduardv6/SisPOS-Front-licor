import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  User,
  Tag,
  FileText,
  Minus,
  Plus,
  CircleDashed,
  X,
  ScanBarcode,
  Loader2,
  Beer,
  Wine,
  GlassWater,
  CheckCircle2,
  Calculator,
  ArrowUp,
  ArrowDown,
  Users,
  Percent,
  LogOut,
  Package,
  ShoppingCart,
  AlertCircle,
  Calendar,
  Clock,
} from "lucide-react";
import clsx from "clsx";
import { salesService } from "../services/salesService";
import { categoryService } from "../services/categoryService";
import { customerService } from "../services/customerService";
import { cashRegisterService } from "../services/cashRegisterService";
import { settingService } from "../services/settingService";
import { useAuth } from "../context/AuthContext";

export default function POS() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [openRegisterId, setOpenRegisterId] = useState(null);
  const [isCloseRegisterModalOpen, setIsCloseRegisterModalOpen] =
    useState(false);
  const [closeAmount, setCloseAmount] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [closingRegister, setClosingRegister] = useState(false);
  const [checkingRegister, setCheckingRegister] = useState(true);

  // Mobile Cart State
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Cash Movement State
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState("INGRESO_EXTRA"); // or 'RETIRO'
  const [movementAmount, setMovementAmount] = useState("");
  const [movementDesc, setMovementDesc] = useState("");
  const [processingMovement, setProcessingMovement] = useState(false);

  // Current Cash Display
  const [currentCash, setCurrentCash] = useState(0);

  // Ticket / Success Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [lastSaleData, setLastSaleData] = useState(null);
  const [settings, setSettings] = useState({
    empresa_nombre: "Licorería",
    empresa_nit: "123456789",
    empresa_direccion: "Sucursal Central",
    empresa_mensaje_recibo: "¡GRACIAS POR SU COMPRA!",
    empresa_logo: null,
  });

  const handleOpenMovementModal = (type) => {
    setMovementType(type);
    setMovementAmount("");
    setMovementDesc("");
    setError("");
    setIsMovementModalOpen(true);
  };

  const handleProcessMovement = async () => {
    if (!movementAmount || parseFloat(movementAmount) <= 0) {
      setError("Monto inválido");
      return;
    }
    if (!openRegisterId) {
      setError("No hay caja abierta identificada");
      return;
    }

    setProcessingMovement(true);
    setError("");
    try {
      await cashRegisterService.addMovement({
        tipo: movementType,
        monto: parseFloat(movementAmount),
        concepto: movementDesc,
      });
      setIsMovementModalOpen(false);
      setSuccess(
        movementType === "INGRESO_EXTRA"
          ? "Dinero ingresado correctamente"
          : "Dinero retirado correctamente",
      );

      const amount = parseFloat(movementAmount);
      setCurrentCash((prev) =>
        movementType === "INGRESO_EXTRA" ? prev + amount : prev - amount,
      );

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Error al procesar movimiento");
    } finally {
      setProcessingMovement(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchOpenRegister = async () => {
      try {
        const res = await cashRegisterService.getAll();
        if (!isMounted) return;

        const registers = res.data || [];
        const myRegister = registers.find((c) => c.estado === "ABIERTA");

        if (myRegister) {
          setOpenRegisterId(myRegister.id);
          try {
            const detailRes = await cashRegisterService.getDetail(
              myRegister.id,
            );
            if (!isMounted) return;

            const detail = detailRes;
            let calc = parseFloat(detail.montoInicial || 0);
            if (detail.movimientos) {
              detail.movimientos.forEach((m) => {
                const mAmount = parseFloat(m.monto);
                if (m.tipo === "VENTA" && m.metodoPago === "EFECTIVO")
                  calc += mAmount;
                else if (m.tipo === "INGRESO_EXTRA") calc += mAmount;
                else if (m.tipo === "RETIRO" || m.tipo === "GASTO")
                  calc -= mAmount;
              });
            }
            setCurrentCash(calc);
          } catch (e) {
            console.error(e);
            setCurrentCash(parseFloat(myRegister.montoInicial || 0));
          }
        } else {
          navigate("/apertura-caja");
        }
      } catch (err) {
        console.error("Error fetching open register", err);
      } finally {
        if (isMounted) setCheckingRegister(false);
      }
    };

    const fetchSettings = async () => {
      try {
        const data = await settingService.getSettings();
        if (isMounted && Object.keys(data).length > 0) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error("Error fetching settings in POS", err);
      }
    };

    fetchOpenRegister();
    fetchSettings();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleCloseRegister = async () => {
    if (!openRegisterId) return;
    setClosingRegister(true);
    try {
      await cashRegisterService.close(openRegisterId, {
        montoFinal: parseFloat(closeAmount) || 0,
        observaciones: closeNotes,
      });
      navigate("/apertura-caja");
    } catch (err) {
      setError(err.message || "Error al cerrar caja");
    } finally {
      setClosingRegister(false);
      setIsCloseRegisterModalOpen(false);
    }
  };

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Client & Discount State
  const [selectedClient, setSelectedClient] = useState(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [loadingClients, setLoadingClients] = useState(false);

  const [discount, setDiscount] = useState(0);
  const [clientDiscountPercent, setClientDiscountPercent] = useState(0);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [tempDiscount, setTempDiscount] = useState("");
  const [isExpressMode, setIsExpressMode] = useState(false);
  const [expressData, setExpressData] = useState({ nombre: "", ciNit: "" });

  // Presentation Selector State
  const [isPresentationModalOpen, setIsPresentationModalOpen] = useState(false);
  const [presentationProduct, setPresentationProduct] = useState(null);

  // Cargar Categorías
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getAll();
        setCategories(Array.isArray(res) ? res : res.data || []);
      } catch (err) {
        console.error("Error loading categories", err);
        // Fallback or empty
      }
    };
    fetchCategories();
  }, []);

  // Cargar Productos
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const categoryId = selectedCategory === "all" ? "" : selectedCategory;
      const res = await salesService.getProducts(searchQuery, categoryId);
      setProducts(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  }, [searchQuery, selectedCategory]);

  // Load Clients when needed
  useEffect(() => {
    if (isClientModalOpen) {
      fetchClients();
    }
  }, [isClientModalOpen, clientSearch]);

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const res = await customerService.getAll({ search: clientSearch });
      setClients(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      console.error("Error fetching clients", err);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timeout = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchProducts]);

  // Cart Logic
  const handleProductClick = (product) => {
    const presentations = product.presentaciones || [];
    // Show modal if there's any non-default presentation (box, pack, etc.)
    const hasMultiplePresentations = presentations.some((p) => !p.esDefault);
    if (hasMultiplePresentations || presentations.length > 1) {
      setPresentationProduct(product);
      setIsPresentationModalOpen(true);
    } else {
      // Only default or no presentations — add directly
      const defaultPres =
        presentations.find((p) => p.esDefault) || presentations[0];
      addToCart(product, defaultPres);
    }
  };

  const addToCart = (product, presentation) => {
    // Use a unique key combining product id + presentation id
    const cartKey = presentation
      ? `${product.id}-${presentation.id}`
      : `${product.id}`;
    const precio = presentation
      ? presentation.precioVenta
      : product.precioVenta;

    setCart((prev) => {
      const existing = prev.find((item) => item.cartKey === cartKey);
      if (existing) {
        // Validate stock: quantity * cantidadBase should not exceed total stock
        const cantidadBase = presentation ? presentation.cantidadBase : 1;
        const newQtyBase = (existing.quantity + 1) * cantidadBase;
        if (newQtyBase > product.stock) {
          return prev;
        }
        return prev.map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          ...product,
          cartKey,
          quantity: 1,
          precioVenta: precio,
          presentacion: presentation || null,
          presentacionId: presentation?.id || null,
          presentacionNombre: presentation?.nombre || "Unidad",
          cantidadBase: presentation?.cantidadBase || 1,
        },
      ];
    });
  };

  const updateQuantity = (cartKey, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartKey === cartKey) {
          const newQty = Math.max(1, item.quantity + delta);
          // Validate stock in base units
          const cantidadBase = item.cantidadBase || 1;
          const product = products.find((p) => p.id === item.id) || item;
          if (product && newQty * cantidadBase > product.stock) return item;
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (cartKey) => {
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedClient(null);
    setClientDiscountPercent(0);
    setDiscount(0);
    setTempDiscount("");
    setReceivedAmount("");
    setClientSearch("");
    setPaymentMethod("EFECTIVO");
    setExpressData({ nombre: "", ciNit: "" });
    setIsExpressMode(false);
    setSearchQuery("");
  };

  // Totals
  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.precioVenta) * item.quantity,
    0,
  );
  // Descuento del cliente (porcentual) + descuento manual (absoluto)
  const clientDiscountAmount = subtotal * (clientDiscountPercent / 100);
  const totalDiscount = clientDiscountAmount + discount;
  const total = Math.max(0, subtotal - totalDiscount);

  // Payment Logic
  const change = (parseFloat(receivedAmount) || 0) - total;

  const handleProcessPayment = () => {
    if (cart.length === 0) return;
    setError("");
    setSuccess("");
    setPaymentMethod("EFECTIVO"); // Default
    setReceivedAmount("");
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (
      paymentMethod === "EFECTIVO" &&
      (parseFloat(receivedAmount) || 0) < total
    ) {
      setError("Monto recibido insuficiente");
      return;
    }

    setProcessing(true);
    setError("");
    try {
      const saleData = {
        items: cart.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          nombre: item.nombre,
          presentacionId: item.presentacionId || null,
        })),
        metodoPago: paymentMethod,
        clienteId: selectedClient ? selectedClient.id : null,
        descuento: parseFloat(totalDiscount) || 0,
        montoRecibido: parseFloat(receivedAmount) || 0,
      };

      const res = await salesService.createSale(saleData);

      // Update cash if paid with cash
      if (paymentMethod === "EFECTIVO") {
        // Add the total sale amount to cash (assuming full payment or change handled)
        // Actually, if I receive 100 for a 50 sale, I keep 50.
        // So I add the sale total.
        setCurrentCash((prev) => prev + total);
      }

      setSuccess(`Venta completada. Cambio: Bs. ${res.cambio.toFixed(2)}`);

      // Store complete sale data for ticket
      setLastSaleData({
        ...saleData,
        id: res.id,
        fecha: new Date().toISOString(),
        items: cart,
        subtotal: subtotal,
        descuento: parseFloat(totalDiscount) || 0,
        total: total,
        cambio: res.cambio,
        usuario: user?.nombre
          ? `${user.nombre} ${user.apellido || ""}`.trim()
          : user?.username || "Cajero",
        cliente: selectedClient,
        metodoPagoTexto: paymentMethod,
      });

      // Open Success Modal
      setIsPaymentModalOpen(false);
      setIsSuccessModalOpen(true);
    } catch (err) {
      setError(typeof err === "string" ? err : "Error al procesar venta");
    } finally {
      setProcessing(false);
    }
  };

  // Helper icons
  const getCategoryIcon = (catName) => {
    const lower = catName?.toLowerCase() || "";
    if (lower.includes("cerveza")) return Beer;
    if (lower.includes("vino")) return Wine;
    if (
      lower.includes("licor") ||
      lower.includes("ron") ||
      lower.includes("whisky")
    )
      return GlassWater;
    return CircleDashed;
  };

  if (checkingRegister) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 shadow-sm">
        <Loader2 size={48} className="animate-spin text-primary-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Verificando Caja</h2>
        <p className="text-gray-500 mt-2">Por favor espere un momento...</p>
      </div>
    );
  }

  // Strict access control: if no register ID is present, do not render anything
  if (!openRegisterId) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-64px)] flex lg:grid lg:grid-cols-[1fr_390px] xl:grid-cols-[1fr_420px] gap-6 relative">
      {/* Left Side */}
      <div className="flex-1 flex flex-col gap-5 md:gap-6 h-full overflow-hidden w-full min-w-0 pb-20 lg:pb-0">
        {/* Header */}
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm shrink-0 transition-all hover:shadow-md">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Punto de Venta
            </h1>
            <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-1.5">
              <User size={14} className="text-primary-500" />
              {user?.nombre
                ? `${user.nombre} ${user.apellido || ""}`.trim()
                : user?.username || "Cajero"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Cash Display */}
            <div className="bg-gray-50 px-5 py-2.5 rounded-xl border border-gray-200 flex flex-col items-end hidden sm:flex">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">
                En Caja
              </div>
              <div className="text-xl font-black text-gray-900 font-mono leading-none">
                Bs.{" "}
                {currentCash.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenMovementModal("INGRESO_EXTRA")}
                className="p-2.5 bg-success-50 text-success-600 hover:bg-success-100 hover:text-success-700 rounded-xl transition-all border border-success-100 hover:shadow-sm"
                title="Ingresar Dinero"
              >
                <Plus size={20} />
              </button>
              <button
                onClick={() => handleOpenMovementModal("RETIRO")}
                className="p-2.5 bg-warning-50 text-warning-600 hover:bg-warning-100 hover:text-warning-700 rounded-xl transition-all border border-warning-100 hover:shadow-sm"
                title="Retirar Dinero"
              >
                <Minus size={20} />
              </button>
              <button
                onClick={() => setIsCloseRegisterModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-danger-50 text-danger-600 hover:bg-danger-100 hover:text-danger-700 rounded-xl transition-all font-bold border border-danger-100 hover:shadow-sm"
              >
                <LogOut size={18} />{" "}
                <span className="hidden sm:inline">Cerrar Caja</span>
              </button>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shrink-0 shadow-sm">
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar hide-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={clsx(
                "px-5 py-2.5 rounded-xl border-2 flex items-center gap-2.5 transition-all outline-none font-bold whitespace-nowrap text-sm",
                selectedCategory === "all"
                  ? "bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-500/30 -translate-y-0.5"
                  : "bg-white border-gray-100 text-gray-600 hover:border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-primary-500/20",
              )}
            >
              <CircleDashed size={18} /> Todos
            </button>
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.nombre);
              return (
                <button
                  key={cat.id}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === cat.id ? "all" : cat.id,
                    )
                  }
                  className={clsx(
                    "px-5 py-2.5 rounded-xl border-2 flex items-center gap-2.5 transition-all outline-none font-bold whitespace-nowrap text-sm",
                    selectedCategory === cat.id
                      ? "bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-500/30 -translate-y-0.5"
                      : "bg-white border-gray-100 text-gray-600 hover:border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-primary-500/20",
                  )}
                >
                  <Icon size={18} /> {cat.nombre}
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 bg-white p-6 rounded-2xl border border-gray-100 flex flex-col overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 p-2.5 bg-gray-50/50 border border-gray-200 rounded-xl mb-6 shrink-0 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
            <div className="flex-1 flex items-center gap-3 px-3">
              <Search size={22} className="text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-base font-medium text-gray-900 placeholder-gray-400"
              />
            </div>
            <div className="flex-1 flex items-center gap-3 px-3 border-l-2 border-gray-200 bg-white sm:bg-transparent rounded-lg sm:rounded-none py-2 sm:py-0">
              <ScanBarcode size={22} className="text-primary-500" />
              <input
                type="text"
                placeholder="Escanear código de barras..."
                className="flex-1 bg-transparent border-none outline-none text-base font-mono font-bold text-gray-900 placeholder-gray-400"
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    const code = e.currentTarget.value.trim();
                    if (!code) return;

                    // 1. Try to find in current products list (exact match)
                    const localMatch = products.find(
                      (p) =>
                        p.codigoBarras === code ||
                        p.codigoInterno === code ||
                        p.codigo === code,
                    );

                    if (localMatch) {
                      if (localMatch.stock > 0) {
                        handleProductClick(localMatch);
                        setSuccess(`Añadido: ${localMatch.nombre}`);
                        setTimeout(() => setSuccess(""), 1500);
                      } else {
                        setError(`Producto sin stock: ${localMatch.nombre}`);
                        setTimeout(() => setError(""), 2000);
                      }
                      e.currentTarget.value = "";
                      return;
                    }

                    // 2. If not found locally, search via API
                    try {
                      setLoadingProducts(true);
                      const res = await salesService.getProducts(code);
                      // Look for exact match in results
                      const exactMatch = res.find(
                        (p) =>
                          p.codigoBarras === code ||
                          p.codigoInterno === code ||
                          p.codigo === code,
                      );

                      if (exactMatch) {
                        if (exactMatch.stock > 0) {
                          handleProductClick(exactMatch);
                          setSuccess(`Añadido: ${exactMatch.nombre}`);
                          setTimeout(() => setSuccess(""), 1500);
                        } else {
                          setError(`Producto sin stock: ${exactMatch.nombre}`);
                          setTimeout(() => setError(""), 2000);
                        }
                      } else {
                        setError("Producto no encontrado");
                        setTimeout(() => setError(""), 2000);
                      }
                    } catch (err) {
                      console.error("Scan error:", err);
                    } finally {
                      setLoadingProducts(false);
                      e.currentTarget.value = "";
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {loadingProducts ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Loader2
                  size={32}
                  className="animate-spin mb-2 text-primary-500"
                />
                <p>Cargando productos...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <p>No se encontraron productos</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    disabled={product.stock <= 0}
                    className={clsx(
                      "bg-white border-2 border-gray-100 rounded-2xl p-3 flex flex-col gap-3 transition-all text-left group hover:shadow-lg hover:shadow-gray-200/50 outline-none focus:ring-4 focus:ring-primary-500/20",
                      product.stock > 0
                        ? "hover:border-primary-400 hover:-translate-y-1"
                        : "opacity-50 cursor-not-allowed filter grayscale-[50%]",
                    )}
                  >
                    <div className="w-full aspect-square bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 group-hover:text-primary-200 transition-colors overflow-hidden relative">
                      {product.imagen ? (
                        <img
                          src={
                            product.imagen.startsWith("http")
                              ? product.imagen
                              : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${product.imagen}`
                          }
                          alt={product.nombre}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        (() => {
                          const Icon = getCategoryIcon(product.category);
                          return <Icon size={48} strokeWidth={1.5} />;
                        })()
                      )}
                      {/* Add overlay if out of stock */}
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <span className="bg-danger-500 text-white text-[10px] uppercase font-black px-3 py-1 rounded-full shadow-lg transform -rotate-12">
                            Agotado
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-h-[60px] flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 truncate mb-1 uppercase tracking-wider">
                          {product.category}
                          {product.marca && (
                            <span className="text-primary-400">
                              {" "}
                              • {product.marca}
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-sm text-gray-900 leading-tight mb-2 line-clamp-2">
                          {product.nombre}
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-auto">
                        <span className="font-black text-lg text-primary-600 font-mono tracking-tight">
                          Bs.{parseFloat(product.precioVenta).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div
                      className={clsx(
                        "text-xs font-bold px-3 py-1 rounded-lg self-start border flex items-center gap-1.5",
                        product.stock > 0
                          ? "bg-success-50 text-success-700 border-success-100"
                          : "bg-danger-50 text-danger-700 border-danger-100",
                      )}
                    >
                      <Package size={14} />
                      Stock: {product.stock}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Cart */}
      {/* Mobile Cart Overlay */}
      {isMobileCartOpen && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileCartOpen(false)}
        />
      )}

      <div
        className={clsx(
          "bg-white flex flex-col overflow-hidden shadow-2xl lg:shadow-xl hover:shadow-2xl z-50 lg:z-10",
          "fixed lg:static inset-y-0 right-0 w-[90%] sm:w-[400px] lg:w-auto h-full lg:h-full lg:rounded-2xl lg:border lg:border-gray-100 transition-transform duration-300",
          isMobileCartOpen
            ? "translate-x-0"
            : "translate-x-full lg:translate-x-0",
          !isMobileCartOpen && "hidden lg:flex",
        )}
      >
        {/* Cart Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 shrink-0">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary-100/50 text-primary-600 flex items-center justify-center font-mono shadow-sm border border-primary-100">
              {cart.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
            Carrito
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="p-2.5 text-danger-500 hover:bg-danger-50 hover:text-danger-600 rounded-xl transition-all disabled:opacity-30 border border-transparent hover:border-danger-100"
              title="Limpiar Carrito"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={() => setIsMobileCartOpen(false)}
              className="lg:hidden p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-all border border-transparent"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-5 bg-white custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center opacity-70">
              <div className="w-24 h-24 mb-4 rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200">
                <ShoppingCart size={40} className="text-gray-300" />
              </div>
              <p className="font-bold text-gray-500">El carrito está vacío</p>
              <p className="text-sm text-gray-400 mt-1">
                Busca o escanea productos para agregarlos
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.cartKey}
                  className="flex flex-col p-4 bg-white rounded-xl border-2 border-gray-50 shadow-sm hover:border-primary-100 transition-colors group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-bold text-sm text-gray-800 leading-tight pr-2 uppercase">
                      {item.nombre}
                      {item.presentacionNombre &&
                        item.presentacionNombre !== "Unidad" && (
                          <span className="text-primary-500 font-black ml-1.5 bg-primary-50 px-2 py-0.5 rounded-md text-[10px]">
                            {item.presentacionNombre}
                          </span>
                        )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.cartKey)}
                      className="text-gray-300 hover:bg-danger-50 hover:text-danger-500 p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={16} strokeWidth={3} />
                    </button>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-0.5">
                      <button
                        onClick={() => updateQuantity(item.cartKey, -1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md text-gray-600 hover:shadow-sm transition-all shadow-none"
                      >
                        <Minus size={14} strokeWidth={3} />
                      </button>
                      <span className="w-10 text-center text-sm font-black text-gray-900 border-x border-gray-200/50">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cartKey, 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md text-gray-600 hover:shadow-sm transition-all shadow-none"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-gray-400 mb-0.5">
                        {item.quantity} x{" "}
                        {parseFloat(item.precioVenta).toFixed(2)}
                      </div>
                      <div className="text-base font-black text-primary-600 font-mono tracking-tight">
                        Bs.{" "}
                        {(Number(item.precioVenta) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary & Actions */}
        {/* Discount & Client Buttons */}
        <div className="p-5 bg-white border-t border-gray-100 grid grid-cols-2 gap-4">
          <button
            onClick={() => setIsClientModalOpen(true)}
            className={clsx(
              "flex items-center justify-center gap-2.5 py-3.5 rounded-xl border-2 font-black text-[13px] uppercase tracking-wide transition-all",
              selectedClient
                ? "border-primary-200 bg-primary-50 text-primary-700 shadow-inner"
                : "border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-700 hover:shadow-sm",
            )}
          >
            <User size={18} strokeWidth={2.5} />
            <span className="truncate max-w-[100px]">
              {selectedClient ? selectedClient.nombre.split(" ")[0] : "Cliente"}
            </span>
          </button>
          <button
            onClick={() => setIsDiscountModalOpen(true)}
            className={clsx(
              "flex items-center justify-center gap-2.5 py-3.5 rounded-xl border-2 font-black text-[13px] uppercase tracking-wide transition-all",
              discount > 0
                ? "border-amber-200 bg-amber-50 text-amber-700 shadow-inner"
                : "border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-700 hover:shadow-sm",
            )}
          >
            <Tag size={18} strokeWidth={2.5} />
            <span>{discount > 0 ? `- Bs. ${discount}` : "Descuento"}</span>
          </button>
        </div>

        <div className="bg-gray-50/80 border-t border-gray-200 shrink-0 p-6 rounded-b-2xl">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-3">
            <span>Subtotal</span>
            <span className="font-mono text-gray-800">
              Bs. {subtotal.toFixed(2)}
            </span>
          </div>

          {clientDiscountPercent > 0 && (
            <div className="flex justify-between items-center text-sm text-success-600 font-bold mb-3">
              <span className="flex items-center gap-1.5 bg-success-50 px-2 py-0.5 rounded-md">
                <User size={14} /> Desc. Cliente ({clientDiscountPercent}%)
              </span>
              <span className="font-mono">
                - Bs. {clientDiscountAmount.toFixed(2)}
              </span>
            </div>
          )}

          {discount > 0 && (
            <div className="flex justify-between items-center text-sm text-amber-600 font-bold mb-3">
              <span className="bg-amber-50 px-2 py-0.5 rounded-md">
                Descuento Manual
              </span>
              <span className="font-mono">
                - Bs. {Number(discount).toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center mb-5 pt-4 border-t-2 border-dashed border-gray-200">
            <span className="text-gray-900 font-black text-sm uppercase tracking-wider">
              TOTAL A PAGAR
            </span>
            <span className="text-3xl font-black text-primary-600 font-mono tracking-tighter">
              Bs. {total.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleProcessPayment}
            disabled={cart.length === 0}
            className="w-full py-4 bg-primary-600 text-white font-black text-base uppercase tracking-wider rounded-xl shadow-[0_8px_20px_-6px_rgba(14,165,233,0.5)] hover:bg-primary-700 hover:shadow-[0_12px_24px_-8px_rgba(14,165,233,0.6)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            <CreditCard size={22} strokeWidth={2.5} />
            <span>Procesar Pago</span>
          </button>
        </div>
      </div>

      {/* Mobile Cart FAB */}
      <button
        onClick={() => setIsMobileCartOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-30 bg-primary-600 text-white p-4 rounded-full shadow-[0_8px_20px_-6px_rgba(14,165,233,0.6)] hover:bg-primary-700 transition-transform active:scale-95 flex items-center gap-3 border-2 border-primary-500"
      >
        <div className="relative">
          <ShoppingCart size={24} />
          {cart.reduce((acc, item) => acc + item.quantity, 0) > 0 && (
            <span className="absolute -top-2 -right-2 bg-danger-500 text-white text-[10px] font-bold w-5 h-5 flex justify-center items-center rounded-full border border-white">
              {cart.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          )}
        </div>
        <div className="flex flex-col items-start hidden sm:flex">
          <span className="text-[10px] font-bold uppercase opacity-80 leading-none mb-1">
            Total a pagar
          </span>
          <span className="text-sm font-black font-mono leading-none">
            Bs. {total.toFixed(2)}
          </span>
        </div>
      </button>

      {/* Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsClientModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Seleccionar Cliente</h3>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                <button
                  onClick={() => setIsExpressMode(false)}
                  className={clsx(
                    "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
                    !isExpressMode
                      ? "bg-white text-primary-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  Lista
                </button>
                <button
                  onClick={() => setIsExpressMode(true)}
                  className={clsx(
                    "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
                    isExpressMode
                      ? "bg-white text-primary-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  Express
                </button>
              </div>

              {!isExpressMode ? (
                <>
                  <div className="relative mb-4">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Buscar cliente..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                    <button
                      onClick={() => {
                        setSelectedClient(null);
                        setClientDiscountPercent(0);
                        setIsClientModalOpen(false);
                      }}
                      className={clsx(
                        "w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3",
                        !selectedClient
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-gray-100 hover:bg-gray-50",
                      )}
                    >
                      <User size={20} />
                      <div>
                        <div className="font-bold text-sm">
                          Consumidor Final
                        </div>
                        <div className="text-xs opacity-70">
                          Cliente Genérico
                        </div>
                      </div>
                    </button>
                    {clients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => {
                          setSelectedClient(client);
                          // Aplicar descuento del cliente automáticamente
                          const pct = parseFloat(client.descuento) || 0;
                          setClientDiscountPercent(pct);
                          setIsClientModalOpen(false);
                        }}
                        className={clsx(
                          "w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3",
                          selectedClient?.id === client.id
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-100 hover:bg-gray-50",
                        )}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
                          {client.nombre.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-sm">
                            {client.nombre} {client.apellido || ""}
                          </div>
                          <div className="text-xs text-gray-500">
                            {client.cedula || client.ciNit || "Sin CI/NIT"}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Nombre / Razón Social
                    </label>
                    <input
                      type="text"
                      value={expressData.nombre}
                      onChange={(e) =>
                        setExpressData({
                          ...expressData,
                          nombre: e.target.value,
                        })
                      }
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm"
                      placeholder="Nombre del cliente..."
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      NIT / CI
                    </label>
                    <input
                      type="text"
                      value={expressData.ciNit}
                      onChange={(e) =>
                        setExpressData({
                          ...expressData,
                          ciNit: e.target.value,
                        })
                      }
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm font-mono"
                      placeholder="Número de documento..."
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!expressData.nombre.trim()) return;
                      setSelectedClient({
                        id: null,
                        nombre: expressData.nombre,
                        ciNit: expressData.ciNit,
                        isExpress: true,
                      });
                      setIsClientModalOpen(false);
                    }}
                    disabled={!expressData.nombre.trim()}
                    className="w-full py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50"
                  >
                    Confirmar Datos
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setIsDiscountModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Tag size={20} className="text-amber-500" />
                Aplicar Descuento
              </h3>
              <button
                onClick={() => setIsDiscountModalOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-5">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Monto a Descontar (Bs)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-lg">
                    Bs.
                  </span>
                  <input
                    type="number"
                    value={tempDiscount}
                    onChange={(e) => setTempDiscount(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl font-mono text-2xl font-black focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
                <div className="flex justify-between items-center mt-3 px-1 text-sm">
                  <span className="text-gray-500 font-medium">Subtotal:</span>
                  <span className="font-mono font-bold text-gray-900">
                    Bs. {subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDiscount(0);
                    setTempDiscount("");
                    setIsDiscountModalOpen(false);
                  }}
                  className="flex-1 py-3 text-gray-600 font-bold border-2 border-gray-200 hover:bg-gray-50 hover:text-gray-800 rounded-xl transition-all"
                >
                  Quitar Ajuste
                </button>
                <button
                  onClick={() => {
                    const val = parseFloat(tempDiscount);
                    if (!isNaN(val) && val >= 0) {
                      setDiscount(val > subtotal ? subtotal : val);
                      setIsDiscountModalOpen(false);
                    }
                  }}
                  className="flex-1 py-3 bg-amber-500 text-white font-black uppercase text-[13px] tracking-wider rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {/* Close Register Modal */}
      {isCloseRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() =>
              !closingRegister && setIsCloseRegisterModalOpen(false)
            }
          ></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 p-8 text-center border border-gray-100">
            {/* Header */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-primary-100 transform rotate-3">
                <Calculator size={40} className="transform -rotate-3" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Cerrar Caja
              </h2>
            </div>

            {/* System Balance */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="text-sm text-gray-500 mb-1">
                Saldo según sistema:
              </div>
              <div className="text-3xl font-black text-gray-900 tracking-tight">
                Bs.{" "}
                {currentCash.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>

            {/* Physical Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Monto físico en caja:
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={closeAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || parseFloat(val) >= 0) {
                      setCloseAmount(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e") e.preventDefault();
                  }}
                  className="w-full text-center py-3 px-4 border-2 border-primary-500 rounded-xl font-mono text-2xl font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>

            {/* Difference Feedback */}
            {closeAmount !== "" && (
              <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                {(() => {
                  const physical = parseFloat(closeAmount) || 0;
                  const diff = physical - currentCash;
                  const diffAbs = Math.abs(diff);

                  if (Math.abs(diff) < 0.01) {
                    return (
                      <div className="bg-success-50 text-success-700 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold border border-success-100">
                        <CheckCircle2 size={20} /> ¡CUADRA PERFECTO!
                      </div>
                    );
                  } else if (diff > 0) {
                    return (
                      <div className="bg-blue-50 text-blue-700 py-3 px-4 rounded-xl flex flex-col items-center border border-blue-100">
                        <div className="text-xs text-blue-500 font-bold uppercase mb-1">
                          Diferencia:
                        </div>
                        <div className="flex items-center gap-1 font-bold text-lg">
                          <ArrowUp size={20} /> Sobrante: Bs.{" "}
                          {diffAbs.toFixed(2)}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-primary-50 text-primary-700 py-3 px-4 rounded-xl flex flex-col items-center border border-primary-100">
                        <div className="text-xs text-primary-500 font-bold uppercase mb-1">
                          Diferencia:
                        </div>
                        <div className="flex items-center gap-1 font-bold text-lg">
                          <ArrowDown size={20} /> Faltante: Bs.{" "}
                          {diffAbs.toFixed(2)}
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            )}

            {/* Observation - Hidden based on request or kept? Screenshots didn't show it clearly but usually needed. 
                User said "igual que las imagenes". Images don't show textarea.
                I will hide it or make it very subtle or remove it if strictly following images.
                User said "Tanto que si falta o sobra o cuadra perfecto la caja en dinero."
                I will remove the observation textarea to match the clean design in screenshots. 
                If needed, I can add it back later.
            */}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsCloseRegisterModalOpen(false)}
                className="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseRegister}
                disabled={closingRegister || closeAmount === ""}
                className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {closingRegister ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  "Cerrar Caja"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => !processing && setIsPaymentModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="bg-primary-600 p-5 text-white flex justify-between items-center">
              <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                <CreditCard size={20} />
                Confirmar Pago
              </h2>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="hover:bg-black/10 p-1.5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-success-100 text-success-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ScanBarcode size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    ¡Venta Exitosa!
                  </h3>
                  <p className="text-gray-500">{success}</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center mb-6 py-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Total a Pagar
                      </span>
                      <span className="text-4xl font-black text-primary-600 font-mono tracking-tighter">
                        Bs. {total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-5 p-3.5 bg-danger-50 text-danger-700 text-sm rounded-xl border border-danger-100 font-bold flex items-center gap-2">
                      <AlertCircle size={18} className="shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={() => setPaymentMethod("EFECTIVO")}
                      className={clsx(
                        "p-4 rounded-xl border-2 flex flex-col items-center gap-2.5 transition-all outline-none focus:ring-4 focus:ring-primary-500/20",
                        paymentMethod === "EFECTIVO"
                          ? "border-primary-500 bg-primary-50 text-primary-700 shadow-inner"
                          : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50",
                      )}
                    >
                      <div
                        className={clsx(
                          "p-2 rounded-full",
                          paymentMethod === "EFECTIVO"
                            ? "bg-primary-100"
                            : "bg-gray-100",
                        )}
                      >
                        <Banknote size={24} />
                      </div>
                      <span className="text-sm font-black uppercase tracking-wider">
                        Efectivo
                      </span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("QR")}
                      className={clsx(
                        "p-4 rounded-xl border-2 flex flex-col items-center gap-2.5 transition-all outline-none focus:ring-4 focus:ring-primary-500/20",
                        paymentMethod === "QR"
                          ? "border-primary-500 bg-primary-50 text-primary-700 shadow-inner"
                          : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50",
                      )}
                    >
                      <div
                        className={clsx(
                          "p-2 rounded-full",
                          paymentMethod === "QR"
                            ? "bg-primary-100"
                            : "bg-gray-100",
                        )}
                      >
                        <QrCode size={24} />
                      </div>
                      <span className="text-sm font-black uppercase tracking-wider">
                        QR
                      </span>
                    </button>
                  </div>

                  {paymentMethod === "EFECTIVO" && (
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                        Monto Recibido
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                          Bs.
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={receivedAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || parseFloat(val) >= 0) {
                              setReceivedAmount(val);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "-" || e.key === "e") {
                              e.preventDefault();
                            }
                          }}
                          className={clsx(
                            "w-full pl-10 pr-4 py-3 border-2 rounded-xl font-mono text-xl font-bold transition-colors outline-none",
                            Number(receivedAmount) > 0 &&
                              Number(receivedAmount) < total
                              ? "border-primary-200 bg-primary-50 text-primary-900 focus:border-primary-500"
                              : "border-gray-200 bg-gray-50 text-gray-900 focus:border-primary-500 bg-white",
                          )}
                          autoFocus
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex justify-between items-center mt-2 px-1">
                        <span className="text-xs font-bold text-gray-400">
                          {Number(receivedAmount) < total
                            ? "Falta:"
                            : "Cambio:"}
                        </span>
                        <span
                          className={clsx(
                            "font-bold font-mono",
                            Number(receivedAmount) < total
                              ? "text-primary-600"
                              : "text-success-600",
                          )}
                        >
                          Bs. {Math.abs(change).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleConfirmPayment}
                    disabled={
                      processing ||
                      (paymentMethod === "EFECTIVO" &&
                        Number(receivedAmount) < total)
                    }
                    className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />{" "}
                        Procesando...
                      </>
                    ) : (
                      <>
                        Confirmar Venta <ScanBarcode size={20} />
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => !processingMovement && setIsMovementModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <h3 className="text-lg font-black text-gray-900">
                {movementType === "INGRESO_EXTRA"
                  ? "Ingresar Dinero"
                  : "Retirar Dinero"}
              </h3>
              <button
                onClick={() => setIsMovementModalOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {error && (
                <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl text-sm mb-5 font-bold flex items-center gap-2">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
              <div className="mb-5">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Monto (Bs)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-lg">
                    Bs.
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={movementAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || parseFloat(val) >= 0) {
                        setMovementAmount(val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e") {
                        e.preventDefault();
                      }
                    }}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl font-mono text-2xl font-black focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Descripción
                </label>
                <textarea
                  value={movementDesc}
                  onChange={(e) => setMovementDesc(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none resize-none transition-all"
                  rows={2}
                  placeholder={
                    movementType === "INGRESO_EXTRA"
                      ? "Ej: Cambio inicial..."
                      : "Ej: Pago de servicios..."
                  }
                />
              </div>
              <button
                onClick={handleProcessMovement}
                disabled={processingMovement || !movementAmount}
                className={clsx(
                  "w-full py-4 text-white font-black uppercase tracking-wider text-[13px] rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50",
                  movementType === "INGRESO_EXTRA"
                    ? "bg-success-600 hover:bg-success-700 shadow-[0_8px_20px_-6px_rgba(22,163,74,0.5)] hover:-translate-y-0.5"
                    : "bg-warning-500 hover:bg-warning-600 shadow-[0_8px_20px_-6px_rgba(245,158,11,0.5)] hover:-translate-y-0.5",
                )}
              >
                {processingMovement ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : movementType === "INGRESO_EXTRA" ? (
                  <>
                    <Plus size={18} strokeWidth={3} /> Confirmar Ingreso
                  </>
                ) : (
                  <>
                    <Minus size={18} strokeWidth={3} /> Confirmar Retiro
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && lastSaleData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 text-center p-8 border border-gray-100">
            <div className="w-20 h-20 bg-success-50 text-success-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner border border-success-100 transform -rotate-3">
              <CheckCircle2 size={40} className="transform rotate-3" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
              ¡Venta Exitosa!
            </h2>
            <div className="text-4xl font-black text-success-600 font-mono mb-8 tracking-tighter">
              Bs. {lastSaleData.total.toFixed(2)}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setIsTicketModalOpen(true)}
                className="w-full py-4 bg-primary-600 text-white font-black uppercase tracking-wider text-[13px] rounded-xl shadow-[0_8px_20px_-6px_rgba(14,165,233,0.5)] hover:bg-primary-700 hover:shadow-[0_12px_24px_-8px_rgba(14,165,233,0.6)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <FileText size={18} strokeWidth={2.5} /> Ver Ticket
              </button>
              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setLastSaleData(null);
                  clearCart();
                  setSuccess("");
                  fetchProducts();
                }}
                className="w-full py-4 bg-white border-2 border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[13px] rounded-xl hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all"
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {isTicketModalOpen && lastSaleData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsTicketModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 print:hidden">
              <h3 className="font-bold text-gray-900">Vista Previa</h3>
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Ticket Content (Scrollable) */}
            <div className="overflow-y-auto flex-1 p-8 pt-12 bg-gray-50 print:p-0 print:bg-white print:overflow-visible">
              <style>{`
                @media print {
                  @page {
                    size: 80mm auto;
                    margin: 0;
                  }
                  body {
                    margin: 0;
                  }
                }
              `}</style>
              <div
                id="print-area"
                className="bg-white p-6 shadow-sm mx-auto max-w-[300px] text-xs font-mono leading-relaxed print:shadow-none print:max-w-none print:w-full"
              >
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="w-20 h-20 bg-white border border-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2 overflow-hidden">
                    {settings.empresa_logo ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${settings.empresa_logo}`}
                        alt="Logo"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-900 text-white flex items-center justify-center print:text-black print:border print:border-black">
                        <Beer size={32} />
                      </div>
                    )}
                  </div>
                  <h2 className="font-bold text-base uppercase mb-1">
                    {settings.empresa_nombre}
                  </h2>
                  <p>{settings.empresa_direccion}</p>
                  <p className="text-[10px] text-gray-500">
                    NIT: {settings.empresa_nit}
                  </p>
                </div>

                <div className="border-b-2 border-dashed border-gray-300 my-2"></div>

                {/* Info */}
                <div className="mb-2">
                  <div className="flex justify-between">
                    <span>FECHA:</span>
                    <span>
                      {new Date(lastSaleData.fecha).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>HORA:</span>
                    <span>
                      {new Date(lastSaleData.fecha).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>CAJERO:</span>
                    <span className="uppercase">{lastSaleData.usuario}</span>
                  </div>
                </div>

                <div className="border-b-2 border-dashed border-gray-300 my-2"></div>

                {/* Client */}
                <div className="mb-2">
                  <div className="flex justify-between">
                    <span className="font-bold">CLIENTE:</span>
                    <span className="text-right text-[10px] break-words max-w-[150px]">
                      {lastSaleData.cliente
                        ? `${lastSaleData.cliente.nombre} ${lastSaleData.cliente.apellido || ""}`.trim()
                        : "S/N"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">NIT/CI:</span>
                    <span>
                      {lastSaleData.cliente
                        ? lastSaleData.cliente.cedula ||
                          lastSaleData.cliente.ciNit ||
                          lastSaleData.cliente.ci ||
                          "0"
                        : "0"}
                    </span>
                  </div>
                </div>

                <div className="border-b-2 border-dashed border-gray-300 my-2"></div>

                {/* Items */}
                <div className="mb-2">
                  <div className="flex justify-between font-bold mb-1 border-b border-gray-200 pb-1">
                    <span>DESCRIPCION</span>
                    <span>TOTAL</span>
                  </div>
                  {lastSaleData.items.map((item, idx) => (
                    <div key={idx} className="mb-2">
                      <div className="uppercase font-medium text-[10px] mb-0.5">
                        {item.nombre}
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-gray-500 pl-2">
                          {item.quantity} x{" "}
                          {parseFloat(item.precioVenta).toFixed(2)}
                        </span>
                        <span className="font-medium">
                          {(item.quantity * item.precioVenta).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-b-2 border-dashed border-gray-300 my-2"></div>

                {/* Totals */}
                <div className="mb-2 space-y-1">
                  {lastSaleData.descuento > 0 && (
                    <>
                      <div className="flex justify-between text-[10px]">
                        <span>SUBTOTAL:</span>
                        <span>Bs. {lastSaleData.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span>DESCUENTO:</span>
                        <span>- Bs. {lastSaleData.descuento.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-dotted border-gray-300">
                    <span>TOTAL A PAGAR</span>
                    <span>Bs. {lastSaleData.total.toFixed(2)}</span>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between text-[10px]">
                      <span>METODO PAGO:</span>
                      <span className="uppercase font-bold">
                        {lastSaleData.metodoPagoTexto}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>EFECTIVO RECIBIDO:</span>
                      <span>
                        Bs.{" "}
                        {parseFloat(lastSaleData.montoRecibido || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>CAMBIO:</span>
                      <span>
                        Bs. {parseFloat(lastSaleData.cambio || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-b-2 border-dashed border-gray-300 my-2"></div>

                <div className="text-center mt-4">
                  <p className="font-bold uppercase">
                    {settings.empresa_mensaje_recibo ||
                      "¡GRACIAS POR SU COMPRA!"}
                  </p>
                  <p className="text-[10px] mt-1">Vuelva pronto</p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-100 flex gap-3 print:hidden bg-white">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                <ScanBarcode size={18} /> Imprimir
              </button>
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>

            {/* CSS Print Styles */}
            <style jsx>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #print-area,
                #print-area * {
                  visibility: visible;
                }
                #print-area {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  margin: 0;
                  padding: 0;
                  box-shadow: none;
                }
              }
            `}</style>
          </div>
        </div>
      )}
      {/* Presentation Selector Modal */}
      {isPresentationModalOpen && presentationProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsPresentationModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900">
                Seleccionar Presentación
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 uppercase">
                {presentationProduct.nombre}
              </p>
            </div>
            <div className="p-4 space-y-2">
              {(presentationProduct.presentaciones || []).map((pres) => {
                const availableQty = Math.floor(
                  presentationProduct.stock / pres.cantidadBase,
                );
                return (
                  <button
                    key={pres.id}
                    disabled={availableQty <= 0}
                    onClick={() => {
                      addToCart(presentationProduct, pres);
                      setIsPresentationModalOpen(false);
                      setPresentationProduct(null);
                    }}
                    className={clsx(
                      "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left",
                      availableQty > 0
                        ? "border-gray-200 hover:border-primary-400 hover:bg-primary-50"
                        : "border-gray-100 opacity-50 cursor-not-allowed",
                    )}
                  >
                    <div>
                      <div className="font-bold text-sm text-gray-900">
                        {pres.nombre}
                      </div>
                      <div className="text-xs text-gray-500">
                        {pres.cantidadBase === 1
                          ? "1 unidad"
                          : `${pres.cantidadBase} unidades`}
                        <span className="ml-2 text-success-600 font-medium">
                          Disponible: {availableQty}
                        </span>
                      </div>
                    </div>
                    <div className="text-lg font-black text-primary-600 font-mono">
                      Bs. {pres.precioVenta.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setIsPresentationModalOpen(false)}
                className="w-full py-2 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
