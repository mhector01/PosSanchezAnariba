'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  user: any;
  setUser: (user: any) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      // Intentamos recuperar la sesión real del servidor
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        // Normalizamos el objeto usuario
        const userData = {
            idusuario: data.user.id || data.user.idusuario,
            nombre: data.user.name || data.user.nombre,
            tipo_usuario: data.user.tipo_usuario
        };
        setUser(userData);
        localStorage.setItem('pos_user', JSON.stringify(userData));
      } else {
        // Si falla, no hay sesión válida
        localStorage.removeItem('pos_user');
        setUser(null);
      }
    } catch (error) {
      console.error("Error validando sesión:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Intentar leer de localStorage primero (más rápido)
    const savedUser = localStorage.getItem('pos_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setLoading(false);
        // Opcional: Validar en segundo plano si la cookie sigue viva
        fetchSession(); 
      } catch (e) {
        fetchSession();
      }
    } else {
      // 2. Si no hay local, ir al servidor
      fetchSession();
    }
  }, []);

  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {}
    document.cookie = "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    localStorage.removeItem('pos_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return { user: null, setUser: () => {}, logout: () => {}, loading: true };
  }
  return context;
};