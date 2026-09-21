import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  FileText,
  FileDown,
  Share2,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Smartphone,
  Laptop,
  Check,
  RotateCcw,
  Sparkles,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import {
  CalendarDatePreset,
  CalendarFilterType,
  CalendarViewMode,
  CashSessionRegister,
  Customer,
  CustomerPayment,
  CustomerReturn,
  Expense,
  FinancialEvent,
  Income,
  LicenseInfo,
  Product,
  Purchase,
  Sale,
  StoreSettings,
  Supplier,
  SupplierPayment,
} from '../types';
import {
  calculateDailySummary,
  calculatePeriodSummary,
  compileFinancialEvents,
  exportToAndroidCalendar,
  formatISODate,
  generateFinancialCSV,
  parseDateOnly,
} from '../utils/financialCalculations';
import { formatCurrency } from '../utils/formatters';
import { SyncEngine, SyncConnectionStatus } from '../utils/syncEngine';

interface FinancialCalendarViewProps {
  sales: Sale[];
  purchases: Purchase[];
  incomes: Income[];
  expenses: Expense[];
  customers: Customer[];
  suppliers: Supplier[];
  products: Product[];
  settings: StoreSettings;
  licenseInfo: LicenseInfo;
  onViewSale?: (sale: Sale) => void;
  onRequirePro?: (featureName: string) => void;
}

