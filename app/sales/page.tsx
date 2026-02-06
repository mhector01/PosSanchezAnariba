'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function SalesHistory() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados de Paginación y Búsqueda
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Función para cargar datos (Memorizada con useCallback)
  const fetchSales = useCallback(async (pageNum: number, searchTerm: string) => {
    setLoading(true);
    try {
      // Llamamos a la API enviando página y búsqueda
      const res = await fetch(`/api/sales?page=${pageNum}&limit=20&q=${searchTerm}`);
      const data = await res.json();
      
      if (data.data) {
        setSales(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
        setPage(data.pagination.page);
      } else {
        setSales([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. Efecto Inicial y cambio de página
  useEffect(() => {
    fetchSales(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]); // Solo recarga si cambia la página (el buscador tiene su propia lógica abajo)

  // 2. Efecto Buscador (Con "Debounce" para no saturar al escribir)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Al buscar, siempre volvemos a la pág 1
      fetchSales(1, search);
    }, 500); // Espera 0.5 seg después de dejar de escribir

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Función para abrir ticket
  const openTicket = (id: number) => {
    const w=400,h=600,l=(window.innerWidth-w)/2,t=(window.innerHeight-h)/2;
    window.open(`/ticket/${id}`,'Ticket',`width=${w},height=${h},top=${t},left=${l},scrollbars=yes`);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* ENCABEZADO */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Historial de Ventas</h1>
            <p className="text-slate-500 text-sm">
              Total de registros: <span className="font-bold">{totalItems}</span>
            </p>
          </div>
          <Link href="/" className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition flex items-center gap-2">
            <span>🏪</span> Ir al POS
          </Link>
        </div>

        {/* BARRA DE BÚSQUEDA */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex gap-4 border border-slate-200">
           <span className="text-2xl">🔍</span>
           <input 
             type="text" 
             placeholder="Buscar cliente, ticket, ID..." 
             className="flex-1 outline-none text-lg text-slate-700"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             autoFocus
           />
           {loading && <span className="text-slate-400 animate-pulse font-bold">Buscando...</span>}
        </div>

        {/* TABLA DE RESULTADOS */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 mb-6">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="p-5 border-b">ID</th>
                <th className="p-5 border-b">Fecha</th>
                <th className="p-5 border-b">Cliente</th>
                <th className="p-5 border-b">Pago</th>
                <th className="p-5 border-b text-right">Total</th>
                <th className="p-5 border-b text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && sales.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-400">Cargando...</td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-400">No se encontraron ventas.</td></tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.idventa} className="hover:bg-blue-50 transition duration-150">
                    <td className="p-5 font-mono font-bold text-slate-700">#{sale.numero_venta || sale.idventa}</td>
                    <td className="p-5 text-sm text-slate-600">
                      {new Date(sale.fecha_venta).toLocaleDateString()} <span className="text-xs text-slate-400">{new Date(sale.fecha_venta).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="p-5 font-medium text-slate-800">{sale.nombre_cliente || sale.cliente || 'Público General'}</td>
                    <td className="p-5 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${sale.tipo_pago === 'Efectivo' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{sale.tipo_pago}</span>
                    </td>
                    <td className="p-5 text-right font-bold text-lg text-slate-800">${Number(sale.total).toFixed(2)}</td>
                    <td className="p-5 flex justify-center gap-2">
                      <button onClick={() => openTicket(sale.idventa)} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 border border-slate-300" title="Imprimir">🖨️</button>
                      <Link href={`/sales/edit/${sale.idventa}`} className="p-2 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 border border-orange-200" title="Editar">✏️</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* CONTROLES DE PAGINACIÓN */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
           <span className="text-slate-500 text-sm">
             Página <strong className="text-slate-800">{page}</strong> de <strong className="text-slate-800">{totalPages}</strong>
           </span>
           <div className="flex gap-2">
             <button 
               onClick={() => setPage(p => Math.max(1, p - 1))} 
               disabled={page === 1 || loading}
               className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 disabled:opacity-50 transition"
             >
               ◀ Anterior
             </button>
             <button 
               onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
               disabled={page >= totalPages || loading}
               className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition"
             >
               Siguiente ▶
             </button>
           </div>
        </div>

      </div>
    </div>
  );
}