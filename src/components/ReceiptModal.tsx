import React from 'react';
import { Printer, X, CheckCircle2, FileDown } from 'lucide-react';
import { Sale, StoreSettings } from '../types';
import { formatCurrency } from '../utils/formatters';
import { translations } from '../localization/translations';
import { downloadOrSharePdf, generateInvoicePdf } from '../utils/pdfGenerator';

interface ReceiptModalProps {
  sale: Sale;
  settings: StoreSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  settings,
  onClose,
}) => {
  const t = translations[settings.language];
  const is58mm = settings.printerType === 'thermal58';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="receipt-modal-overlay"
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm">
              {t.success} — {sale.invoiceNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Thermal Ticket Emulation */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950/60 flex justify-center">
          <div
            id="thermal-receipt-container"
            className={`bg-white text-slate-950 p-5 rounded-md shadow-md font-mono text-xs border border-slate-300 ${
              is58mm ? 'w-64 text-[11px]' : 'w-80'
            }`}
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              <h1 className="font-black text-base uppercase tracking-wider">
                {settings.storeName}
              </h1>
              <p className="text-[11px] text-slate-700">{settings.tagline}</p>
              <p className="text-[10px] text-slate-600">{settings.address}</p>
              <p className="text-[10px] text-slate-600">Tél: {settings.phone}</p>
              {settings.rcNumber && (
                <p className="text-[9px] text-slate-500">
                  RC: {settings.rcNumber} | NIF: {settings.nifNumber}
                </p>
              )}
            </div>

            {/* Sale Metadata */}
            <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>N° Facture:</span>
                <span className="font-bold">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{sale.saleDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Client:</span>
                <span className="font-semibold">
                  {sale.customerName || t.anonymousClient}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Mode:</span>
                <span className="uppercase font-semibold">{sale.paymentMethod}</span>
              </div>
            </div>

            {/* Itemized Line Table */}
            <div className="py-2.5 border-b border-dashed border-slate-400">
              <div className="flex justify-between font-bold pb-1 text-[10px] text-slate-700 uppercase border-b border-slate-300">
                <span>Article</span>
                <span>Qté x P.U</span>
                <span>Total</span>
              </div>
              <div className="divide-y divide-slate-200 mt-1">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="py-1 text-[11px]">
                    <div className="font-medium truncate">{item.productName}</div>
                    <div className="flex justify-between text-slate-600 text-[10px]">
                      <span>
                        {item.quantity} x {formatCurrency(item.unitPrice, settings.currency)}
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(item.lineTotal, settings.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="py-2.5 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>{t.cartSubtotal}:</span>
                <span>{formatCurrency(sale.subtotal, settings.currency)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>{t.discount}:</span>
                  <span>-{formatCurrency(sale.discount, settings.currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-400">
                <span>{t.cartTotal}:</span>
                <span>{formatCurrency(sale.totalAmount, settings.currency)}</span>
              </div>
              <div className="flex justify-between text-slate-700 pt-1">
                <span>{t.amountReceived}:</span>
                <span>{formatCurrency(sale.amountPaid, settings.currency)}</span>
              </div>
              {sale.debtAmount > 0 && (
                <div className="flex justify-between text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded">
                  <span>{t.balanceDue} (Dette):</span>
                  <span>{formatCurrency(sale.debtAmount, settings.currency)}</span>
                </div>
              )}
            </div>

            {/* Footer Notice & Pseudo Barcode */}
            <div className="pt-3 text-center border-t border-dashed border-slate-400">
              <p className="text-[11px] font-medium text-slate-700">
                {settings.receiptFooter}
              </p>
              <div className="mt-2 flex justify-center">
                <div className="font-mono tracking-widest text-[9px] bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                  *{sale.invoiceNumber}*
                </div>
              </div>
              <p className="text-[9px] text-slate-400 mt-1">
                Logiciel: Hanouti 40 — Gestion de magasin
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-800 bg-slate-900">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            {t.close}
          </button>
          <button
            type="button"
            onClick={() => {
              const doc = generateInvoicePdf(sale, settings);
              downloadOrSharePdf(doc, `Invoice_${sale.invoiceNumber}.pdf`, `Facture ${sale.invoiceNumber}`);
            }}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>{t.exportPdf}</span>
          </button>
          <button
            id="print-receipt-btn"
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printReceipt}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
