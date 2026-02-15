'use client';
import React, { useState, useEffect } from 'react';
import { FileText, Layers, AlertTriangle, Printer, ListTree, Search } from 'lucide-react';

// --- INTERFACES PARA TYPESCRIPT ---
interface SubCategoryData {
  totalCosto: number;
  items: any[];
}

interface CategoryData {
  totalCosto: number;
  itemsCount: number;
  subs: Record<string, SubCategoryData>;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas'); 

  useEffect(() => {
    setSelectedCategory('Todas');
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    const apiType = activeTab === 'items_by_category' ? 'inventory' : activeTab;
    
    fetch(`/api/reports?type=${apiType}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [activeTab]);

  // --- LÓGICA DE FILTRADO ---
  let displayData = data;
  if (activeTab === 'items_by_category' && selectedCategory !== 'Todas') {
    displayData = data.filter(item => item.nombre_categoria === selectedCategory);
  }

  const totalCosto = displayData.reduce((sum, item) => sum + (Number(item.total_costo) || Number(item.valor_inversion) || 0), 0);
  const totalItems = displayData.length;

  // --- LÓGICA DE AGRUPACIÓN (Con Tipado Estricto) ---
  const groupedData: Record<string, CategoryData> = displayData.reduce((acc, item) => {
    const cat = item.nombre_categoria || 'Sin Categoría';
    const sub = item.nombre_subcategoria || 'General';

    if (!acc[cat]) {
        acc[cat] = { totalCosto: 0, itemsCount: 0, subs: {} };
    }
    if (!acc[cat].subs[sub]) {
        acc[cat].subs[sub] = { totalCosto: 0, items: [] };
    }

    acc[cat].subs[sub].items.push(item);
    const itemTotal = Number(item.total_costo) || 0;
    
    acc[cat].subs[sub].totalCosto += itemTotal;
    acc[cat].totalCosto += itemTotal;
    acc[cat].itemsCount += 1;

    return acc;
  }, {} as Record<string, CategoryData>); 

  const uniqueCategories = Array.from(new Set(data.map(item => item.nombre_categoria || 'Sin Categoría'))).sort();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* --- ESTILOS DE IMPRESIÓN --- */}
      <style jsx global>{`
        @media print {
          html, body { height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area {
            position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px;
            background: white; z-index: 9999; height: auto !important; overflow: visible !important; display: block !important; 
          }
          table { width: 100% !important; border-collapse: collapse !important; }
          thead { display: table-header-group; }
          tr { break-inside: avoid; page-break-inside: avoid; }
          th, td { border-bottom: 1px solid #ddd !important; color: #000 !important; padding: 8px !important; }
          .print\\:hidden { display: none !important; }
          .no-print-style { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Reportes e Inventario</h1>
          <p className="text-slate-500">Visualiza el estado de tu negocio.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={handlePrint} className="bg-slate-800 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-900 transition shadow-lg active:scale-95">
                <Printer className="w-5 h-5" /> Imprimir Reporte
            </button>
        </div>
      </div>

      {/* TABS (Navegación) */}
      <div className="flex gap-2 overflow-x-auto pb-2 print:hidden border-b border-slate-200">
        <button onClick={() => setActiveTab('inventory')} className={`shrink-0 px-5 py-3 rounded-t-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
            <FileText className="w-4 h-4" /> Inventario General
        </button>
        <button onClick={() => setActiveTab('items_by_category')} className={`shrink-0 px-5 py-3 rounded-t-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'items_by_category' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
            <ListTree className="w-4 h-4" /> Detalle por Categoría
        </button>
        <button onClick={() => setActiveTab('categories')} className={`shrink-0 px-5 py-3 rounded-t-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'categories' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
            <Layers className="w-4 h-4" /> Resumen Categorías
        </button>
        <button onClick={() => setActiveTab('low_stock')} className={`shrink-0 px-5 py-3 rounded-t-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'low_stock' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
            <AlertTriangle className="w-4 h-4" /> Bajo Stock
        </button>
      </div>

      {/* --- ÁREA IMPRIMIBLE --- */}
      <div id="printable-area" className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-slate-200 p-6 min-h-[500px] no-print-style">
        
        {/* ENCABEZADO PARA IMPRESIÓN */}
        <div className="hidden print:block mb-8 text-center border-b-2 border-black pb-4">
            <h2 className="text-2xl font-black uppercase text-black">
                {activeTab === 'inventory' ? 'Reporte de Inventario General' : 
                 activeTab === 'items_by_category' ? `Detalle de Inventario: ${selectedCategory}` :
                 activeTab === 'categories' ? 'Resumen de Stock por Categorías' : 
                 'Reporte de Productos Bajo Stock'}
            </h2>
            <div className="flex justify-between mt-2 text-sm text-black font-medium">
                <p>Farmacia Ivis</p>
                <p>Fecha: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            </div>
        </div>

        {/* TARJETAS RESUMEN */}
        {activeTab !== 'low_stock' && !loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 print:mb-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 print:border print:border-gray-400 print:bg-white">
                    <p className="text-xs text-slate-500 uppercase font-bold print:text-black">Total Registros</p>
                    <p className="text-2xl font-black text-slate-800 print:text-black">{totalItems}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 print:border print:border-gray-400 print:bg-white">
                    <p className="text-xs text-emerald-600 uppercase font-bold print:text-black">Inversión Total</p>
                    <p className="text-2xl font-black text-emerald-700 print:text-black">L. {totalCosto.toLocaleString('es-HN', {minimumFractionDigits: 2})}</p>
                </div>
                
                {/* FILTRO DROPDOWN */}
                {activeTab === 'items_by_category' && (
                    <div className="col-span-2 p-4 bg-indigo-50 rounded-xl border border-indigo-100 print:hidden flex flex-col justify-center">
                        <label className="text-xs text-indigo-600 uppercase font-bold mb-1 flex items-center gap-1"><Search className="w-3 h-3"/> Filtrar Categoría</label>
                        <select 
                            value={selectedCategory} 
                            onChange={e => setSelectedCategory(e.target.value)} 
                            className="w-full p-2 bg-white border border-indigo-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="Todas">TODAS LAS CATEGORÍAS</option>
                            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                )}
            </div>
        )}

        {/* TABLA DE DATOS */}
        {loading ? (
            <div className="flex justify-center items-center h-64 text-slate-400 font-medium animate-pulse print:hidden">Cargando datos...</div>
        ) : (
            <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold print:bg-white print:text-black print:border-b-2 print:border-black">
                        {(activeTab === 'inventory' || activeTab === 'items_by_category') && (
                            <tr>
                                <th className="p-3 w-[15%]">Código</th>
                                <th className="p-3 w-[35%]">Producto</th>
                                <th className="p-3 text-center w-[10%]">Stock</th>
                                <th className="p-3 text-right w-[15%]">Costo Unit.</th>
                                <th className="p-3 text-right w-[10%]">Venta</th>
                                <th className="p-3 text-right w-[15%]">Total Inversión</th>
                            </tr>
                        )}
                        {activeTab === 'categories' && (
                            <tr>
                                <th className="p-3">Categoría</th>
                                <th className="p-3">Subcategoría</th>
                                <th className="p-3 text-center">Cant. Items</th>
                                <th className="p-3 text-center">Unidades Totales</th>
                                <th className="p-3 text-right">Inversión</th>
                            </tr>
                        )}
                        {activeTab === 'low_stock' && (
                            <tr>
                                <th className="p-3">Código</th>
                                <th className="p-3">Producto</th>
                                <th className="p-3 text-center">Stock</th>
                                <th className="p-3 text-center">Mínimo</th>
                                <th className="p-3">Proveedor</th>
                                <th className="p-3 text-right">Contacto</th>
                            </tr>
                        )}
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-gray-300">
                        
                        {/* INVENTARIO GENERAL, CATEGORÍAS Y BAJO STOCK */}
                        {activeTab !== 'items_by_category' && displayData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors print:hover:bg-transparent break-inside-avoid">
                                {activeTab === 'inventory' && (
                                    <>
                                        <td className="p-3 font-mono text-xs">{item.codigo_barra}</td>
                                        <td className="p-3 font-bold text-slate-700 print:text-black">{item.nombre_producto}</td>
                                        <td className="p-3 text-center font-bold">{Number(item.stock).toFixed(0)}</td>
                                        <td className="p-3 text-right text-slate-500 print:text-black">L. {Number(item.precio_compra).toFixed(2)}</td>
                                        <td className="p-3 text-right text-slate-700 font-bold print:text-black">L. {Number(item.precio_venta).toFixed(2)}</td>
                                        <td className="p-3 text-right font-black text-slate-800 print:text-black">L. {Number(item.total_costo).toFixed(2)}</td>
                                    </>
                                )}
                                {activeTab === 'categories' && (
                                    <>
                                        <td className="p-3 font-bold text-slate-700 print:text-black">{item.nombre_categoria}</td>
                                        <td className="p-3 text-slate-500 print:text-black">{item.nombre_subcategoria || '- General -'}</td>
                                        <td className="p-3 text-center">{item.cantidad_productos}</td>
                                        <td className="p-3 text-center font-bold">{Number(item.unidades_totales).toFixed(0)}</td>
                                        <td className="p-3 text-right font-black text-emerald-600 print:text-black">L. {Number(item.valor_inversion).toFixed(2)}</td>
                                    </>
                                )}
                                {activeTab === 'low_stock' && (
                                    <>
                                        <td className="p-3 font-mono text-xs">{item.codigo_barra}</td>
                                        <td className="p-3 font-bold text-slate-700 print:text-black">{item.nombre_producto}</td>
                                        <td className="p-3 text-center font-bold text-rose-600 print:text-black bg-rose-50 print:bg-transparent rounded">{Number(item.stock).toFixed(0)}</td>
                                        <td className="p-3 text-center text-slate-500 print:text-black">{Number(item.stock_min).toFixed(0)}</td>
                                        <td className="p-3 text-sm">{item.nombre_proveedor || 'N/A'}</td>
                                        <td className="p-3 text-sm font-mono text-right">{item.telefono_contacto || '-'}</td>
                                    </>
                                )}
                            </tr>
                        ))}

                        {/* DETALLE POR CATEGORÍA AGRUPADO (TS SOLUCIONADO) */}
                        {activeTab === 'items_by_category' && Object.entries(groupedData).map((entry) => {
                            const catName = entry[0];
                            const catData = entry[1] as CategoryData;

                            return (
                                <React.Fragment key={catName}>
                                    <tr className="bg-slate-200 print:bg-gray-200 border-b-2 border-slate-300 break-after-avoid">
                                        <td colSpan={5} className="p-3 font-black text-slate-800 print:text-black uppercase tracking-wide">
                                            📦 {catName} <span className="text-xs font-medium ml-2 text-slate-600 normal-case">({catData.itemsCount} productos)</span>
                                        </td>
                                        <td className="p-3 text-right font-black text-slate-900 print:text-black">
                                            L. {catData.totalCosto.toLocaleString('es-HN', {minimumFractionDigits: 2})}
                                        </td>
                                    </tr>

                                    {Object.entries(catData.subs).map((subEntry) => {
                                        const subName = subEntry[0];
                                        const subData = subEntry[1] as SubCategoryData;

                                        return (
                                            <React.Fragment key={subName}>
                                                <tr className="bg-indigo-50/50 print:bg-gray-50 border-b border-indigo-100 break-after-avoid">
                                                    <td colSpan={5} className="py-2 px-3 pl-8 font-bold text-indigo-700 print:text-gray-700 text-xs uppercase tracking-wider">
                                                        ↳ Subcategoría: {subName}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-bold text-indigo-700 print:text-gray-700 text-xs">
                                                        L. {subData.totalCosto.toLocaleString('es-HN', {minimumFractionDigits: 2})}
                                                    </td>
                                                </tr>
                                                {subData.items.map((item: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-slate-50 print:hover:bg-transparent border-b border-slate-100 break-inside-avoid">
                                                        <td className="p-2 pl-12 font-mono text-[10px] text-slate-400">{item.codigo_barra}</td>
                                                        <td className="p-2 text-xs font-medium text-slate-700 print:text-black">{item.nombre_producto}</td>
                                                        <td className="p-2 text-center text-xs font-bold">{Number(item.stock).toFixed(0)}</td>
                                                        <td className="p-2 text-right text-[10px] text-slate-500">L. {Number(item.precio_compra).toFixed(2)}</td>
                                                        <td className="p-2 text-right text-[10px] text-slate-600">L. {Number(item.precio_venta).toFixed(2)}</td>
                                                        <td className="p-2 text-right text-xs font-bold text-slate-800 print:text-black">L. {Number(item.total_costo).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}

                        {displayData.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-medium">No hay datos para mostrar en esta vista.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
}