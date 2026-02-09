'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, Save, Calendar, DollarSign, Archive } from 'lucide-react';

export default function PurchasesPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Datos del Encabezado
  const [header, setHeader] = useState({
    idproveedor: '',
    numero_comprobante: '',
    fecha_comprobante: new Date().toISOString().split('T')[0],
    tipo_pago: 'Contado'
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Cargar proveedores
    fetch('/api/providers').then(r => r.json()).then(setProviders);
  }, []);

  // Buscar productos
  useEffect(() => {
    const timer = setTimeout(() => {
        if(search.length > 1) {
            fetch(`/api/products?q=${search}&limit=5`)
                .then(r => r.json())
                .then(d => setProducts(d.data || []));
        } else {
            setProducts([]);
        }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const addToCart = (prod: any) => {
    // Verificar si ya está
    const exists = cart.find(i => i.idproducto === prod.idproducto);
    if(exists) return alert("El producto ya está en la lista.");

    setCart([...cart, {
        ...prod,
        cantidad: 1,
        nuevo_costo: prod.precio_compra, // Sugerir costo actual
        fecha_vencimiento: '' // Obligar a poner fecha si es necesario
    }]);
    setSearch('');
    setProducts([]);
    searchInputRef.current?.focus();
  };

  const updateItem = (id: number, field: string, value: any) => {
    setCart(prev => prev.map(item => {
        if(item.idproducto === id) {
            return { ...item, [field]: value };
        }
        return item;
    }));
  };

  const removeItem = (id: number) => {
    setCart(prev => prev.filter(i => i.idproducto !== id));
  };

  const totalCompra = cart.reduce((sum, item) => sum + (Number(item.cantidad) * Number(item.nuevo_costo)), 0);

  const handleSave = async () => {
    if(!header.idproveedor) return alert("Seleccione un proveedor");
    if(!header.numero_comprobante) return alert("Ingrese número de factura");
    if(cart.length === 0) return alert("No hay productos");

    // Validar fechas
    const missingDate = cart.find(i => i.perecedero === 1 && !i.fecha_vencimiento);
    if(missingDate) return alert(`El producto "${missingDate.nombre_producto}" es perecedero y requiere fecha de vencimiento.`);

    setLoading(true);
    try {
        const res = await fetch('/api/purchases', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                ...header,
                total: totalCompra,
                cart: cart.map(i => ({
                    idproducto: i.idproducto,
                    cantidad: i.cantidad,
                    precio_compra: i.nuevo_costo,
                    fecha_vencimiento: i.fecha_vencimiento
                }))
            })
        });

        if(res.ok) {
            alert("✅ Compra registrada. Inventario actualizado.");
            setCart([]);
            setHeader(prev => ({...prev, numero_comprobante: ''}));
        } else {
            const err = await res.json();
            alert("Error: " + err.error);
        }
    } catch (e) { alert("Error de conexión"); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in">
        
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-black text-slate-800">Nueva Compra</h1>
                <p className="text-slate-500">Ingreso de mercadería al inventario.</p>
            </div>
            <div className="text-right">
                <p className="text-xs text-slate-400 uppercase font-bold">Total Compra</p>
                <p className="text-4xl font-black text-indigo-600">L. {totalCompra.toFixed(2)}</p>
            </div>
        </div>

        {/* FORMULARIO ENCABEZADO */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Proveedor</label>
                <select className="w-full p-3 border rounded-xl bg-slate-50" value={header.idproveedor} onChange={e => setHeader({...header, idproveedor: e.target.value})}>
                    <option value="">-- Seleccionar --</option>
                    {providers.map(p => <option key={p.idproveedor} value={p.idproveedor}>{p.nombre_proveedor}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">N° Factura Prov.</label>
                <input type="text" className="w-full p-3 border rounded-xl" placeholder="Ej. 000-001-01..." value={header.numero_comprobante} onChange={e => setHeader({...header, numero_comprobante: e.target.value})} />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Emisión</label>
                <input type="date" className="w-full p-3 border rounded-xl" value={header.fecha_comprobante} onChange={e => setHeader({...header, fecha_comprobante: e.target.value})} />
            </div>
        </div>

        {/* BUSCADOR */}
        <div className="relative group z-20">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Search className="text-gray-400" /></div>
            <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Buscar producto para agregar..." 
                className="w-full p-4 pl-12 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 outline-none text-lg shadow-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />
            {/* Resultados de búsqueda flotantes */}
            {products.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white shadow-xl rounded-xl mt-2 border border-slate-100 overflow-hidden max-h-60 overflow-y-auto">
                    {products.map(prod => (
                        <button key={prod.idproducto} onClick={() => addToCart(prod)} className="w-full text-left p-4 hover:bg-indigo-50 flex justify-between items-center border-b border-slate-50 last:border-0">
                            <div>
                                <div className="font-bold text-slate-700">{prod.nombre_producto}</div>
                                <div className="text-xs text-slate-400 font-mono">{prod.codigo_barra}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-slate-400">Stock: {Number(prod.stock).toFixed(0)}</div>
                                <div className="font-bold text-indigo-600">Costo: L. {Number(prod.precio_compra).toFixed(2)}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* TABLA DE PRODUCTOS A INGRESAR */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                    <tr>
                        <th className="p-4">Producto</th>
                        <th className="p-4 w-32 text-center">Cantidad</th>
                        <th className="p-4 w-32 text-center">Nuevo Costo</th>
                        <th className="p-4 w-40 text-center">Vencimiento</th>
                        <th className="p-4 w-32 text-right">Subtotal</th>
                        <th className="p-4 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {cart.length === 0 ? (
                        <tr><td colSpan={6} className="p-10 text-center text-slate-400">Carrito vacío. Busca productos arriba.</td></tr>
                    ) : (
                        cart.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-4">
                                    <div className="font-bold text-slate-700">{item.nombre_producto}</div>
                                    <div className="text-xs text-slate-400">{item.codigo_barra}</div>
                                </td>
                                <td className="p-4">
                                    <input type="number" className="w-full p-2 border rounded-lg text-center font-bold" value={item.cantidad} onChange={e => updateItem(item.idproducto, 'cantidad', e.target.value)} />
                                </td>
                                <td className="p-4">
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">L.</span>
                                        <input type="number" className="w-full p-2 pl-6 border rounded-lg text-center font-bold text-indigo-600" value={item.nuevo_costo} onChange={e => updateItem(item.idproducto, 'nuevo_costo', e.target.value)} />
                                    </div>
                                </td>
                                <td className="p-4">
                                    {item.perecedero === 1 ? (
                                        <input type="date" className="w-full p-2 border border-orange-200 bg-orange-50 rounded-lg text-xs" value={item.fecha_vencimiento} onChange={e => updateItem(item.idproducto, 'fecha_vencimiento', e.target.value)} required />
                                    ) : (
                                        <div className="text-center text-slate-300 text-xs">No aplica</div>
                                    )}
                                </td>
                                <td className="p-4 text-right font-bold text-slate-700">
                                    L. {(item.cantidad * item.nuevo_costo).toFixed(2)}
                                </td>
                                <td className="p-4 text-center">
                                    <button onClick={() => removeItem(item.idproducto)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

        <div className="flex justify-end pt-4">
            <button 
                onClick={handleSave} 
                disabled={loading || cart.length === 0} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 flex items-center gap-3 transition transform active:scale-95 disabled:opacity-50 disabled:shadow-none"
            >
                {loading ? 'Procesando...' : <><Save className="w-5 h-5" /> Registrar Compra</>}
            </button>
        </div>

    </div>
  );
}