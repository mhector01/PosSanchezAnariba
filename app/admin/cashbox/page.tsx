'use client';
import { useState, useEffect } from 'react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  Lock, 
  RefreshCw,
  History,
  Printer,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function CashboxPage() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'in' | 'out'>('out');
  const [form, setForm] = useState({ monto: '', descripcion: '' });
  
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [finalCount, setFinalCount] = useState('');
  
  // ID de la caja que vamos a cerrar
  const [closingBoxId, setClosingBoxId] = useState<number | null>(null);

  // Estado del ticket para imprimir
  const [ticketData, setTicketData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
        const res = await fetch('/api/cashbox/transactions');
        const data = await res.json();
        
        setSummary(data.summary || null); 
        setMovements(Array.isArray(data.movements) ? data.movements : []); 
        setHistory(Array.isArray(data.history) ? data.history : []);
    } catch (e) { 
        console.error("Error:", e);
    } finally { 
        setLoading(false); 
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const tipo = modalType === 'in' ? 1 : 4; 
          await fetch('/api/cashbox/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...form, tipo })
          });
          setShowModal(false);
          setForm({ monto: '', descripcion: '' });
          fetchData();
          alert("Movimiento registrado");
      } catch (error) { alert("Error al registrar"); }
  };

  // Preparar cierre
  const initiateClose = (boxId: number) => {
      setClosingBoxId(boxId);
      setFinalCount('');
      setShowCloseModal(true);
  };

  const handleCloseBox = async () => {
      if(!finalCount) return alert("Ingresa el monto final contado");
      
      const real = parseFloat(finalCount);
      
      // Calcular datos del sistema para el ticket
      let sistema = 0;
      let inicial = 0, ventas = 0, otros = 0, egresos = 0;

      // Si cerramos la caja actual, usamos el resumen detallado
      if (summary && summary.idcaja === closingBoxId) {
          inicial = parseFloat(summary.p_monto_inicial || 0);
          ventas = parseFloat(summary.p_ventas || 0);        // Ventas puras
          otros = parseFloat(summary.p_otros_ingresos || 0); // Ingresos manuales
          egresos = parseFloat(summary.p_egresos || 0);      // Gastos
          sistema = inicial + ventas + otros - egresos;
      }

      if(confirm(`¿Confirmar cierre de caja #${closingBoxId}?`)) {
          try {
              const res = await fetch('/api/cashbox/transactions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                      action: 'force_close', 
                      idcaja: closingBoxId, 
                      amount: real 
                  })
              });

              if(res.ok) {
                  // 1. Generar la "foto" del ticket con el desglose
                  const newTicket = {
                      id: closingBoxId,
                      fecha: new Date().toLocaleDateString(),
                      hora: new Date().toLocaleTimeString(),
                      inicial, 
                      ventas, 
                      otros, 
                      egresos, 
                      sistema, 
                      real,
                      diferencia: real - sistema,
                      isReprint: false
                  };
                  setTicketData(newTicket);

                  // 2. Cerrar modal y actualizar interfaz
                  setShowCloseModal(false);
                  await fetchData(); // Actualiza para mostrar "Caja Cerrada"

                  // 3. Imprimir (Damos 800ms para que React renderice el ticket oculto)
                  setTimeout(() => {
                      window.print();
                  }, 800);
              }
          } catch (e) { alert("Error de conexión"); }
      }
  };

  const handleReprint = (hist: any) => {
      // Reimpresión simple (Nota: Historial muestra totales, si necesitas desglose histórico exacto requeriría otra query)
      setTicketData({
          id: hist.idcaja,
          fecha: new Date(hist.fecha_cierre).toLocaleDateString(),
          hora: new Date(hist.fecha_cierre).toLocaleTimeString(),
          inicial: Number(hist.monto_apertura),
          ventas: 0, // En reimpresión simple ponemos 0 o el total para no confundir sin consulta extra
          otros: 0,
          egresos: 0,
          sistema: Number(hist.monto_cierre), 
          real: Number(hist.monto_cierre),
          diferencia: 0,
          isReprint: true
      });
      
      // Esperar renderizado y llamar a imprimir
      setTimeout(() => window.print(), 500);
  };

  const isBoxOpen = summary && summary.estado === 1;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* CSS IMPRESIÓN (SOLUCIÓN HOJA EN BLANCO) */}
      <style jsx global>{`
        @media print {
          /* Ocultar todo el cuerpo */
          body {
            visibility: hidden;
          }
          
          /* Hacer visible SOLO el ticket */
          #ticket-print {
            visibility: visible !important;
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white;
            z-index: 99999;
          }
          
          /* Asegurar que los hijos del ticket sean visibles */
          #ticket-print * {
            visibility: visible !important;
          }

          @page { size: auto; margin: 0mm; }
        }
      `}</style>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Administrar Caja</h1>
          <p className="text-slate-500 flex items-center gap-2">
             {isBoxOpen 
                ? <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Caja Abierta</span> 
                : <span className="text-rose-600 font-bold flex items-center gap-1"><Lock className="w-4 h-4"/> Caja Cerrada</span>
             }
          </p>
        </div>
        <div className="flex gap-3">
            <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition shadow-sm">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            {/* BOTONES DE ACCIÓN: Solo si la caja está abierta */}
            {isBoxOpen ? (
                <>
                    <button onClick={() => { setModalType('out'); setShowModal(true); }} className="bg-rose-100 text-rose-700 hover:bg-rose-200 px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition">
                        <ArrowDownCircle className="w-5 h-5" /> Gasto
                    </button>
                    <button onClick={() => { setModalType('in'); setShowModal(true); }} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition">
                        <ArrowUpCircle className="w-5 h-5" /> Ingreso
                    </button>
                </>
            ) : (
                <button disabled className="bg-slate-100 text-slate-400 px-5 py-3 rounded-xl font-bold flex items-center gap-2 cursor-not-allowed">
                    <Lock className="w-5 h-5" /> Turno Cerrado
                </button>
            )}
        </div>
      </div>

      {/* TARJETAS DE RESUMEN */}
      {summary && (
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 print:hidden relative transition-all duration-500 ${!isBoxOpen ? 'opacity-75 grayscale-[0.8]' : ''}`}>
            
            {/* Banner de Caja Cerrada */}
            {!isBoxOpen && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                    <div className="bg-slate-900/90 text-white px-8 py-3 rounded-2xl font-black text-xl shadow-2xl border-2 border-white/20 transform -rotate-3 backdrop-blur-sm">
                        CAJA CERRADA
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">Fondo Inicial</p>
                <h3 className="text-2xl font-black text-slate-700">L. {Number(summary.p_monto_inicial || 0).toFixed(2)}</h3>
            </div>
            
            {/* DESGLOSE VENTAS */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-emerald-500 uppercase">Ventas Efectivo</p>
                <h3 className="text-2xl font-black text-emerald-600">+ L. {Number(summary.p_ventas || 0).toFixed(2)}</h3>
                {Number(summary.p_otros_ingresos) > 0 && (
                    <div className="mt-1 text-xs text-slate-500 bg-emerald-50 px-2 py-1 rounded inline-block">
                        + L. {Number(summary.p_otros_ingresos).toFixed(2)} Otros
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-rose-500 uppercase">Salidas / Gastos</p>
                <h3 className="text-2xl font-black text-rose-600">- L. {Number(summary.p_egresos || 0).toFixed(2)}</h3>
            </div>
            
            {/* Tarjeta de Acción Principal */}
            {isBoxOpen ? (
                <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-200 text-white relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => initiateClose(summary.idcaja)}>
                    <div className="absolute right-0 top-0 p-4 opacity-10"><Wallet className="w-16 h-16" /></div>
                    <p className="text-xs font-bold text-indigo-200 uppercase mb-1">Total Esperado</p>
                    <h3 className="text-3xl font-black">L. {(Number(summary.p_monto_inicial || 0) + Number(summary.p_ingresos_total || 0) - Number(summary.p_egresos || 0)).toFixed(2)}</h3>
                    <div className="mt-2 text-xs font-bold bg-white text-indigo-600 inline-block px-3 py-1 rounded-full shadow-sm animate-pulse">Cerrar Turno Ahora</div>
                </div>
            ) : (
                <div className="bg-slate-800 p-6 rounded-3xl shadow-lg text-white cursor-pointer hover:bg-slate-700 transition" onClick={() => handleReprint(summary)}>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Cierre Final</p>
                    <h3 className="text-3xl font-black">L. {Number(summary.monto_cierre || 0).toFixed(2)}</h3>
                    <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-300">
                        <Printer className="w-4 h-4" /> Click para Reimprimir
                    </div>
                </div>
            )}
        </div>
      )}

      {/* --- SECCIÓN HISTORIAL DE CAJAS --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print:hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700 flex items-center gap-2"><History className="w-5 h-5 text-indigo-500" /> Historial de Cajas</h3>
          </div>
          <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-500 font-bold uppercase text-xs sticky top-0">
                      <tr>
                          <th className="p-4">ID</th>
                          <th className="p-4">Fecha Apertura</th>
                          <th className="p-4">Usuario</th>
                          <th className="p-4 text-right">Inicial</th>
                          <th className="p-4 text-right">Cierre</th>
                          <th className="p-4 text-center">Estado</th>
                          <th className="p-4 text-center">Acción</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {history.map((box) => (
                          <tr key={box.idcaja} className="hover:bg-slate-50">
                              <td className="p-4 font-mono text-slate-400">#{box.idcaja}</td>
                              <td className="p-4">{new Date(box.fecha_apertura).toLocaleDateString()} {new Date(box.fecha_apertura).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                              <td className="p-4 font-bold text-slate-700">{box.usuario || 'Admin'}</td>
                              <td className="p-4 text-right text-slate-500">L. {Number(box.monto_apertura).toFixed(2)}</td>
                              <td className="p-4 text-right font-bold">
                                  {Number(box.monto_cierre) > 0 ? `L. ${Number(box.monto_cierre).toFixed(2)}` : '-'}
                              </td>
                              <td className="p-4 text-center">
                                  {box.estado === 1 ? (
                                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold uppercase"><CheckCircle className="w-3 h-3" /> Abierta</span>
                                  ) : (
                                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold uppercase"><Lock className="w-3 h-3" /> Cerrada</span>
                                  )}
                              </td>
                              <td className="p-4 text-center">
                                  {box.estado === 1 ? (
                                      <button onClick={() => initiateClose(box.idcaja)} className="text-rose-600 hover:bg-rose-50 px-3 py-1 rounded border border-rose-200 text-xs font-bold transition">
                                          Cerrar
                                      </button>
                                  ) : (
                                      <button onClick={() => handleReprint(box)} className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded border border-indigo-200 text-xs font-bold transition">
                                          Ticket
                                      </button>
                                  )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* --- MODAL INGRESO / GASTO --- */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in zoom-in print:hidden">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
                <h3 className="font-bold text-xl text-slate-800 mb-1">Registrar {modalType === 'in' ? 'Ingreso' : 'Gasto'}</h3>
                <form onSubmit={handleTransaction} className="space-y-4 mt-4">
                    <input autoFocus type="number" step="0.01" className="w-full p-3 border border-slate-200 rounded-xl text-lg font-bold outline-none focus:border-indigo-500" placeholder="0.00" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} />
                    <textarea className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 h-20 resize-none" placeholder="Descripción..." value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600">Cancelar</button>
                        <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- MODAL CIERRE DE CAJA --- */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in zoom-in print:hidden">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center relative">
                <div className="mb-6"><h2 className="text-2xl font-black text-slate-800">Cerrar Caja #{closingBoxId}</h2></div>
                
                {!summary || summary.idcaja !== closingBoxId ? (
                    <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5"/> Estás cerrando una caja anterior.
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 mb-6">Verifica el efectivo físico antes de continuar.</p>
                )}

                <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dinero Físico Real</label>
                    <input autoFocus type="number" step="0.01" className="w-full p-4 border-2 border-indigo-100 rounded-2xl font-black text-3xl text-center text-slate-800 outline-none focus:border-indigo-500 transition" placeholder="0.00" value={finalCount} onChange={e => setFinalCount(e.target.value)} />
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowCloseModal(false)} className="flex-1 py-4 bg-slate-100 rounded-xl font-bold text-slate-600">Cancelar</button>
                    <button onClick={handleCloseBox} className="flex-1 py-4 bg-rose-600 rounded-xl font-bold text-white shadow-lg">CONFIRMAR CIERRE</button>
                </div>
            </div>
        </div>
      )}

      {/* --- TICKET (Visible solo al imprimir, invisible en pantalla) --- */}
      {ticketData && (
        <div id="ticket-print" style={{display: 'none'}}>
            <div style={{textAlign: 'center', marginBottom: '10px'}}>
                <h2 style={{margin: 0, fontSize: '14px', fontWeight: 'bold'}}>FARMACIA IVIS</h2>
                <p style={{margin: 0, fontSize: '10px'}}>{ticketData.isReprint ? 'REIMPRESION DE CIERRE' : 'REPORTE DE CORTE Z'}</p>
                <p style={{margin: 0, fontSize: '10px'}}>Fecha: {ticketData.fecha} {ticketData.hora}</p>
                <p style={{margin: 0, fontSize: '10px'}}>Caja ID: #{ticketData.id}</p>
            </div>
            <div style={{borderBottom: '1px dashed black', margin: '5px 0'}}></div>
            
            {!ticketData.isReprint && (
                <div style={{fontSize: '11px', lineHeight: '1.6'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}><span>FONDO INICIAL:</span><span>L. {Number(ticketData.inicial).toFixed(2)}</span></div>
                    
                    {/* --- AQUÍ ESTÁ EL CAMBIO SOLICITADO --- */}
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span>(+) VENTAS EFECTIVO:</span>
                        <span>L. {Number(ticketData.ventas).toFixed(2)}</span>
                    </div>
                    
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span>(+) INGRESOS EXTRA:</span>
                        <span>L. {Number(ticketData.otros || 0).toFixed(2)}</span>
                    </div>

                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span>(-) SALIDAS/GASTOS:</span>
                        <span>L. {Number(ticketData.egresos).toFixed(2)}</span>
                    </div>
                    
                    <div style={{borderBottom: '1px dashed black', margin: '5px 0'}}></div>
                    
                    <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold'}}>
                        <span>TOTAL SISTEMA:</span>
                        <span>L. {Number(ticketData.sistema).toFixed(2)}</span>
                    </div>
                </div>
            )}

            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginTop: '10px', fontWeight: 'bold'}}>
                <span>CIERRE REAL:</span>
                <span>L. {Number(ticketData.real).toFixed(2)}</span>
            </div>

            {!ticketData.isReprint && (
                <div style={{textAlign: 'center', marginTop: '10px', fontWeight: 'bold', fontSize: '12px'}}>
                    {Math.abs(ticketData.diferencia) < 0.01 ? '*** CUADRE PERFECTO ***' : 
                     ticketData.diferencia > 0 ? `SOBRANTE: L. ${Number(ticketData.diferencia).toFixed(2)}` : 
                     `FALTANTE: L. ${Math.abs(Number(ticketData.diferencia)).toFixed(2)}`}
                </div>
            )}

            <br /><br />
            <div style={{textAlign: 'center', fontSize: '10px'}}><p>__________________________</p><p>Firma Responsable</p></div>
        </div>
      )}

    </div>
  );
}