'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

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
          // Auto-imprimir
          setTimeout(() => window.print(), 800);
        });
    }
  }, [id]);

  if (loading || !sale) return <div className="p-4 text-xs font-mono">Cargando...</div>;

  // --- LÓGICA DE FORMATO ---
  const esFactura = sale.nombre_comprobante?.toUpperCase().includes('FACTURA');
  const tituloDocumento = esFactura ? 'Factura' : 'Ticket';
  
  // Formatear Serie y Número
  // Serie: "000-003-01" (Asumimos que esto viene en 'serie_autorizada')
  // Correlativo: "00000008" (8 dígitos)
  let serieClean = sale.serie_autorizada || '';
  // Limpieza defensiva por si acaso guardaron "DEL... AL..." en la serie
  if(serieClean.length > 15) serieClean = serieClean.substring(0, 10); 

  const numeroCorrelativo = String(sale.numero_comprobante).padStart(8, '0');
  
  // Construcción Final: 000-003-01-00000008
  const numeroCompleto = serieClean 
    ? `${serieClean}-${numeroCorrelativo}`
    : numeroCorrelativo;

  // Rango Autorizado Formateado
  const rangoTexto = sale.rango_inicial && sale.rango_final 
    ? `${serieClean}-${String(sale.rango_inicial).padStart(8, '0')} al ${serieClean}-${String(sale.rango_final).padStart(8, '0')}`
    : 'N/A';

  // --- CÁLCULOS IMPUESTOS (Siempre mostrar) ---
  const subtotal = Number(sale.sumas) + Number(sale.exento);
  const importeExento = Number(sale.exento);
  const importeGravado15 = Number(sale.sumas);
  const isv15 = Number(sale.iva);
  const isv18 = 0.00; // Asumimos 0 si no lo usas
  const total = Number(sale.total);

  const importeGravado18 = 0; // Se deja en 0 si no manejas alcohol/tabaco
  
  return (
    <div className="bg-white text-black font-mono text-[10px] leading-tight p-2 max-w-[300px] mx-auto print:max-w-full print:p-0">
      <style jsx global>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { margin: 0.2cm; }
          .no-print { display: none; }
        }
      `}</style>

      {/* 1. ENCABEZADO EMPRESA */}
      <div className="text-center mb-1">
        {/* Si tienes logo en base64 o url, podrías ponerlo aquí */}
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
      <div className="mb-1 font-bold">
        {tituloDocumento} No {numeroCompleto}
      </div>
      <div className="mb-1">
        <div className="flex justify-between">
            <span>Fecha: {new Date(sale.fecha_venta).toLocaleDateString('es-HN')} {new Date(sale.fecha_venta).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false})}</span>
        </div>
        <p>Cajero: {sale.usuario || 'ADMIN'}</p>
      </div>
      <div className="mb-1">
        <p>Cliente:</p>
        <p className="font-bold uppercase">{sale.nombre_cliente || 'CONSUMIDOR FINAL'}</p>
        <p>RTN: {sale.rtnC || '9999'}</p>
        {sale.direccionC && <p>Direccion: {sale.direccionC}</p>}
      </div>

      <div className="border-b border-dashed border-black my-1"></div>

      {/* 4. ITEMS */}
      <table className="w-full text-left mb-1">
        <thead>
          <tr>
            <th className="pb-1 w-full">Descripcion</th>
            <th className="pb-1 text-center px-1">Cant</th>
            <th className="pb-1 text-right">Precio</th>
            <th className="pb-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
             const flag = Number(item.is_exento) === 1 ? 'E' : 'G';
             return (
                <tr key={i}>
                <td className="pr-1 align-top">
                    {item.nombre_producto} 
                </td>
                <td className="text-center align-top px-1">{Number(item.cantidad).toFixed(2)}</td>
                <td className="text-right align-top">{Number(item.precio_cobrado).toFixed(2)}</td>
                <td className="text-right align-top">
                    {Number(item.subtotal).toFixed(2)}{flag}
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
        <div className="flex justify-between"><span>Descuentos y rebajas:</span><span>L {Number(sale.descuento || 0).toFixed(2)}</span></div>
        
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
        
        <div className="mt-6 pt-4 border-t border-black w-2/3 mx-auto">
            Firma Cliente
        </div>
      </div>
    </div>
  );
}