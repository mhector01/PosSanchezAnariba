'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// --- Interfaces ---
interface SaleItem {
  idproducto: number;
  nombre_producto: string;
  codigo_barra?: string; 
  cantidad: number;
  precio_venta: number; 
  precio_cobrado: number; 
  subtotal: number;
}

interface ProductSearchResult {
  idproducto: number;
  nombre_producto: string;
  codigo_barra: string;
  precio_venta: number;
  stock: number;
}

interface SaleHeader {
  idventa: number;
  fecha_venta: string;
  idcliente: number;
  tipo_pago: string;
  notas: string;
  estado: string;
}

interface SaleHistory {
  idhistorial: number;
  fecha_edicion: string;
  usuario: string;
  accion: string;
  total_anterior: number;
  total_nuevo: number;
}

interface Customer {
  idcliente: number;
  nombre_cliente: string;
}

export default function EditSalePOSPage() {
  const params = useParams();
  const router = useRouter();
  const idVenta = params.id;

  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [user, setUser] = useState<any>(null); 

  // Datos
  const [sale, setSale] = useState<SaleHeader | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [history, setHistory] = useState<SaleHistory[]>([]); // <--- ESTADO HISTORIAL

  // Modales
  const [showHistoryModal, setShowHistoryModal] = useState(false); // <--- CONTROL MODAL

  // Buscador
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<ProductSearchResult[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Totales
  const totalCalculado = items.reduce((sum, item) => sum + (item.cantidad * item.precio_cobrado), 0);

  // --- 1. CARGA INICIAL ---
  useEffect(() => {
    fetch('/api/auth/session').then(res => res.json()).then(data => setUser(data.user));

    const loadData = async () => {
      try {
        const resCust = await fetch('/api/customers');
        const dataCust = await resCust.json();
        if (Array.isArray(dataCust)) setCustomers(dataCust);

        const resSale = await fetch(`/api/sales/${idVenta}`);
        const dataSale = await resSale.json();

        if (dataSale.sale) {
          const dateObj = new Date(dataSale.sale.fecha_venta);
          const localIso = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

          setSale({ ...dataSale.sale, fecha_venta: localIso });
          setItems(dataSale.items || []);
          setHistory(dataSale.history || []); // <--- GUARDAMOS HISTORIAL
        } else {
          router.push('/admin/sales');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (idVenta) loadData();
  }, [idVenta, router]);

  // --- 2. BUSCADOR ---
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!search.trim()) { setProducts([]); return; }
      setLoadingProducts(true);
      try {
        const res = await fetch(`/api/products?q=${search}&limit=12`);
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) setProducts(data.data);
      } catch (e) { console.error(e); } 
      finally { setLoadingProducts(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // --- 3. MANEJADORES ---
  const handleAddProduct = (prod: ProductSearchResult) => {
    setItems(prev => {
      const exists = prev.find(i => i.idproducto === prod.idproducto);
      if (exists) {
        return prev.map(i => i.idproducto === prod.idproducto 
          ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precio_cobrado } 
          : i);
      }
      return [...prev, {
        idproducto: prod.idproducto,
        nombre_producto: prod.nombre_producto,
        codigo_barra: prod.codigo_barra,
        cantidad: 1,
        precio_venta: Number(prod.precio_venta),
        precio_cobrado: Number(prod.precio_venta),
        subtotal: Number(prod.precio_venta)
      }];
    });
    searchInputRef.current?.focus();
  };

  const handleItemChange = (index: number, field: keyof SaleItem, value: string) => {
    const newItems = [...items];
    const val = parseFloat(value);
    if (field === 'cantidad') newItems[index].cantidad = isNaN(val) || val < 1 ? 1 : val;
    else if (field === 'precio_cobrado') newItems[index].precio_cobrado = isNaN(val) ? 0 : val;
    newItems[index].subtotal = newItems[index].cantidad * newItems[index].precio_cobrado;
    setItems(newItems);
  };

  const handleDeleteItem = (index: number) => {
    if (confirm("¿Quitar producto?")) setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveChanges = async () => {
    if (!sale || !user?.id) return alert("Falta usuario o datos");
    setSaving(true);
    try {
      const payload = {
        header: {
            idcliente: sale.idcliente,
            fecha_venta: sale.fecha_venta,
            tipo_pago: sale.tipo_pago,
            notas: sale.notas,
            total: totalCalculado
        },
        items: items.map(i => ({
            idproducto: i.idproducto,
            cantidad: i.cantidad,
            precio: i.precio_cobrado
        })),
        id_usuario_editor: user.id 
      };

      const res = await fetch(`/api/sales/${idVenta}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("✅ Guardado con éxito");
        window.location.reload(); // Recargar para ver el historial actualizado
      } else {
        const data = await res.json();
        alert("❌ Error: " + data.error);
      }
    } catch (error) { alert("Error de conexión"); } 
    finally { setSaving(false); }
  };

  if (loading || !sale) return <div className="h-screen flex items-center justify-center text-indigo-600 font-bold">Cargando...</div>;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans relative">
      
      {/* ======================= */}
      {/* MODAL HISTORIAL (NUEVO) */}
      {/* ======================= */}
      {showHistoryModal && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg">📜 Historial de Ediciones</h3>
                    <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="overflow-y-auto p-0 flex-1">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-500 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Usuario</th>
                                <th className="p-4">Acción</th>
                                <th className="p-4 text-right">Cambio Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-400">No hay ediciones registradas.</td></tr>
                            ) : (
                                history.map((h) => (
                                    <tr key={h.idhistorial} className="hover:bg-slate-50">
                                        <td className="p-4 text-slate-600">
                                            {new Date(h.fecha_edicion).toLocaleDateString()} <span className="text-xs text-slate-400">{new Date(h.fecha_edicion).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="p-4 font-bold text-indigo-600">{h.usuario}</td>
                                        <td className="p-4">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{h.accion}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="text-xs text-slate-400 line-through">L. {Number(h.total_anterior).toFixed(2)}</div>
                                            <div className="font-bold text-slate-800">L. {Number(h.total_nuevo).toFixed(2)}</div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-slate-50 border-t text-center">
                    <button onClick={() => setShowHistoryModal(false)} className="px-6 py-2 bg-white border rounded-lg text-slate-600 font-bold hover:bg-slate-100">Cerrar</button>
                </div>
            </div>
        </div>
      )}

      {/* LADO IZQUIERDO */}
      <div className="w-[60%] flex flex-col p-6 h-full border-r border-gray-200">
        <div className="mb-6 flex justify-between items-center">
            <div><h1 className="text-2xl font-black text-slate-800">Agregar Productos</h1></div>
            <Link href="/admin/sales" className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition">← Volver</Link>
        </div>
        
        {/* Buscador */}
        <div className="mb-6 relative group">
          <input ref={searchInputRef} type="text" placeholder="Buscar..." className="w-full p-4 pl-4 rounded-2xl bg-white border-2 border-transparent shadow-sm text-lg outline-none focus:border-indigo-500 transition-all" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
        </div>

        {/* Grid Productos */}
        <div className="flex-1 overflow-y-auto pr-2 pb-2">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map((prod) => (
                    <button key={prod.idproducto} onClick={() => handleAddProduct(prod)} disabled={Number(prod.stock) <= 0} className={`text-left bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition group ${Number(prod.stock) <= 0 ? 'opacity-50' : ''}`}>
                        <div className="mb-2 h-10 line-clamp-2 font-bold text-slate-700 text-sm group-hover:text-indigo-600">{prod.nombre_producto}</div>
                        <div className="flex justify-between items-end"><span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded">Stock: {prod.stock}</span><span className="font-bold text-lg text-slate-800">L. {Number(prod.precio_venta).toFixed(2)}</span></div>
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* LADO DERECHO */}
      <div className="w-[40%] bg-white shadow-2xl z-20 flex flex-col h-full border-l border-gray-200">
        <div className="bg-slate-50 p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-black text-slate-800">Editando <span className="text-indigo-600">#{idVenta}</span></h2>
                
                {/* BOTÓN VER HISTORIAL */}
                <button 
                    onClick={() => setShowHistoryModal(true)} 
                    className="flex items-center gap-1 bg-white border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-50 transition shadow-sm"
                >
                    <span>📜</span> {history.length} Ediciones
                </button>
            </div>
            
            {/* Formulario Cabecera */}
            <div className="grid grid-cols-2 gap-3 text-sm">
                <select className="w-full p-2 bg-white border rounded-lg font-bold text-slate-700" value={sale.idcliente} onChange={(e) => setSale({...sale, idcliente: Number(e.target.value)})}>
                    {customers.map(c => <option key={c.idcliente} value={c.idcliente}>{c.nombre_cliente}</option>)}
                </select>
                <input type="datetime-local" className="w-full p-2 bg-white border rounded-lg font-bold text-slate-700" value={sale.fecha_venta} onChange={(e) => setSale({...sale, fecha_venta: e.target.value})} />
                <select className="w-full p-2 bg-white border rounded-lg font-bold text-slate-700" value={sale.tipo_pago} onChange={(e) => setSale({...sale, tipo_pago: e.target.value})}>
                    <option value="Efectivo">Efectivo</option><option value="Tarjeta">Tarjeta</option><option value="Deposito">Depósito</option>
                </select>
                <input type="text" className="w-full p-2 bg-white border rounded-lg text-slate-700" value={sale.notas || ''} onChange={(e) => setSale({...sale, notas: e.target.value})} placeholder="Notas..." />
            </div>
        </div>

        {/* Lista Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
            {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-center p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
                    <div className="flex-1 min-w-0"><div className="font-bold text-sm text-slate-800 line-clamp-1">{item.nombre_producto}</div></div>
                    <div className="flex flex-col items-center"><label className="text-[9px] text-slate-400 font-bold uppercase">Cant.</label><input type="number" className="w-12 p-1 text-center font-bold border rounded" value={item.cantidad} onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)} /></div>
                    <div className="flex flex-col items-end"><label className="text-[9px] text-slate-400 font-bold uppercase">Precio</label><input type="number" className="w-16 p-1 text-right font-bold border rounded text-indigo-600" value={item.precio_cobrado} onChange={(e) => handleItemChange(index, 'precio_cobrado', e.target.value)} /></div>
                    <button onClick={() => handleDeleteItem(index)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500">✕</button>
                </div>
            ))}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-900 text-white shadow-inner z-30">
            <div className="flex justify-between items-end mb-4 border-b border-slate-700 pb-4">
                <div className="text-slate-400 text-sm">Total Nuevo</div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">L. {totalCalculado.toFixed(2)}</div>
            </div>
            <button onClick={handleSaveChanges} disabled={saving || items.length === 0 || sale.estado === 'ANULADA'} className="w-full py-4 rounded-xl font-bold text-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition shadow-lg disabled:opacity-50">
                {saving ? 'Guardando...' : '💾 GUARDAR CAMBIOS'}
            </button>
        </div>
      </div>
    </div>
  );
}