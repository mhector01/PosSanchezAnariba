'use client';
import { useState, useEffect } from 'react';
import { FileText, Hash, Plus, Save, AlertCircle } from 'lucide-react';

// --- Interfaces ---
interface Comprobante {
  idcomprobante: number;
  nombre_comprobante: string;
  estado: number;
}

interface Tiraje {
  idtiraje: number;
  idcomprobante: number;
  nombre_comprobante: string;
  fecha_resolucion: string;
  numero_resolucion: string;
  serie: string;
  desde: number;
  hasta: number;
  disponibles: number;
  usados: number;
}

export default function BillingSettingsPage() {
  const [activeTab, setActiveTab] = useState<'types' | 'ranges'>('ranges');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [tirajes, setTirajes] = useState<Tiraje[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  
  // Forms
  const [formType, setFormType] = useState({ nombre: '' });
  const [formTiraje, setFormTiraje] = useState({
    idcomprobante: 1,
    numero_resolucion: '',
    serie: '',
    fecha_resolucion: '',
    desde: 1,
    hasta: 1000
  });

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resTypes, resRanges] = await Promise.all([
        fetch('/api/settings/comprobantes'),
        fetch('/api/settings/tirajes')
      ]);
      setComprobantes(await resTypes.json());
      setTirajes(await resRanges.json());
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- HANDLERS ---
  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!formType.nombre) return;
    await fetch('/api/settings/comprobantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formType)
    });
    setFormType({ nombre: '' });
    setShowModal(false);
    fetchData();
  };

  const handleCreateTiraje = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!formTiraje.numero_resolucion) return;
    await fetch('/api/settings/tirajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formTiraje)
    });
    // Reset parcial
    setFormTiraje({ ...formTiraje, numero_resolucion: '', serie: '' });
    setShowModal(false);
    fetchData();
  };

  return (
    <div className="animate-fadeIn max-w-6xl mx-auto">
      
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-black text-slate-800">Configuración de Facturación</h1>
            <p className="text-slate-500 text-sm">Gestiona tipos de documentos y rangos de impresión (SAR).</p>
        </div>
        <button 
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-200"
        >
            <Plus className="w-5 h-5" /> Nuevo {activeTab === 'types' ? 'Tipo' : 'Tiraje'}
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-white p-1 rounded-xl w-fit mb-6 border border-slate-200">
        <button 
            onClick={() => setActiveTab('ranges')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'ranges' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
            <Hash className="w-4 h-4" /> Tirajes y Rangos
        </button>
        <button 
            onClick={() => setActiveTab('types')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'types' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
            <FileText className="w-4 h-4" /> Tipos de Documento
        </button>
      </div>

      {/* CONTENT */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* VISTA TIPO DOCUMENTOS */}
        {activeTab === 'types' && (
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                    <tr>
                        <th className="p-4">ID</th>
                        <th className="p-4">Nombre Documento</th>
                        <th className="p-4 text-center">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {comprobantes.map(c => (
                        <tr key={c.idcomprobante} className="hover:bg-slate-50">
                            <td className="p-4 font-mono text-xs">{c.idcomprobante}</td>
                            <td className="p-4 font-bold text-slate-700">{c.nombre_comprobante}</td>
                            <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${c.estado === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    {c.estado === 1 ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}

        {/* VISTA TIRAJES (RANGOS) */}
        {activeTab === 'ranges' && (
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                    <tr>
                        <th className="p-4">Documento</th>
                        <th className="p-4">CAI / Resolución</th>
                        <th className="p-4">Serie</th>
                        <th className="p-4 text-center">Rango</th>
                        <th className="p-4 text-center">Uso</th>
                        <th className="p-4 text-center">Vencimiento</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                    {tirajes.map(t => {
                        // Calcular porcentaje usado para barra de progreso
                        const total = t.hasta - t.desde + 1;
                        const percent = (t.usados / total) * 100;
                        const isExpired = new Date(t.fecha_resolucion) < new Date(); // Ojo: fecha_resolucion suele ser fecha límite en estos sistemas

                        return (
                            <tr key={t.idtiraje} className="hover:bg-slate-50">
                                <td className="p-4 font-bold text-slate-800">{t.nombre_comprobante}</td>
                                <td className="p-4 font-mono text-xs text-slate-600">{t.numero_resolucion || 'N/A'}</td>
                                <td className="p-4 font-mono text-xs">{t.serie}</td>
                                <td className="p-4 text-center">
                                    <div className="text-xs text-slate-500">Del {t.desde} al {t.hasta}</div>
                                </td>
                                <td className="p-4 align-middle">
                                    <div className="w-24 bg-slate-200 rounded-full h-2 mx-auto overflow-hidden">
                                        <div 
                                            className={`h-full ${percent > 90 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-[10px] text-center text-slate-400 mt-1">{t.disponibles} disponibles</div>
                                </td>
                                <td className="p-4 text-center">
                                    {/* Ajustar según tu campo real de fecha vencimiento */}
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${isExpired ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                                        {new Date(t.fecha_resolucion).toLocaleDateString()}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        )}
      </div>

      {/* MODAL FORMULARIO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-lg font-black text-slate-800 mb-4">
                    {activeTab === 'types' ? 'Crear Tipo de Documento' : 'Registrar Nuevo Tiraje'}
                </h3>
                
                {/* FORMULARIO TIPOS */}
                {activeTab === 'types' ? (
                    <form onSubmit={handleCreateType} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Nombre</label>
                            <input className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500" autoFocus 
                                value={formType.nombre} onChange={e => setFormType({...formType, nombre: e.target.value})} 
                                placeholder="Ej. Factura Proforma" />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-700">Guardar</button>
                        </div>
                    </form>
                ) : (
                /* FORMULARIO TIRAJES */
                    <form onSubmit={handleCreateTiraje} className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Tipo Documento</label>
                            <select className="w-full p-3 border rounded-xl outline-none bg-white" 
                                value={formTiraje.idcomprobante} onChange={e => setFormTiraje({...formTiraje, idcomprobante: Number(e.target.value)})}>
                                {comprobantes.map(c => <option key={c.idcomprobante} value={c.idcomprobante}>{c.nombre_comprobante}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">CAI / Resolución</label>
                            <input className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500 font-mono text-sm" 
                                value={formTiraje.numero_resolucion} onChange={e => setFormTiraje({...formTiraje, numero_resolucion: e.target.value})} placeholder="324324-..." required />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Fecha Límite Emisión</label>
                            <input type="date" className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500" 
                                value={formTiraje.fecha_resolucion} onChange={e => setFormTiraje({...formTiraje, fecha_resolucion: e.target.value})} required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Del</label>
                                <input type="number" className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500 text-center font-bold" 
                                    value={formTiraje.desde} onChange={e => setFormTiraje({...formTiraje, desde: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Al</label>
                                <input type="number" className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500 text-center font-bold" 
                                    value={formTiraje.hasta} onChange={e => setFormTiraje({...formTiraje, hasta: Number(e.target.value)})} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Serie (Opcional)</label>
                            <input className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500 font-mono text-sm" 
                                value={formTiraje.serie} onChange={e => setFormTiraje({...formTiraje, serie: e.target.value})} placeholder="001-001-01..." />
                        </div>

                        <div className="flex gap-2 pt-4">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-700">Guardar</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
      )}

    </div>
  );
}