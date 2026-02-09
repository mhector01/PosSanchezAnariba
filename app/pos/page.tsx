'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Info, X } from 'lucide-react'; // Import icons

// Roles permitidos para editar precios: 1 = Admin, 2 = Gerente
const ROLES_PERMITIDOS = [1, 2];

// Added description to interface
interface Producto {
  idproducto: number;
  nombre_producto: string;
  precio_venta: number | string;
  stock: number;
  descripcion?: string; // <--- New optional field
}

export default function POSPage() {
  const router = useRouter();

  // --- Estados de Datos ---
  const [products, setProducts] = useState<Producto[]>([]); // Typed state
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  // --- Estados de Control ---
  const [cashboxStatus, setCashboxStatus] = useState<{ isOpen: boolean } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // --- New State for Info Modal ---
  const [infoProduct, setInfoProduct] = useState<Producto | null>(null);

  // 1. CARGAR SESIÓN
  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => {
        if (res.status === 401) throw new Error('No autorizado');
        if (!res.ok) throw new Error('Error API');
        return res.json();
      })
      .then(data => {
        // Guardamos el usuario real
        setUser(data.user);
        setLoadingSession(false);
      })
      .catch((err) => {
        console.error("Error de sesión:", err);
        router.push('/login'); // Redirige si no hay sesión
      });
  }, [router]);

  // 2. VALIDAR ESTADO DE CAJA (Solo si hay usuario)
  useEffect(() => {
    if (user) {
      fetch('/api/cashbox')
        .then(res => res.json())
        .then(data => setCashboxStatus(data))
        .catch(() => setCashboxStatus({ isOpen: false }));
    }
  }, [user]);

  // 3. BUSCAR PRODUCTOS (Solo si usuario existe y caja abierta)
  useEffect(() => {
    if (user && cashboxStatus?.isOpen) {
      fetch(`/api/products?q=${search}`)
        .then(res => res.json())
        .then(data => {
          // --- CORRECCIÓN CRÍTICA: Validar que sea un array ---
          // Note: API might return { data: [], pagination: {} } based on previous code, 
          // so we check data.data if it exists, otherwise data itself.
          const list = data.data || data; 
          if (Array.isArray(list)) {
            setProducts(list);
          } else {
            console.error("La API no devolvió una lista:", data);
            setProducts([]); // Evita que la pantalla explote
          }
        })
        .catch(err => {
          console.error("Error buscando productos:", err);
          setProducts([]);
        });
    }
  }, [search, cashboxStatus, user]);

  // --- LÓGICA DEL CARRITO ---

  const addToCart = (product: any) => {
    setCart(prev => {
      const exists = prev.find((p: any) => p.idproducto === product.idproducto);
      if (exists) {
        return prev.map((p: any) => p.idproducto === product.idproducto 
          ? { ...p, cantidad: p.cantidad + 1 } : p);
      }
      // Inicializamos precio_venta asegurando que sea número
      return [...prev, { ...product, cantidad: 1, precio_venta: Number(product.precio_venta) }];
    });
  };

  // --- LÓGICA DE PERMISOS ---
  // Convertimos a número para asegurar comparación (ej: "1" == 1)
  const userRole = user ? Number(user.tipo_usuario) : 0;
  const canEditPrice = ROLES_PERMITIDOS.includes(userRole);

  const updatePrice = (productId: number, newPrice: string) => {
    if (!canEditPrice) return; // Seguridad extra

    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) return;

    setCart(prev => prev.map(item => 
      item.idproducto === productId 
        ? { ...item, precio_venta: price } 
        : item
    ));
  };

  const total = cart.reduce((sum, item) => sum + (item.cantidad * item.precio_venta), 0);

  // --- RENDERIZADO DE PANTALLAS DE ESTADO ---

  if (loadingSession) {
    return <div className="h-screen flex items-center justify-center text-gray-500 font-bold">Cargando sistema...</div>;
  }

  // Pantalla de Bloqueo (Caja Cerrada)
  if (!cashboxStatus?.isOpen) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-red-100">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Caja Cerrada</h2>
          <p className="text-gray-500 mb-6">
            Hola <span className="font-bold">{user?.name}</span>, no hay turno activo hoy.
          </p>
          <Link href="/caja/apertura" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
            IR A APERTURA DE CAJA
          </Link>
        </div>
      </div>
    );
  }

  // --- INTERFAZ PRINCIPAL DEL POS ---
  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans relative">
      
      {/* SECCIÓN IZQUIERDA: PRODUCTOS */}
      <div className="w-2/3 flex flex-col p-4 h-full">
        {/* Buscador */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar producto (Escáner, Código o Nombre)..."
            className="w-full p-4 rounded-lg shadow-sm border border-gray-200 outline-none text-lg focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        
        {/* Grid de Productos */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto pr-2 pb-2">
          {products.length > 0 ? (
            products.map((prod) => {
              const isOutOfStock = prod.stock <= 0;
              const hasInfo = prod.descripcion && prod.descripcion.trim().length > 0;

              return (
                <button
                  key={prod.idproducto}
                  onClick={() => addToCart(prod)}
                  className="bg-white p-3 rounded-xl shadow hover:shadow-lg transition-all flex flex-col items-center justify-between border border-transparent hover:border-blue-500 h-32 relative group"
                >
                  {/* --- BOTÓN DE INFORMACIÓN --- */}
                  {hasInfo && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation(); // Evita agregar al carrito
                        setInfoProduct(prod);
                      }}
                      className="absolute top-1 right-1 z-10 p-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm cursor-pointer"
                      title="Ver Compatibilidad"
                    >
                      <Info className="w-4 h-4" />
                    </div>
                  )}

                  <div className="text-center w-full mt-2">
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide line-clamp-2 h-8 leading-tight mb-1">
                      {prod.nombre_producto}
                    </div>
                    <div className="text-xl font-bold text-blue-700">
                      L. {Number(prod.precio_venta).toFixed(2)}
                    </div>
                  </div>
                  <div className="w-full flex justify-between items-end mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${prod.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      Stock: {prod.stock}
                    </span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="col-span-full text-center text-gray-400 mt-10">
              No se encontraron productos
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN DERECHA: CARRITO / TICKET */}
      <div className="w-1/3 bg-white border-l border-gray-200 flex flex-col h-full shadow-2xl z-10">
        
        {/* Header Ticket */}
        <div className="p-5 bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Venta Actual</h1>
              <p className="text-blue-200 text-sm mt-1 opacity-90">
                Cajero: {user?.name || user?.username} 
              </p>
            </div>
            <div className="bg-blue-800 p-2 rounded-lg text-center min-w-[80px]">
              <span className="block text-xs text-blue-200">Items</span>
              <span className="font-bold text-lg">{cart.reduce((acc, el) => acc + el.cantidad, 0)}</span>
            </div>
          </div>
        </div>

        {/* Lista de Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
              <p>Carrito vacío</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={`${item.idproducto}-${index}`} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-800 line-clamp-1 w-3/4">
                    {item.nombre_producto}
                  </span>
                  <span className="font-bold text-gray-900">
                    L. {(item.cantidad * item.precio_venta).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center bg-gray-100 rounded px-2 py-1">
                    <span className="font-bold text-gray-700 mr-1">{item.cantidad}</span>
                    <span className="text-xs">unid.</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-xs">x Unit:</span>
                    
                    {/* INPUT DE PRECIO (CONDICIONAL) */}
                    {canEditPrice ? (
                      <div className="relative group">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">L.</span>
                        <input 
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24 pl-6 pr-2 py-1 border-2 border-blue-300 bg-white rounded text-right font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          value={item.precio_venta}
                          onChange={(e) => updatePrice(item.idproducto, e.target.value)}
                        />
                      </div>
                    ) : (
                      <span className="font-medium">L. {Number(item.precio_venta).toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
          <div className="flex justify-between items-end mb-4">
            <span className="text-gray-500 font-medium">Total a Pagar</span>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-gray-800">L. {total.toFixed(2)}</span>
            </div>
          </div>
          
          <button 
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]
              ${cart.length > 0 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            disabled={cart.length === 0}
            onClick={() => alert(`Procesando venta... Usuario ID: ${user.id}`)}
          >
            <span>COBRAR</span>
          </button>
        </div>
      </div>

      {/* --- MODAL DE INFORMACIÓN --- */}
      {infoProduct && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-2xl relative border border-gray-100">
            <button 
              onClick={() => setInfoProduct(null)}
              className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-500 transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                <Info className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 leading-tight px-4">{infoProduct.nombre_producto}</h3>
              <p className="text-slate-400 text-xs font-mono mt-2 bg-slate-100 inline-block px-3 py-1 rounded-full">
                ID: {infoProduct.idproducto}
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap shadow-inner max-h-60 overflow-y-auto">
              <span className="font-bold text-slate-800 block mb-2 text-xs uppercase tracking-wider">Compatibilidad / Descripción:</span>
              {infoProduct.descripcion}
            </div>

            <div className="flex gap-3 mt-6">
               <button 
                onClick={() => setInfoProduct(null)}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition"
              >
                Cerrar
              </button>
              <button 
                onClick={() => {
                    addToCart(infoProduct);
                    setInfoProduct(null);
                }}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
              >
                Agregar a Venta
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}