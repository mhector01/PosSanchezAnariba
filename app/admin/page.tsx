'use client';
import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  ArrowUpRight, 
  DollarSign, 
  Box,
  LayoutDashboard,
  Wallet
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-indigo-600">
        <div className="flex flex-col items-center gap-2">
           <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
           <span className="font-bold">Cargando métricas...</span>
        </div>
      </div>
    );
  }

  // Si hay error o no hay datos
  if (!data) return <div className="text-center p-10">No se pudieron cargar los datos.</div>;

  const { kpi, alerts, chart } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-6">
      
      {/* WELCOME SECTION */}
      <div>
        <h3 className="text-2xl font-black text-slate-800">¡Hola de nuevo! 👋</h3>
        <p className="text-slate-500">Resumen operativo de la empresa en tiempo real.</p>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Venta Hoy */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <DollarSign className="w-6 h-6" />
            </div>
            {/* Opcional: Podrías calcular el % real si tuvieras venta de ayer */}
            <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> Hoy
            </span>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Ventas de Hoy</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">L. {Number(kpi.ventas_hoy).toFixed(2)}</h3>
        </div>

        {/* Creditos / Dinero Caja */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Dinero en Caja (Aprox)</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">L. {Number(kpi.dinero_caja).toFixed(2)}</h3>
        </div>

        {/* Clientes */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Clientes</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">{kpi.clientes_total}</h3>
        </div>

        {/* Alertas / Stock Critico */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-rose-500/5 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Box className="w-6 h-6" />
            </div>
            <span className="text-rose-500 text-xs font-bold bg-rose-50 px-2 py-1 rounded-full">
              Por vencer / Agotados
            </span>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Alertas Inventario</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">{alerts.length} <span className="text-sm font-medium text-slate-400">items</span></h3>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfica Principal (Visualización simple de barras CSS por ahora) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm min-h-[450px] flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="font-black text-slate-800">Rendimiento Anual</h4>
              <p className="text-sm text-slate-400">Ventas totales por mes ({new Date().getFullYear()})</p>
            </div>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-2 px-4">
             {chart.length === 0 && (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                    <LayoutDashboard className="w-12 h-12 mb-4 opacity-20" />
                    <p>No hay datos de ventas anuales aún.</p>
                </div>
             )}
             {/* Renderizado simple de barras basado en datos reales */}
             {chart.map((mes: any, idx: number) => {
                // Calcular altura relativa (max 200px por ejemplo)
                const maxVal = Math.max(...chart.map((c:any) => Number(c.total)));
                const height = maxVal > 0 ? (Number(mes.total) / maxVal) * 100 : 0;
                
                return (
                    <div key={idx} className="flex flex-col items-center gap-2 group w-full">
                        <div className="relative w-full bg-indigo-50 rounded-t-lg hover:bg-indigo-100 transition-all" style={{ height: `${height}%`, minHeight: '4px' }}>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                L. {Number(mes.total).toLocaleString()}
                            </div>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">{mes.mes}</span>
                    </div>
                )
             })}
          </div>
        </div>

        {/* Alertas Rápidas (REALES) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col">
          <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Alertas del Sistema
          </h4>
          <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {alerts.length === 0 ? (
                <p className="text-slate-400 text-sm italic">Todo parece estar en orden ✅</p>
            ) : (
                alerts.map((alert: any, i: number) => (
                <div key={i} className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    alert.tipo === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-amber-50 border-amber-100 text-amber-700'
                }`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${alert.tipo === 'error' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                    <div>
                        <span className="text-sm font-bold block">{alert.mensaje}</span>
                        {alert.fecha && <span className="text-[10px] opacity-70 block mt-1">{new Date(alert.fecha).toLocaleDateString()}</span>}
                    </div>
                </div>
                ))
            )}
          </div>
          <button className="mt-auto w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black rounded-2xl transition-colors uppercase tracking-widest text-[10px] mt-4">
            Ir a Inventario
          </button>
        </div>
      </div>
    </div>
  );
}