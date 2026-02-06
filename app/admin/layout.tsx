'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Package, 
  Store, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  UserCircle
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const menuItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Historial Ventas', href: '/admin/sales', icon: ReceiptText },
    { name: 'Productos', href: '/admin/products', icon: Package },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`
        ${isSidebarOpen ? 'w-72' : 'w-20'} 
        bg-[#0f172a] text-slate-300 flex flex-col shadow-2xl z-30 transition-all duration-300 ease-in-out
      `}>
        
        {/* LOGO SECTION */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-[#1e293b]/50">
          <div className="min-w-[40px] h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
            F+
          </div>
          {isSidebarOpen && (
            <div className="ml-4 overflow-hidden whitespace-nowrap animate-fadeIn">
              <h1 className="font-bold text-white tracking-tight">IVIS SYSTEM</h1>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Admin Control</p>
            </div>
          )}
        </div>

        {/* USER PROFILE BOX */}
        {isSidebarOpen && (
          <div className="m-4 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-3">
              <UserCircle className="w-10 h-10 text-slate-400" />
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">Administrador</p>
                <p className="text-xs text-slate-500 truncate">Soporte Técnico</p>
              </div>
            </div>
          </div>
        )}

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 mt-4 space-y-1">
          <p className={`text-[10px] font-black text-slate-500 px-2 mb-2 uppercase tracking-[0.2em] ${!isSidebarOpen && 'text-center'}`}>
            {isSidebarOpen ? 'Menú Principal' : '•••'}
          </p>
          
          {menuItems.map((item) => {
            const Active = isActive(item.href);
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group
                  ${Active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'hover:bg-slate-800 hover:text-white'}
                `}
              >
                <item.icon className={`w-5 h-5 ${Active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                {isSidebarOpen && <span className="font-semibold text-sm tracking-wide">{item.name}</span>}
                {isSidebarOpen && Active && <ChevronRight className="ml-auto w-4 h-4 opacity-50" />}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-800/50">
            <Link 
              href="/" 
              className="flex items-center gap-3 p-3 rounded-xl text-emerald-400 hover:bg-emerald-500/10 transition-all group"
            >
              <Store className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {isSidebarOpen && <span className="font-bold text-sm">Ir al POS (Caja)</span>}
            </Link>
          </div>
        </nav>

        {/* LOGOUT */}
        <div className="p-4 bg-[#0f172a]">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="font-bold text-sm">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* TOPBAR */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex justify-between items-center shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">
               {pathname === '/admin' ? 'Vista General' : pathname.replace('/admin/', '').split('/')[0]}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('es-HN', { weekday: 'long' })}</span>
              <span className="text-sm font-black text-indigo-600">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </header>

        {/* VIEWPORT */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           <div className="max-w-7xl mx-auto">
              {children}
           </div>
        </div>
      </main>
    </div>
  );
}