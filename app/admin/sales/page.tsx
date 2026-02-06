'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// Definición de tipos
interface Sale {
  idventa: number;
  numero_venta?: string;
  fecha_venta: string;
  nombre_cliente: string;
  tipo_pago: string;
  total: number;
  usuario?: string;
  total_ediciones: number; // <--- NUEVO CAMPO
}

interface HistoryRecord {
  fecha_edicion: string;
  usuario: string;
  accion: string;
  total_anterior: number;
  total_nuevo: number;
}

export default function AdminSalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  
  // --- Estados de Control ---
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // --- Estados Modal Historial ---
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<HistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // --- Estados de Ordenamiento ---
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'fecha_venta',
    direction: 'desc'
  });

  // --- Fetch de Datos ---
  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        q: search,
        orderBy: sortConfig.key,
        orderDir: sortConfig.direction
      });

      const res = await fetch(`/api/sales?${queryParams}`);
      const data = await res.json();
      
      if (data.data) {
        setSales(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
        if (page > data.pagination.totalPages && data.pagination.totalPages > 0) {
            setPage(data.pagination.totalPages);
        }
      } else {
        setSales([]);
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  }, [page, limit, search, sortConfig]);

  // Cargar Historial de una venta específica
  const fetchHistoryDetails = async (idVenta: number) => {
    setLoadingHistory(true);
    setShowHistoryModal(true);
    setSelectedHistory([]); // Limpiar previo
    try {
        // Reutilizamos el endpoint de detalle que ya devuelve el historial
        const res = await fetch(`/api/sales/${idVenta}`);
        const data = await res.json();
        if (data.history) {
            setSelectedHistory(data.history);
        }
    } catch (error) {
        console.error("Error cargando historial", error);
    } finally {
        setLoadingHistory(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        if (page !== 1) setPage(1);
        else fetchSales(); 
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchSales();
  }, [page, limit, sortConfig]);

  // --- Manejadores ---
  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const openTicket = (id: number) => {
    const w=400,h=600,l=(window.innerWidth-w)/2,t=(window.innerHeight-h)/2;
    window.open(`/ticket/${id}`,'Ticket',`width=${w},height=${h},top=${t},left=${l},scrollbars=yes`);
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <span className="text-slate-300 ml-1">⇅</span>;
    return <span className="text-indigo-600 ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  const PaymentBadge = ({ type }: { type: string }) => {
    const styles: Record<string, string> = {
      'Efectivo': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Tarjeta': 'bg-blue-100 text-blue-700 border-blue-200',
      'Deposito': 'bg-purple-100 text-purple-700 border-purple-200',
      'Credito': 'bg-amber-100 text-amber-700 border-amber-200',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[type] || 'bg-slate-100 text-slate-600'}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="animate-fadeIn p-4 md:p-8 max-w-[1600px] mx-auto relative">
      
      {/* --- MODAL HISTORIAL --- */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg">📜 Bitácora de Cambios</h3>
                    <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
                </div>
                <div className="overflow-y-auto p-0 flex-1 bg-slate-50">
                    {loadingHistory ? (
                        <div className="p-10 text-center text-slate-500">Cargando bitácora...</div>
                    ) : selectedHistory.length === 0 ? (
                        <div className="p-10 text-center text-slate-400">Esta venta no tiene ediciones registradas.</div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white text-slate-500 uppercase text-xs font-bold border-b">
                                <tr>
                                    <th className="p-4">Fecha / Usuario</th>
                                    <th className="p-4 text-right">Cambio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {selectedHistory.map((h, i) => (
                                    <tr key={i} className="bg-white hover:bg-slate-50">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-700">{new Date(h.fecha_edicion).toLocaleDateString()} {new Date(h.fecha_edicion).toLocaleTimeString()}</div>
                                            <div className="text-xs text-indigo-600 font-bold mt-1">👤 {h.usuario}</div>
                                            <div className="text-[10px] text-slate-400 uppercase mt-0.5">{h.accion}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="text-xs text-slate-400 line-through">L. {Number(h.total_anterior).toFixed(2)}</div>
                                            <div className="font-black text-slate-800 text-lg">L. {Number(h.total_nuevo).toFixed(2)}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="p-4 bg-white border-t text-center">
                    <button onClick={() => setShowHistoryModal(false)} className="w-full py-3 bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition">Cerrar</button>
                </div>
            </div>
        </div>
      )}

      {/* HEADER SUPERIOR */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Historial de Ventas</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona y revisa todas las transacciones realizadas.</p>
        </div>
        <div className="bg-white px-5 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
           <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">📊</div>
           <div>
             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Ventas</p>
             <p className="text-xl font-black text-slate-800">{totalItems}</p>
           </div>
        </div>
      </div>

      {/* BARRA DE CONTROLES */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <svg className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
           </div>
           <input type="text" placeholder="Buscar por cliente, # ticket..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <span className="text-sm text-slate-500 font-medium hidden md:inline">Mostrar:</span>
           <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none font-bold" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
             <option value={10}>10 filas</option><option value={20}>20 filas</option><option value={50}>50 filas</option><option value={100}>100 filas</option>
           </select>
        </div>
      </div>

      {/* TABLA DE DATOS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
                <th className="p-5 cursor-pointer hover:bg-slate-100 transition select-none group" onClick={() => handleSort('idventa')}>Ticket <SortIcon columnKey="idventa" /></th>
                <th className="p-5 cursor-pointer hover:bg-slate-100 transition select-none group" onClick={() => handleSort('fecha_venta')}>Fecha <SortIcon columnKey="fecha_venta" /></th>
                <th className="p-5 cursor-pointer hover:bg-slate-100 transition select-none group" onClick={() => handleSort('nombre_cliente')}>Cliente <SortIcon columnKey="nombre_cliente" /></th>
                <th className="p-5 text-center">Método Pago</th>
                <th className="p-5 text-right cursor-pointer hover:bg-slate-100 transition select-none group" onClick={() => handleSort('total')}>Total <SortIcon columnKey="total" /></th>
                <th className="p-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-5"><div className="h-4 bg-slate-200 rounded w-12"></div></td>
                    <td className="p-5"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="p-5"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                    <td className="p-5 text-center"><div className="h-6 bg-slate-200 rounded-full w-16 mx-auto"></div></td>
                    <td className="p-5"><div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div></td>
                    <td className="p-5"><div className="h-8 bg-slate-200 rounded w-16 mx-auto"></div></td>
                  </tr>
                ))
              ) : sales.length === 0 ? (
                <tr><td colSpan={6} className="p-16 text-center text-slate-400">📂 No se encontraron ventas.</td></tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.idventa} className="hover:bg-indigo-50/30 transition duration-150 group">
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded text-xs">
                            #{sale.numero_venta || String(sale.idventa).padStart(6, '0')}
                          </span>
                          {/* ETIQUETA EDITADO */}
                          {sale.total_ediciones > 0 && (
                              <span 
                                className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200 cursor-help"
                                title={`Esta venta ha sido editada ${sale.total_ediciones} veces`}
                              >
                                ✏️ {sale.total_ediciones > 1 ? `x${sale.total_ediciones}` : 'Edit'}
                              </span>
                          )}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="font-bold text-slate-700">{new Date(sale.fecha_venta).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{new Date(sale.fecha_venta).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                    </td>
                    <td className="p-5">
                      <div className="font-medium text-slate-800">{sale.nombre_cliente}</div>
                      {sale.usuario && <div className="text-[10px] text-slate-400">Vend: {sale.usuario}</div>}
                    </td>
                    <td className="p-5 text-center">
                      <PaymentBadge type={sale.tipo_pago} />
                    </td>
                    <td className="p-5 text-right">
                      <span className="font-black text-slate-800 text-base">L. {Number(sale.total).toFixed(2)}</span>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center gap-2 opacity-100 md:opacity-60 group-hover:opacity-100 transition-opacity">
                        
                        {/* Botón Historial */}
                        {sale.total_ediciones > 0 && (
                            <button 
                                onClick={() => fetchHistoryDetails(sale.idventa)}
                                className="w-8 h-8 flex items-center justify-center bg-amber-50 border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-100 transition shadow-sm"
                                title="Ver Historial de Cambios"
                            >
                                📜
                            </button>
                        )}

                        <button onClick={() => openTicket(sale.idventa)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition shadow-sm" title="Imprimir Ticket">🖨️</button>
                        
                        <Link href={`/admin/sales/edit/${sale.idventa}`} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition shadow-sm" title="Editar">✏️</Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER PAGINACIÓN */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <p className="text-sm text-slate-500">Mostrando página <span className="font-bold text-slate-800">{page}</span> de <span className="font-bold text-slate-800">{totalPages}</span></p>
         <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition shadow-sm flex items-center gap-1"><span>◀</span> Anterior</button>
            <div className="hidden md:flex gap-1">
               {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pNum = i + 1;
                  if (totalPages > 5 && page > 3) pNum = page - 2 + i;
                  if (pNum > totalPages) return null;
                  return (<button key={pNum} onClick={() => setPage(pNum)} className={`w-9 h-9 rounded-lg text-sm font-bold transition ${page === pNum ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{pNum}</button>)
               })}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition shadow-sm flex items-center gap-1">Siguiente <span>▶</span></button>
         </div>
      </div>
    </div>
  );
}