export const FinancialCalendarView: React.FC<FinancialCalendarViewProps> = ({
  sales,
  purchases,
  incomes,
  expenses,
  customers,
  suppliers,
  products,
  settings,
  licenseInfo,
  onViewSale,
  onRequirePro,
}) => {
  // Stored customer payments & returns (persisted in localStorage)
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>(() => {
    const saved = localStorage.getItem('hanouti40_customer_payments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    // Extract initial payments from existing customers with payment activity
    return [];
  });

  const [supplierPayments] = useState<SupplierPayment[]>(() => {
    const saved = localStorage.getItem('hanouti40_supplier_payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [customerReturns, setCustomerReturns] = useState<CustomerReturn[]>(() => {
    const saved = localStorage.getItem('hanouti40_customer_returns');
    return saved ? JSON.parse(saved) : [];
  });

  // Cash Register Sessions (persisted in localStorage)
  const [cashSessions, setCashSessions] = useState<Record<string, CashSessionRegister>>(() => {
    const saved = localStorage.getItem('hanouti40_cash_sessions');
    return saved ? JSON.parse(saved) : {};
  });

  const saveCashSession = (date: string, opening: number, actual?: number, notes?: string) => {
    const updated = {
      ...cashSessions,
      [date]: { date, openingCash: opening, actualClosingCash: actual, notes },
    };
    setCashSessions(updated);
    localStorage.setItem('hanouti40_cash_sessions', JSON.stringify(updated));
  };

  // View Mode: DAY, WEEK, MONTH, YEAR (Default: MONTH)
  const [viewMode, setViewMode] = useState<CalendarViewMode>('MONTH');

  // Currently focused date
  const [selectedDate, setSelectedDate] = useState<string>(() => formatISODate(new Date()));

  // Active month reference (first day of month)
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Date Preset: TODAY, THIS_WEEK, THIS_MONTH, PREV_MONTH, THIS_YEAR, CUSTOM
  const [preset, setPreset] = useState<CalendarDatePreset>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState<string>(() => formatISODate(new Date()));
  const [customEndDate, setCustomEndDate] = useState<string>(() => formatISODate(new Date()));

  // Transaction list filters
  const [activeFilter, setActiveFilter] = useState<CalendarFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync state tracking
  const [syncStatus, setSyncStatus] = useState<SyncConnectionStatus>(SyncEngine.getCurrentStatus());
  const [lastSyncText, setLastSyncText] = useState<string>(SyncEngine.getLastSyncTime());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsub = SyncEngine.onStatusChange((s) => {
      setSyncStatus(s);
      setLastSyncText(SyncEngine.getLastSyncTime());
    });
    return () => unsub();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await SyncEngine.syncNow();
    setLastSyncText(SyncEngine.getLastSyncTime());
    setSyncStatus(SyncEngine.getCurrentStatus());
    setTimeout(() => setIsSyncing(false), 600);
  };

  // Date Range calculation based on presets or month
  const { dateRangeStart, dateRangeEnd } = useMemo(() => {
    const today = new Date();
    if (preset === 'TODAY') {
      const d = formatISODate(today);
      return { dateRangeStart: d, dateRangeEnd: d };
    }
    if (preset === 'THIS_WEEK') {
      const day = today.getDay(); // 0 is Sunday
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      const monday = new Date(today.getFullYear(), today.getMonth(), diff);
      const sunday = new Date(today.getFullYear(), today.getMonth(), diff + 6);
      return { dateRangeStart: formatISODate(monday), dateRangeEnd: formatISODate(sunday) };
    }
    if (preset === 'THIS_MONTH') {
      const y = currentMonthDate.getFullYear();
      const m = currentMonthDate.getMonth();
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      return { dateRangeStart: formatISODate(start), dateRangeEnd: formatISODate(end) };
    }
    if (preset === 'PREV_MONTH') {
      const y = currentMonthDate.getFullYear();
      const m = currentMonthDate.getMonth() - 1;
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      return { dateRangeStart: formatISODate(start), dateRangeEnd: formatISODate(end) };
    }
    if (preset === 'THIS_YEAR') {
      const y = currentMonthDate.getFullYear();
      return { dateRangeStart: `${y}-01-01`, dateRangeEnd: `${y}-12-31` };
    }
    return { dateRangeStart: customStartDate, dateRangeEnd: customEndDate };
  }, [preset, currentMonthDate, customStartDate, customEndDate]);

  // Period Financial Summary
  const periodSummary = useMemo(() => {
    return calculatePeriodSummary(
      dateRangeStart,
      dateRangeEnd,
      sales,
      purchases,
      incomes,
      expenses,
      customerPayments,
      supplierPayments,
      customerReturns
    );
  }, [
    dateRangeStart,
    dateRangeEnd,
    sales,
    purchases,
    incomes,
    expenses,
    customerPayments,
    supplierPayments,
    customerReturns,
  ]);

  // Selected Day Summary
  const daySummary = useMemo(() => {
    return calculateDailySummary(
      selectedDate,
      sales,
      purchases,
      incomes,
      expenses,
      customerPayments,
      supplierPayments,
      customerReturns
    );
  }, [
    selectedDate,
    sales,
    purchases,
    incomes,
    expenses,
    customerPayments,
    supplierPayments,
    customerReturns,
  ]);

  // All financial events compiled for current range
  const allRangeEvents = useMemo(() => {
    return compileFinancialEvents(
      dateRangeStart,
      dateRangeEnd,
      sales,
      purchases,
      incomes,
      expenses,
      customerPayments,
      supplierPayments,
      customerReturns
    );
  }, [
    dateRangeStart,
    dateRangeEnd,
    sales,
    purchases,
    incomes,
    expenses,
    customerPayments,
    supplierPayments,
    customerReturns,
  ]);

  // Selected Day Events
  const selectedDayEvents = useMemo(() => {
    return allRangeEvents.filter((e) => e.date === selectedDate);
  }, [allRangeEvents, selectedDate]);

  // Filtered Events for list
  const filteredEvents = useMemo(() => {
    let list = viewMode === 'DAY' ? selectedDayEvents : allRangeEvents;

    if (activeFilter !== 'ALL') {
      if (activeFilter === 'SALES' || activeFilter === 'INVOICES') {
        list = list.filter((e) => e.type === 'SALE');
      } else if (activeFilter === 'CUSTOMER_PAYMENTS') {
        list = list.filter((e) => e.type === 'CUSTOMER_PAYMENT');
      } else if (activeFilter === 'EXPENSES') {
        list = list.filter((e) => e.type === 'EXPENSE');
      } else if (activeFilter === 'INCOME') {
        list = list.filter((e) => e.type === 'INCOME');
      } else if (activeFilter === 'PURCHASES') {
        list = list.filter((e) => e.type === 'PURCHASE');
      } else if (activeFilter === 'SUPPLIER_PAYMENTS') {
        list = list.filter((e) => e.type === 'SUPPLIER_PAYMENT');
      } else if (activeFilter === 'REFUNDS') {
        list = list.filter((e) => e.type === 'RETURN');
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.partyName && e.partyName.toLowerCase().includes(q)) ||
          (e.reference && e.reference.toLowerCase().includes(q)) ||
          (e.category && e.category.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allRangeEvents, selectedDayEvents, viewMode, activeFilter, searchQuery]);

  // Month Grid Calculation
  const monthGridDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysCount = lastDay.getDate();
    // Monday as first day of week: 0=Mon, 6=Sun
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      summary: ReturnType<typeof calculateDailySummary>;
    }> = [];

    // Days from previous month for padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, dNum);
      const dStr = formatISODate(prevDate);
      days.push({
        dateStr: dStr,
        dayNumber: dNum,
        isCurrentMonth: false,
        summary: calculateDailySummary(
          dStr,
          sales,
          purchases,
          incomes,
          expenses,
          customerPayments,
          supplierPayments,
          customerReturns
        ),
      });
    }

    // Days of current month
    for (let d = 1; d <= daysCount; d++) {
      const curDate = new Date(year, month, d);
      const dStr = formatISODate(curDate);
      days.push({
        dateStr: dStr,
        dayNumber: d,
        isCurrentMonth: true,
        summary: calculateDailySummary(
          dStr,
          sales,
          purchases,
          incomes,
          expenses,
          customerPayments,
          supplierPayments,
          customerReturns
        ),
      });
    }

    // Days of next month for padding to 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dStr = formatISODate(nextDate);
      days.push({
        dateStr: dStr,
        dayNumber: d,
        isCurrentMonth: false,
        summary: calculateDailySummary(
          dStr,
          sales,
          purchases,
          incomes,
          expenses,
          customerPayments,
          supplierPayments,
          customerReturns
        ),
      });
    }

    return days;
  }, [
    currentMonthDate,
    sales,
    purchases,
    incomes,
    expenses,
    customerPayments,
    supplierPayments,
    customerReturns,
  ]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonthDate(
      new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(
      new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1)
    );
  };

  const handleGoToday = () => {
    const today = new Date();
    setCurrentMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(formatISODate(today));
    setPreset('TODAY');
    setViewMode('DAY');
  };

  // Cash Register State for selected day
  const currentCashSession = cashSessions[selectedDate] || {
    date: selectedDate,
    openingCash: 0,
  };
  const [tempOpeningCash, setTempOpeningCash] = useState<number>(currentCashSession.openingCash);
  const [tempActualCash, setTempActualCash] = useState<string>(
    currentCashSession.actualClosingCash !== undefined
      ? String(currentCashSession.actualClosingCash)
      : ''
  );

  useEffect(() => {
    const session = cashSessions[selectedDate] || { date: selectedDate, openingCash: 0 };
    setTempOpeningCash(session.openingCash);
    setTempActualCash(session.actualClosingCash !== undefined ? String(session.actualClosingCash) : '');
  }, [selectedDate, cashSessions]);

  // Theoretical Expected Closing Cash
  const theoreticalClosingCash =
    tempOpeningCash +
    daySummary.cashSales +
    daySummary.cashCustomerPayments +
    daySummary.otherCashIncome -
    daySummary.cashExpenses -
    daySummary.cashSupplierPayments;

  const actualClosingCashNumber = tempActualCash !== '' ? Number(tempActualCash) : undefined;
  const cashDifference =
    actualClosingCashNumber !== undefined
      ? actualClosingCashNumber - theoreticalClosingCash
      : 0;

  // Handle Export CSV
  const handleExportCSV = () => {
    const csv = generateFinancialCSV(allRangeEvents, periodSummary, settings.storeName);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hanouti40_Bilan_${dateRangeStart}_au_${dateRangeEnd}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle Export PDF
  const handleExportPDF = () => {
    if (licenseInfo.edition === 'FREE' && onRequirePro) {
      onRequirePro('Exportation PDF Complète & Certifiée');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport Financier - Hanouti 40</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; line-height: 1.4; }
          h1 { margin: 0; font-size: 20px; color: #0f172a; }
          .sub { color: #64748b; font-size: 12px; margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
          .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc; }
          .card-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
          .card-value { font-size: 18px; font-weight: bold; margin-top: 4px; }
          .profit { color: #10b981; }
          .expense { color: #f43f5e; }
          .net { color: #6366f1; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
          th { background: #f1f5f9; padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; }
          td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
          .right { text-align: right; }
          .footer { margin-top: 30px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <h1>${settings.storeName} — Bilan Financier Périodique</h1>
        <div class="sub">Période : du ${dateRangeStart} au ${dateRangeEnd} • Émis le ${new Date().toLocaleString('fr-FR')}</div>
        
        <div class="grid">
          <div class="card">
            <div class="card-title">Chiffre d'Affaires Brut</div>
            <div class="card-value">${periodSummary.grossSales.toLocaleString()} DZD</div>
            <small style="color:#64748b">Coût marchandises : ${periodSummary.costOfGoodsSold.toLocaleString()} DZD</small>
          </div>
          <div class="card">
            <div class="card-title">Marge Commerciale (Bénéfice Brut)</div>
            <div class="card-value profit">${periodSummary.grossProfit.toLocaleString()} DZD</div>
            <small style="color:#64748b">Ventes - CAMV</small>
          </div>
          <div class="card">
            <div class="card-title">Bénéfice Net d'Exploitation</div>
            <div class="card-value net">${periodSummary.netProfit.toLocaleString()} DZD</div>
            <small style="color:#64748b">Marge + Produits - Charges</small>
          </div>
          <div class="card">
            <div class="card-title">Charges d'Exploitation</div>
            <div class="card-value expense">${periodSummary.operatingExpenses.toLocaleString()} DZD</div>
          </div>
          <div class="card">
            <div class="card-title">Encaissements Réels</div>
            <div class="card-value">${periodSummary.totalReceived.toLocaleString()} DZD</div>
          </div>
          <div class="card">
            <div class="card-title">Flux de Caisse Net</div>
            <div class="card-value ${periodSummary.netCashFlow >= 0 ? 'profit' : 'expense'}">${periodSummary.netCashFlow.toLocaleString()} DZD</div>
          </div>
        </div>

        <h3>Détail des Opérations (${filteredEvents.length} enregistrements)</h3>
        <table>
          <thead>
            <tr>
              <th>Date & Heure</th>
              <th>Type</th>
              <th>Référence / Libellé</th>
              <th>Tiers</th>
              <th>Mode</th>
              <th class="right">Montant (DZD)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredEvents
              .map(
                (e) => `
              <tr>
                <td>${e.date} ${e.time}</td>
                <td>${e.type}</td>
                <td><strong>${e.title}</strong></td>
                <td>${e.partyName || '-'}</td>
                <td>${e.paymentMethod}</td>
                <td class="right font-bold">${e.amount.toLocaleString()} DZD</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="footer">
          Hanouti 40 Pro • Système Financier Algérien Conforme • Certification Logiciel de Caisse
        </div>
        <script>
          window.print();
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Sync status badge helper
  const renderSyncBadge = () => {
    switch (syncStatus) {
      case 'SYNCED':
        return (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>🟢 Synchronisé avec PC & Android</span>
          </div>
        );
      case 'SYNCING':
        return (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold bg-amber-950/60 border border-amber-800/40 px-3 py-1 rounded-full">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>🟡 Synchronisation en cours...</span>
          </div>
        );
      case 'OFFLINE':
        return (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold bg-rose-950/60 border border-rose-800/40 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>🔴 Mode Hors-ligne (Modifications locales)</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-xs text-orange-400 font-semibold bg-orange-950/60 border border-orange-800/40 px-3 py-1 rounded-full">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>🟠 En attente de reconnexion</span>
          </div>
        );
    }
  };

  return (
    <div id="financial-calendar-view" className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner: Module Header, Sync Status & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950/70 border border-emerald-800/50 rounded-xl text-emerald-400 shadow-xs">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Calendrier Financier & Caisse
                </h1>
                <span className="bg-indigo-950 text-indigo-400 border border-indigo-800/50 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full font-mono">
                  Temps Réel
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Calcul exact du Chiffre d'Affaires, Bénéfice Brut, Bénéfice Net et Réconciliation de Caisse.
              </p>
            </div>
          </div>
        </div>

        {/* Real-Time Sync Status Bar */}
        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
          {renderSyncBadge()}

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-50"
            title="Forcer la synchronisation immédiate"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={() => exportToAndroidCalendar(selectedDate, daySummary, settings.storeName)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            title="Exporter l'événement vers le calendrier Android (.ics)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Calendrier Android</span>
          </button>
        </div>
      </div>

      {/* Main KPI Summary Panel for the active period */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Gross Sales */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Ventes Brutes
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-black text-white font-mono">
              {formatCurrency(periodSummary.grossSales, settings.currency)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {periodSummary.salesCount} ventes / factures
          </span>
        </div>

        {/* 2. Cost of Goods Sold (COGS) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Coût Marchandises
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-black text-slate-300 font-mono">
              {formatCurrency(periodSummary.costOfGoodsSold, settings.currency)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            CAMV (Prix d'achat réel)
          </span>
        </div>

        {/* 3. Gross Profit (Marge) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xs bg-emerald-950/20 border-emerald-800/30">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
            Bénéfice Brut
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
              {formatCurrency(periodSummary.grossProfit, settings.currency)}
            </span>
          </div>
          <span className="text-[10px] text-emerald-500/80 mt-1 block">
            Ventes - Coût d'achat
          </span>
        </div>

        {/* 4. Operating Expenses */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
            Dépenses Exploitation
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-black text-rose-400 font-mono">
              {formatCurrency(periodSummary.operatingExpenses, settings.currency)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {periodSummary.expensesCount} charges enregistrées
          </span>
        </div>

        {/* 5. Net Profit (Real Profit) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xs bg-indigo-950/30 border-indigo-800/40">
          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
            Bénéfice Net Réel
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-black text-indigo-300 font-mono">
              {formatCurrency(periodSummary.netProfit, settings.currency)}
            </span>
          </div>
          <span className="text-[10px] text-indigo-400/80 mt-1 block">
            Bénéfice net certifié
          </span>
        </div>

        {/* 6. Net Cash Flow */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Flux de Caisse Net
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-base sm:text-lg font-black font-mono ${
                periodSummary.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(periodSummary.netCashFlow, settings.currency)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Encaissé - Décaissé
          </span>
        </div>
      </div>

      {/* View Mode & Preset Selector Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Preset filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-thin">
          <button
            onClick={() => setPreset('TODAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              preset === 'TODAY'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setPreset('THIS_WEEK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              preset === 'THIS_WEEK'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Cette semaine
          </button>
          <button
            onClick={() => setPreset('THIS_MONTH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              preset === 'THIS_MONTH'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Ce mois
          </button>
          <button
            onClick={() => setPreset('PREV_MONTH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              preset === 'PREV_MONTH'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Mois précédent
          </button>
          <button
            onClick={() => setPreset('THIS_YEAR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              preset === 'THIS_YEAR'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Cette année
          </button>
          <button
            onClick={() => setPreset('CUSTOM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              preset === 'CUSTOM'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Personnalisé
          </button>
        </div>

        {/* Custom Date Inputs if preset is CUSTOM */}
        {preset === 'CUSTOM' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white text-xs px-2.5 py-1.5 rounded-lg font-mono focus:outline-none focus:border-emerald-500"
            />
            <span className="text-slate-500 text-xs">à</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white text-xs px-2.5 py-1.5 rounded-lg font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {/* View Mode Tabs (JOUR / SEMAINE / MOIS / ANNÉE) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 w-full md:w-auto justify-center">
          <button
            onClick={() => setViewMode('DAY')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
              viewMode === 'DAY'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Jour
          </button>
          <button
            onClick={() => setViewMode('WEEK')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
              viewMode === 'WEEK'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => setViewMode('MONTH')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
              viewMode === 'MONTH'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mois
          </button>
          <button
            onClick={() => setViewMode('YEAR')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
              viewMode === 'YEAR'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Année
          </button>
        </div>
      </div>

      {/* Month Navigator Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Mois précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
            {currentMonthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase()}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Mois suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGoToday}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Aujourd'hui</span>
          </button>
        </div>
      </div>

      {/* MAIN VIEW CONTENT */}
      {viewMode === 'MONTH' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm overflow-hidden">
          {/* Days of week headers */}
          <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
              <div key={d} className="py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Month grid cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {monthGridDays.map((cell) => {
              const isSelected = cell.dateStr === selectedDate;
              const isToday = cell.dateStr === formatISODate(new Date());
              const hasActivity =
                cell.summary.grossSales > 0 ||
                cell.summary.operatingExpenses > 0 ||
                cell.summary.paymentsCount > 0;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => {
                    setSelectedDate(cell.dateStr);
                  }}
                  className={`min-h-[92px] sm:min-h-[110px] p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition select-none relative ${
                    cell.isCurrentMonth
                      ? isSelected
                        ? 'bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                        : 'bg-slate-950/70 hover:bg-slate-800/80 border-slate-800'
                      : 'bg-slate-950/30 border-slate-900 opacity-40 hover:opacity-75'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-emerald-500 text-slate-950 shadow-xs'
                          : isSelected
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {cell.summary.invoicesCount > 0 && (
                      <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-1.5 py-0.2 rounded-md">
                        {cell.summary.invoicesCount} fac
                      </span>
                    )}
                  </div>

                  {/* Day Financial Metrics */}
                  <div className="space-y-0.5 mt-1">
                    {cell.summary.grossSales > 0 ? (
                      <div className="text-[10px] font-mono font-bold text-emerald-400 truncate">
                        +{Math.round(cell.summary.grossSales).toLocaleString()}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-700 font-mono">-</div>
                    )}

                    {cell.summary.operatingExpenses > 0 && (
                      <div className="text-[10px] font-mono font-bold text-rose-400 truncate">
                        -{Math.round(cell.summary.operatingExpenses).toLocaleString()}
                      </div>
                    )}

                    {cell.summary.grossSales > 0 && (
                      <div
                        className={`text-[10px] font-mono font-semibold truncate ${
                          cell.summary.netProfit >= 0 ? 'text-indigo-300' : 'text-rose-300'
                        }`}
                      >
                        Net: {Math.round(cell.summary.netProfit).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY DETAIL & CASH RECONCILIATION DRAWER / SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">
                Détail Journalier & Caisse — {selectedDate}
              </h3>
              {selectedDate === formatISODate(new Date()) && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  Aujourd'hui
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Journal des encaissements, factures, décaissements et réconciliation physique.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToAndroidCalendar(selectedDate, daySummary, settings.storeName)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sync Calendrier Mobile</span>
            </button>
          </div>
        </div>

        {/* Selected Day Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-bold uppercase block">
              Ventes Jour
            </span>
            <span className="text-base font-black text-white font-mono mt-1 block">
              {formatCurrency(daySummary.grossSales, settings.currency)}
            </span>
            <span className="text-[10px] text-slate-500">
              Coût: {formatCurrency(daySummary.costOfGoodsSold, settings.currency)}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-emerald-400 font-bold uppercase block">
              Marge Brute Jour
            </span>
            <span className="text-base font-black text-emerald-400 font-mono mt-1 block">
              {formatCurrency(daySummary.grossProfit, settings.currency)}
            </span>
            <span className="text-[10px] text-emerald-500/80">
              Ventes - CAMV
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-rose-400 font-bold uppercase block">
              Dépenses Jour
            </span>
            <span className="text-base font-black text-rose-400 font-mono mt-1 block">
              {formatCurrency(daySummary.operatingExpenses, settings.currency)}
            </span>
            <span className="text-[10px] text-slate-500">
              {daySummary.expensesCount} enregistrements
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-indigo-400 font-bold uppercase block">
              Bénéfice Net Jour
            </span>
            <span className="text-base font-black text-indigo-400 font-mono mt-1 block">
              {formatCurrency(daySummary.netProfit, settings.currency)}
            </span>
            <span className="text-[10px] text-slate-500">
              Marge - Dépenses
            </span>
          </div>
        </div>

        {/* Cash Register Reconciliation (Caisse Journalière) */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>Réconciliation de Caisse (Contrôle Physique Espèces)</span>
            </h4>
            <span className="text-xs text-slate-500 font-mono">
              Date : {selectedDate}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {/* Opening Cash Input */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold block">
                Fond de Caisse Initial ({settings.currency})
              </label>
              <input
                type="number"
                value={tempOpeningCash}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTempOpeningCash(val);
                  saveCashSession(
                    selectedDate,
                    val,
                    actualClosingCashNumber,
                    currentCashSession.notes
                  );
                }}
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono px-3 py-2 rounded-lg font-bold focus:outline-none focus:border-emerald-500"
                placeholder="0"
              />
            </div>

            {/* Expected Closing Cash (Theoretical) */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold block">
                Total Théorique Caisse ({settings.currency})
              </label>
              <div className="bg-slate-900 border border-slate-800 text-white font-mono px-3 py-2 rounded-lg font-bold text-sm">
                {formatCurrency(theoreticalClosingCash, settings.currency)}
              </div>
            </div>

            {/* Actual Closing Cash Counted */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold block">
                Espèces Comptées Physiquement ({settings.currency})
              </label>
              <input
                type="number"
                value={tempActualCash}
                onChange={(e) => {
                  const val = e.target.value;
                  setTempActualCash(val);
                  saveCashSession(
                    selectedDate,
                    tempOpeningCash,
                    val !== '' ? Number(val) : undefined,
                    currentCashSession.notes
                  );
                }}
                className="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-mono px-3 py-2 rounded-lg font-bold text-sm focus:outline-none focus:border-emerald-500"
                placeholder="Saisir montant compté..."
              />
            </div>

            {/* Cash Difference */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold block">
                Écart de Caisse
              </label>
              <div
                className={`border font-mono px-3 py-2 rounded-lg font-bold text-sm flex items-center justify-between ${
                  actualClosingCashNumber === undefined
                    ? 'bg-slate-900 border-slate-800 text-slate-500'
                    : cashDifference === 0
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                    : cashDifference > 0
                    ? 'bg-blue-950/40 border-blue-800 text-blue-400'
                    : 'bg-rose-950/40 border-rose-800 text-rose-400'
                }`}
              >
                <span>
                  {actualClosingCashNumber !== undefined
                    ? `${cashDifference > 0 ? '+' : ''}${formatCurrency(
                        cashDifference,
                        settings.currency
                      )}`
                    : 'Non compté'}
                </span>
                {actualClosingCashNumber !== undefined && (
                  <span className="text-[10px] font-sans uppercase">
                    {cashDifference === 0 ? 'Conforme' : cashDifference > 0 ? 'Surplus' : 'Manquant'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Filtering and Search */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-thin">
              {[
                { id: 'ALL', label: 'Tous' },
                { id: 'SALES', label: 'Ventes' },
                { id: 'CUSTOMER_PAYMENTS', label: 'Versements' },
                { id: 'EXPENSES', label: 'Dépenses' },
                { id: 'INCOME', label: 'Entrées' },
                { id: 'PURCHASES', label: 'Achats' },
                { id: 'REFUNDS', label: 'Retours' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id as CalendarFilterType)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeFilter === f.id
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Recherche opération, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Transaction List */}
          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Aucune transaction financière trouvée pour cette période.
              </div>
            ) : (
              filteredEvents.slice(0, 50).map((event) => (
                <div
                  key={event.id}
                  className="p-3 hover:bg-slate-900/60 transition flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-400 w-12 text-right">
                      {event.time}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        event.type === 'SALE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                          : event.type === 'CUSTOMER_PAYMENT'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800/40'
                          : event.type === 'EXPENSE'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                          : event.type === 'INCOME'
                          ? 'bg-teal-950 text-teal-400 border border-teal-800/40'
                          : event.type === 'PURCHASE'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                          : 'bg-purple-950 text-purple-400 border border-purple-800/40'
                      }`}
                    >
                      {event.type === 'SALE'
                        ? 'Vente'
                        : event.type === 'CUSTOMER_PAYMENT'
                        ? 'Versement'
                        : event.type === 'EXPENSE'
                        ? 'Dépense'
                        : event.type === 'INCOME'
                        ? 'Entrée'
                        : event.type === 'PURCHASE'
                        ? 'Achat'
                        : 'Retour'}
                    </span>

                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>{event.title}</span>
                        {event.partyName && (
                          <span className="text-slate-400 font-normal">
                            • {event.partyName}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>Date : {event.date}</span>
                        <span>Mode : {event.paymentMethod}</span>
                        {event.profitContribution !== undefined && (
                          <span className="text-indigo-400">
                            Marge: {formatCurrency(event.profitContribution, settings.currency)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-bold font-mono ${
                        event.type === 'SALE' || event.type === 'CUSTOMER_PAYMENT' || event.type === 'INCOME'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {event.type === 'SALE' || event.type === 'CUSTOMER_PAYMENT' || event.type === 'INCOME'
                        ? '+'
                        : '-'}
                      {formatCurrency(event.amount, settings.currency)}
                    </span>

                    {event.type === 'SALE' && onViewSale && event.rawEntity && (
                      <button
                        onClick={() => onViewSale(event.rawEntity)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Voir ticket / facture"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
