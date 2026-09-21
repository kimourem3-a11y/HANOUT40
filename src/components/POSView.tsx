import React, { useState, useRef, useEffect } from 'react';
import {
  Barcode,
  Search,
  Trash2,
  Plus,
  Minus,
  Check,
  CreditCard,
  Banknote,
  Receipt,
  User,
  ShoppingBag,
  AlertCircle,
  Percent,
  Camera,
} from 'lucide-react';
import { Category, Customer, Product, Sale, SaleItem, StoreSettings } from '../types';
import { formatCurrency, generateInvoiceNumber } from '../utils/formatters';
import { translations } from '../localization/translations';
import { CameraScannerModal } from './CameraScannerModal';

interface POSViewProps {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  settings: StoreSettings;
  onSaleComplete: (sale: Sale, updatedProducts: Product[], updatedCustomers: Customer[]) => void;
}

export const POSView: React.FC<POSViewProps> = ({
  products,
  categories,
  customers,
  settings,
  onSaleComplete,
}) => {
  const t = translations[settings.language];
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Search & Filters
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Cart State
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [tvaRate, setTvaRate] = useState<number>(settings.taxRate ?? 0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT' | 'CARD' | 'SPLIT'>('CASH');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  const handleScanBarcode = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;
    const matched = products.find((p) => p.barcode === cleanCode);
    if (matched) {
      addProductToCart(matched);
    } else {
      alert(`Code-barres inconnu : ${cleanCode}`);
    }
  };

  // Auto-focus barcode scanner
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Keyboard shortcut listener (F12 to checkout, F1 to focus barcode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' && cart.length > 0) {
        e.preventDefault();
        openCheckout();
      } else if (e.key === 'F1') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Cart Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const taxAmount = (discountedSubtotal * tvaRate) / 100;
  const totalPayable = discountedSubtotal + taxAmount;

  // Open Checkout
  const openCheckout = () => {
    setAmountReceived(totalPayable);
    setIsCheckoutOpen(true);
  };

  // Add product to cart by product or barcode
  const addProductToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      alert(
        settings.language === 'ar'
          ? 'تنبيه: هذا المنتج نافذ من المخزون!'
          : 'Attention: Ce produit est en rupture de stock !'
      );
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.productId === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        const item = updated[existingIndex];
        const newQty = item.quantity + 1;
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          lineTotal: newQty * item.unitPrice,
        };
        return updated;
      } else {
        const newItem: SaleItem = {
          productId: product.id,
          barcode: product.barcode,
          productName: settings.language === 'ar' && product.nameAr ? product.nameAr : product.name,
          quantity: 1,
          unitPrice: product.sellingPrice,
          purchasePrice: product.purchasePrice,
          lineTotal: product.sellingPrice,
        };
        return [newItem, ...prevCart];
      }
    });
  };

  // Barcode Submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = barcodeInput.trim();
    if (!cleanCode) return;

    const matched = products.find((p) => p.barcode === cleanCode);
    if (matched) {
      addProductToCart(matched);
      setBarcodeInput('');
    } else {
      alert(
        settings.language === 'ar'
          ? `لم يتم العثور على منتج بالرمز: ${cleanCode}`
          : `Code-barres introuvable: ${cleanCode}`
      );
    }
  };

  // Quantity updates
  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = Math.max(1, item.quantity + delta);
            return {
              ...item,
              quantity: newQty,
              lineTotal: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    if (cart.length > 0 && confirm(t.confirmDelete)) {
      setCart([]);
      setDiscount(0);
      setSelectedCustomerId(null);
    }
  };

  // Filtered Products for quick grid
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategoryId === null || p.categoryId === selectedCategoryId;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nameAr && p.nameAr.includes(searchQuery)) ||
      p.barcode.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  // Selected customer info
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Complete Transaction
  const handleFinalizeSale = () => {
    const debtAmount =
      paymentMethod === 'CREDIT'
        ? totalPayable
        : paymentMethod === 'SPLIT'
        ? Math.max(0, totalPayable - amountReceived)
        : 0;

    const actualPaid =
      paymentMethod === 'CREDIT'
        ? 0
        : paymentMethod === 'SPLIT'
        ? Math.min(totalPayable, amountReceived)
        : totalPayable;

    // Check debt credit limit
    if (debtAmount > 0 && selectedCustomer) {
      const projectedDebt = selectedCustomer.currentDebt + debtAmount;
      if (selectedCustomer.creditLimit > 0 && projectedDebt > selectedCustomer.creditLimit) {
        alert(
          settings.language === 'ar'
            ? `تحذير: هذا الزبون سيتجاوز سقف دينه المسموح (${formatCurrency(selectedCustomer.creditLimit, settings.currency)})`
            : `Alerte: Plafond de crédit dépassé (${formatCurrency(selectedCustomer.creditLimit, settings.currency)})`
        );
      }
    }

    const now = new Date();
    const dateStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newSale: Sale = {
      id: Date.now(),
      invoiceNumber: generateInvoiceNumber(),
      saleDate: dateStr,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer ? selectedCustomer.name : t.anonymousClient,
      subtotal,
      discount,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: totalPayable,
      amountPaid: actualPaid,
      debtAmount,
      paymentMethod,
      items: [...cart],
      status: 'COMPLETED',
    };

    // Decrement stock in memory
    const updatedProducts = products.map((p) => {
      const cartItem = cart.find((item) => item.productId === p.id);
      if (cartItem) {
        return { ...p, stockQuantity: Math.max(0, p.stockQuantity - cartItem.quantity) };
      }
      return p;
    });

    // Update customer debt if credit sale
    const updatedCustomers = customers.map((c) => {
      if (selectedCustomer && c.id === selectedCustomer.id && debtAmount > 0) {
        return { ...c, currentDebt: c.currentDebt + debtAmount };
      }
      return c;
    });

    // Reset local state
    setCart([]);
    setDiscount(0);
    setIsCheckoutOpen(false);
    setSelectedCustomerId(null);

    // Trigger parent callback (which shows receipt)
    onSaleComplete(newSale, updatedProducts, updatedCustomers);
  };

  return (
    <div id="pos-view-container" className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
      {/* Left Column: Product Search, Barcode & Quick Catalog (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        {/* Barcode Fast Scan Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Barcode className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder={t.barcodeSearchPlaceholder}
                className="w-full bg-slate-950 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-lg text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-3 py-2.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5"
              title={t.scanCamera}
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">{t.scanCamera}</span>
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer"
            >
              {t.addToCart}
            </button>
          </form>
        </div>

        {/* Catalog Search & Category Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.productSearchPlaceholder}
              className="w-full bg-slate-950 border border-slate-800 text-white pl-9 pr-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategoryId === null
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {t.allCategories}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategoryId === cat.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {settings.language === 'ar' && cat.nameAr ? cat.nameAr : cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto max-h-[520px] p-1">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => addProductToCart(product)}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-3 flex flex-col justify-between transition cursor-pointer shadow-xs group"
            >
              <div>
                <div className="flex justify-between items-start gap-1">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {product.barcode.slice(-5)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      product.stockQuantity <= product.minStock
                        ? 'bg-rose-950 text-rose-400 border border-rose-800/50'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {product.stockQuantity} {product.unit}
                  </span>
                </div>
                <h4 className="font-semibold text-white text-xs mt-1.5 group-hover:text-emerald-400 transition line-clamp-2">
                  {settings.language === 'ar' && product.nameAr
                    ? product.nameAr
                    : product.name}
                </h4>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="font-black text-emerald-400 text-sm">
                  {formatCurrency(product.sellingPrice, settings.currency)}
                </span>
                <span className="p-1 rounded-md bg-emerald-600/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <Plus className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Active Cart, Customer & Checkout (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex-1 flex flex-col justify-between">
          {/* Cart Header */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>{t.cartSubtotal} ({cart.length})</span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium transition cursor-pointer"
                >
                  {t.delete} tout
                </button>
              )}
            </div>

            {/* Customer Assignment */}
            <div className="py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedCustomerId || ''}
                  onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="">{t.anonymousClient}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.currentDebt > 0 ? `(Dette: ${formatCurrency(c.currentDebt, settings.currency)})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && selectedCustomer.currentDebt > 0 && (
                <div className="mt-2 text-[11px] bg-amber-950/40 text-amber-300 px-2 py-1 rounded border border-amber-800/40 flex items-center justify-between">
                  <span>{t.customerDebts}:</span>
                  <span className="font-bold font-mono">
                    {formatCurrency(selectedCustomer.currentDebt, settings.currency)}
                  </span>
                </div>
              )}
            </div>

            {/* Cart Line Items Table */}
            <div className="overflow-y-auto max-h-72 divide-y divide-slate-800 mt-2">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                  <ShoppingBag className="w-8 h-8 opacity-30" />
                  <p>{t.cartEmpty}</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {item.productName}
                      </p>
                      <p className="text-[11px] text-emerald-400 font-medium">
                        {formatCurrency(item.unitPrice, settings.currency)}
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-1.5 bg-slate-950 rounded-lg p-1 border border-slate-800">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-xs text-white px-1.5 font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Item Total & Delete */}
                    <div className="text-right min-w-[70px]">
                      <span className="font-black text-xs text-white font-mono">
                        {formatCurrency(item.lineTotal, settings.currency)}
                      </span>
                    </div>

                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cart Footer: Totals & Checkout Button */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>{t.cartSubtotal}:</span>
              <span className="font-mono">{formatCurrency(subtotal, settings.currency)}</span>
            </div>

            {/* Discount line */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-amber-400" />
                {t.discount}:
              </span>
              <div className="w-24">
                <input
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-2 py-1 rounded text-right font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* TVA Tax line */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{t.tax} (TVA):</span>
              <div className="flex items-center gap-2">
                <select
                  value={tvaRate}
                  onChange={(e) => setTvaRate(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-white px-2 py-0.5 rounded text-[11px] font-mono focus:outline-none focus:border-emerald-500"
                >
                  <option value="0">0%</option>
                  <option value="9">9%</option>
                  <option value="19">19%</option>
                </select>
                <span className="font-mono text-slate-300 w-16 text-right">
                  {formatCurrency(taxAmount, settings.currency)}
                </span>
              </div>
            </div>

            {/* Total Payable Box */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold">{t.cartTotal}</span>
                <p className="text-xl font-black text-emerald-400 font-mono">
                  {formatCurrency(totalPayable, settings.currency)}
                </p>
              </div>
              <button
                id="pos-checkout-btn"
                disabled={cart.length === 0}
                onClick={openCheckout}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg text-xs font-black tracking-wide shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>{t.checkout}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white pb-2 border-b border-slate-800">
              {t.checkout} — {formatCurrency(totalPayable, settings.currency)}
            </h3>

            {/* Mode of Payment Pills */}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2 px-1 rounded-lg text-xs font-bold text-center transition cursor-pointer border ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {t.cash}
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CREDIT')}
                className={`py-2 px-1 rounded-lg text-xs font-bold text-center transition cursor-pointer border ${
                  paymentMethod === 'CREDIT'
                    ? 'bg-amber-600 border-amber-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {t.credit}
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`py-2 px-1 rounded-lg text-xs font-bold text-center transition cursor-pointer border ${
                  paymentMethod === 'CARD'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {t.card}
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('SPLIT')}
                className={`py-2 px-1 rounded-lg text-xs font-bold text-center transition cursor-pointer border ${
                  paymentMethod === 'SPLIT'
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {t.split}
              </button>
            </div>

            {/* Cash details */}
            {paymentMethod !== 'CREDIT' && (
              <div className="space-y-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    {t.amountReceived}
                  </label>
                  <input
                    type="number"
                    value={amountReceived || ''}
                    onChange={(e) => setAmountReceived(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded text-base font-black font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {amountReceived >= totalPayable ? (
                  <div className="flex justify-between items-center text-xs text-emerald-400 font-semibold">
                    <span>{t.changeDue}:</span>
                    <span className="font-mono text-sm font-bold">
                      {formatCurrency(amountReceived - totalPayable, settings.currency)}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-xs text-rose-400 font-semibold">
                    <span>{t.balanceDue} (Dette):</span>
                    <span className="font-mono text-sm font-bold">
                      {formatCurrency(totalPayable - amountReceived, settings.currency)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Warning if credit selected without customer */}
            {(paymentMethod === 'CREDIT' || (paymentMethod === 'SPLIT' && amountReceived < totalPayable)) && !selectedCustomer && (
              <div className="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {settings.language === 'ar'
                    ? 'يرجى اختيار الزبون لتسجيل الدين في حسابه'
                    : 'Veuillez sélectionner un client pour imputer la dette.'}
                </span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                {t.cancel}
              </button>
              <button
                id="finalize-payment-btn"
                type="button"
                disabled={
                  (paymentMethod === 'CREDIT' || (paymentMethod === 'SPLIT' && amountReceived < totalPayable)) &&
                  !selectedCustomer
                }
                onClick={handleFinalizeSale}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                {t.checkout}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal (Android CameraX / ML Kit Emulation) */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={handleScanBarcode}
      />
    </div>
  );
};
