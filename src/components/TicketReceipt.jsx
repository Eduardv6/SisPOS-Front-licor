import React from "react";
import { Beer } from "lucide-react";

export default function TicketReceipt({ saleData, settings }) {
  if (!saleData || !settings) return null;

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #print-area,
          #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none;
          }
        }
      `}</style>
      <div
        id="print-area"
        className="bg-white p-6 shadow-sm mx-auto max-w-[300px] text-xs font-mono leading-relaxed print:shadow-none print:max-w-none print:w-full"
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div className="w-20 h-20 bg-white border border-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2 overflow-hidden">
            {settings.empresa_logo ? (
              <img
                src={
                  settings.empresa_logo?.startsWith("http")
                    ? settings.empresa_logo
                    : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${settings.empresa_logo}`
                }
                alt="Logo"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-gray-900 text-white flex items-center justify-center print:text-black print:border print:border-black">
                <Beer size={32} />
              </div>
            )}
          </div>
          <h2 className="font-bold text-base uppercase mb-1">
            {settings.empresa_nombre}
          </h2>
          <p>{settings.empresa_direccion}</p>
          <p className="text-[10px] text-gray-500">
            NIT: {settings.empresa_nit}
          </p>
        </div>

        <div className="border-b-2 border-dashed border-gray-300 my-2"></div>

        {/* Info */}
        <div className="mb-2">
          <div className="flex justify-between">
            <span>FECHA:</span>
            <span>{new Date(saleData.fecha).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>HORA:</span>
            <span>{new Date(saleData.fecha).toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between">
            <span>CAJERO:</span>
            <span className="uppercase">{saleData.usuario}</span>
          </div>
          <div className="flex justify-between">
            <span>NRO VENTA:</span>
            <span>{saleData.numeroVenta || "S/N"}</span>
          </div>
        </div>

        <div className="border-b-2 border-dashed border-gray-300 my-2"></div>

        {/* Client */}
        <div className="mb-2">
          <div className="flex justify-between">
            <span className="font-bold">CLIENTE:</span>
            <span className="text-right text-[10px] break-words max-w-[150px]">
              {saleData.cliente
                ? `${saleData.cliente.nombre || ""} ${saleData.cliente.apellido || ""}`.trim()
                : "S/N"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">NIT/CI:</span>
            <span>
              {saleData.cliente
                ? saleData.cliente.cedula ||
                  saleData.cliente.ciNit ||
                  saleData.cliente.ci ||
                  "0"
                : "0"}
            </span>
          </div>
        </div>

        <div className="border-b-2 border-dashed border-gray-300 my-2"></div>

        {/* Items */}
        <div className="mb-2">
          <div className="flex justify-between font-bold mb-1 border-b border-gray-200 pb-1">
            <span>DESCRIPCION</span>
            <span>TOTAL</span>
          </div>
          {(saleData.items || []).map((item, idx) => (
            <div key={idx} className="mb-2">
              <div className="uppercase font-medium text-[10px] mb-0.5">
                {item.nombre}
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-gray-500 pl-2">
                  {item.quantity} x{" "}
                  {parseFloat(
                    item.precioVenta || item.precioUnitario || 0,
                  ).toFixed(2)}
                </span>
                <span className="font-medium">
                  {parseFloat(
                    item.subtotal ||
                      item.quantity *
                        (item.precioVenta || item.precioUnitario || 0),
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-b-2 border-dashed border-gray-300 my-2"></div>

        {/* Totals */}
        <div className="mb-2 space-y-1">
          {saleData.descuento > 0 && (
            <>
              <div className="flex justify-between text-[10px]">
                <span>SUBTOTAL:</span>
                <span>Bs. {Number(saleData.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>DESCUENTO:</span>
                <span>- Bs. {Number(saleData.descuento).toFixed(2)}</span>
              </div>
            </>
          )}

          <div className="flex justify-between font-bold text-sm pt-1 border-t border-dotted border-gray-300">
            <span>TOTAL A PAGAR</span>
            <span>Bs. {Number(saleData.total).toFixed(2)}</span>
          </div>

          <div className="pt-2">
            <div className="flex justify-between text-[10px]">
              <span>METODO PAGO:</span>
              <span className="uppercase font-bold">
                {saleData.metodoPagoTexto || saleData.metodoPago || "Efectivo"}
              </span>
            </div>
            {/* Show received amount and change only for cash payments */}
            {(saleData.metodoPago || "").toUpperCase() === "EFECTIVO" && (
              <>
                <div className="flex justify-between text-[10px]">
                  <span>EFECTIVO RECIBIDO:</span>
                  <span>
                    Bs.{" "}
                    {parseFloat(
                      saleData.montoRecibido ?? saleData.total ?? 0,
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>CAMBIO:</span>
                  <span>
                    Bs.{" "}
                    {parseFloat(
                      saleData.cambio ??
                        (saleData.montoRecibido != null
                          ? saleData.montoRecibido - saleData.total
                          : 0),
                    ).toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="border-b-2 border-dashed border-gray-300 my-2"></div>

        <div className="text-center mt-4">
          <p className="font-bold uppercase">
            {settings.empresa_mensaje_recibo || "¡GRACIAS POR SU COMPRA!"}
          </p>
          <p className="text-[10px] mt-1">Vuelva pronto</p>
        </div>
      </div>
    </>
  );
}
