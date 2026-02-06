'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

// --- Interfaces (Mismas que POS) ---
interface Producto {
  idproducto: number;
  nombre_producto: string;
  codigo_barra: string;
  precio_venta: string | number;
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

export default function EditSalePage() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.id as string; // ID de la venta a editar

  // =========================================
  // ESTADOS
  // =========================================
  const isProcessing = useRef(false);
  
  // Estados Generales
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Producto[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customers, setCustomers] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  
  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Datos del Formulario de Edición
  const [saleDate, setSaleDate] = useState(''); // Fecha de la venta
  const [paymentForm, setPaymentForm] = useState({
    idCliente: 1, 
    metodoPago: 'Efectivo',
    condicion: 'Contado',
    recibido: '',
    notas: ''
  });

  // Modal Lotes
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Producto | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Cálculos
  const total = cart.reduce((sum, item) => sum + (item.cantidad * item.precio_numerico), 0);

  // =========================================
  // CARGA INICIAL
  // =========================================
  useEffect(() => {
    // 1. Cargar Clientes y Productos
    fetchCustomers();
    fetchProducts('', 1);

    // 2. Cargar Datos de la Venta a Editar
    if (saleId) {
      loadSaleData(saleId);
    }
  }, [saleId]);

  // Efecto Buscador
  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchProducts(search, 1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // =========================================
  // FUNCIONES DE CARGA
  // =========================================
  
  const loadSaleData = async (id: string) => {
    setLoading(true);
    try {
      // Usamos la misma API que el Ticket para leer datos
      const res = await fetch(`/api/sales/${id}`);
      const data = await res.json();

      if (data.error) {
        alert("Error cargando venta: " + data.error);
        router.push('/sales'); // Volver si falla
        return;
      }

      const { sale, items } = data;

      // A. Rellenar Formulario
      setPaymentForm({
        idCliente: sale.idcliente || 1,
        metodoPago: sale.tipo_pago,
        condicion: 'Contado', // Ajustar si tienes campo condición
        recibido: sale.pago_efectivo,
        notas: sale.notas || ''
      });

      // B. Rellenar Fecha (Formato datetime-local: YYYY-MM-DDTHH:mm)
      const dateObj = new Date(sale.fecha_venta);
      // Ajuste de zona horaria simple
      dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
      setSaleDate(dateObj.toISOString().slice(0, 16));

      // C. Rellenar Carrito
      const loadedCart = items.map((item: any) => ({
        idproducto: item.idproducto || 0, // Asegúrate que tu API devuelva esto
        nombre_producto: item.nombre_producto,
        codigo_barra: '', // No crítico para editar
        precio_venta: item.precio_unitario,
        stock: 9999, // Stock virtual para permitir edición visual
        cantidad: Number(item.cantidad),
        precio_numerico: Number(item.precio_unitario),
        fecha_vencimiento: item.fecha_vence || null
      }));
      
      setCart(loadedCart);

    } catch (error) {
      console.error(error);
      alert("Error de conexión al cargar venta");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (q: string, p: number) => {
    try {
      const res = await fetch(`/api/products?q=${q}&page=${p}&limit=24`);
      const data = await res.json();
      if (data.data) {
        setProducts(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (e) { console.error(e); }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (Array.isArray(data)) setCustomers(data);
    } catch (e) { console.error(e); }
  };

  const fetchBatches = async (productId: number) => {
    try {
      const res = await fetch(`/api/products/${productId}/batches`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
  };

  // =========================================
  // LÓGICA CARRITO (Igual que POS)
  // =========================================

  const handleProductClick = async (prod: Producto) => {
    const lotes = await fetchBatches(prod.idproducto);
    if (lotes.length > 0) {
      setCurrentProduct(prod);
      setBatches(lotes);
      setShowBatchModal(true);
    } else {
      addToCart(prod, null);
    }
  };

  const addToCart = (prod: Producto, fecha: string | null) => {
    setCart(prev => {
      const existing = prev.find(p => p.idproducto === prod.idproducto && p.fecha_vencimiento === fecha);
      if (existing) {
        return prev.map(p => (p.idproducto === prod.idproducto && p.fecha_vencimiento === fecha) ? { ...p, cantidad: p.cantidad + 1 } : p);
      }
      return [...prev, { ...prod, cantidad: 1, precio_numerico: Number(prod.precio_venta), fecha_vencimiento: fecha }];
    });
    setShowBatchModal(false);
  };

  const updateQuantity = (id: number, fecha: string | null, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.idproducto === id && item.fecha_vencimiento === fecha) {
        const newQty = item.cantidad + delta;
        if (newQty < 1) return item;
        return { ...item, cantidad: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number, fecha: string | null) => {
    setCart(prev => prev.filter(i => !(i.idproducto === id && i.fecha_vencimiento === fecha)));
  };

  // =========================================
  // GUARDAR CAMBIOS (PUT)
  // =========================================
  const handleUpdateSale = async () => {
    if (isProcessing.current) return;
    if (cart.length === 0) return alert("El carrito no puede estar vacío");
    if (!saleDate) return alert("La fecha es obligatoria");

    if (confirm("¿Seguro que deseas modificar esta venta? Esto afectará el inventario.")) {
      isProcessing.current = true;
      setLoading(true);

      try {
        const cartToSend = cart.map(i => ({
          idproducto: i.idproducto,
          cantidad: i.cantidad,
          precio_numerico: i.precio_numerico,
          fecha_vencimiento: i.fecha_vencimiento
        }));

        const res = await fetch(`/api/sales/${saleId}/update`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cart: cartToSend,
            total,
            tipo_pago: paymentForm.metodoPago,
            pago_efectivo: paymentForm.metodoPago === 'Efectivo' ? paymentForm.recibido : total,
            id_cliente: paymentForm.idCliente,
            notas: paymentForm.notas,
            fecha_venta: saleDate // Enviamos la nueva fecha
          })
        });

        const data = await res.json();

        if (res.ok) {
          alert("✅ Venta actualizada correctamente");
          router.push('/sales'); // Redirigir a lista de ventas
        } else {
          alert("❌ Error: " + data.error);
        }
      } catch (e) {
        alert("Error de conexión");
      } finally {
        setLoading(false);
        setTimeout(() => isProcessing.current = false, 1000);
      }
    }
  };

  // =========================================
  // RENDERIZADO
  // =========================================
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans relative">
      
      {/* MODAL LOTES */}
      {showBatchModal && currentProduct && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
            <h3 className="font-bold text-lg mb-2">Seleccionar Lote</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {batches.map((b, i) => (
                <button key={i} onClick={() => addToCart(currentProduct, b.fecha_vencimiento)} className="w-full p-3 border rounded flex justify-between hover:bg-blue-50">
                  <span>{new Date(b.fecha_vencimiento).toLocaleDateString()}</span>
                  <span className="font-bold">{Number(b.cantidad_perecedero).toFixed(0)}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowBatchModal(false)} className="mt-4 w-full py-2 bg-slate-200 rounded">Cancelar</button>
          </div>
        </div>
      )}

      {/* IZQUIERDA: PRODUCTOS (Para agregar nuevos si se desea) */}
      <div className="w-[60%] flex flex-col p-4 border-r border-slate-300">
        <div className="mb-4 flex gap-2">
           <button onClick={() => router.back()} className="px-4 py-3 bg-slate-200 hover:bg-slate-300 rounded-xl font-bold text-slate-700">← Volver</button>
           <input type="text" placeholder="Buscar para agregar..." className="flex-1 p-3 border rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
           <div className="grid grid-cols-3 gap-3">
             {products.map(p => (
               <button key={p.idproducto} onClick={() => handleProductClick(p)} className="p-3 border rounded-xl text-left bg-white hover:border-blue-500 shadow-sm h-32 flex flex-col justify-between">
                 <div><div className="font-bold text-sm line-clamp-2">{p.nombre_producto}</div><div className="text-xs text-slate-400">{p.codigo_barra}</div></div>
                 <div className="flex justify-between"><span className="text-xs bg-slate-100 px-2 rounded">Stock: {Number(p.stock).toFixed(0)}</span><span className="font-bold">${Number(p.precio_venta).toFixed(2)}</span></div>
               </button>
             ))}
           </div>
        </div>
      </div>

      {/* DERECHA: FORMULARIO DE EDICIÓN */}
      <div className="w-[40%] bg-white flex flex-col shadow-2xl z-20 border-l border-slate-200">
        <div className="bg-orange-600 text-white p-5 shadow-md">
           <h2 className="text-xl font-bold">✏️ Editando Venta #{saleId}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           
           {/* 1. Datos Generales */}
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Venta</label>
                 <input type="datetime-local" className="w-full p-3 border rounded-lg" value={saleDate} onChange={e => setSaleDate(e.target.value)} />
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente</label>
                 <select className="w-full p-3 border rounded-lg" value={paymentForm.idCliente} onChange={e => setPaymentForm({...paymentForm, idCliente: Number(e.target.value)})}>
                    {customers.map(c => <option key={c.idcliente} value={c.idcliente}>{c.nombre_cliente}</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Método Pago</label>
                 <select className="w-full p-3 border rounded-lg" value={paymentForm.metodoPago} onChange={e => setPaymentForm({...paymentForm, metodoPago: e.target.value})}>
                    <option>Efectivo</option><option>Tarjeta</option>
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Condición</label>
                 <select className="w-full p-3 border rounded-lg" value={paymentForm.condicion} onChange={e => setPaymentForm({...paymentForm, condicion: e.target.value})}>
                    <option>Contado</option><option>Credito</option>
                 </select>
              </div>
           </div>

           {/* 2. Carrito Editable */}
           <div>
              <h3 className="font-bold text-slate-700 mb-2 border-b pb-1">Productos en Factura</h3>
              <div className="space-y-2">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded border">
                     <div className="flex-1">
                        <div className="font-bold text-sm">{item.nombre_producto}</div>
                        {item.fecha_vencimiento && <div className="text-[10px] text-orange-600">Vence: {new Date(item.fecha_vencimiento).toLocaleDateString()}</div>}
                     </div>
                     <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.idproducto, item.fecha_vencimiento || null, -1)} className="w-6 h-6 bg-white border rounded text-xs">-</button>
                        <span className="text-sm font-bold w-4 text-center">{item.cantidad}</span>
                        <button onClick={() => updateQuantity(item.idproducto, item.fecha_vencimiento || null, 1)} className="w-6 h-6 bg-white border rounded text-xs">+</button>
                        <span className="font-mono w-16 text-right">${(item.cantidad * item.precio_numerico).toFixed(2)}</span>
                        <button onClick={() => removeFromCart(item.idproducto, item.fecha_vencimiento || null)} className="text-red-500 text-xs ml-2">✕</button>
                     </div>
                  </div>
                ))}
              </div>
           </div>

           {/* 3. Totales y Notas */}
           <div className="pt-4 border-t">
              <div className="flex justify-between text-2xl font-bold mb-4">
                 <span>Total Nuevo:</span>
                 <span className="text-orange-600">${total.toFixed(2)}</span>
              </div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notas / Razón de edición</label>
              <textarea className="w-full p-3 border rounded-lg h-20 resize-none mb-4" value={paymentForm.notas} onChange={e => setPaymentForm({...paymentForm, notas: e.target.value})} placeholder="Escribe por qué editaste esta venta..." />
              
         <button 
            onClick={handleUpdateSale} 
            disabled={loading || cart.length === 0}
            className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all 
                        flex justify-center items-center gap-2
                        text-white bg-orange-600 hover:bg-orange-700 
                        disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
            >
            {loading ? (
                <>
                <div className="animate-spin h-5 w-5 border-2 border-gray-600 border-t-transparent rounded-full"></div>
                <span className="text-gray-600">GUARDANDO...</span>
                </>
            ) : (
                <>
                <span>💾</span>
                <span>GUARDAR CAMBIOS</span>
                </>
            )}
            </button>
           </div>

        </div>
      </div>
    </div>
  );
}