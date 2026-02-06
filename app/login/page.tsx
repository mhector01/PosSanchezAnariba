'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        // --- LÓGICA DE REDIRECCIÓN ---
        // data.role viene de la API (tipo_usuario)
        
        if (Number(data.role) === 1) {
          router.push('/admin'); // Admin -> Dashboard
        } else {
          router.push('/');      // Cajero (2) -> POS
        }
        
        router.refresh();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🔒
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Iniciar Sesión</h1>
          <p className="text-slate-500 text-sm">Sistema de Farmacia</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuario</label>
            <input 
              type="text" 
              className="w-full p-3 border rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
              placeholder="Ingresa tu usuario"
              value={form.username}
              onChange={e => setForm({...form, username: e.target.value})}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contraseña</label>
            <input 
              type="password" 
              className="w-full p-3 border rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-600 text-sm rounded-lg text-center font-bold">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-bold transition transform active:scale-[0.98] disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'INGRESAR'}
          </button>
        </form>
      </div>
    </div>
  );
}