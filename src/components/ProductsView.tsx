import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  PlusCircle,
} from 'lucide-react';
import { Category, Product, StoreSettings, Supplier } from '../types';
import { formatCurrency } from '../utils/formatters';
import { translations } from '../localization/translations';

interface ProductsViewProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  settings: StoreSettings;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
  onQuickAddStock: (productId: number, addQty: number) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  categories,
  suppliers,
  settings,
  onSaveProduct,
  onDeleteProduct,
  onQuickAddStock,
}) => {
  const t = translations[settings.language];
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Stock refill modal
  const [refillProductId, setRefillProductId] = useState<number | null>(null);
  const [refillQuantity, setRefillQuantity] = useState<number>(10);

  // Form State
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [unit, setUnit] = useState<string>('Unité');
  const [supplierId, setSupplierId] = useState<number | undefined>(undefined);

  const openAddModal = () => {
    setEditingProduct(null);
    setBarcode(String(Math.floor(6130000000000 + Math.random() * 9999999999)));
    setName('');
    setNameAr('');
    setCategoryId(categories[0]?.id || 1);
    setPurchasePrice(0);
    setSellingPrice(0);
    setStockQuantity(10);
    setMinStock(5);
    setUnit('Unité');
    setSupplierId(suppliers[0]?.id);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setBarcode(p.barcode);
    setName(p.name);
    setNameAr(p.nameAr || '');
    setCategoryId(p.categoryId);
    setPurchasePrice(p.purchasePrice);
    setSellingPrice(p.sellingPrice);
    setStockQuantity(p.stockQuantity);
    setMinStock(p.minStock);
    setUnit(p.unit);
    setSupplierId(p.supplierId);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !barcode.trim()) return;

    const prod: Product = {
      id: editingProduct ? editingProduct.id : Date.now(),
      barcode,
      name,
      nameAr: nameAr.trim() || undefined,
      categoryId,
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      stockQuantity: Number(stockQuantity),
      minStock: Number(minStock),
      unit,
      supplierId: supplierId ? Number(supplierId) : undefined,
    };

    onSaveProduct(prod);
    setIsModalOpen(false);
  };

  const handleRefillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (refillProductId && refillQuantity > 0) {
      onQuickAddStock(refillProductId, Number(refillQuantity));
      setRefillProductId(null);
    }
  };

  const filtered = products.filter((p) => {
    const matchesCat = selectedCat === null || p.categoryId === selectedCat;
    const matchesSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.nameAr && p.nameAr.includes(search)) ||
      p.barcode.includes(search);
    return matchesCat && matchesSearch;
  });

  return (
    <div id="products-view-container" className="space-y-5">
      {/* Header controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-950/70 border border-emerald-800/40 rounded-lg text-emerald-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{t.products}</h2>
            <p className="text-xs text-slate-400">
              {products.length} {t.itemsCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="add-product-btn"
            onClick={openAddModal}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.quickNewProduct}</span>
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.productSearchPlaceholder}
            className="w-full bg-slate-950 border border-slate-800 text-white pl-9 pr-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={selectedCat || ''}
          onChange={(e) => setSelectedCat(e.target.value ? Number(e.target.value) : null)}
          className="bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
        >
          <option value="">{t.allCategories}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {settings.language === 'ar' && c.nameAr ? c.nameAr : c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
                <th className="py-3 px-4 font-semibold">{t.barcode}</th>
                <th className="py-3 px-4 font-semibold">{t.productName}</th>
                <th className="py-3 px-4 font-semibold text-right">{t.costPrice}</th>
                <th className="py-3 px-4 font-semibold text-right">{t.sellingPrice}</th>
                <th className="py-3 px-4 font-semibold text-right">{t.margin}</th>
                <th className="py-3 px-4 font-semibold text-center">{t.stock}</th>
                <th className="py-3 px-4 font-semibold text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((prod) => {
                const margin =
                  prod.sellingPrice > 0
                    ? ((prod.sellingPrice - prod.purchasePrice) / prod.sellingPrice) * 100
                    : 0;
                const isLow = prod.stockQuantity <= prod.minStock;

                return (
                  <tr key={prod.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-300">
                      {prod.barcode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">
                        {settings.language === 'ar' && prod.nameAr
                          ? prod.nameAr
                          : prod.name}
                      </div>
                      {prod.nameAr && settings.language !== 'ar' && (
                        <div className="text-[11px] text-slate-400">{prod.nameAr}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono">
                      {formatCurrency(prod.purchasePrice, settings.currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-400 font-mono">
                      {formatCurrency(prod.sellingPrice, settings.currency)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-slate-300 font-bold font-mono">
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded font-bold font-mono text-[11px] ${
                          isLow
                            ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                            : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        {prod.stockQuantity} {prod.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setRefillProductId(prod.id)}
                          className="p-1.5 rounded-md hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                          title="Ajouter du Stock"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(prod)}
                          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                          title={t.edit}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(t.confirmDelete)) onDeleteProduct(prod.id);
                          }}
                          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          title={t.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white pb-2 border-b border-slate-800">
              {editingProduct ? t.edit : t.quickNewProduct}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    {t.barcode} *
                  </label>
                  <input
                    type="text"
                    required
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    Catégorie
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {settings.language === 'ar' && c.nameAr ? c.nameAr : c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  {t.productName} (FR) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Lait Soummam Candia 1L"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  اسم المنتج (عربي)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: حليب كانديا 1 لتر"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500 text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    {t.costPrice} ({settings.currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    {t.sellingPrice} ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    {t.stock}
                  </label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    {t.minStock}
                  </label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    {t.unit}
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Unité, Kg, Boîte"
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Refill Modal */}
      {refillProductId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white pb-2 border-b border-slate-800">
              Réapprovisionnement Rapide
            </h3>
            <form onSubmit={handleRefillSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Quantité à ajouter au stock
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={refillQuantity}
                  onChange={(e) => setRefillQuantity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-base font-bold font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRefillProductId(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
