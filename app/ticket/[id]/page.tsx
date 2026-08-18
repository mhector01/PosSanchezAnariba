'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// ==========================================
// 1. UTILIDADES
// ==========================================

const cleanNumber = (val: any) => {
  if (!val) return 0;
  const str = String(val).replace(/[A-Za-z() L$]/g, '').replace(/,/g, '').trim();
  return Number(str) || 0;
};

// Función para detectar exentos
const esExento = (val: any): boolean => {
  if (val === 1 || val === '1' || val === true) return true;
  if (val && typeof val === 'object' && val.data && val.data[0] === 1) return true;
  return false;
};

export default function TicketPage() {
  const params = useParams();
  const id = params?.id;
  
  const [sale, setSale] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [company, setCompany] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings/parameters').then(res => res.json()).then(setCompany);

    if (id) {
      fetch(`/api/sales/${id}`)
        .then(res => res.json())
        .then(data => {
          setSale(data.sale);
          setItems(data.items || []);
          setLoading(false);
          // Auto-imprimir con un ligero retraso para cargar el logo
          setTimeout(() => window.print(), 1000);
        });
    }
  }, [id]);

  if (loading || !sale) return <div className="p-4 text-xs font-mono">Cargando...</div>;

  // --- LÓGICA DE FORMATO ---
  const esFactura = sale.nombre_comprobante?.toUpperCase().includes('FACTURA');
  const tituloDocumento = esFactura ? 'Factura' : 'Ticket';
  
  let serieClean = sale.serie_autorizada || '';
  if(serieClean.length > 15) serieClean = serieClean.substring(0, 10); 

  const numeroCorrelativo = String(sale.numero_comprobante).padStart(8, '0');
  const numeroCompleto = serieClean 
    ? `${serieClean}-${numeroCorrelativo}`
    : numeroCorrelativo;

  const rangoTexto = sale.rango_inicial && sale.rango_final 
    ? `${serieClean}-${String(sale.rango_inicial).padStart(8, '0')} al ${serieClean}-${String(sale.rango_final).padStart(8, '0')}`
    : 'N/A';

  // --- CÁLCULO DE TOTALES REPARADO (Suma items manualmente) ---
  const calculatedTotals = items.reduce((acc: any, item: any) => {
      // El importe viene con impuesto incluido (ej: 30.00)
      const totalLine = cleanNumber(item.importe || item.subtotal || 0);
      
      // Verificación robusta de exento
      const isItemExempt = esExento(item.producto_exento) || esExento(item.is_exento) || Number(item.exento) > 0 || (typeof item.importe === 'string' && item.importe.toUpperCase().includes('E'));

      if (isItemExempt) {
          acc.exento += totalLine;
      } else {
          acc.gravado += totalLine; // Aquí acumulamos el bruto (30.00)
      }
      return acc;
  }, { exento: 0, gravado: 0 });

  const importeExento = calculatedTotals.exento;
  
  // CORRECCIÓN: Como 'calculatedTotals.gravado' tiene el impuesto incluido,
  // lo dividimos entre 1.15 para obtener la BASE IMPONIBLE real.
  const importeGravado15 = calculatedTotals.gravado / 1.15; 
  
  // Recuperamos el ISV de la base de datos
  let isv15 = cleanNumber(sale.iva);

  // Si la DB no trae el impuesto (es 0 o null) pero hay base gravada, lo calculamos manualmente
  if (!isv15 && importeGravado15 > 0) {
      isv15 = importeGravado15 * 0.15; 
  }

  const descuento = cleanNumber(sale.descuento || sale.total_descuento);
  
  // Subtotal es la suma de bases (Exento + Base Gravada)
  const subtotal = importeExento + importeGravado15;
  
  // Total final: Base + Impuesto - Descuento
  // (26.09 + 3.91 = 30.00)
  const total = subtotal + isv15 - descuento;
  
  const isv18 = 0.00; 
  const importeGravado18 = 0; 
  
  return (
    <div className="bg-white text-black font-mono text-[10px] leading-tight p-2 max-w-[300px] mx-auto print:max-w-full print:p-0">
      <style jsx global>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { margin: 0.2cm; }
          .no-print { display: none; }
        }
      `}</style>

      {/* 1. ENCABEZADO EMPRESA & LOGO */}
      <div className="text-center mb-2 flex flex-col items-center">
        {/* LOGO AUMENTADO DE TAMAÑO PARA MEJOR VISIBILIDAD */}
        <img 
            src="/logoSA.jpeg" 
            alt="Logo Grupo Sánchez Anariba" 
            className="w-32 h-24 object-contain mb-1" 
        />
        <h1 className="text-sm font-bold uppercase mb-1">{company.nombre_empresa}</h1>
        <p className="px-2">{company.direccion_empresa}</p>
        <p className="mt-1">Telefono: {company.telefono_empresa}</p>
        <p className="font-bold">RTN: {company.numero_nit}</p>
      </div>

      <div className="border-b border-dashed border-black my-1"></div>

      {/* 2. BLOQUE FISCAL (CAI) - SOLO SI ES FACTURA */}
      {esFactura && sale.cai_rango && (
        <div className="mb-1">
            <p>CAI: {sale.cai_rango}</p>
            <p>Fecha limite emision: {new Date(sale.fecha_limite).toLocaleDateString('es-HN')}</p>
            <p className="mt-1">Rango autorizado:</p>
            <p className="text-[9px]">{rangoTexto}</p>
        </div>
      )}
      
      <div className="border-b border-dashed border-black my-1"></div>

      {/* 3. DATOS DE LA VENTA */}
      <div className="mb-1 font-bold text-center text-[11px]">
        {tituloDocumento} N° {numeroCompleto}
      </div>
      <div className="mb-1">
        <div className="flex justify-between">
            <span>Fecha: {new Date(sale.fecha_venta).toLocaleDateString('es-HN')} {new Date(sale.fecha_venta).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false})}</span>
        </div>
        <p>Cajero: {sale.usuario || sale.empleado || 'ADMIN'}</p>
      </div>
      <div className="mb-1">
        <p>Cliente:</p>
        <p className="font-bold uppercase">{sale.nombre_cliente || sale.cliente || 'CONSUMIDOR FINAL'}</p>
        <p>RTN: {sale.rtnC || '9999'}</p>
        {sale.direccionC && <p>Direccion: {sale.direccionC}</p>}
      </div>

      <div className="border-b border-dashed border-black my-1"></div>

      {/* 4. ITEMS */}
      <table className="w-full text-left mb-1 table-fixed">
        <thead>
          <tr>
            <th className="pb-1 w-[45%]">Descrip</th>
            <th className="pb-1 text-center w-[15%]">Cant</th>
            <th className="pb-1 text-right w-[18%] pr-1">Precio</th>
            <th className="pb-1 text-right w-[22%]">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
             const precio = cleanNumber(item.precio_unitario || item.precio_cobrado);
             const totalLine = cleanNumber(item.importe || item.subtotal);
             const cantidad = cleanNumber(item.cantidad);

             const isItemExempt = esExento(item.producto_exento) || esExento(item.is_exento) || Number(item.exento) > 0 || (typeof item.importe === 'string' && item.importe.toUpperCase().includes('E'));
             const flag = isItemExempt ? 'E' : 'G';

             return (
                <tr key={i}>
                  <td className="pr-1 pb-1 align-top leading-tight break-words">
                      {item.nombre_producto || item.descripcion} 
                  </td>
                  <td className="text-center align-top px-1 pb-1">
                      {cantidad.toFixed(2)}
                  </td>
                  <td className="text-right align-top pr-1 pb-1">
                      {precio.toFixed(2)}
                  </td>
                  <td className="text-right align-top pb-1">
                      {totalLine.toFixed(2)}{flag}
                  </td>
                </tr>
             );
          })}
        </tbody>
      </table>

      <div className="border-b border-dashed border-black my-1"></div>

      {/* 5. TOTALES OBLIGATORIOS (Formato SAR) */}
      <div className="mb-2 font-bold text-[9px]">G = GRAVADO   E = EXENTO</div>
      
      <div className="mb-3 space-y-0.5">
        <div className="flex justify-between font-bold"><span>SubTotal:</span><span>L {subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Importe exonerado:</span><span>L 0.00</span></div>
        <div className="flex justify-between"><span>Importe exento:</span><span>L {importeExento.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Importe gravado 15%:</span><span>L {importeGravado15.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Importe gravado 18%:</span><span>L {importeGravado18.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>ISV 15%:</span><span>L {isv15.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>ISV 18%:</span><span>L 0.00</span></div>
        <div className="flex justify-between"><span>Descuentos y rebajas:</span><span>L {descuento.toFixed(2)}</span></div>
        
        {/* --- CAMPOS FISCALES ADICIONALES (TICKET) --- */}
        <div className="mt-3 mb-2 space-y-1 text-[9px]">
            <p>No. Orden de compra exenta: </p>
            <p>No. Constancia registro exonerado: </p>
            <p>No. Registro de la SAC: </p>
        </div>

        <div className="flex justify-between font-bold text-sm mt-2 pt-1 border-t border-black">
          <span>Total a pagar:</span>
          <span>L {total.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-b border-dashed border-black my-1"></div>

      <div className="mb-4">
        <p className="font-bold mb-1">Pago realizado en: {sale.tipo_pago}</p>
        <div className="flex justify-between px-4"><span>Recibido:</span><span>L {Number(sale.pago_efectivo).toFixed(2)}</span></div>
        <div className="flex justify-between px-4"><span>Cambio:</span><span>L {Number(sale.cambio).toFixed(2)}</span></div>
      </div>

      <div className="text-center mt-4">
        <p className="font-bold uppercase">GRACIAS POR SU COMPRA</p>
        <p className="mt-1">*{String(sale.numero_venta || sale.idventa).padStart(8, '0')}*</p>
        {sale.notas && <p className="mt-2 italic text-[9px]">Nota: {sale.notas}</p>}
        
        <div className="mt-6 pt-4 border-t border-black w-3/4 mx-auto">
            Firma Cliente
        </div>
      </div>
    </div>
  );
}