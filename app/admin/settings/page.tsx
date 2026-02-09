'use client';
import { useState, useEffect } from 'react';
import { Save, Building, FileText, Plus, AlertCircle, CheckCircle, FilePlus } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  // --- ESTADOS DATOS GENERALES ---
  const [company, setCompany] = useState<any>({
    idparametro: 1,
    nombre_empresa: '',
    propietario: '',
    numero_nit: '',
    numero_nrc: '',
    direccion_empresa: '',
    porcentaje_iva: 15,
    porcentaje_retencion: 0,
    monto_retencion: 0
  });

  // --- ESTADOS RANGOS (CAI) ---
  const [ranges, setRanges] = useState<any[]>([]);
  const [comprobantes, setComprobantes] = useState<any[]>([]);
  
  // Modal Rango (Tiraje)
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [newRange, setNewRange] = useState({
    idcomprobante: 0, // Iniciamos en 0 para obligar a seleccionar
    numero_resolucion: '',
    fecha_resolucion: '',
    serie: '',
    desde: '',
    hasta: ''
  });

  // Modal Nuevo Tipo de Comprobante
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  // --- CARGA INICIAL ---
  useEffect(() => {
    fetchParams();
    fetchRanges();
    fetchComprobantes();
  }, []);

  const fetchParams = async () => {
    try {
      const res = await fetch('/api/settings/parameters');
      const data = await res.json();
      if (data.idparametro) setCompany(data);
    } catch (e) { console.error(e); }
  };

  const fetchRanges = async () => {
    try {
      const res = await fetch('/api/settings/ranges');
      setRanges(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchComprobantes = async () => {
    try {
      const res = await fetch('/api/settings/comprobantes');
      const data = await res.json();
      setComprobantes(data);
      // Pre-seleccionar el primero si existe
      if (data.length > 0 && newRange.idcomprobante === 0) {
          setNewRange(prev => ({ ...prev, idcomprobante: data[0].idcomprobante }));
      }
    } catch (e) { console.error(e); }
  };

  // --- GUARDAR DATOS GENERALES ---
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/parameters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company)
      });
      if (res.ok) alert("✅ Datos actualizados correctamente");
      else alert("❌ Error al guardar");
    } catch (error) { console.error(error); }
    finally { setSaving(false); }
  };

  // --- GUARDAR NUEVO TIPO DE COMPROBANTE ---
  const handleSaveType = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTypeName.trim()) return alert("Escribe un nombre");

      try {
          const res = await fetch('/api/settings/comprobantes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nombre: newTypeName })
          });

          if (res.ok) {
              alert("✅ Nuevo tipo de documento creado");
              setNewTypeName('');
              setShowTypeModal(false);
              fetchComprobantes(); // Recargar la lista para que aparezca en el otro modal
          } else {
              alert("Error al crear tipo");
          }
      } catch (error) { console.error(error); }
  };

  // --- GUARDAR NUEVO RANGO ---
  const handleSaveRange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRange.numero_resolucion || !newRange.desde || !newRange.hasta) return alert("Faltan datos");
    
    const desde = parseInt(newRange.desde);
    const hasta = parseInt(newRange.hasta);
    const disponibles = hasta - desde + 1;

    try {
      const res = await fetch('/api/settings/ranges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRange, disponibles })
      });
      
      if (res.ok) {
        alert("✅ Nuevo rango activado. El anterior ha sido cerrado.");
        setShowRangeModal(false);
        fetchRanges();
        // Limpiar form pero mantener el tipo de comprobante seleccionado
        setNewRange(prev => ({ ...prev, numero_resolucion: '', fecha_resolucion: '', serie: '', desde: '', hasta: '' }));
      } else {
        const d = await res.json();
        alert("Error: " + d.error);
      }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-slate-800">Configuración del Sistema</h1>
        <p className="text-slate-500">Administra los datos de la empresa y facturación.</p>
      </div>

      {/* TABS */}
      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('general')}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'general' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Building className="w-4 h-4" /> Datos Generales
        </button>
        <button 
          onClick={() => setActiveTab('ranges')}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'ranges' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <FileText className="w-4 h-4" /> Facturación y CAI
        </button>
      </div>

      {/* --- PESTAÑA 1: DATOS GENERALES --- */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveCompany} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 mb-2">
            <h3 className="font-bold text-lg text-slate-800">Información de la Farmacia</h3>
            <p className="text-xs text-slate-400">Estos datos aparecerán en el encabezado de las facturas.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre Empresa</label>
            <input type="text" className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 focus:border-indigo-500 outline-none" value={company.nombre_empresa} onChange={e => setCompany({...company, nombre_empresa: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Propietario</label>
            <input type="text" className="w-full p-3 border border-slate-200 rounded-xl" value={company.propietario} onChange={e => setCompany({...company, propietario: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">RTN</label>
            <input type="text" className="w-full p-3 border border-slate-200 rounded-xl font-mono" value={company.numero_nit} onChange={e => setCompany({...company, numero_nit: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dirección</label>
            <input type="text" className="w-full p-3 border border-slate-200 rounded-xl" value={company.direccion_empresa} onChange={e => setCompany({...company, direccion_empresa: e.target.value})} />
          </div>

          <div className="md:col-span-2 border-t border-slate-100 my-2"></div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Impuesto (ISV %)</label>
            <div className="relative">
              <input type="number" className="w-full p-3 border border-slate-200 rounded-xl pr-10" value={company.porcentaje_iva} onChange={e => setCompany({...company, porcentaje_iva: e.target.value})} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end mt-4">
            <button disabled={saving} type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition active:scale-95 disabled:opacity-50">
              <Save className="w-5 h-5" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}

      {/* --- PESTAÑA 2: RANGOS CAI --- */}
      {activeTab === 'ranges' && (
        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-full text-indigo-600 shadow-sm"><AlertCircle className="w-6 h-6" /></div>
              <div>
                <h4 className="font-bold text-indigo-900">Gestión de Facturación SAR</h4>
                <p className="text-sm text-indigo-700 max-w-2xl">
                  Administra los rangos autorizados. Si necesitas crear un documento nuevo (Ej. Nota de Crédito), usa el botón "Nuevo Tipo".
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 w-full xl:w-auto">
                <button onClick={() => setShowTypeModal(true)} className="flex-1 xl:flex-none bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-5 py-3 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 transition active:scale-95">
                    <FilePlus className="w-5 h-5" /> Nuevo Tipo Doc.
                </button>
                <button onClick={() => setShowRangeModal(true)} className="flex-1 xl:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition active:scale-95">
                    <Plus className="w-5 h-5" /> Nuevo Rango
                </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold border-b border-slate-200">
                <tr>
                  <th className="p-5">Tipo</th>
                  <th className="p-5">CAI / Resolución</th>
                  <th className="p-5">Rango</th>
                  <th className="p-5">Vigencia</th>
                  <th className="p-5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {ranges.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">No hay rangos registrados.</td></tr>
                ) : (
                    ranges.map((r: any) => (
                    <tr key={r.idtiraje} className="hover:bg-slate-50 transition-colors">
                        <td className="p-5 font-bold text-slate-700">{r.nombre_comprobante}</td>
                        <td className="p-5">
                        <div className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit">{r.numero_resolucion}</div>
                        <div className="text-[10px] text-slate-400 mt-1">Serie: {r.serie || 'N/A'}</div>
                        </td>
                        <td className="p-5">
                        <div className="flex items-center gap-2 text-slate-700 font-mono text-xs">
                            <span>{r.desde}</span>
                            <span className="text-slate-300">➔</span>
                            <span>{r.hasta}</span>
                        </div>
                        <div className="text-[10px] text-indigo-500 mt-1 font-bold">Disponibles: {r.disponibles}</div>
                        </td>
                        <td className="p-5 text-slate-600">{new Date(r.fecha_resolucion).toLocaleDateString()}</td>
                        <td className="p-5 text-center">
                        {r.estado === 1 
                            ? <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold"><CheckCircle className="w-3 h-3" /> Activo</span>
                            : <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-xs font-bold">Inactivo</span>
                        }
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL NUEVO TIPO DE COMPROBANTE --- */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-800">Crear Tipo Documento</h3>
                    <button onClick={() => setShowTypeModal(false)} className="text-slate-400 hover:text-rose-500">✕</button>
                </div>
                <p className="text-sm text-slate-500 mb-4">Ejemplo: Nota de Crédito, Guía de Remisión.</p>
                <form onSubmit={handleSaveType} className="space-y-4">
                    <input 
                        autoFocus 
                        type="text" 
                        className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" 
                        placeholder="Nombre del documento" 
                        value={newTypeName} 
                        onChange={e => setNewTypeName(e.target.value)} 
                    />
                    <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition">Guardar</button>
                </form>
            </div>
        </div>
      )}

      {/* --- MODAL NUEVO RANGO --- */}
      {showRangeModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-slate-800">Nuevo Rango de Facturación</h3>
              <button onClick={() => setShowRangeModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSaveRange} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Documento</label>
                <div className="flex gap-2">
                    <select className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none focus:border-indigo-500" value={newRange.idcomprobante} onChange={e => setNewRange({...newRange, idcomprobante: Number(e.target.value)})}>
                    {comprobantes.map((c: any) => (
                        <option key={c.idcomprobante} value={c.idcomprobante}>{c.nombre_comprobante}</option>
                    ))}
                    </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">CAI / Resolución</label>
                <input required type="text" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" placeholder="E001-..." value={newRange.numero_resolucion} onChange={e => setNewRange({...newRange, numero_resolucion: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Desde (Número)</label>
                  <input required type="number" className="w-full p-3 border border-slate-200 rounded-xl font-mono outline-none focus:border-indigo-500" placeholder="1" value={newRange.desde} onChange={e => setNewRange({...newRange, desde: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hasta (Número)</label>
                  <input required type="number" className="w-full p-3 border border-slate-200 rounded-xl font-mono outline-none focus:border-indigo-500" placeholder="5000" value={newRange.hasta} onChange={e => setNewRange({...newRange, hasta: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fecha Límite Emisión</label>
                <input required type="date" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" value={newRange.fecha_resolucion} onChange={e => setNewRange({...newRange, fecha_resolucion: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Serie (Opcional)</label>
                <input type="text" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" placeholder="001-001-01..." value={newRange.serie} onChange={e => setNewRange({...newRange, serie: e.target.value})} />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowRangeModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 transition">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition">Guardar Rango</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}