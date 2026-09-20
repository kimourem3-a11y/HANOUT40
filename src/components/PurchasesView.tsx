import React, { useState } from 'react';
import { ShoppingBag, Plus, Trash2, CheckCircle2, Truck } from 'lucide-react';
import { Product, Purchase, PurchaseItem, StoreSettings, Supplier } from '../types';
import { formatCurrency, generateBillNumber } from '../utils/formatters';
import { translations } from '../localization/translations';

interface PurchasesViewProps {
  purchases: Purchase[];
  products: Product[];
  suppliers: Supplier[];
  settings: StoreSettings;
  onRecordPurchase: (purchase: Purchase, updatedProducts: Product[], updatedSuppliers: Supplier[]) => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  products,
  suppliers,
  settings,
  onRecordPurchase,
}) => {
  const t = translations[settings.language];
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);

  // New Purchase Form
  const [billNumber, setBillNumber] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(suppliers[0]?.id || 1);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Item input
  const [selectedProductId, setSelectedProductId] = useState<number>(products[0]?.id || 1);
  const [itemQuantity, setItemQuantity] = useState<number>(10);
  const [itemCost, setItemCost] = useState<number>(0);

  const openNewPurchase = () => {
    setBillNumber(generateBillNumber());
    setSelectedSupplierId(suppliers[0]?.id || 1);
    setItems([]);
    setAmountPaid(0);
    if (products[0]) {
      setSelectedProductId(products[0].id);
      setItemCost(products[0].purchasePrice);
    }
    setIsNewPurchaseOpen(true);
  };

  const handleProductSelect = (pid: number) => {
    setSelectedProductId(pid);
    const prod = products.find((p) => p.id === pid);
    if (prod) {
      setItemCost(prod.purchasePrice);
    }
  };

  const addItem = () => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod || itemQuantity <= 0) return;

    const newItem: PurchaseItem = {
      productId: prod.id,
      productName: prod.name,
      quantity: Number(itemQuantity),
      unitCost: Number(itemCost),
      lineTotal: Number(itemQuantity) * Number(itemCost),
    };

    setItems([...items, newItem]);
    setItemQuantity(10);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const totalBillAmount = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const debtAmount = Math.max(0, totalBillAmount - amountPaid);

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Veuillez ajouter au moins un produit à la facture.');
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supplier) return;

    const now = new Date();
    const dateStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newPurchase: Purchase = {
      id: Date.now(),
      billNumber: billNumber || generateBillNumber(),
      purchaseDate: dateStr,
      supplierId: supplier.id,
      supplierName: supplier.name,
      totalAmount: totalBillAmount,
      amountPaid,
      debtAmount,
      items: [...items],
    };

    // Update Product stocks & cost prices
    const updatedProducts = products.map((p) => {
      const purchaseItem = items.find((i) => i.productId === p.id);
      if (purchaseItem) {
        return {
          ...p,
          stockQuantity: p.stockQuantity + purchaseItem.quantity,
          purchasePrice: purchaseItem.unitCost, // update last cost price
        };
      }
      return p;
    });

    // Update Supplier debt
    const updatedSuppliers = suppliers.map((s) => {
      if (s.id === supplier.id && debtAmount > 0) {
        return { ...s, currentDebt: s.currentDebt + debtAmount };
      }
      return s;
    });

    onRecordPurchase(newPurchase, updatedProducts, updatedSuppliers);
    setIsNewPurchaseOpen(false);
  };

  return (
    <div id="purchases-view-container" className="space-y-5">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-950/70 border border-emerald-800/40 rounded-lg text-emerald-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{t.purchases}</h2>
            <p className="text-xs text-slate-400">
              {purchases.length} Bons de Réception
            </p>
          </div>
        </div>

        <button
          id="record-purchase-btn"
          onClick={openNewPurchase}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel Achat / Réception</span>
        </button>
      </div>

      {/* Purchases History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
                <th className="py-3 px-4 font-semibold">N° Bon</th>
                <th className="py-3 px-4 font-semibold">{t.date}</th>
                <th className="py-3 px-4 font-semibold">Fournisseur</th>
                <th className="py-3 px-4 font-semibold text-center">{t.itemsCount}</th>
                <th className="py-3 px-4 font-semibold text-right">Total Facture</th>
                <th className="py-3 px-4 font-semibold text-right">Montant Versé</th>
                <th className="py-3 px-4 font-semibold text-right">Reste (Dette)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {purchases.map((pur) => (
                <tr key={pur.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-medium text-white">
                    {pur.billNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-400">{pur.purchaseDate}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">
                    {pur.supplierName}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono">
                      {pur.items.length}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-white font-mono">
                    {formatCurrency(pur.totalAmount, settings.currency)}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-mono">
                    {formatCurrency(pur.amountPaid, settings.currency)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    {pur.debtAmount > 0 ? (
                      <span className="text-rose-400">
                        {formatCurrency(pur.debtAmount, settings.currency)}
                      </span>
                    ) : (
                      <span className="text-slate-500">Réglé</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      {isNewPurchaseOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white pb-2 border-b border-slate-800">
              Nouvelle Réception Marchandise (Entrée Stock)
            </h3>

            <form onSubmit={handleSubmitPurchase} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    N° Bon de Livraison / Facture *
                  </label>
                  <input
                    type="text"
                    required
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    Fournisseur *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add items section */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase">
                  Ajouter un produit reçu
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-1">
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Produit
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductSelect(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 text-white px-2 py-1.5 rounded text-xs focus:outline-none focus:border-emerald-500"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Quantité reçue
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 text-white px-2 py-1.5 rounded text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Prix Achat Unitaire
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={itemCost}
                      onChange={(e) => setItemCost(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 text-white px-2 py-1.5 rounded text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={addItem}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter à la liste</span>
                  </button>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-800 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400">
                    <tr>
                      <th className="py-2 px-3">Article</th>
                      <th className="py-2 px-3 text-center">Quantité</th>
                      <th className="py-2 px-3 text-right">P.U Achat</th>
                      <th className="py-2 px-3 text-right">Total</th>
                      <th className="py-2 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-white font-medium">
                          {item.productName}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-emerald-400">
                          +{item.quantity}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-300">
                          {formatCurrency(item.unitCost, settings.currency)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-white">
                          {formatCurrency(item.lineTotal, settings.currency)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Payments */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Total Facture Achat:</span>
                  <span className="font-bold font-mono text-sm text-white">
                    {formatCurrency(totalBillAmount, settings.currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <label className="font-semibold text-slate-400">
                    Montant Réglé au Fournisseur:
                  </label>
                  <div className="w-36">
                    <input
                      type="number"
                      step="any"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded text-right font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800 font-bold">
                  <span className="text-amber-400">Dette Générée Fournisseur:</span>
                  <span className="font-mono text-sm text-amber-400">
                    {formatCurrency(debtAmount, settings.currency)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewPurchaseOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={items.length === 0}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Valider la Réception
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
