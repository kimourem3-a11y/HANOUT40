import React, { useState } from 'react';
import { Boxes, AlertTriangle, ArrowUpDown, Filter, Edit3 } from 'lucide-react';
import { Category, Product, StoreSettings } from '../types';
import { formatCurrency } from '../utils/formatters';
import { translations } from '../localization/translations';

interface InventoryViewProps {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  onAdjustStock: (productId: number, newStock: number, reason: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  categories,
  settings,
  onAdjustStock,
}) => {
  const t = translations[settings.language];
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<number | null>(null);

  // Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [newStockQty, setNewStockQty] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Inventaire physique périodique');

  // Valuation metrics
  const totalStockItems = products.reduce((sum, p) => sum + p.stockQuantity, 0);
  const totalValuationCost = products.reduce((sum, p) => sum + p.purchasePrice * p.stockQuantity, 0);
  const totalValuationSelling = products.reduce((sum, p) => sum + p.sellingPrice * p.stockQuantity, 0);
  const potentialMargin = totalValuationSelling - totalValuationCost;

  const openAdjust = (p: Product) => {
    setAdjustingProduct(p);
    setNewStockQty(p.stockQuantity);
    setAdjustmentReason('Inventaire physique périodique');
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustingProduct) {
      onAdjustStock(adjustingProduct.id, Number(newStockQty), adjustmentReason);
      setAdjustingProduct(null);
    }
  };

  const filtered = products.filter((p) => {
    const matchesLow = !filterLowStockOnly || p.stockQuantity <= p.minStock;
    const matchesCat = selectedCat === null || p.categoryId === selectedCat;
    const matchesSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.nameAr && p.nameAr.includes(search)) ||
      p.barcode.includes(search);
    return matchesLow && matchesCat && matchesSearch;
  });

  return (
    <div id="inventory-view-container" className="space-y-5">
      {/* Valuation Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Total Pièces en Stock
          </span>
          <p className="text-2xl font-black text-white mt-2 font-mono">
            {totalStockItems} <span className="text-xs font-normal text-slate-400">articles</span>
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Valeur au Prix d'Achat
          </span>
          <p className="text-2xl font-black text-white mt-2 font-mono">
            {formatCurrency(totalValuationCost, settings.currency)}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Valeur au Prix de Vente
          </span>
          <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">
            {formatCurrency(totalValuationSelling, settings.currency)}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Marge Potentielle
          </span>
          <p className="text-2xl font-black text-indigo-400 mt-2 font-mono">
            {formatCurrency(potentialMargin, settings.currency)}
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher produit..."
            className="bg-slate-950 border border-slate-800 text-white px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-emerald-500 w-full sm:w-60"
          />

          <select
            value={selectedCat || ''}
            onChange={(e) => setSelectedCat(e.target.value ? Number(e.target.value) : null)}
            className="bg-slate-950 border border-slate-800 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
              filterLowStockOnly
                ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Articles en Alerte Stock</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
                <th className="py-3 px-4 font-semibold">{t.barcode}</th>
                <th className="py-3 px-4 font-semibold">{t.productName}</th>
                <th className="py-3 px-4 font-semibold text-center">Stock Actuel</th>
                <th className="py-3 px-4 font-semibold text-center">Seuil Min</th>
                <th className="py-3 px-4 font-semibold text-right">Val. Achat</th>
                <th className="py-3 px-4 font-semibold text-right">Val. Vente</th>
                <th className="py-3 px-4 font-semibold text-center">Ajuster</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((prod) => {
                const isLow = prod.stockQuantity <= prod.minStock;
                const costVal = prod.purchasePrice * prod.stockQuantity;
                const sellVal = prod.sellingPrice * prod.stockQuantity;

                return (
                  <tr key={prod.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-300">
                      {prod.barcode}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {settings.language === 'ar' && prod.nameAr ? prod.nameAr : prod.name}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded font-bold ${
                          isLow
                            ? 'bg-rose-950 text-rose-400 border border-rose-800/50'
                            : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        {prod.stockQuantity} {prod.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">
                      {prod.minStock}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      {formatCurrency(costVal, settings.currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(sellVal, settings.currency)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => openAdjust(prod)}
                        className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                        title="Inventaire Physique / Ajustement"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white pb-2 border-b border-slate-800">
              Ajustement Stock — {adjustingProduct.name}
            </h3>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs flex justify-between">
              <span className="text-slate-400">Stock Théorique:</span>
              <span className="font-bold text-white font-mono">
                {adjustingProduct.stockQuantity} {adjustingProduct.unit}
              </span>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Nouveau Stock Physique Réel *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStockQty}
                  onChange={(e) => setNewStockQty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-base font-black font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Motif de l'ajustement
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
