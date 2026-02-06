'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// --- Interfaces ---
interface Producto {
  idproducto: number;
  nombre_producto: string;
  codigo_barra: string;
  precio_venta: string | number;
  precio_venta_mayoreo: string | number;
  precio_venta_3: string | number;
  stock: string | number;
}

interface CartItem extends Producto {
  cantidad: number;
  precio_numerico: number;
  fecha_vencimiento?: string | null;
}

interface Batch {
  fecha_vencimiento: string;
  cantidad_perecedero: number;
}

interface Cliente {
  idcliente: number;
  nombre_cliente: string;
}

interface Comprobante {
  idcomprobante: number;
  nombre_comprobante: string;
  serie: string;
  siguiente_numero: number;
  disponibles: number;
}

// ROLES PERMITIDOS
const ROLES_PERMITIDOS = [1, 2];

export default function POS() {
  const router = useRouter();
  const isProcessing = useRef(false);
  
  // REFERENCIA PARA EL INPUT DE BÚSQUEDA (SCANNER)
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // =========================================
  // ESTADOS
  // =========================================

  const [user, setUser] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean | null>(null);
  const [registerDetails, setRegisterDetails] = useState<any>(null);
  const [cashAmount, setCashAmount] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);

  const [products, setProducts] = useState<Producto[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customers, setCustomers] = useState<Cliente[]>([]);
  const [tipoComprobantes, setTipoComprobantes] = useState<Comprobante[]>([]); // New state for receipt types
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    idCliente: 1, 
    metodoPago: 'Efectivo',
    condicion: 'Contado',
    recibido: '',
    notas: '',
    idComprobante: 1 // Default to Ticket (ID 1)
  });

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Producto | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const total = cart.reduce((sum, item) => sum + (item.cantidad * item.precio_numerico), 0);
  const montoRecibido = parseFloat(paymentForm.recibido) || 0;
  const cambio = Math.max(0, montoRecibido - total);
  const faltante = Math.max(0, total - montoRecibido);

  const userRole = user ? Number(user.tipo_usuario) : 0;
  const canEditPrice = ROLES_PERMITIDOS.includes(userRole);

  // =========================================
  // EFECTOS
  // =========================================

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => {
        if (!res.ok) throw new Error('No autorizado');
        return res.json();
      })
      .then(data => {
        setUser(data.user);
        setLoadingSession(false);
        checkRegisterStatus();
        fetchCustomers();
        // Fetch receipt types
        fetch('/api/settings/comprobantes')
          .then(res => res.json())
          .then(comprobantes => {
            setTipoComprobantes(comprobantes);
            if (comprobantes.length > 0) {
                // Set default if available, otherwise keep 1
               setPaymentForm(prev => ({ ...prev, idComprobante: comprobantes[0].idcomprobante }));
            }
          })
          .catch(err => console.error("Error fetching comprobantes", err));
      })
      .catch(() => {
        router.push('/login');
      });
  }, []);

  // Buscador Live (mantiene la lista actualizada visualmente)
  useEffect(() => {
    if (isRegisterOpen) {
      const timer = setTimeout(() => {
        setPage(1); 
        fetchProducts(search, 1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search, isRegisterOpen]);

  // EFECTO PARA REGRESAR EL FOCO AL CERRAR MODALES
  useEffect(() => {
    if (!showBatchModal && !showPaymentModal && !showCloseModal && !loading) {
       // Pequeño delay para asegurar que el DOM está listo
       setTimeout(() => {
         searchInputRef.current?.focus();
       }, 100);
    }
  }, [showBatchModal, showPaymentModal, showCloseModal, loading]);

  // =========================================
  // LÓGICA DE NEGOCIO
  // =========================================

  const handleLogout = async () => {
    document.cookie = "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.location.href = '/login';
  };

  const checkRegisterStatus = async () => {
    try {
      const res = await fetch('/api/cashbox');
      const data = await res.json();
      setIsRegisterOpen(data.isOpen);
      if (data.isOpen) {
        setRegisterDetails(data.data);
        fetchProducts('', 1);
      }
    } catch (error) { console.error(error); }
  };

  const handleRegisterAction = async (action: 'open' | 'close') => {
    if (!cashAmount) return alert("Por favor ingresa un monto.");
    try {
      const res = await fetch('/api/cashbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, amount: parseFloat(cashAmount) })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Operación exitosa');
        setCashAmount('');
        setShowCloseModal(false);
        checkRegisterStatus();
      } else alert(data.error);
    } catch (e) { alert("Error de conexión"); }
  };

  const fetchProducts = async (term: string, pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?q=${term}&page=${pageNum}&limit=24`);
      const data = await res.json();
      
      if (data.data && Array.isArray(data.data)) {
        setProducts(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.total);
        setPage(data.pagination.currentPage);
      } else if (Array.isArray(data)) {
         setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (e) { console.error(e); setProducts([]); } finally { setLoading(false); }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (Array.isArray(data)) setCustomers(data);
    } catch (e) { console.error(e); }
  };

  const fetchBatches = async (productId: number) => {
    setLoadingBatches(true);
    try {
      const res = await fetch(`/api/products/${productId}/batches`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) { return []; } finally { setLoadingBatches(false); }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);           
      fetchProducts(search, newPage); 
    }
  };

  // --- LÓGICA DE AGREGADO ---

  const handleProductClick = async (prod: Producto) => {
    if (Number(prod.stock) <= 0) return alert("⚠️ Producto Agotado");
    
    // Si el producto es perecedero o tiene lotes, buscar lotes
    const lotes = await fetchBatches(prod.idproducto);
    
    if (lotes.length > 0) {
      // SI TIENE LOTES: Abrir modal y detener flujo automático
      setCurrentProduct(prod);
      setBatches(lotes);
      setShowBatchModal(true);
    } else {
      // SI NO TIENE LOTES: Agregar directo
      addToCart(prod, null);
      
      // Limpiar buscador y re-enfocar para el siguiente escaneo
      setSearch('');
      searchInputRef.current?.focus();
    }
  };

  // --- MANEJO DEL ESCÁNER (ENTER KEY) ---
  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Evitar submit si hubiera form
        
        if (!search.trim()) return;

        // 1. Verificar si ya tenemos el resultado único en pantalla (más rápido)
        // Si el filtro actual muestra exactamente 1 producto, asumimos que es ese
        let targetProduct: Producto | null = null;

        if (products.length === 1) {
            targetProduct = products[0];
        } else {
            // 2. Si hay varios o ninguno, hacemos fetch específico exacto para estar seguros
            try {
                const res = await fetch(`/api/products?q=${search}&limit=5`); // Buscamos pocos
                const data = await res.json();
                const found = data.data || [];
                
                // Buscamos coincidencia exacta de código de barra
                const exactMatch = found.find((p: Producto) => p.codigo_barra === search);
                
                if (exactMatch) {
                    targetProduct = exactMatch;
                } else if (found.length === 1) {
                    // Si solo hay uno (ej: busqueda por nombre muy especifica)
                    targetProduct = found[0];
                }
            } catch (err) {
                console.error("Error buscando producto al escanear", err);
            }
        }

        if (targetProduct) {
            // Producto encontrado -> Intentar agregar
            handleProductClick(targetProduct);
            // handleProductClick ya se encarga de limpiar el search si fue exitoso directo
        } else {
            // No encontrado o ambiguo -> No hacer nada, dejar que el usuario seleccione
            // Opcional: Sonido de error
            // alert("Producto no encontrado o búsqueda ambigua");
        }
    }
  };

  const addToCart = (prod: Producto, fecha: string | null) => {
    const stock = Number(prod.stock);
    setCart(prev => {
      const existing = prev.find(p => p.idproducto === prod.idproducto && p.fecha_vencimiento === fecha);
      if (existing) {
        if (existing.cantidad + 1 > stock) { alert("⚠️ Stock insuficiente"); return prev; }
        return prev.map(p => (p.idproducto === prod.idproducto && p.fecha_vencimiento === fecha) ? { ...p, cantidad: p.cantidad + 1 } : p);
      }
      return [...prev, { ...prod, cantidad: 1, precio_numerico: Number(prod.precio_venta), fecha_vencimiento: fecha }];
    });
    setShowBatchModal(false);
    setCurrentProduct(null);
  };

  const updateQuantity = (id: number, fecha: string | null, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.idproducto === id && item.fecha_vencimiento === fecha) {
        const newQty = item.cantidad + delta;
        if (newQty > Number(item.stock)) { alert("⚠️ Stock máximo"); return item; }
        if (newQty < 1) return item;
        return { ...item, cantidad: newQty };
      }
      return item;
    }));
  };

  const updatePrice = (id: number, fecha: string | null, newPrice: number | string) => {
    const price = Number(newPrice);
    if (isNaN(price) || price < 0) return;

    setCart(prev => prev.map(item => {
        if (item.idproducto === id && item.fecha_vencimiento === fecha) {
            return { ...item, precio_numerico: price };
        }
        return item;
    }));
  };

  const removeFromCart = (id: number, fecha: string | null) => {
    setCart(prev => prev.filter(item => !(item.idproducto === id && item.fecha_vencimiento === fecha)));
  };

  const handleFinalizeSale = async () => {
    if (isProcessing.current) return;
    if (paymentForm.metodoPago === 'Efectivo' && montoRecibido < total) {
      alert(`⚠️ Faltan L. ${faltante.toFixed(2)} para cubrir el total.`);
      return;
    }

    isProcessing.current = true;
    setLoading(true);

    try {
      const cartToSend = cart.map(i => ({
        idproducto: i.idproducto,
        cantidad: i.cantidad,
        precio_numerico: i.precio_numerico,
        fecha_vencimiento: i.fecha_vencimiento
      }));

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: cartToSend,
          total,
          tipo_pago: paymentForm.metodoPago,
          pago_efectivo: paymentForm.metodoPago === 'Efectivo' ? montoRecibido : total,
          id_cliente: paymentForm.idCliente,
          notas: paymentForm.notas,
          id_usuario: user?.id,
          id_comprobante: paymentForm.idComprobante // Send selected receipt type
        })
      });

      const data = await res.json();

      if (res.ok) {
        setShowPaymentModal(false);
        setCart([]);
        setPaymentForm(prev => ({ ...prev, recibido: '', notas: '' }));
        checkRegisterStatus(); 
        fetchProducts(search, page); 
        
        const width = 400; const height = 600;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        window.open(`/ticket/${data.id_venta}`, 'TicketVenta', `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`);

      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (e) {
      alert("Error de conexión con el servidor");
    } finally {
      setLoading(false);
      setTimeout(() => { isProcessing.current = false; }, 1000);
    }
  };

  // =========================================
  // RENDERIZADO
  // =========================================

  if (loadingSession) return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-indigo-600">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="font-semibold animate-pulse">Iniciando sistema...</span>
      </div>
    </div>
  );

  if (!user) return null; 

  if (isRegisterOpen === null) return (
    <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-400 font-medium">
      Verificando estado de caja...
    </div>
  );

  // --- APERTURA ---
  if (isRegisterOpen === false) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4 font-sans">
        <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md text-center transform transition-all hover:scale-[1.01] duration-500">
          <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <span className="text-5xl">🏪</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">Apertura de Caja</h1>
          <div className="text-slate-500 mb-8 bg-slate-50 py-2 px-4 rounded-full inline-block text-sm border border-slate-100">
            Usuario: <span className="font-bold text-indigo-600">{user.name}</span>
          </div>
          <div className="relative mb-8">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">L.</span>
            <input 
              type="number" 
              className="w-full p-5 pl-10 border-2 border-slate-100 rounded-2xl text-3xl font-bold text-center text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
              placeholder="0.00"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              autoFocus
            />
          </div>
          <button onClick={() => handleRegisterAction('open')} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 transform active:scale-95 transition-all">
            INICIAR TURNO
          </button>
        </div>
      </div>
    );
  }

  // --- POS PRINCIPAL ---
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans relative text-gray-800">
      <style jsx global>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* --- MODAL LOTE --- */}
      {showBatchModal && currentProduct && (
        <div className="absolute inset-0 bg-slate-900/60 z-[60] flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Selecciona Lote</h2>
              <p className="text-sm text-slate-500 mt-1">Producto: <span className="font-semibold text-indigo-600">{currentProduct.nombre_producto}</span></p>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {batches.map((batch, index) => {
                const daysLeft = Math.ceil((new Date(batch.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                const isUrgent = daysLeft < 30; 
                return (
                  <button key={index} onClick={() => addToCart(currentProduct, batch.fecha_vencimiento)} 
                    className={`w-full p-4 rounded-2xl border flex justify-between items-center transition-all duration-200 hover:scale-[1.02] group text-left ${isUrgent ? 'bg-rose-50 border-rose-100 hover:border-rose-300' : 'bg-white border-gray-100 hover:border-indigo-300 hover:shadow-md'}`}>
                    <div>
                       <div className="font-bold text-slate-700 text-lg group-hover:text-indigo-700 transition-colors">{new Date(batch.fecha_vencimiento).toLocaleDateString()}</div>
                       <div className={`text-xs font-medium mt-1 ${isUrgent ? 'text-rose-600' : 'text-emerald-600'}`}>{isUrgent ? `⚠️ Vence en ${daysLeft} días` : '✅ Fecha óptima'}</div>
                    </div>
                    <div className="text-right bg-white/50 px-3 py-1 rounded-lg">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide">Stock</div>
                      <div className="font-bold text-lg">{Number(batch.cantidad_perecedero).toFixed(0)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setShowBatchModal(false)} className="w-full mt-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      {/* --- MODAL CORTE --- */}
      {showCloseModal && registerDetails && (
        <div className="absolute inset-0 bg-slate-900/70 z-50 flex items-center justify-center backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100">
             <div className="flex justify-between items-center mb-8">
               <div><h2 className="text-2xl font-extrabold text-slate-800">Corte de Caja</h2><p className="text-slate-400 text-sm">Resumen del turno actual</p></div>
               <button onClick={() => setShowCloseModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">✕</button>
             </div>
             <div className="bg-slate-50 p-5 rounded-2xl mb-8 space-y-3 text-sm border border-slate-200 shadow-inner">
                <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Fondo Inicial</span><span className="font-mono font-bold text-slate-700">L. {Number(registerDetails.monto_apertura).toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Ventas Efectivo (+)</span><span className="font-mono font-bold text-emerald-600">L. {Number(registerDetails.ventasEfectivo).toFixed(2)}</span></div>
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-base"><span className="font-bold text-slate-800">Total Esperado</span><span className="font-mono font-black text-indigo-600 text-lg">L. {Number(registerDetails.totalEsperado).toFixed(2)}</span></div>
             </div>
             <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Dinero real en caja</label>
             <div className="relative mb-4"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">L.</span><input type="number" className="w-full p-4 pl-10 border-2 border-gray-200 rounded-xl text-2xl font-bold text-center text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="0.00" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} autoFocus /></div>
             {cashAmount && (
               <div className={`flex items-center justify-center gap-2 p-3 rounded-xl mb-8 text-sm font-bold border ${Number(cashAmount) - Number(registerDetails.totalEsperado) >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                 <span>{Number(cashAmount) - Number(registerDetails.totalEsperado) >= 0 ? '✅ SOBRA:' : '⚠️ FALTA:'}</span><span className="text-lg">L. {Math.abs(Number(cashAmount) - Number(registerDetails.totalEsperado)).toFixed(2)}</span>
               </div>
             )}
             <div className="flex gap-4">
               <button onClick={() => setShowCloseModal(false)} className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition">Cancelar</button>
               <button onClick={() => handleRegisterAction('close')} className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-200 transition transform active:scale-95">CERRAR TURNO</button>
             </div>
          </div>
        </div>
      )}

      {/* --- MODAL PAGO --- */}
      {showPaymentModal && (
        <div className="absolute inset-0 bg-slate-900/80 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row h-[90vh] lg:h-auto border border-gray-200">
            <div className="bg-slate-900 text-white p-10 lg:w-1/3 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-emerald-500 rounded-full blur-3xl opacity-20"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-extrabold mb-2 tracking-tight">Resumen</h2>
                <p className="text-slate-400 text-sm mb-10">Revisa los detalles antes de confirmar.</p>
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-slate-300 pb-4 border-b border-slate-700"><span className="text-lg">Artículos</span><span className="text-2xl font-bold text-white">{cart.reduce((s,i)=>s+i.cantidad,0)}</span></div>
                  <div className="flex flex-col gap-1 pt-2"><span className="text-slate-400 text-sm uppercase tracking-wider">Total a Pagar</span><div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">L. {total.toFixed(2)}</div></div>
                </div>
              </div>
              <div className="mt-10 text-xs text-slate-500 text-center relative z-10">Farmacia IVIS • Sistema POS v2.0</div>
            </div>
            <div className="p-10 lg:w-2/3 bg-white overflow-y-auto">
              <div className="flex justify-between items-start mb-8">
                <div><h2 className="text-2xl font-extrabold text-slate-800">Procesar Pago</h2><p className="text-gray-400 text-sm">Selecciona método y cliente.</p></div>
                <button onClick={() => setShowPaymentModal(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition text-xl">✕</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* --- SELECTOR DE COMPROBANTE --- */}
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tipo Comprobante</label>
                  <select 
                    className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                    value={paymentForm.idComprobante}
                    onChange={(e) => setPaymentForm({...paymentForm, idComprobante: Number(e.target.value)})}
                  >
                    {tipoComprobantes.map(tc => (
                      <option key={tc.idcomprobante} value={tc.idcomprobante}>
                        {tc.nombre_comprobante} (Prox: #{tc.siguiente_numero})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-1"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Cliente</label><select className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer" value={paymentForm.idCliente} onChange={(e) => setPaymentForm({...paymentForm, idCliente: Number(e.target.value)})}>{customers.map(c => <option key={c.idcliente} value={c.idcliente}>{c.nombre_cliente}</option>)}{customers.length === 0 && <option value="1">Público General</option>}</select></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Método Pago</label><div className="relative"><select className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer" value={paymentForm.metodoPago} onChange={(e) => setPaymentForm({...paymentForm, metodoPago: e.target.value, recibido: ''})}><option value="Efectivo">💵 Efectivo</option><option value="Tarjeta">💳 Tarjeta</option><option value="Deposito">🏦 Depósito</option></select></div></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Condición</label><select className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer" value={paymentForm.condicion} onChange={(e) => setPaymentForm({...paymentForm, condicion: e.target.value})}><option value="Contado">Contado</option><option value="Credito">Crédito</option></select></div>
              </div>
              {paymentForm.metodoPago === 'Efectivo' && (
                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 mb-8 animate-in fade-in slide-in-from-top-4">
                   <label className="block text-xs font-bold text-indigo-800 uppercase tracking-wide mb-3">Dinero Recibido</label>
                   <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 font-bold text-2xl">L.</span><input type="number" autoFocus className="w-full p-4 pl-12 text-4xl font-black text-indigo-900 bg-white border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-indigo-200" placeholder={total.toFixed(2)} value={paymentForm.recibido} onChange={(e) => setPaymentForm({...paymentForm, recibido: e.target.value})} /></div>
                   <div className="flex justify-between mt-6 text-lg items-center bg-white p-4 rounded-xl shadow-sm border border-indigo-100"><div className="text-gray-500 font-medium">Cambio a entregar:</div><div className={`font-black text-3xl ${faltante > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{faltante > 0 ? `Falta L. ${faltante.toFixed(2)}` : `L. ${cambio.toFixed(2)}`}</div></div>
                </div>
              )}
              <div className="mb-8"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Notas (Opcional)</label><textarea className="w-full p-4 border border-gray-200 rounded-xl h-24 outline-none resize-none bg-gray-50 focus:bg-white focus:border-indigo-500 transition-all text-sm" placeholder="Ej. Cliente solicitó factura..." value={paymentForm.notas} onChange={(e) => setPaymentForm({...paymentForm, notas: e.target.value})} /></div>
              <button onClick={handleFinalizeSale} disabled={loading || (paymentForm.metodoPago === 'Efectivo' && montoRecibido < total)} className={`w-full py-5 rounded-2xl font-extrabold text-xl shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 ${(loading || (paymentForm.metodoPago === 'Efectivo' && montoRecibido < total)) ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-200'}`}>{loading ? (<><div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>PROCESANDO...</>) : (<><span>CONFIRMAR VENTA</span><span>➔</span></>)}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- PANEL IZQUIERDO --- */}
      <div className="w-[68%] flex flex-col p-6 h-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col"><h1 className="text-2xl font-black text-slate-800 tracking-tight">Farmacia <span className="text-indigo-600">IVIS</span></h1><p className="text-sm text-slate-400 font-medium">Panel de Venta</p></div>
          <div className="flex gap-3">
             <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100"><div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">{user.name.charAt(0)}</div><div className="text-sm"><p className="font-bold text-slate-700">{user.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user.tipo_usuario === 1 ? 'Administrador' : 'Vendedor'}</p></div></div>
             <button onClick={() => { checkRegisterStatus().then(() => { setCashAmount(''); setShowCloseModal(true); }); }} className="bg-slate-800 hover:bg-slate-900 text-white px-5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-slate-200 transition-all active:scale-95" title="Corte de Caja"><span>🔒</span> <span className="hidden xl:inline text-sm">Cerrar Caja</span></button>
             <button onClick={handleLogout} className="bg-white border-2 border-rose-100 text-rose-500 hover:bg-rose-50 hover:border-rose-200 px-4 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95" title="Salir"><span>🚪</span></button>
          </div>
        </div>

        <div className="mb-6 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg className="w-6 h-6 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div>
          <input 
             ref={searchInputRef}
             type="text" 
             placeholder="Buscar producto (Escáner, Código o Nombre)..." 
             className="w-full p-5 pl-12 rounded-2xl bg-white border-2 border-transparent shadow-sm text-lg outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-gray-300" 
             value={search} 
             onChange={(e) => setSearch(e.target.value)} 
             onKeyDown={handleScan}
             autoComplete="off"
             autoFocus 
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-4">
          {loading && <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div><p>Buscando productos...</p></div>}
          {!loading && products.length === 0 && <div className="flex flex-col items-center justify-center h-64 text-slate-400 opacity-60"><span className="text-6xl mb-4">📦</span><p className="text-lg">No se encontraron productos</p></div>}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
            {products.map((prod) => {
              const isOutOfStock = Number(prod.stock) <= 0;
              return (
                <button key={prod.idproducto} onClick={() => handleProductClick(prod)} disabled={isOutOfStock} className={`group relative bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-44 text-left transition-all duration-300 ${isOutOfStock ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-xl hover:border-indigo-200'}`}>
                  <div className="mb-2">
                    <div className="flex justify-between items-start mb-2"><div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-xl shadow-inner text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">💊</div><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${Number(prod.stock) > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>Stop: {Number(prod.stock).toFixed(0)}</span></div>
                    <h3 className="font-bold text-slate-700 text-sm leading-tight line-clamp-2 group-hover:text-indigo-700 transition-colors">{prod.nombre_producto}</h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{prod.codigo_barra}</p>
                  </div>
                  <div className="pt-3 border-t border-dashed border-gray-100"><span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Precio</span><span className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">L. {Number(prod.precio_venta).toFixed(2)}</span></div>
                  {isOutOfStock && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-2xl"><span className="bg-rose-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg transform -rotate-6 border-2 border-white">AGOTADO</span></div>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-4 flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
           <span className="text-xs font-bold text-slate-400 pl-2">Página {page} de {totalPages} <span className="font-normal opacity-50">({totalItems} productos)</span></span>
           <div className="flex gap-2"><button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-indigo-100 hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-gray-100 transition-colors">◀</button><button onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-indigo-100 hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-gray-100 transition-colors">▶</button></div>
        </div>
      </div>

      {/* --- CARRITO (DERECHA) --- */}
      <div className="w-[32%] bg-white flex flex-col shadow-2xl z-20 border-l border-gray-100 relative">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mt-10 -mr-10"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white opacity-5 rounded-full -mb-10 -ml-10"></div>
          <div className="flex justify-between items-center relative z-10">
            <div><h2 className="text-xl font-bold tracking-wide">Ticket Actual</h2><div className="flex items-center gap-2 mt-1"><span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span><span className="text-xs text-slate-300 font-medium">Turno Activo</span></div></div>
            <div className="text-right"><div className="text-3xl font-black">{cart.reduce((s,i)=>s+i.cantidad,0)}</div><div className="text-[10px] text-slate-400 uppercase tracking-wider">Artículos</div></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {cart.length === 0 && <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-70"><svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg><p className="font-medium text-sm">Escanea productos para empezar</p></div>}

          {cart.map((item, idx) => (
            <div key={`${item.idproducto}-${item.fecha_vencimiento || idx}`} className="group bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all animate-in slide-in-from-right-4 duration-300">
              
              <div className="flex justify-between items-start mb-2">
                 <div className="flex-1 min-w-0 pr-2">
                    <div className="font-bold text-slate-800 text-sm line-clamp-2 leading-tight">{item.nombre_producto}</div>
                    {item.fecha_vencimiento && <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold border border-amber-100"><span>⏳</span> {new Date(item.fecha_vencimiento).toLocaleDateString()}</div>}
                 </div>
                 <button onClick={() => removeFromCart(item.idproducto, item.fecha_vencimiento || null)} className="text-gray-300 hover:text-rose-500 transition-colors p-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
              </div>

              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-1">
                 {/* Stepper */}
                 <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-100">
                    <button onClick={() => updateQuantity(item.idproducto, item.fecha_vencimiento || null, -1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-l-lg transition font-bold">-</button>
                    <span className="w-8 text-center text-sm font-bold text-slate-800">{item.cantidad}</span>
                    <button onClick={() => updateQuantity(item.idproducto, item.fecha_vencimiento || null, 1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-r-lg transition font-bold">+</button>
                 </div>

                 <div className="flex flex-col items-end px-2">
                    
                    {/* --- SELECTOR DE PRECIOS MEJORADO --- */}
                    <div className="flex gap-1 mb-1">
                        <button 
                            onClick={() => updatePrice(item.idproducto, item.fecha_vencimiento || null, item.precio_venta)}
                            className={`w-6 h-6 text-[10px] font-bold rounded-full border ${item.precio_numerico === Number(item.precio_venta) ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'}`}
                            title={`Público: L. ${Number(item.precio_venta).toFixed(2)}`}
                        >1</button>
                        <button 
                            onClick={() => updatePrice(item.idproducto, item.fecha_vencimiento || null, item.precio_venta_mayoreo)}
                            className={`w-6 h-6 text-[10px] font-bold rounded-full border ${item.precio_numerico === Number(item.precio_venta_mayoreo) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-300 border-blue-100 hover:border-blue-300'}`}
                            title={`Mayoreo: L. ${Number(item.precio_venta_mayoreo).toFixed(2)}`}
                        >2</button>
                        <button 
                            onClick={() => updatePrice(item.idproducto, item.fecha_vencimiento || null, item.precio_venta_3)}
                            className={`w-6 h-6 text-[10px] font-bold rounded-full border ${item.precio_numerico === Number(item.precio_venta_3) ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-300 border-purple-100 hover:border-purple-300'}`}
                            title={`Especial: L. ${Number(item.precio_venta_3).toFixed(2)}`}
                        >3</button>
                    </div>

                    <div className="flex items-center gap-1">
                      {canEditPrice ? (
                        <div className="relative group/price">
                           <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">L.</span>
                           <input type="number" className="w-16 pl-3 py-0 text-right text-xs font-bold bg-transparent border-b border-dashed border-gray-300 focus:border-indigo-500 focus:bg-white outline-none transition-all text-indigo-600" value={item.precio_numerico} onChange={(e) => updatePrice(item.idproducto, item.fecha_vencimiento || null, e.target.value)} />
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-gray-500">L. {item.precio_numerico.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="font-black text-slate-800">L. {(item.cantidad * item.precio_numerico).toFixed(2)}</div>
                 </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-white z-30 border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="space-y-1 mb-6">
             <div className="flex justify-between text-slate-400 text-sm"><span>Subtotal</span><span>L. {(total / 1.15).toFixed(2)}</span></div>
             <div className="flex justify-between text-slate-400 text-sm"><span>ISV (15%)</span><span>L. {(total - (total / 1.15)).toFixed(2)}</span></div>
             <div className="flex justify-between items-end pt-2 mt-2 border-t border-dashed border-gray-200"><span className="text-slate-800 font-bold text-lg">Total a Pagar</span><span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">L. {total.toFixed(2)}</span></div>
          </div>
          <button onClick={() => setShowPaymentModal(true)} disabled={cart.length === 0} className="w-full py-4 rounded-2xl font-bold text-lg text-white shadow-xl shadow-indigo-200 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">COBRAR</button>
        </div>
      </div>
    </div>
  );
}