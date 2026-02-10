'use client';
import { useState, useEffect } from 'react';
import { Users, Plus, Pencil, Trash2, ShieldCheck, User, Save, X } from 'lucide-react';

// Interfaces basadas en tu DB
interface UsuarioView {
  idusuario: number;
  usuario: string;
  tipo_usuario: number; // 1: Admin, 2: Cajero
  idempleado: number;
  nombre_empleado: string;
  apellido_empleado: string;
  // Campos opcionales para el formulario
  telefono?: string;
  email?: string;
  contrasena?: string; // Solo para envío
}

export default function UsersPage() {
  const [users, setUsers] = useState<UsuarioView[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Formulario completo (Empleado + Usuario)
  const initialForm = {
      idusuario: 0,
      idempleado: 0,
      nombre_empleado: '',
      apellido_empleado: '',
      telefono: '',
      email: '',
      usuario: '',
      password: '',
      tipo_usuario: 2
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validaciones
    if (!form.nombre_empleado || !form.apellido_empleado || !form.usuario) return alert("Datos incompletos");
    if (!isEditing && !form.password) return alert("La contraseña es obligatoria");

    try {
      const res = await fetch('/api/users', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        fetchUsers();
        alert(isEditing ? "Usuario actualizado" : "Usuario creado");
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) { alert("Error de conexión"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Desactivar este usuario?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    } catch (e) { alert("Error al eliminar"); }
  };

  const openEdit = (u: UsuarioView) => {
    // Al editar, mapeamos los datos de la vista al formulario
    setForm({
        idusuario: u.idusuario,
        idempleado: u.idempleado,
        nombre_empleado: u.nombre_empleado,
        apellido_empleado: u.apellido_empleado,
        telefono: '', // La vista no trae telefono por defecto, se puede dejar vacio o hacer otra query
        email: '',
        usuario: u.usuario,
        password: '', // Limpio por seguridad
        tipo_usuario: u.tipo_usuario
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const openCreate = () => {
    setForm(initialForm);
    setIsEditing(false);
    setShowModal(true);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 p-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" /> Gestión de Usuarios
          </h1>
          <p className="text-slate-500">Administra empleados y accesos al sistema.</p>
        </div>
        <button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition transform active:scale-95 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Nuevo Usuario
        </button>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
            <tr>
              <th className="p-5">Empleado</th>
              <th className="p-5">Credenciales</th>
              <th className="p-5 text-center">Rol</th>
              <th className="p-5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr><td colSpan={4} className="p-10 text-center text-slate-400">Cargando...</td></tr>
            ) : users.map((u) => (
              <tr key={u.idusuario} className="hover:bg-slate-50 transition">
                <td className="p-5">
                    <div className="font-bold text-slate-700 text-base">{u.nombre_empleado} {u.apellido_empleado}</div>
                    <div className="text-xs text-slate-400 font-mono">ID Emp: {u.idempleado}</div>
                </td>
                <td className="p-5">
                    <div className="flex items-center gap-2 bg-slate-100 w-fit px-3 py-1 rounded-lg">
                        <User className="w-3 h-3 text-slate-400"/>
                        <span className="font-bold text-slate-600">{u.usuario}</span>
                    </div>
                </td>
                <td className="p-5 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto ${u.tipo_usuario === 1 ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {u.tipo_usuario === 1 ? <ShieldCheck className="w-3 h-3"/> : <User className="w-3 h-3"/>}
                    {u.tipo_usuario === 1 ? 'ADMINISTRADOR' : 'CAJERO'}
                  </span>
                </td>
                <td className="p-5 text-center flex justify-center gap-2">
                  <button onClick={() => openEdit(u)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(u.idusuario)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-white p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-xl text-slate-800">{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              
              {/* Sección Empleado */}
              <div>
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-indigo-50 pb-1">Datos del Empleado</h4>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre *</label>
                        <input required type="text" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition" 
                          value={form.nombre_empleado} onChange={e => setForm({...form, nombre_empleado: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Apellido *</label>
                        <input required type="text" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition" 
                          value={form.apellido_empleado} onChange={e => setForm({...form, apellido_empleado: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Teléfono</label>
                        <input type="text" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition" 
                          value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email</label>
                        <input type="email" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition" 
                          value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                      </div>
                  </div>
              </div>

              {/* Sección Usuario */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-4">Credenciales de Acceso</h4>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Usuario (Login) *</label>
                        <input required type="text" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition font-mono" 
                          value={form.usuario} onChange={e => setForm({...form, usuario: e.target.value})} placeholder="Ej. jperez" />
                        <p className="text-[10px] text-slate-400 mt-1">Úsalo para iniciar sesión.</p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Contraseña</label>
                        <input type="password" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition" 
                          value={form.password} onChange={e => setForm({...form, password: e.target.value})} 
                          placeholder={isEditing ? "Vacío para no cambiar" : "********"} />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Rol</label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setForm({...form, tipo_usuario: 1})} 
                            className={`flex-1 p-2 rounded-xl border flex items-center justify-center gap-2 transition text-xs font-bold ${form.tipo_usuario === 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                            <ShieldCheck className="w-3 h-3" /> Admin
                          </button>
                          <button type="button" onClick={() => setForm({...form, tipo_usuario: 2})} 
                            className={`flex-1 p-2 rounded-xl border flex items-center justify-center gap-2 transition text-xs font-bold ${form.tipo_usuario === 2 ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                            <User className="w-3 h-3" /> Cajero
                          </button>
                        </div>
                      </div>
                  </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                    <Save className="w-4 h-4"/> Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}