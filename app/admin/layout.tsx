'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, ReceiptText, Package, Store, LogOut, 
  Menu, X, ChevronRight, UserCircle, BarChart3, 
  ShoppingCart, Wallet, Settings, Users 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout, loading } = useAuth();

  // Lista de menús con roles definidos
  const allItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, adminOnly: true },
    { name: 'Historial Ventas', href: '/admin/sales', icon: ReceiptText, adminOnly: false },
    { name: 'Productos', href: '/admin/products', icon: Package, adminOnly: false },
    { name: 'Reportes', href: '/admin/reports', icon: BarChart3, adminOnly: true },
    { name: 'Compras', href: '/admin/purchases', icon: ShoppingCart, adminOnly: true },
    { name: 'Caja', href: '/admin/cashbox', icon: Wallet, adminOnly: false },
    { name: 'Usuarios', href: '/admin/users', icon: Users, adminOnly: true },
    { name: 'Configuración', href: '/admin/settings', icon: Settings, adminOnly: true },
  ];

  // Lógica de filtrado: 
  // 1. Si está cargando, mostramos todo para evitar parpadeos/bloqueos.
  // 2. Si ya cargó y es Cajero (tipo_usuario 2), quitamos los que son solo para admin.
  const menuItems = allItems.filter(item => {
    if (!loading && user && Number(user.tipo_usuario) === 2 && item.adminOnly) {
      return false;
    }
    return true;
  });

  // Pantalla de carga inicial para evitar errores de contexto
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0f172a] text-white font-bold animate-pulse">
        Iniciando sistema...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      
      {/* --- ESTILOS DE SCROLLBAR DISCRETOS --- */}
      <style jsx global>{`
        /* Scrollbar ultra-fina y oscura para el Sidebar */
        .sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.5); /* slate-700 con opacidad */
          border-radius: 10px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.8); /* slate-600 al pasar el mouse */
        }

        /* Scrollbar fina y clara para el contenido principal */
        .content-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .content-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .content-scroll::-webkit-scrollbar-thumb {
          background: rgba(203, 213, 225, 0.6); /* slate-300 con opacidad */
          border-radius: 10px;
        }
        .content-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.8); /* slate-400 al pasar el mouse */
        }

        /* Soporte para Firefox (Estándar web) */
        .sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(51, 65, 85, 0.5) transparent;
        }
        .content-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(203, 213, 225, 0.6) transparent;
        }
      `}</style>

      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-[#0f172a] text-slate-300 flex flex-col shadow-2xl z-30 transition-all duration-300 ease-in-out`}>
        
        {/* LOGO */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-[#1e293b]/50">
          <div className="min-w-[40px] h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">F+</div>
          {isSidebarOpen && (
            <div className="ml-4 overflow-hidden whitespace-nowrap animate-in fade-in duration-300">
              <h1 className="font-bold text-white tracking-tight">Imza POS</h1>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
                {Number(user?.tipo_usuario) === 1 ? 'Administrador' : 'Cajero'}
              </p>
            </div>
          )}
        </div>

        {/* PERFIL DE USUARIO */}
        {isSidebarOpen && (
          <div className="m-4 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 animate-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 shadow-inner">
                <UserCircle className="w-8 h-8" />
              </div>
              <div className="overflow-hidden text-left">
                <p className="text-sm font-bold text-white truncate">{user?.nombre || 'Cargando...'}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Turno Activo</p>
              </div>
            </div>
          </div>
        )}

        {/* NAVEGACIÓN (AQUÍ APLICAMOS LA CLASE sidebar-scroll) */}
        <nav className="flex-1 px-4 mt-4 space-y-1 overflow-y-auto sidebar-scroll">
          <p className={`text-[10px] font-black text-slate-500 px-2 mb-2 uppercase tracking-[0.2em] ${!isSidebarOpen && 'hidden'}`}>
            Menú Principal
          </p>

          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group
                  ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 hover:text-white'}
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                {isSidebarOpen && <span className="font-semibold text-sm tracking-wide">{item.name}</span>}
                {isSidebarOpen && isActive && <ChevronRight className="ml-auto w-4 h-4 opacity-30" />}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-800/50">
            <Link href="/" className="flex items-center gap-3 p-3 rounded-xl text-emerald-400 hover:bg-emerald-500/10 transition-all">
              <Store className="w-5 h-5" />
              {isSidebarOpen && <span className="font-bold text-sm">Ir al POS (Caja)</span>}
            </Link>
          </div>
        </nav>

        {/* BOTÓN CERRAR SESIÓN */}
        <div className="p-4 border-t border-slate-800 bg-[#0f172a]">
          <button 
            onClick={(e) => { e.preventDefault(); logout(); }}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            {isSidebarOpen && <span className="font-bold text-sm">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER SUPERIOR */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex justify-between items-center shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] hidden sm:block">
                {pathname === '/admin' ? 'Vista General' : pathname.replace('/admin/', '').split('/')[0]}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('es-HN', { weekday: 'long' })}</span>
              <span className="text-sm font-black text-indigo-600">{new Date().toLocaleDateString()}</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${Number(user?.tipo_usuario) === 1 ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
               {Number(user?.tipo_usuario) === 1 ? 'Admin' : 'Cajero'}
            </div>
          </div>
        </header>

        {/* ÁREA DE CONTENIDO DINÁMICO (AQUÍ APLICAMOS LA CLASE content-scroll) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 content-scroll">
            <div className="max-w-7xl mx-auto">
               {children}
            </div>
        </div>
      </main>
    </div>
  );
}