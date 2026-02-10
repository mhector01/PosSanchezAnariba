'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Save, X, Pencil, Search, Scale, FileClock, Calendar } from 'lucide-react'; 
import { useAuth } from '@/context/AuthContext';

// --- INTERFACES ---
interface Product {
  idproducto?: number;
  codigo_interno?: string;
  codigo_barra: string;
  nombre_producto: string;
  descripcion?: string;
  precio_compra: number;
  precio_venta: number;
  precio_venta_mayoreo: number;
  precio_venta_3: number;
  stock: number;
  stock_min: number;
  idcategoria: number;
  idsubcategoria: number;
  idmarca?: number;
  idpresentacion: number;
  perecedero: number;
  nombre_marca?: string;
}

interface Category { idcategoria: number; nombre_categoria: string; }
interface Subcategory { idsubcategoria: number; nombre_subcategoria: string; idcategoria: number; }
interface Brand { idmarca: number; nombre_marca: string; }
interface Presentation { idpresentacion: number; nombre_presentacion: string; }

// --- COMPONENTE AUXILIAR (QUICK CREATE) ---
const QuickCreateModal = ({ isOpen, title, label, value, onChange, onSave, onClose, loading }: any) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-800">{title}</h4>
                    <button onClick={onClose} className="text-slate-400 hover:text-rose-500"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{label}</label>
                        <input autoFocus type="text" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition" placeholder="..." value={value} onChange={(e) => onChange(e.target.value)} />
                    </div>
                    <button onClick={onSave} disabled={!value || loading} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-50 flex justify-center gap-2">
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Guardar Rápido
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE AUXILIAR (AJUSTE INVENTARIO) ---
const AdjustStockModal = ({ isOpen, product, onClose, onSave }: any) => {
    const [realStock, setRealStock] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !product) return null;

    const currentStock = Number(product.stock);
    const newStock = Number(realStock);
    const diff = newStock - currentStock;

    const handleSave = async () => {
        if (!realStock || !reason) return alert("Completa los campos");
        setLoading(true);
        await onSave(product.idproducto, currentStock, newStock, reason);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 w-full max-w-md relative">
                <div className="mb-6 text-center">
                    <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100"><Scale className="w-8 h-8" /></div>
                    <h3 className="text-xl font-black text-slate-800">Ajuste de Inventario</h3>
                    <p className="text-sm text-slate-500 mt-1">{product.nombre_producto}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 flex justify-between items-center">
                    <div className="text-sm text-slate-500 font-medium">Stock en Sistema:</div>
                    <div className="text-2xl font-black text-slate-700">{currentStock}</div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Conteo Físico (Real)</label>
                        <input autoFocus type="number" className="w-full p-4 border-2 border-slate-200 rounded-xl text-center text-2xl font-bold outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition" placeholder="0" value={realStock} onChange={(e) => setRealStock(e.target.value)} />
                    </div>
                    
                    {realStock !== '' && diff !== 0 && (
                        <div className={`p-3 rounded-xl text-center text-sm font-bold border ${diff > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            {diff > 0 ? `Entrada: +${diff} unidades` : `Salida: ${diff} unidades`}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Motivo del Ajuste</label>
                        <textarea className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-amber-500 outline-none transition h-20 text-sm resize-none" placeholder="Ej. Dañado, Robo, Vencido, Error de conteo..." value={reason} onChange={(e) => setReason(e.target.value)} />
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition">Cancelar</button>
                    <button onClick={handleSave} disabled={loading || !reason || realStock === ''} className="flex-1 py-3 bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-200 hover:bg-amber-700 transition disabled:opacity-50 flex justify-center items-center gap-2">
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Aplicar Ajuste'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE AUXILIAR (HISTORIAL) ---
const HistoryModal = ({ isOpen, onClose }: any) => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(isOpen) {
            setLoading(true);
            fetch('/api/inventory/adjust/history')
                .then(res => res.json())
                .then(data => setHistory(Array.isArray(data) ? data : []))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><FileClock className="w-6 h-6 text-indigo-600"/> Historial de Ajustes</h3>
                        <p className="text-sm text-slate-400">Auditoría de movimientos manuales de inventario.</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">✕</button>
                </div>
                
                <div className="flex-1 overflow-auto p-0 custom-scrollbar">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs sticky top-0 shadow-sm">
                            <tr>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Producto</th>
                                <th className="p-4 text-center">Tipo</th>
                                <th className="p-4 text-center">Cantidad</th>
                                <th className="p-4">Motivo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-10 text-center text-slate-400">Cargando historial...</td></tr>
                            ) : history.length === 0 ? (
                                <tr><td colSpan={5} className="p-10 text-center text-slate-400">No hay ajustes registrados.</td></tr>
                            ) : (
                                history.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition">
                                        <td className="p-4 text-slate-500 font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3"/>
                                                {new Date(item.fecha).toLocaleDateString()} {new Date(item.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-700">{item.nombre_producto}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{item.codigo_barra}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {item.tipo === 'ENTRADA' ? 'Sobrante (+)' : 'Faltante (-)'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center font-black text-slate-700">
                                            {item.cantidad}
                                        </td>
                                        <td className="p-4 text-slate-600 italic text-xs max-w-xs truncate" title={item.motivo}>
                                            {item.motivo.replace('AJUSTE INVENTARIO: ', '')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
                    <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

// --- PÁGINA PRINCIPAL ---
export default function AdminProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user && Number(user.tipo_usuario) === 1;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false); // Estado para el historial
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Catálogos
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]); 
  const [filteredSubcats, setFilteredSubcats] = useState<Subcategory[]>([]); 
  const [brands, setBrands] = useState<Brand[]>([]);
  const [presentations, setPresentations] = useState<Presentation[]>([]);

  const [quickModal, setQuickModal] = useState({ type: '', isOpen: false, value: '', loading: false });

  const initialForm: Product = {
    codigo_barra: '', nombre_producto: '', descripcion: '', precio_compra: 0, precio_venta: 0,
    precio_venta_mayoreo: 0, precio_venta_3: 0, stock: 0, stock_min: 5,
    idcategoria: 0, idsubcategoria: 0, idpresentacion: 0, idmarca: 0, perecedero: 0
  };
  const [form, setForm] = useState<Product>(initialForm);

  const fetchCatalogs = async () => {
    try {
      const [resCat, resSub, resBrand, resPres] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/subcategories'), 
        fetch('/api/brands'),
        fetch('/api/presentations')
      ]);
      setCategories(await resCat.json());
      setSubcategories(await resSub.json());
      setBrands(await resBrand.json());
      setPresentations(await resPres.json());
    } catch (e) { console.error("Error catálogos", e); }
  };

  useEffect(() => { fetchCatalogs(); }, []);

  useEffect(() => {
    if (form.idcategoria) {
        const filtradas = subcategories.filter(s => s.idcategoria === form.idcategoria);
        setFilteredSubcats(filtradas);
        const isValid = filtradas.find(s => s.idsubcategoria === form.idsubcategoria);
        if (!isValid) setForm(prev => ({ ...prev, idsubcategoria: 0 }));
    } else {
        setFilteredSubcats([]);
        setForm(prev => ({ ...prev, idsubcategoria: 0 }));
    }
  }, [form.idcategoria, subcategories]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?q=${search}&limit=50`);
      const data = await res.json();
      setProducts(data.data && Array.isArray(data.data) ? data.data : []);
    } catch (e) { console.error(e); setProducts([]); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(), 500);
    return () => clearTimeout(timer);
  }, [search, fetchProducts]);

  // Manejo de Modales Rápidos
  const handleOpenQuick = (type: 'cat' | 'subcat' | 'brand' | 'pres') => {
    if (type === 'subcat' && !form.idcategoria) return alert("Selecciona primero una categoría");
    setQuickModal({ type, isOpen: true, value: '', loading: false });
  };

  const handleSaveQuick = async () => {
    if (!quickModal.value.trim()) return;
    setQuickModal(prev => ({ ...prev, loading: true }));
    try {
      let url = '';
      let body: any = {};
      if (quickModal.type === 'cat') { url = '/api/categories'; body = { nombre_categoria: quickModal.value }; }
      if (quickModal.type === 'brand') { url = '/api/brands'; body = { nombre_marca: quickModal.value }; }
      if (quickModal.type === 'pres') { url = '/api/presentations'; body = { nombre_presentacion: quickModal.value }; }
      if (quickModal.type === 'subcat') { url = '/api/subcategories'; body = { nombre_subcategoria: quickModal.value, idcategoria: form.idcategoria }; }
      
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json(); 
      if (res.ok) {
        await fetchCatalogs(); 
        setForm(prev => ({ ...prev, 
            idcategoria: quickModal.type === 'cat' ? data.id : prev.idcategoria,
            idsubcategoria: quickModal.type === 'subcat' ? data.id : prev.idsubcategoria,
            idmarca: quickModal.type === 'brand' ? data.id : prev.idmarca,
            idpresentacion: quickModal.type === 'pres' ? data.id : prev.idpresentacion,
        }));
        setQuickModal({ type: '', isOpen: false, value: '', loading: false });
      } else { alert("Error al guardar: " + data.error); }
    } catch (e) { alert("Error de conexión"); } 
    finally { setQuickModal(prev => ({ ...prev, loading: false })); }
  };

  // Manejo CRUD
  const handleOpenCreate = () => {
    setForm({ ...initialForm, idcategoria: categories[0]?.idcategoria || 0 }); 
    setIsEditing(false); setShowModal(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setForm(prod); setIsEditing(true); setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) { setShowModal(false); fetchProducts(); alert(isEditing ? 'Actualizado' : 'Creado'); } else { alert('Error: ' + data.error); }
    } catch (error) { alert('Error de conexión'); }
  };

  // Manejo Ajuste
  const handleOpenAdjust = (prod: Product) => {
      setSelectedProduct(prod);
      setShowAdjustModal(true);
  };

  const handleSaveAdjust = async (idproducto: number, cantidad_sistema: number, cantidad_real: number, motivo: string) => {
      try {
          const res = await fetch('/api/inventory/adjust', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  idproducto,
                  cantidad_sistema,
                  cantidad_real,
                  motivo,
                  idusuario: user?.id
              })
          });
          
          if(res.ok) {
              alert("Inventario ajustado correctamente");
              setShowAdjustModal(false);
              fetchProducts();
          } else {
              alert("Error al ajustar inventario");
          }
      } catch(e) {
          alert("Error de conexión");
      }
  };

  const getCatName = (id: number) => categories.find(c => c.idcategoria === id)?.nombre_categoria || 'N/A';
  const getBrandName = (id: number) => brands.find(b => b.idmarca === id)?.nombre_marca || 'N/A';

  if (authLoading) return <div className="p-10 text-center text-slate-400">Verificando permisos...</div>;

  return (
    <div className="animate-fadeIn p-4 md:p-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex-1 w-full md:w-auto bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex gap-3 items-center focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
           <Search className="w-5 h-5 text-slate-400" />
           <input type="text" placeholder="Buscar productos..." className="flex-1 outline-none text-slate-700 font-medium placeholder:text-slate-400" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {isAdmin && (
            <div className="flex gap-2">
                <button onClick={() => setShowHistoryModal(true)} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-4 rounded-2xl font-bold shadow-lg shadow-slate-200 transition transform active:scale-95 flex items-center gap-2">
                    <FileClock className="w-5 h-5" /> <span className="hidden md:inline">Historial</span>
                </button>
                <button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition transform active:scale-95 flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Nuevo Producto
                </button>
            </div>
        )}
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-5">Código</th>
              <th className="p-5">Producto</th>
              <th className="p-5">Clasificación</th>
              <th className="p-5">Precio Público</th>
              {isAdmin && <th className="p-5 text-rose-600">Costo (Admin)</th>}
              <th className="p-5 text-center">Stock</th>
              {isAdmin && <th className="p-5 text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? ( <tr><td colSpan={isAdmin ? 7 : 5} className="p-10 text-center text-slate-400 font-medium">Cargando catálogo...</td></tr> ) : products.length === 0 ? ( <tr><td colSpan={isAdmin ? 7 : 5} className="p-10 text-center text-slate-400">No se encontraron productos.</td></tr> ) : (
              products.map((prod) => (
                <tr key={prod.idproducto} className="hover:bg-indigo-50/30 transition duration-150">
                  <td className="p-5"><div className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">{prod.codigo_barra}</div></td>
                  <td className="p-5"><div className="font-bold text-slate-700 text-base">{prod.nombre_producto}</div></td>
                  <td className="p-5">
                      <div className="text-xs font-bold text-indigo-600">{getCatName(prod.idcategoria)}</div>
                      {prod.idsubcategoria > 0 && <div className="text-[10px] text-indigo-400 font-medium">↳ {subcategories.find(s => s.idsubcategoria === prod.idsubcategoria)?.nombre_subcategoria}</div>}
                      <div className="text-[10px] text-slate-400">{getBrandName(prod.idmarca || 0)}</div>
                  </td>
                  <td className="p-5 font-bold text-slate-700">L. {Number(prod.precio_venta).toFixed(2)}</td>
                  {isAdmin && <td className="p-5 font-bold text-rose-600 bg-rose-50/30">L. {Number(prod.precio_compra).toFixed(2)}</td>}
                  <td className="p-5 text-center"><span className={`px-3 py-1 rounded-full font-bold text-xs ${Number(prod.stock) <= Number(prod.stock_min) ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>{prod.stock}</span></td>
                  {isAdmin && (
                      <td className="p-5 flex justify-center gap-2">
                          <button onClick={() => handleOpenAdjust(prod)} className="text-amber-600 hover:text-amber-800 font-bold bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-xl transition flex items-center gap-1" title="Ajuste de Inventario">
                              <Scale className="w-4 h-4"/>
                          </button>
                          <button onClick={() => handleOpenEdit(prod)} className="text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition flex items-center gap-1">
                              <Pencil className="w-4 h-4"/>
                          </button>
                      </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR/EDITAR (Solo Admin) */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          {/* ... Contenido del modal crear (sin cambios respecto al anterior) ... */}
          {/* Para ahorrar espacio en la respuesta, es el mismo bloque que tenías, 
              pero asegurado con isAdmin */}
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] relative">
            <QuickCreateModal 
                isOpen={quickModal.isOpen}
                title={quickModal.type === 'cat' ? 'Nueva Categoría' : quickModal.type === 'subcat' ? 'Nueva Subcategoría' : quickModal.type === 'brand' ? 'Nueva Marca' : 'Nueva Presentación'}
                label={quickModal.type === 'cat' ? 'Nombre Categoría' : quickModal.type === 'subcat' ? 'Nombre Subcategoría' : 'Nombre'}
                value={quickModal.value}
                onChange={(val: string) => setQuickModal(p => ({...p, value: val}))}
                onSave={handleSaveQuick}
                onClose={() => setQuickModal({ type: '', isOpen: false, value: '', loading: false })}
                loading={quickModal.loading}
            />
            <div className="bg-white px-8 py-6 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
              <div><h3 className="font-black text-2xl text-slate-800">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3><p className="text-slate-400 text-sm">Completa la información del inventario.</p></div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition flex items-center justify-center text-xl">✕</button>
            </div>
            <div className="overflow-y-auto p-8 custom-scrollbar">
              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2 space-y-4">
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre del Producto *</label><input required type="text" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition font-medium" value={form.nombre_producto} onChange={e => setForm({...form, nombre_producto: e.target.value})} /></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Código de Barra</label><input type="text" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition font-mono text-sm" value={form.codigo_barra} onChange={e => setForm({...form, codigo_barra: e.target.value})} /></div>
                </div>
                <div className="col-span-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                   <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Stock Actual</label><input type="number" disabled={isEditing} className="w-full p-3 border border-slate-200 rounded-xl bg-white disabled:bg-slate-100 text-center font-bold text-lg" value={form.stock} onChange={e => setForm({...form, stock: e.target.value === '' ? 0 : parseFloat(e.target.value)})} /></div>
                   <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Stock Mínimo</label><input type="number" className="w-full p-3 border border-slate-200 rounded-xl bg-white text-center" value={form.stock_min} onChange={e => setForm({...form, stock_min: e.target.value === '' ? 0 : parseFloat(e.target.value)})} /></div>
                </div>
                <div className="col-span-1 md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descripción / Compatibilidad</label>
                  <textarea className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none transition h-24 text-sm resize-none" placeholder="Ej. Compatible con Toyota Corolla 2009-2013..." value={form.descripcion || ''} onChange={e => setForm({...form, descripcion: e.target.value})} />
                </div>
                <div className="col-span-1 md:col-span-3 border-t border-slate-100 my-2"></div>
                <h4 className="col-span-1 md:col-span-3 text-sm font-bold text-indigo-600 uppercase tracking-wider">Precios</h4>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Costo (Compra) *</label><input required type="number" step="0.01" className="w-full p-3 border border-slate-200 rounded-xl" value={form.precio_compra} onChange={e => setForm({...form, precio_compra: parseFloat(e.target.value)})} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Precio Público *</label><input required type="number" step="0.01" className="w-full p-3 border-2 border-indigo-100 bg-indigo-50/30 rounded-xl font-bold text-indigo-900" value={form.precio_venta} onChange={e => setForm({...form, precio_venta: parseFloat(e.target.value)})} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mayoreo</label><input required type="number" step="0.01" className="w-full p-3 border border-slate-200 rounded-xl" value={form.precio_venta_mayoreo} onChange={e => setForm({...form, precio_venta_mayoreo: parseFloat(e.target.value)})} /></div>
                <div className="col-span-1 md:col-span-3 border-t border-slate-100 my-2"></div>
                <h4 className="col-span-1 md:col-span-3 text-sm font-bold text-indigo-600 uppercase tracking-wider">Clasificación</h4>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Categoría *</label>
                  <div className="flex gap-2">
                    <select required className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none focus:border-indigo-500 transition" value={form.idcategoria} onChange={e => setForm({...form, idcategoria: parseInt(e.target.value)})}>
                        <option value={0} disabled>Seleccione...</option>
                        {categories.map(cat => <option key={cat.idcategoria} value={cat.idcategoria}>{cat.nombre_categoria}</option>)}
                    </select>
                    <button type="button" onClick={() => handleOpenQuick('cat')} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition"><Plus className="w-5 h-5" /></button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subcategoría</label>
                  <div className="flex gap-2">
                    <select className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none focus:border-indigo-500 transition disabled:bg-slate-100 disabled:text-slate-400" value={form.idsubcategoria} onChange={e => setForm({...form, idsubcategoria: parseInt(e.target.value)})} disabled={!form.idcategoria}>
                        <option value={0}>{form.idcategoria ? 'Seleccione Subcategoría...' : '← Elija Categoría'}</option>
                        {filteredSubcats.map(sub => <option key={sub.idsubcategoria} value={sub.idsubcategoria}>{sub.nombre_subcategoria}</option>)}
                    </select>
                    <button type="button" onClick={() => handleOpenQuick('subcat')} disabled={!form.idcategoria} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition disabled:opacity-50"><Plus className="w-5 h-5" /></button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Marca</label>
                  <div className="flex gap-2">
                    <select className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none focus:border-indigo-500 transition" value={form.idmarca} onChange={e => setForm({...form, idmarca: parseInt(e.target.value)})}>
                        <option value={0}>Sin Marca / Genérico</option>
                        {brands.map(brand => <option key={brand.idmarca} value={brand.idmarca}>{brand.nombre_marca}</option>)}
                    </select>
                    <button type="button" onClick={() => handleOpenQuick('brand')} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition"><Plus className="w-5 h-5" /></button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Presentación</label>
                  <div className="flex gap-2">
                    <select required className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none focus:border-indigo-500 transition" value={form.idpresentacion} onChange={e => setForm({...form, idpresentacion: parseInt(e.target.value)})}>
                        <option value={0} disabled>Seleccione...</option>
                        {presentations.map(pres => <option key={pres.idpresentacion} value={pres.idpresentacion}>{pres.nombre_presentacion}</option>)}
                    </select>
                    <button type="button" onClick={() => handleOpenQuick('pres')} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition"><Plus className="w-5 h-5" /></button>
                  </div>
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
              <button onClick={handleSaveProduct} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition transform active:scale-[0.98]">{isEditing ? 'Guardar Cambios' : 'Crear Producto'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJUSTE INVENTARIO (Solo Admin) */}
      {showAdjustModal && isAdmin && selectedProduct && (
          <AdjustStockModal 
              isOpen={showAdjustModal}
              product={selectedProduct}
              onClose={() => setShowAdjustModal(false)}
              onSave={handleSaveAdjust}
          />
      )}

      {/* MODAL HISTORIAL (Solo Admin) */}
      {showHistoryModal && isAdmin && (
          <HistoryModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} />
      )}
    </div>
  );
}