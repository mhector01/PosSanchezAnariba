'use client';
import { useState, useEffect } from 'react';
import { FileText, Layers, AlertTriangle, Printer } from 'lucide-react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?type=${activeTab}`)
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

  const totalCosto = data.reduce((sum, item) => sum + (Number(item.total_costo) || Number(item.valor_inversion) || 0), 0);
  const totalItems = data.length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* --- ESTILOS DE IMPRESIÓN MEJORADOS --- */}
      <style jsx global>{`
        @media print {
          /* 1. RESETEAR EL CUERPO Y HTML */
          html, body {
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* 2. OCULTAR TODO EL SITIO WEB */
          body * {
            visibility: hidden;
          }

          /* 3. VISIBILIDAD SOLO AL ÁREA DE IMPRESIÓN */
          #printable-area, #printable-area * {
            visibility: visible;
          }

          /* 4. POSICIONAMIENTO DEL REPORTE */
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white;
            z-index: 9999;
            /* CRÍTICO: Permitir que crezca */
            height: auto !important; 
            overflow: visible !important;
            display: block !important; 
          }

          /* 5. GESTIÓN DE SALTO DE PÁGINA */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          thead {
            display: table-header-group; /* Repetir encabezado en cada página */
          }
          tr {
            break-inside: avoid; /* Evitar partir filas a la mitad */
            page-break-inside: avoid;
          }
          th, td {
            border-bottom: 1px solid #ddd !important;
            color: #000 !important;
            padding: 8px !important;
          }

          /* Ocultar elementos de UI */
          .print\:hidden {
            display: none !important;
          }
          
          /* Quitar estilos decorativos */
          .no-print-style {
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* HEADER (Botones y Título Web) */}
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
        <button onClick={() => setActiveTab('inventory')} className={`px-5 py-3 rounded-t-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
            <FileText className="w-4 h-4" /> Inventario Valorizado
        </button>
        <button onClick={() => setActiveTab('categories')} className={`px-5 py-3 rounded-t-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'categories' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
            <Layers className="w-4 h-4" /> Por Categorías
        </button>
        <button onClick={() => setActiveTab('low_stock')} className={`px-5 py-3 rounded-t-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'low_stock' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
            <AlertTriangle className="w-4 h-4" /> Bajo Stock
        </button>
      </div>

      {/* --- ÁREA IMPRIMIBLE --- */}
      {/* Importante: Quitamos overflow-auto aquí para que al imprimir no corte */}
      <div id="printable-area" className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-slate-200 p-6 min-h-[500px] no-print-style">
        
        {/* ENCABEZADO PARA IMPRESIÓN */}
        <div className="hidden print:block mb-8 text-center border-b-2 border-black pb-4">
            <h2 className="text-2xl font-black uppercase text-black">
                {activeTab === 'inventory' ? 'Reporte de Inventario General' : 
                 activeTab === 'categories' ? 'Reporte de Stock por Categorías' : 
                 'Reporte de Productos Bajo Stock'}
            </h2>
            <div className="flex justify-between mt-2 text-sm text-black font-medium">
                <p>Farmacia IVIS</p>
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
            </div>
        )}

        {/* TABLA DE DATOS */}
        {loading ? (
            <div className="flex justify-center items-center h-64 text-slate-400 font-medium animate-pulse print:hidden">Cargando datos...</div>
        ) : (
            // IMPORTANTE: Quitamos el div con overflow-x-auto al imprimir para que la tabla se expanda
            <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold print:bg-white print:text-black print:border-b-2 print:border-black">
                        {activeTab === 'inventory' && (
                            <tr>
                                <th className="p-3">Código</th>
                                <th className="p-3">Producto</th>
                                <th className="p-3">Categoría</th>
                                <th className="p-3 text-center">Stock</th>
                                <th className="p-3 text-right">Costo</th>
                                <th className="p-3 text-right">Venta</th>
                                <th className="p-3 text-right">Total Costo</th>
                            </tr>
                        )}
                        {activeTab === 'categories' && (
                            <tr>
                                <th className="p-3">Categoría</th>
                                <th className="p-3">Subcategoría</th>
                                <th className="p-3 text-center">Cant. Items</th>
                                <th className="p-3 text-center">Unidades</th>
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
                        {data.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors print:hover:bg-transparent break-inside-avoid">
                                {/* FILAS INVENTARIO */}
                                {activeTab === 'inventory' && (
                                    <>
                                        <td className="p-3 font-mono text-xs">{item.codigo_barra}</td>
                                        <td className="p-3 font-bold text-slate-700 print:text-black">{item.nombre_producto}</td>
                                        <td className="p-3 text-slate-500 text-xs print:text-black">
                                            {item.nombre_categoria}
                                            {item.nombre_subcategoria && <span className="block text-indigo-500 print:text-black font-semibold">↳ {item.nombre_subcategoria}</span>}
                                        </td>
                                        <td className="p-3 text-center font-bold">{Number(item.stock).toFixed(0)}</td>
                                        <td className="p-3 text-right text-slate-500 print:text-black">L. {Number(item.precio_compra).toFixed(2)}</td>
                                        <td className="p-3 text-right text-slate-700 font-bold print:text-black">L. {Number(item.precio_venta).toFixed(2)}</td>
                                        <td className="p-3 text-right font-black text-slate-800 print:text-black">L. {Number(item.total_costo).toFixed(2)}</td>
                                    </>
                                )}

                                {/* FILAS CATEGORÍAS */}
                                {activeTab === 'categories' && (
                                    <>
                                        <td className="p-3 font-bold text-slate-700 print:text-black">{item.nombre_categoria}</td>
                                        <td className="p-3 text-slate-500 print:text-black">{item.nombre_subcategoria || '- General -'}</td>
                                        <td className="p-3 text-center">{item.cantidad_productos}</td>
                                        <td className="p-3 text-center font-bold">{Number(item.unidades_totales).toFixed(0)}</td>
                                        <td className="p-3 text-right font-black text-emerald-600 print:text-black">L. {Number(item.valor_inversion).toFixed(2)}</td>
                                    </>
                                )}

                                {/* FILAS BAJO STOCK */}
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
                        {data.length === 0 && (
                            <tr><td colSpan={7} className="p-8 text-center text-slate-400">No hay datos para mostrar.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
}