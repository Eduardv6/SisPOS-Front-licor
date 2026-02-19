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
} from "lucide-react";
import clsx from "clsx";
import { salesService } from "../services/salesService";
import { categoryService } from "../services/categoryService";
import { customerService } from "../services/customerService";
import { cashRegisterService } from "../services/cashRegisterService";
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
        cajaId: openRegisterId,
        tipo: movementType,
        monto: parseFloat(movementAmount),
        descripcion: movementDesc,
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
    const fetchOpenRegister = async () => {
      try {
        const res = await cashRegisterService.getAll();
        const registers = res.data || [];
        // Find open register for current user (or any open if user check is loose)
        const myRegister = registers.find((c) => c.estado === "ABIERTA");
        if (myRegister) {
          setOpenRegisterId(myRegister.id);
          try {
            // Get details to calculate current cash
            const detailRes = await cashRegisterService.getDetail(
              myRegister.id,
            );
            const detail = detailRes;
            // Calculate initial + movements
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
            // Fallback to basic init if details fail
            setCurrentCash(parseFloat(myRegister.montoInicial || 0));
          }
        } else {
          // No open register found, redirect to Apertura de Caja
          navigate("/apertura-caja");
        }
      } catch (err) {
        console.error("Error fetching open register", err);
      }
    };
    fetchOpenRegister();
  }, []);

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
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [tempDiscount, setTempDiscount] = useState("");

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
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        // Validar stock si se desea, aunque el backend valida
        if (existing.quantity >= product.stock) {
          // Opcional: Alerta de stock maximo alcanzado en UI
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          // Validar stock
          const product = products.find((p) => p.id === id) || item; // item tiene datos, pero stock actualizado esta en products
          if (product && newQty > product.stock) return item;
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedClient(null);
    setDiscount(0);
    setTempDiscount("");
    setReceivedAmount("");
    setClientSearch("");
    setPaymentMethod("EFECTIVO");
  };

  // Totals
  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.precioVenta) * item.quantity,
    0,
  );
  // discount is state
  const total = Math.max(0, subtotal - discount);

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
        })),
        metodoPago: paymentMethod,
        clienteId: selectedClient ? selectedClient.id : null,
        descuento: parseFloat(discount) || 0,
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
        descuento: parseFloat(discount) || 0,
        total: total,
        cambio: res.cambio,
        usuario: user?.nombre || "Cajero",
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

  return (
    <div className="h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
      {/* Left Side */}
      <div className="flex flex-col gap-6 h-full overflow-hidden">
        {/* Header */}
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Punto de Venta</h1>
            <p className="text-xs text-gray-500">
              Atendiendo como: {user?.nombre || "Cajero"}
            </p>
          </div>

          {/* Cash Display */}
          <div className="bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              En Caja
            </div>
            <div className="text-xl font-bold text-gray-900 font-mono">
              Bs.{" "}
              {currentCash.toLocaleString("es-BO", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenMovementModal("INGRESO_EXTRA")}
              className="flex items-center gap-2 px-3 py-2 bg-success-50 text-success-700 hover:bg-success-100 rounded-lg transition-colors text-xs font-bold border border-success-200"
            >
              <Plus size={16} /> Ingresar
            </button>
            <button
              onClick={() => handleOpenMovementModal("RETIRO")}
              className="flex items-center gap-2 px-3 py-2 bg-warning-50 text-warning-700 hover:bg-warning-100 rounded-lg transition-colors text-xs font-bold border border-warning-200"
            >
              <Minus size={16} /> Retirar
            </button>
            <button
              onClick={() => setIsCloseRegisterModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-danger-50 text-danger-700 hover:bg-danger-100 rounded-lg transition-colors text-xs font-bold border border-danger-200"
            >
              <LogOut size={16} /> Cerrar
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shrink-0">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">Categorías</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={clsx(
                "px-4 py-2 rounded-lg border flex items-center gap-2 transition-all text-xs font-bold whitespace-nowrap",
                selectedCategory === "all"
                  ? "bg-primary-600 border-primary-600 text-white"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
              )}
            >
              <CircleDashed size={16} /> Todos
            </button>
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.nombre);
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={clsx(
                    "px-4 py-2 rounded-lg border flex items-center gap-2 transition-all text-xs font-bold whitespace-nowrap",
                    selectedCategory === cat.id
                      ? "bg-primary-600 border-primary-600 text-white"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
                  )}
                >
                  <Icon size={16} /> {cat.nombre}
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 bg-white p-6 rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-3 p-2 bg-gray-50 border border-gray-200 rounded-lg mb-4 shrink-0">
            <div className="flex-1 flex items-center gap-2 px-2">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-500"
              />
            </div>
            <div className="w-px bg-gray-300 hidden sm:block"></div>
            <div className="flex-1 flex items-center gap-2 px-2">
              <ScanBarcode size={18} className="text-primary-500" />
              <input
                type="text"
                placeholder="Escanear código..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-500 font-mono"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    // Logic to find product by code and add to cart
                    const code = e.currentTarget.value;
                    // Implement scan logic here or reuse search query if unified
                    setSearchQuery(code); // Temporary simple binding
                    e.currentTarget.value = "";
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
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className={clsx(
                      "bg-gray-50 border-2 border-gray-200 rounded-lg p-3 flex flex-col gap-2 hover:bg-white transition-all text-left group",
                      product.stock > 0
                        ? "hover:border-primary-500 hover:-translate-y-0.5 hover:shadow-md"
                        : "opacity-60 cursor-not-allowed",
                    )}
                  >
                    <div className="w-full aspect-square bg-white rounded flex items-center justify-center text-gray-300 group-hover:text-primary-100 transition-colors overflow-hidden relative">
                      {product.imagen ? (
                        <img
                          src={`http://localhost:5000${product.imagen}`}
                          alt={product.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (() => {
                          const Icon = getCategoryIcon(product.category);
                          return <Icon size={32} />;
                        })()
                      )}
                    </div>
                    <div className="flex-1 min-h-[50px]">
                      <div className="font-bold text-[10px] text-gray-900 leading-tight mb-1 line-clamp-2 uppercase">
                        {product.nombre}
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="font-bold text-sm text-primary-600 font-mono">
                          Bs.{parseFloat(product.precioVenta).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div
                      className={clsx(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full self-start",
                        product.stock > 0
                          ? "bg-success-100 text-success-700"
                          : "bg-danger-100 text-danger-700",
                      )}
                    >
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
      {/* Reduced width implied by grid-cols-[1fr_380px] */}
      <div className="h-full bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden shadow-xl z-10">
        {/* Cart Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
              {cart.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
            Carrito
          </h2>
          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors disabled:opacity-30"
            title="Limpiar Carrito"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 bg-white custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center opacity-40">
              <Tag size={48} className="mb-2" />
              <p className="font-medium">Carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col p-3 bg-gray-50/80 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-xs text-gray-800 leading-tight pr-2 uppercase">
                      {item.nombre}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-300 hover:text-danger-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center bg-white rounded border border-gray-200 shadow-sm">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-gray-600"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-gray-600"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500">
                        {item.quantity} x{" "}
                        {parseFloat(item.precioVenta).toFixed(2)}
                      </div>
                      <div className="text-sm font-bold text-primary-700 font-mono">
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
        <div className="p-4 bg-white border-t border-gray-100 grid grid-cols-2 gap-3">
          <button
            onClick={() => setIsClientModalOpen(true)}
            className={clsx(
              "flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all",
              selectedClient
                ? "border-primary-200 bg-primary-50 text-primary-700"
                : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50",
            )}
          >
            <User size={18} />
            <span className="truncate max-w-[100px]">
              {selectedClient ? selectedClient.nombre.split(" ")[0] : "Cliente"}
            </span>
          </button>
          <button
            onClick={() => setIsDiscountModalOpen(true)}
            className={clsx(
              "flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all",
              discount > 0
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50",
            )}
          >
            <Tag size={18} />
            <span>{discount > 0 ? `- Bs. ${discount}` : "Descuento"}</span>
          </button>
        </div>

        <div className="bg-gray-50 border-t border-gray-200 shrink-0 p-4">
          <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
            <span>Subtotal</span>
            <span className="font-mono">Bs. {subtotal.toFixed(2)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between items-center text-sm text-amber-600 font-bold mb-2">
              <span>Descuento</span>
              <span className="font-mono">
                - Bs. {Number(discount).toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center mb-4 pt-2 border-t border-gray-200">
            <span className="text-gray-600 font-bold text-sm">
              TOTAL A PAGAR
            </span>
            <span className="text-2xl font-black text-gray-900 font-mono tracking-tight">
              Bs. {total.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleProcessPayment}
            disabled={cart.length === 0}
            className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <CreditCard size={18} /> Procesar Pago
          </button>
        </div>
      </div>

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
                    <div className="font-bold text-sm">Consumidor Final</div>
                    <div className="text-xs opacity-70">Cliente Genérico</div>
                  </div>
                </button>
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => {
                      setSelectedClient(client);
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
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsDiscountModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Aplicar Descuento</h3>
              <button
                onClick={() => setIsDiscountModalOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Monto a Descontar (Bs)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500">
                    Bs.
                  </span>
                  <input
                    type="number"
                    value={tempDiscount}
                    onChange={(e) => setTempDiscount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl font-mono text-lg font-bold focus:border-primary-500 focus:ring-0 outline-none"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Subtotal actual:{" "}
                  <span className="font-mono font-bold">
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
                  className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Quitar
                </button>
                <button
                  onClick={() => {
                    const val = parseFloat(tempDiscount);
                    if (!isNaN(val) && val >= 0) {
                      setDiscount(val > subtotal ? subtotal : val);
                      setIsDiscountModalOpen(false);
                    }
                  }}
                  className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 text-sm"
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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() =>
              !closingRegister && setIsCloseRegisterModalOpen(false)
            }
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 p-6 text-center">
            {/* Header */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                <Calculator size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Cerrar Caja</h2>
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
                      <div className="bg-danger-50 text-danger-700 py-3 px-4 rounded-xl flex flex-col items-center border border-danger-100">
                        <div className="text-xs text-danger-500 font-bold uppercase mb-1">
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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !processing && setIsPaymentModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="bg-primary-600 p-4 text-white flex justify-between items-center">
              <h2 className="font-bold text-lg">Confirmar Pago</h2>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="hover:bg-white/20 p-1 rounded-full"
              >
                <X size={18} />
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
                  <div className="flex justify-center mb-6">
                    <span className="text-4xl font-black text-gray-900 font-mono">
                      Bs. {total.toFixed(2)}
                    </span>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-danger-50 text-danger-700 text-xs rounded-lg border border-danger-100 font-bold">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => setPaymentMethod("EFECTIVO")}
                      className={clsx(
                        "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                        paymentMethod === "EFECTIVO"
                          ? "border-primary-500 bg-primary-50 text-primary-700 font-bold"
                          : "border-gray-200 text-gray-500 hover:border-gray-300",
                      )}
                    >
                      <Banknote size={24} />
                      <span className="text-xs">Efectivo</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("QR")}
                      className={clsx(
                        "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                        paymentMethod === "QR"
                          ? "border-primary-500 bg-primary-50 text-primary-700 font-bold"
                          : "border-gray-200 text-gray-500 hover:border-gray-300",
                      )}
                    >
                      <QrCode size={24} />
                      <span className="text-xs">QR</span>
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
                              ? "border-danger-200 bg-danger-50 text-danger-900 focus:border-danger-500"
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
                              ? "text-danger-600"
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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !processingMovement && setIsMovementModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">
                {movementType === "INGRESO_EXTRA"
                  ? "Ingresar Dinero"
                  : "Retirar Dinero"}
              </h3>
              <button
                onClick={() => setIsMovementModalOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {error && (
                <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Monto (Bs)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500">
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
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl font-mono text-lg font-bold focus:border-primary-500 focus:ring-0 outline-none"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Descripción
                </label>
                <textarea
                  value={movementDesc}
                  onChange={(e) => setMovementDesc(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-primary-500 focus:ring-0 outline-none resize-none"
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
                  "w-full py-3 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50",
                  movementType === "INGRESO_EXTRA"
                    ? "bg-success-600 hover:bg-success-700 shadow-success-500/20"
                    : "bg-warning-600 hover:bg-warning-700 shadow-warning-500/20",
                )}
              >
                {processingMovement ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : movementType === "INGRESO_EXTRA" ? (
                  <>
                    <Plus size={18} /> Confirmar Ingreso
                  </>
                ) : (
                  <>
                    <Minus size={18} /> Confirmar Retiro
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 text-center p-6">
            <div className="w-16 h-16 bg-success-100 text-success-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              ¡Venta Exitosa!
            </h2>
            <div className="text-3xl font-black text-success-600 font-mono mb-6">
              Bs. {lastSaleData.total.toFixed(2)}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setIsTicketModalOpen(true)}
                className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <FileText size={18} /> Ver Ticket
              </button>
              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setLastSaleData(null);
                  clearCart();
                  setSuccess("");
                  fetchProducts();
                }}
                className="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cerrar
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
                  <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-2 print:text-black print:border print:border-black">
                    <Beer size={24} />
                  </div>
                  <h2 className="font-bold text-base uppercase mb-1">
                    Licorería
                  </h2>
                  <p>Sucursal Central</p>
                  <p className="text-[10px] text-gray-500">NIT: 123456789</p>
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
                  <p className="font-bold">¡GRACIAS POR SU COMPRA!</p>
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
    </div>
  );
}
