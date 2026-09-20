import React, { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Calendar, Printer, Award, CreditCard, FileDown } from 'lucide-react';
import { Product, Sale, StoreSettings } from '../types';
import { formatCurrency } from '../utils/formatters';
import { translations } from '../localization/translations';
import { downloadOrSharePdf, generateSalesReportPdf } from '../utils/pdfGenerator';

interface ReportsViewProps {
  sales: Sale[];
  products: Product[];
  settings: StoreSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  sales,
  products,
  settings,
}) => {
  const t = translations[settings.language];
  const [period, setPeriod] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('ALL');

  // Filter sales based on period
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const filteredSales = sales.filter((s) => {
    if (s.status !== 'COMPLETED') return false;
    const saleDateOnly = s.saleDate.split(' ')[0];
    if (period === 'TODAY') {
      return saleDateOnly === todayStr;
    } else if (period === 'WEEK') {
      const pastWeek = new Date();
      pastWeek.setDate(pastWeek.getDate() - 7);
      return new Date(saleDateOnly) >= pastWeek;
    } else if (period === 'MONTH') {
      const pastMonth = new Date();
      pastMonth.setDate(pastMonth.getDate() - 30);
      return new Date(saleDateOnly) >= pastMonth;
    }
    return true;
  });

  // Calculate Aggregates
  let totalRevenue = 0;
  let totalCOGS = 0;
  let totalDiscounts = 0;
  let cashSales = 0;
  let creditSales = 0;
  let cardSales = 0;

  // Product sales counter map
  const productSalesMap: Record<number, { name: string; qty: number; total: number }> = {};

  filteredSales.forEach((sale) => {
    totalRevenue += sale.totalAmount;
    totalDiscounts += sale.discount;

    if (sale.paymentMethod === 'CASH') cashSales += sale.totalAmount;
    else if (sale.paymentMethod === 'CREDIT') creditSales += sale.totalAmount;
    else cardSales += sale.totalAmount;

    sale.items.forEach((item) => {
      totalCOGS += item.purchasePrice * item.quantity;
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: item.productName,
          qty: 0,
          total: 0,
        };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].total += item.lineTotal;
    });
  });

  const grossProfit = Math.max(0, totalRevenue - totalCOGS);
  const marginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Sort top products
  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div id="reports-view-container" className="space-y-5">
      {/* Header & Date Range Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-950/70 border border-indigo-800/40 rounded-lg text-indigo-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{t.reports} & Statistiques</h2>
            <p className="text-xs text-slate-400">
              Analyse financière & Clôture de Caisse
            </p>
          </div>
        </div>

        {/* Filter Pills and PDF Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setPeriod('TODAY')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                period === 'TODAY' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setPeriod('WEEK')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                period === 'WEEK' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              7 Derniers Jours
            </button>
            <button
              onClick={() => setPeriod('MONTH')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                period === 'MONTH' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ce Mois
            </button>
            <button
              onClick={() => setPeriod('ALL')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                period === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Global
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const doc = generateSalesReportPdf(filteredSales, settings, period);
              downloadOrSharePdf(doc, `Rapport_Ventes_${period}.pdf`, `Rapport Ventes ${period}`);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>{t.exportPdf}</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Chiffre d'Affaires Net
          </span>
          <p className="text-2xl font-black text-white mt-2 font-mono">
            {formatCurrency(totalRevenue, settings.currency)}
          </p>
          <p className="text-xs text-slate-400 mt-1">{filteredSales.length} ventes</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Coût Marchandises (COGS)
          </span>
          <p className="text-2xl font-black text-slate-300 mt-2 font-mono">
            {formatCurrency(totalCOGS, settings.currency)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Prix de revient</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Bénéfice Brut Réalisé
          </span>
          <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">
            {formatCurrency(grossProfit, settings.currency)}
          </p>
          <p className="text-xs text-emerald-400 mt-1 font-mono">
            {marginPercent.toFixed(1)}% de marge brute
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Remises Accordées
          </span>
          <p className="text-2xl font-black text-amber-400 mt-2 font-mono">
            {formatCurrency(totalDiscounts, settings.currency)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Rabais clients</p>
        </div>
      </div>

      {/* Two Column Section: Payment Breakdown & Top Selling Articles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Payment Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Répartition des Encaissements</span>
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Espèces (Caisse)</span>
                <span className="font-bold text-white font-mono">
                  {formatCurrency(cashSales, settings.currency)}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{
                    width: `${totalRevenue > 0 ? (cashSales / totalRevenue) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Crédit / Dette Accordée</span>
                <span className="font-bold text-amber-400 font-mono">
                  {formatCurrency(creditSales, settings.currency)}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{
                    width: `${totalRevenue > 0 ? (creditSales / totalRevenue) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Carte Bancaire</span>
                <span className="font-bold text-blue-400 font-mono">
                  {formatCurrency(cardSales, settings.currency)}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${totalRevenue > 0 ? (cardSales / totalRevenue) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Top Produits les Plus Vendus</span>
          </h3>

          <div className="divide-y divide-slate-800">
            {topProducts.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                Aucune vente enregistrée pour cette période.
              </p>
            ) : (
              topProducts.map((p, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-white">{p.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {p.qty} unités vendues
                      </p>
                    </div>
                  </div>
                  <span className="font-bold font-mono text-emerald-400 text-xs">
                    {formatCurrency(p.total, settings.currency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
