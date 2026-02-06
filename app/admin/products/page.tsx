'use client';
import { useState, useEffect, useCallback } from 'react';

// 1. INTERFAZ
interface Product {
  idproducto?: number;
  codigo_interno?: string;
  codigo_barra: string;
  nombre_producto: string;
  precio_compra: number;
  precio_venta: number;
  precio_venta_mayoreo: number;
  precio_venta_3: number;
  stock: number;
  stock_min: number;
  idcategoria: number;
  idmarca?: number;
  idpresentacion: number;
  perecedero: number;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // 2. ESTADO INICIAL
  const initialForm: Product = {
    codigo_barra: '',
    nombre_producto: '',
    precio_compra: 0,
    precio_venta: 0,
    precio_venta_mayoreo: 0,
    precio_venta_3: 0,
    stock: 0,
    stock_min: 5,
    idcategoria: 1,
    idpresentacion: 1,
    idmarca: 0,
    perecedero: 0
  };

  const [form, setForm] = useState<Product>(initialForm);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?q=${search}&limit=50`);
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setProducts(data.data);
      } else {
        setProducts([]);
      }
    } catch (error) { console.error(error); setProducts([]); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(), 500);
    return () => clearTimeout(timer);
  }, [search, fetchProducts]);

  const handleOpenCreate = () => {
    setForm(initialForm);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setForm(prod);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch('/api/products', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setShowModal(false);
        fetchProducts();
        alert(isEditing ? 'Producto actualizado' : 'Producto creado');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) { alert('Error de conexión'); }
  };

  return (
    <div className="animate-fadeIn p-4 md:p-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex-1 w-full md:w-auto bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex gap-3 items-center focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
           <span className="text-xl pl-2 opacity-50">🔍</span>
           <input 
             type="text" 
             placeholder="Buscar productos..." 
             className="flex-1 outline-none text-slate-700 font-medium placeholder:text-slate-400" 
             value={search} 
             onChange={(e) => setSearch(e.target.value)}
           />
        </div>
        <button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition transform active:scale-95 flex items-center gap-2">
          <span>＋</span> Nuevo Producto
        </button>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-5">Código</th>
              <th className="p-5">Producto</th>
              <th className="p-5">Costo</th>
              <th className="p-5">Precio 1</th>
              <th className="p-5">Precio 2</th>
              <th className="p-5">Precio 3</th>
              <th className="p-5 text-center">Stock</th>
              <th className="p-5 text-center">Acciones</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? ( 
              <tr><td colSpan={8} className="p-10 text-center text-slate-400 font-medium">Cargando catálogo...</td></tr> 
            ) : products.length === 0 ? ( 
              <tr><td colSpan={8} className="p-10 text-center text-slate-400">No se encontraron productos.</td></tr> 
            ) : (
              products.map((prod) => (
                <tr key={prod.idproducto} className="hover:bg-indigo-50/30 transition duration-150">
                  <td className="p-5">
                    <div className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">{prod.codigo_interno}</div>
                  </td>
                  <td className="p-5">
                    <div className="font-bold text-slate-700 text-base">{prod.nombre_producto}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{prod.codigo_barra}</div>
                  </td>
                  <td className="p-5 text-slate-400 font-medium">L. {Number(prod.precio_compra).toFixed(2)}</td>
                  
                  <td className="p-5 font-bold text-slate-700">L. {Number(prod.precio_venta).toFixed(2)}</td>
                  <td className="p-5 font-bold text-blue-600">L. {Number(prod.precio_venta_mayoreo).toFixed(2)}</td>
                  <td className="p-5 font-bold text-purple-600 bg-purple-50 rounded-lg">L. {Number(prod.precio_venta_3).toFixed(2)}</td>
                  
                  <td className="p-5 text-center">
                    <span className={`px-3 py-1 rounded-full font-bold text-xs ${Number(prod.stock) <= Number(prod.stock_min) ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {prod.stock}
                    </span>
                  </td>
                  <td className="p-5 flex justify-center">
                    <button onClick={() => handleOpenEdit(prod)} className="text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition">
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORMULARIO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-white px-8 py-6 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="font-black text-2xl text-slate-800">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                <p className="text-slate-400 text-sm">Completa la información del inventario.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition flex items-center justify-center text-xl">✕</button>
            </div>

            <div className="overflow-y-auto p-8">
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="col-span-1 md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre del Producto *</label>
                    <input required type="text" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition font-medium" value={form.nombre_producto} onChange={e => setForm({...form, nombre_producto: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Código de Barra</label>
                    <input type="text" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition font-mono text-sm" value={form.codigo_barra} onChange={e => setForm({...form, codigo_barra: e.target.value})} />
                  </div>
                </div>

                <div className="col-span-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Stock Actual</label>
                      {/* PROTECCIÓN NaN */}
                      <input 
                        type="number" 
                        disabled={isEditing} 
                        className="w-full p-3 border border-slate-200 rounded-xl bg-white disabled:bg-slate-100 text-center font-bold text-lg" 
                        value={form.stock} 
                        onChange={e => setForm({...form, stock: e.target.value === '' ? 0 : parseFloat(e.target.value)})} 
                      />
                      {isEditing && <p className="text-[10px] text-slate-400 mt-1 text-center">Gestionar en Entradas/Salidas</p>}
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Stock Mínimo</label>
                      <input 
                        type="number" 
                        className="w-full p-3 border border-slate-200 rounded-xl bg-white text-center" 
                        value={form.stock_min} 
                        onChange={e => setForm({...form, stock_min: e.target.value === '' ? 0 : parseFloat(e.target.value)})} 
                      />
                   </div>
                </div>

                <div className="col-span-1 md:col-span-3 border-t border-slate-100 my-2"></div>

                <h4 className="col-span-1 md:col-span-3 text-sm font-bold text-indigo-600 uppercase tracking-wider">Configuración de Precios</h4>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Costo (Compra) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">L.</span>
                    <input 
                        required 
                        type="number" 
                        step="0.01" 
                        className="w-full p-3 pl-8 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition" 
                        value={form.precio_compra} 
                        onChange={e => setForm({...form, precio_compra: e.target.value === '' ? 0 : parseFloat(e.target.value)})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Precio Público *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">L.</span>
                    <input 
                        required 
                        type="number" 
                        step="0.01" 
                        className="w-full p-3 pl-8 border-2 border-indigo-100 bg-indigo-50/30 rounded-xl focus:border-indigo-500 outline-none transition font-bold text-indigo-900" 
                        value={form.precio_venta} 
                        onChange={e => setForm({...form, precio_venta: e.target.value === '' ? 0 : parseFloat(e.target.value)})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mayoreo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">L.</span>
                    <input 
                        required 
                        type="number" 
                        step="0.01" 
                        className="w-full p-3 pl-8 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition" 
                        value={form.precio_venta_mayoreo} 
                        onChange={e => setForm({...form, precio_venta_mayoreo: e.target.value === '' ? 0 : parseFloat(e.target.value)})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-600 uppercase mb-2">Precio Especial (3)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 font-bold">L.</span>
                    <input 
                        required 
                        type="number" 
                        step="0.01" 
                        className="w-full p-3 pl-8 border-2 border-purple-100 bg-purple-50/30 rounded-xl focus:border-purple-500 outline-none transition font-bold text-purple-900" 
                        value={form.precio_venta_3} 
                        onChange={e => setForm({...form, precio_venta_3: e.target.value === '' ? 0 : parseFloat(e.target.value)})} 
                    />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-3 border-t border-slate-100 my-2"></div>

                <h4 className="col-span-1 md:col-span-3 text-sm font-bold text-indigo-600 uppercase tracking-wider">Clasificación</h4>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">ID Categoría *</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full p-3 border border-slate-200 rounded-xl" 
                    value={form.idcategoria} 
                    onChange={e => setForm({...form, idcategoria: e.target.value === '' ? 1 : parseInt(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">ID Presentación *</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full p-3 border border-slate-200 rounded-xl" 
                    value={form.idpresentacion} 
                    onChange={e => setForm({...form, idpresentacion: e.target.value === '' ? 1 : parseInt(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">ID Marca</label>
                  <input 
                    type="number" 
                    className="w-full p-3 border border-slate-200 rounded-xl" 
                    value={form.idmarca || 0} 
                    onChange={e => setForm({...form, idmarca: e.target.value === '' ? 0 : parseInt(e.target.value)})} 
                  />
                </div>
                
                <div className="col-span-1 md:col-span-3 pt-2">
                  <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                    <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" checked={form.perecedero === 1} onChange={e => setForm({...form, perecedero: e.target.checked ? 1 : 0})} />
                    <span className="text-sm font-bold text-slate-700">Producto Perecedero (Maneja fecha de vencimiento)</span>
                  </label>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition transform active:scale-[0.98]">
                {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}