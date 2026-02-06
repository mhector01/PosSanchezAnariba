'use client';
import { 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  ArrowUpRight, 
  DollarSign, 
  Box,
  LayoutDashboard 
} from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* WELCOME SECTION */}
      <div>
        <h3 className="text-2xl font-black text-slate-800">¡Hola de nuevo, Admin! 👋</h3>
        <p className="text-slate-500">Esto es lo que ha pasado en la farmacia hoy.</p>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Venta Hoy */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> +12%
            </span>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Ventas de Hoy</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">L. 12,450.00</h3>
        </div>

        {/* Productos Bajos */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-rose-500/5 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Box className="w-6 h-6" />
            </div>
            <span className="text-rose-500 text-xs font-bold bg-rose-50 px-2 py-1 rounded-full">
              Requiere Acción
            </span>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Stock Crítico</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">08 <span className="text-sm font-medium text-slate-400">items</span></h3>
        </div>

        {/* Clientes */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Clientes Nuevos</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">24</h3>
        </div>

        {/* Alertas */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Margen de Ganancia</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">32.5%</h3>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfica Principal */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm min-h-[450px] flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="font-black text-slate-800">Rendimiento Mensual</h4>
              <p className="text-sm text-slate-400">Comparativa de ingresos vs gastos</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 text-sm rounded-xl px-4 py-2 font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
              <option>Últimos 7 días</option>
              <option>Últimos 30 días</option>
              <option>Este año</option>
            </select>
          </div>
          
          <div className="flex-1 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300">
            <LayoutDashboard className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold tracking-widest uppercase text-xs">Área de Visualización de Datos</p>
          </div>
        </div>

        {/* Alertas Rápidas */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col">
          <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Alertas del Sistema
          </h4>
          <div className="space-y-4">
            {[
              { msg: 'Paracetamol 500mg agotado', type: 'error' },
              { msg: 'Caja 01 requiere cierre', type: 'warning' },
              { msg: '3 productos por vencer este mes', type: 'warning' },
            ].map((alert, i) => (
              <div key={i} className={`p-4 rounded-2xl border flex items-center gap-3 ${
                alert.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-amber-50 border-amber-100 text-amber-700'
              }`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${alert.type === 'error' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                <span className="text-sm font-semibold">{alert.msg}</span>
              </div>
            ))}
          </div>
          <button className="mt-auto w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black rounded-2xl transition-colors uppercase tracking-widest text-[10px]">
            Ver todas las notificaciones
          </button>
        </div>
      </div>
    </div>
  );
}