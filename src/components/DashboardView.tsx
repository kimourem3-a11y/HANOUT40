import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  ReceiptText,
  PlusCircle,
  ShoppingCart,
  Users,
  ArrowUpRight,
  Eye,
  TrendingDown,
  FileDown,
  PieChart,
} from 'lucide-react';
import { Customer, Expense, Income, Product, Sale, StoreSettings, Supplier } from '../types';
import { formatCurrency } from '../utils/formatters';
import { translations } from '../localization/translations';

interface DashboardViewProps {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  suppliers: Supplier[];
  incomes?: Income[];
  expenses?: Expense[];
  settings: StoreSettings;
  onNavigate: (module: any) => void;
  onViewSale: (sale: Sale) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  sales,
  customers,
  suppliers,
  incomes = [],
  expenses = [],
  settings,
  onNavigate,
  onViewSale,
}) => {
  const t = translations[settings.language];

  // Daily Sales & Profit Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(
    (s) => s.status === 'COMPLETED' && s.saleDate.startsWith(todayStr)
  );
  const totalSalesToday = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);

  // Profit calculation: sum of (unitPrice - purchasePrice) * qty - discount
  let grossProfitToday = 0;
  todaySales.forEach((s) => {
    let saleProfit = 0;
    s.items.forEach((item) => {
      saleProfit += (item.unitPrice - item.purchasePrice) * item.quantity;
    });
    grossProfitToday += Math.max(0, saleProfit - s.discount);
  });

  // Inventory valuation
  const totalStockValueCost = products.reduce(
    (sum, p) => sum + p.purchasePrice * p.stockQuantity,
    0
  );
  const totalStockValueSelling = products.reduce(
    (sum, p) => sum + p.sellingPrice * p.stockQuantity,
    0
  );

  // Debts
  const totalCustomerDebts = customers.reduce(
    (sum, c) => sum + (c.currentDebt || 0),
    0
  );
  const totalSupplierDebts = suppliers.reduce(
    (sum, s) => sum + (s.currentDebt || 0),
    0
  );

  // Low stock products
  const lowStockProducts = products.filter(
    (p) => p.stockQuantity <= p.minStock
  );

  // Incomes & Expenses Totals
  const totalIncomeAmount = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netEstimatedProfit = grossProfitToday + totalIncomeAmount - totalExpenseAmount;

  return (
    <div id="dashboard-view-container" className="space-y-6">
      {/* Top Welcome & Quick Actions banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>{t.dashboard} — {settings.storeName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.appSubtitle} • {new Date().toLocaleDateString(settings.language === 'ar' ? 'ar-DZ' : 'fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          <button
            id="dash-quick-sale-btn"
            onClick={() => onNavigate('pos')}
            className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{t.quickNewSale} (F1)</span>
          </button>
          <button
            id="dash-quick-product-btn"
            onClick={() => onNavigate('products')}
            className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>{t.quickNewProduct}</span>
          </button>
          <button
            id="dash-quick-export-btn"
            onClick={() => onNavigate('exportCenter')}
            className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>{t.exportCenter}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Daily Sales */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>{t.dailySales}</span>
            <div className="p-2 bg-emerald-950/60 text-emerald-400 rounded-lg border border-emerald-800/40">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">
              {formatCurrency(totalSalesToday, settings.currency)}
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{todaySales.length} {t.itemsCount} / {t.completed}</span>
          </div>
        </div>

        {/* Card 2: Estimated Daily Profit */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>{t.dailyProfit}</span>
            <div className="p-2 bg-indigo-950/60 text-indigo-400 rounded-lg border border-indigo-800/40">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-indigo-400">
              {formatCurrency(grossProfitToday, settings.currency)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            <span>
              {totalSalesToday > 0
                ? `${((grossProfitToday / totalSalesToday) * 100).toFixed(1)}% ${t.margin}`
                : '0% Marge'}
            </span>
          </div>
        </div>

        {/* Card 3: Inventory Valuation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>{t.stockValue}</span>
            <div className="p-2 bg-blue-950/60 text-blue-400 rounded-lg border border-blue-800/40">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">
              {formatCurrency(totalStockValueCost, settings.currency)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            <span>Vente: {formatCurrency(totalStockValueSelling, settings.currency)}</span>
          </div>
        </div>

        {/* Card 4: Customer Debts (Créances) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>{t.customerDebts}</span>
            <div className="p-2 bg-amber-950/60 text-amber-400 rounded-lg border border-amber-800/40">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-400">
              {formatCurrency(totalCustomerDebts, settings.currency)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            <span>Fournisseurs: {formatCurrency(totalSupplierDebts, settings.currency)}</span>
          </div>
        </div>
      </div>

      {/* Financial Health Summary (Income, Expenses & Net Operations) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 rounded-lg">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {settings.language === 'ar' ? 'النتائج المالية والتشغيلية' : 'Santé Financière & Trésorerie'}
            </h3>
            <p className="text-sm font-semibold text-white">
              {settings.language === 'ar' ? 'الأرباح التشغيلية الصافية التقديرية' : 'Bénéfice Net d\'Exploitation Estimé'} :{' '}
              <span className={netEstimatedProfit >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {formatCurrency(netEstimatedProfit, settings.currency)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => onNavigate('income')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{t.income}: {formatCurrency(totalIncomeAmount, settings.currency)}</span>
          </button>
          <button
            onClick={() => onNavigate('expenses')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{t.expenses}: {formatCurrency(totalExpenseAmount, settings.currency)}</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Low Stock Warning + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <h2>{t.lowStockAlerts}</h2>
            </div>
            <span className="bg-amber-500/20 text-amber-300 font-bold text-xs px-2 py-0.5 rounded-full border border-amber-500/30">
              {lowStockProducts.length}
            </span>
          </div>

          <div className="divide-y divide-slate-800/80 mt-2 overflow-y-auto max-h-80">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                {settings.language === 'ar'
                  ? 'جميع مستويات المخزون كافية ومستقرة'
                  : 'Tous les niveaux de stock sont suffisants.'}
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {settings.language === 'ar' && p.nameAr ? p.nameAr : p.name}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {p.barcode}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/80 text-rose-400 border border-rose-800/40">
                      {p.stockQuantity} {p.unit}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Min: {p.minStock}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="font-bold text-sm text-white flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-emerald-400" />
              <span>{t.recentSales}</span>
            </h2>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition cursor-pointer"
            >
              {t.sales} →
            </button>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-2.5 px-3 font-semibold">{t.invoiceNumber}</th>
                  <th className="py-2.5 px-3 font-semibold">{t.date}</th>
                  <th className="py-2.5 px-3 font-semibold">{t.customer}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{t.cartTotal}</th>
                  <th className="py-2.5 px-3 font-semibold text-center">{t.paymentMethod}</th>
                  <th className="py-2.5 px-3 font-semibold text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sales.slice(0, 5).map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-2.5 px-3 font-mono font-medium text-white">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {sale.saleDate}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-medium">
                      {sale.customerName || t.anonymousClient}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                      {formatCurrency(sale.totalAmount, settings.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-700">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onViewSale(sale)}
                        className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title={t.printReceipt}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
