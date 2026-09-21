import {
  Customer,
  CustomerPayment,
  CustomerReturn,
  DailyFinancialSummary,
  Expense,
  FinancialEvent,
  Income,
  PeriodFinancialSummary,
  Purchase,
  Sale,
  Supplier,
  SupplierPayment,
} from '../types';

/**
 * HANOUTI 40 — FINANCIAL ENGINE
 * 
 * Strict Algerian Accounting Compliance:
 * 1. Gross Profit = Gross Sales (Total Ventes HT/TTC) - Cost of Goods Sold (Coût d'Achat des Marchandises Vendues - CAMV)
 * 2. Net Profit = Gross Profit + Other Operational Income (Revenus Annexes) - Operating Expenses (Charges d'Exploitation)
 * 3. Never confuse Profit with Cash Flow!
 * 4. Net Cash Flow = Total Inflows (Cash Sales + Debt Payments + Cash Income) - Total Outflows (Cash Expenses + Cash Purchases + Supplier Payments)
 */

export function parseDateOnly(dateStr?: string): string {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
}

export function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Calculate COGS for a specific sale
 */
export function calculateSaleCOGS(sale: Sale): number {
  if (sale.status === 'CANCELLED') return 0;
  return (sale.items || []).reduce((sum, item) => {
    const cost = item.purchasePrice || 0;
    return sum + cost * (item.quantity || 0);
  }, 0);
}

/**
 * Calculate Gross Profit for a specific sale
 */
export function calculateSaleGrossProfit(sale: Sale): number {
  if (sale.status === 'CANCELLED') return 0;
  const cogs = calculateSaleCOGS(sale);
  // Total after discount
  return Math.max(0, sale.totalAmount - cogs);
}

/**
 * Compile all financial events for a specific date range
 */
export function compileFinancialEvents(
  startDateStr: string,
  endDateStr: string,
  sales: Sale[],
  purchases: Purchase[],
  incomes: Income[],
  expenses: Expense[],
  customerPayments: CustomerPayment[],
  supplierPayments: SupplierPayment[],
  returns: CustomerReturn[]
): FinancialEvent[] {
  const events: FinancialEvent[] = [];

  // 1. Sales
  sales.forEach((s) => {
    const d = parseDateOnly(s.saleDate);
    if (d >= startDateStr && d <= endDateStr) {
      const time = s.saleDate.includes('T')
        ? s.saleDate.split('T')[1]?.slice(0, 5) || '12:00'
        : '12:00';
      events.push({
        id: `sale-${s.id}`,
        date: d,
        time,
        type: 'SALE',
        title: `Vente #${s.invoiceNumber || s.id}`,
        amount: s.totalAmount,
        paymentMethod: s.paymentMethod,
        reference: s.invoiceNumber,
        partyName: s.customerName || 'Client Comptoir',
        profitContribution: calculateSaleGrossProfit(s),
        rawEntity: s,
      });
    }
  });

  // 2. Customer Payments
  customerPayments.forEach((p) => {
    const d = parseDateOnly(p.paymentDate);
    if (d >= startDateStr && d <= endDateStr) {
      const time = p.paymentDate.includes('T')
        ? p.paymentDate.split('T')[1]?.slice(0, 5) || '12:00'
        : '12:00';
      events.push({
        id: `cust-pay-${p.id}`,
        date: d,
        time,
        type: 'CUSTOMER_PAYMENT',
        title: `Versement dette client #${p.id}`,
        amount: p.amount,
        paymentMethod: p.paymentMethod || 'CASH',
        partyName: p.customerName || 'Client',
        reference: p.notes,
        rawEntity: p,
      });
    }
  });

  // 3. Supplier Payments
  supplierPayments.forEach((p) => {
    const d = parseDateOnly(p.paymentDate);
    if (d >= startDateStr && d <= endDateStr) {
      const time = p.paymentDate.includes('T')
        ? p.paymentDate.split('T')[1]?.slice(0, 5) || '12:00'
        : '12:00';
      events.push({
        id: `supp-pay-${p.id}`,
        date: d,
        time,
        type: 'SUPPLIER_PAYMENT',
        title: `Paiement fournisseur #${p.id}`,
        amount: p.amount,
        paymentMethod: 'CASH',
        partyName: p.supplierName || 'Fournisseur',
        reference: p.notes,
        rawEntity: p,
      });
    }
  });

  // 4. Purchases
  purchases.forEach((pur) => {
    const d = parseDateOnly(pur.purchaseDate);
    if (d >= startDateStr && d <= endDateStr) {
      const time = pur.purchaseDate.includes('T')
        ? pur.purchaseDate.split('T')[1]?.slice(0, 5) || '12:00'
        : '12:00';
      events.push({
        id: `purchase-${pur.id}`,
        date: d,
        time,
        type: 'PURCHASE',
        title: `Achat #${pur.billNumber || pur.id}`,
        amount: pur.totalAmount,
        paymentMethod: pur.debtAmount > 0 ? 'CREDIT' : 'CASH',
        reference: pur.billNumber,
        partyName: pur.supplierName || 'Fournisseur',
        rawEntity: pur,
      });
    }
  });

  // 5. Operating Expenses
  expenses.forEach((e) => {
    const d = parseDateOnly(e.date);
    if (d >= startDateStr && d <= endDateStr) {
      const time = e.date.includes('T')
        ? e.date.split('T')[1]?.slice(0, 5) || '12:00'
        : '12:00';
      events.push({
        id: `expense-${e.id}`,
        date: d,
        time,
        type: 'EXPENSE',
        title: e.description || `Dépense [${e.category}]`,
        amount: e.amount,
        paymentMethod: e.paymentMethod || 'CASH',
        category: String(e.category),
        partyName: e.supplierName,
        reference: e.reference,
        rawEntity: e,
      });
    }
  });

  // 6. Other Income
  incomes.forEach((i) => {
    const d = parseDateOnly(i.date);
    if (d >= startDateStr && d <= endDateStr) {
      const time = i.date.includes('T')
        ? i.date.split('T')[1]?.slice(0, 5) || '12:00'
        : '12:00';
      events.push({
        id: `income-${i.id}`,
        date: d,
        time,
        type: 'INCOME',
        title: i.description || `Entrée [${i.category}]`,
        amount: i.amount,
        paymentMethod: i.paymentMethod || 'CASH',
        category: String(i.category),
        partyName: i.customerName,
        reference: i.reference,
        rawEntity: i,
      });
    }
  });

  // 7. Returns / Refunds
  returns.forEach((r) => {
    const d = parseDateOnly(r.date);
    if (d >= startDateStr && d <= endDateStr) {
      const time = r.date.includes('T')
        ? r.date.split('T')[1]?.slice(0, 5) || '12:00'
        : '12:00';
      events.push({
        id: `return-${r.id}`,
        date: d,
        time,
        type: 'RETURN',
        title: `Retour Marchandise #${r.invoiceNumber || r.id}`,
        amount: r.amount,
        paymentMethod: r.refundMethod === 'CASH' ? 'CASH' : 'CREDIT_REDUCTION',
        partyName: r.customerName,
        reference: r.reason,
        rawEntity: r,
      });
    }
  });

  // Sort descending by date, then time
  return events.sort((a, b) => {
    const cmp = b.date.localeCompare(a.date);
    if (cmp !== 0) return cmp;
    return (b.time || '').localeCompare(a.time || '');
  });
}

/**
 * Calculate Daily Financial Summary for a single date
 */
export function calculateDailySummary(
  dateStr: string,
  sales: Sale[],
  purchases: Purchase[],
  incomes: Income[],
  expenses: Expense[],
  customerPayments: CustomerPayment[],
  supplierPayments: SupplierPayment[],
  returns: CustomerReturn[]
): DailyFinancialSummary {
  const daySales = sales.filter((s) => s.status === 'COMPLETED' && parseDateOnly(s.saleDate) === dateStr);
  const dayPurchases = purchases.filter((p) => parseDateOnly(p.purchaseDate) === dateStr);
  const dayIncomes = incomes.filter((i) => parseDateOnly(i.date) === dateStr);
  const dayExpenses = expenses.filter((e) => parseDateOnly(e.date) === dateStr);
  const dayCustPayments = customerPayments.filter((p) => parseDateOnly(p.paymentDate) === dateStr);
  const daySuppPayments = supplierPayments.filter((p) => parseDateOnly(p.paymentDate) === dateStr);
  const dayReturns = returns.filter((r) => parseDateOnly(r.date) === dateStr);

  // 1. Sales & COGS
  let grossSales = 0;
  let costOfGoodsSold = 0;
  let cashSales = 0;

  daySales.forEach((s) => {
    grossSales += s.totalAmount;
    costOfGoodsSold += calculateSaleCOGS(s);
    if (s.paymentMethod === 'CASH') {
      cashSales += s.amountPaid;
    } else if (s.paymentMethod === 'SPLIT') {
      cashSales += Math.max(0, s.amountPaid);
    }
  });

  // Gross profit = Gross Sales - COGS
  const grossProfit = Math.max(0, grossSales - costOfGoodsSold);

  // 2. Customer Payments
  let cashCustomerPayments = 0;
  dayCustPayments.forEach((p) => {
    if (!p.paymentMethod || p.paymentMethod === 'CASH') {
      cashCustomerPayments += p.amount;
    }
  });

  // 3. Other Incomes (Exclude sales categories to prevent double counting)
  let otherIncome = 0;
  let otherCashIncome = 0;
  dayIncomes.forEach((i) => {
    if (i.category !== 'SALES' && i.category !== 'CUSTOMER_PAYMENT') {
      otherIncome += i.amount;
      if (i.paymentMethod === 'CASH') {
        otherCashIncome += i.amount;
      }
    }
  });

  // 4. Operating Expenses
  let operatingExpenses = 0;
  let cashExpenses = 0;
  dayExpenses.forEach((e) => {
    operatingExpenses += e.amount;
    if (e.paymentMethod === 'CASH') {
      cashExpenses += e.amount;
    }
  });

  // 5. Supplier Payments
  let cashSupplierPayments = 0;
  daySuppPayments.forEach((p) => {
    cashSupplierPayments += p.amount;
  });

  // 6. Cash Purchases (Immediate cash payment on purchase)
  dayPurchases.forEach((p) => {
    if (p.amountPaid > 0) {
      cashSupplierPayments += p.amountPaid;
    }
  });

  // 7. Net Profit = Gross Profit + Other Income - Operating Expenses
  const netProfit = grossProfit + otherIncome - operatingExpenses;

  // 8. Cash Flow Calculation
  const totalCashInflow = cashSales + cashCustomerPayments + otherCashIncome;
  const totalCashOutflow = cashExpenses + cashSupplierPayments;
  const netCashFlow = totalCashInflow - totalCashOutflow;

  return {
    date: dateStr,
    grossSales,
    costOfGoodsSold,
    grossProfit,
    operatingExpenses,
    otherIncome,
    netProfit,
    cashSales,
    cashCustomerPayments,
    otherCashIncome,
    cashExpenses,
    cashSupplierPayments,
    netCashFlow,
    invoicesCount: daySales.length,
    paymentsCount: dayCustPayments.length,
    expensesCount: dayExpenses.length,
    purchasesCount: dayPurchases.length,
    refundsCount: dayReturns.length,
  };
}

/**
 * Calculate Period Financial Summary across a date range
 */
export function calculatePeriodSummary(
  startDateStr: string,
  endDateStr: string,
  sales: Sale[],
  purchases: Purchase[],
  incomes: Income[],
  expenses: Expense[],
  customerPayments: CustomerPayment[],
  supplierPayments: SupplierPayment[],
  returns: CustomerReturn[]
): PeriodFinancialSummary {
  const filteredSales = sales.filter((s) => {
    const d = parseDateOnly(s.saleDate);
    return s.status === 'COMPLETED' && d >= startDateStr && d <= endDateStr;
  });

  const filteredPurchases = purchases.filter((p) => {
    const d = parseDateOnly(p.purchaseDate);
    return d >= startDateStr && d <= endDateStr;
  });

  const filteredIncomes = incomes.filter((i) => {
    const d = parseDateOnly(i.date);
    return d >= startDateStr && d <= endDateStr;
  });

  const filteredExpenses = expenses.filter((e) => {
    const d = parseDateOnly(e.date);
    return d >= startDateStr && d <= endDateStr;
  });

  const filteredCustPayments = customerPayments.filter((p) => {
    const d = parseDateOnly(p.paymentDate);
    return d >= startDateStr && d <= endDateStr;
  });

  const filteredSuppPayments = supplierPayments.filter((p) => {
    const d = parseDateOnly(p.paymentDate);
    return d >= startDateStr && d <= endDateStr;
  });

  const filteredReturns = returns.filter((r) => {
    const d = parseDateOnly(r.date);
    return d >= startDateStr && d <= endDateStr;
  });

  let grossSales = 0;
  let costOfGoodsSold = 0;
  let totalReceived = 0;

  filteredSales.forEach((s) => {
    grossSales += s.totalAmount;
    costOfGoodsSold += calculateSaleCOGS(s);
    totalReceived += s.amountPaid;
  });

  filteredCustPayments.forEach((p) => {
    totalReceived += p.amount;
  });

  let otherIncome = 0;
  filteredIncomes.forEach((i) => {
    if (i.category !== 'SALES' && i.category !== 'CUSTOMER_PAYMENT') {
      otherIncome += i.amount;
      totalReceived += i.amount;
    }
  });

  let operatingExpenses = 0;
  let totalCashOutflow = 0;
  filteredExpenses.forEach((e) => {
    operatingExpenses += e.amount;
    totalCashOutflow += e.amount;
  });

  filteredPurchases.forEach((p) => {
    totalCashOutflow += p.amountPaid;
  });

  filteredSuppPayments.forEach((p) => {
    totalCashOutflow += p.amount;
  });

  const grossProfit = Math.max(0, grossSales - costOfGoodsSold);
  const netProfit = grossProfit + otherIncome - operatingExpenses;
  const netCashFlow = totalReceived - totalCashOutflow;

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    grossSales,
    costOfGoodsSold,
    grossProfit,
    operatingExpenses,
    otherIncome,
    netProfit,
    totalReceived,
    totalCashOutflow,
    netCashFlow,
    salesCount: filteredSales.length,
    invoicesCount: filteredSales.length,
    expensesCount: filteredExpenses.length,
    purchasesCount: filteredPurchases.length,
    paymentsCount: filteredCustPayments.length,
    returnsCount: filteredReturns.length,
  };
}

/**
 * Dynamically recompute client debt from actual transaction history
 * Initial Balance + Total Credit Invoices - Total Payments - Total Returns
 */
export function calculateClientRealDebt(
  customer: Customer,
  sales: Sale[],
  customerPayments: CustomerPayment[],
  returns: CustomerReturn[]
): {
  realDebt: number;
  totalInvoicesAmount: number;
  totalPaid: number;
  totalReturns: number;
  invoicesCount: number;
  paymentsCount: number;
  returnsCount: number;
} {
  const initial = customer.initialBalance || 0;
  const custSales = sales.filter((s) => s.customerId === customer.id && s.status === 'COMPLETED');
  const custPayments = customerPayments.filter((p) => p.customerId === customer.id);
  const custReturns = returns.filter((r) => r.customerId === customer.id);

  let totalInvoicesAmount = 0;
  let creditPortionOfInvoices = 0;
  let totalPaidOnInvoices = 0;

  custSales.forEach((s) => {
    totalInvoicesAmount += s.totalAmount;
    totalPaidOnInvoices += s.amountPaid;
    creditPortionOfInvoices += s.debtAmount || Math.max(0, s.totalAmount - s.amountPaid);
  });

  const totalPaymentsReceived = custPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalReturnsAmount = custReturns.reduce((sum, r) => sum + r.amount, 0);

  // Total debt = Initial debt + unpaid parts of sales - direct debt payments - returns
  const realDebt = Math.max(0, initial + creditPortionOfInvoices - totalPaymentsReceived - totalReturnsAmount);

  return {
    realDebt,
    totalInvoicesAmount,
    totalPaid: totalPaidOnInvoices + totalPaymentsReceived,
    totalReturns: totalReturnsAmount,
    invoicesCount: custSales.length,
    paymentsCount: custPayments.length,
    returnsCount: custReturns.length,
  };
}

/**
 * Android Calendar Integration
 * Generates an iCalendar (.ics) file or calendar intent URL
 */
export function exportToAndroidCalendar(
  dateStr: string,
  summary: DailyFinancialSummary,
  storeName: string
): void {
  const title = `Bilan Hanouti 40 (${storeName}) - ${dateStr}`;
  const description = [
    `Bilan Journalier Hanouti 40 — ${storeName}`,
    `Date: ${dateStr}`,
    `--------------------------------`,
    `Ventes Brutes: ${summary.grossSales.toLocaleString()} DZD`,
    `Coût Marchandises (CAMV): ${summary.costOfGoodsSold.toLocaleString()} DZD`,
    `Bénéfice Brut: ${summary.grossProfit.toLocaleString()} DZD`,
    `Charges d'Exploitation: ${summary.operatingExpenses.toLocaleString()} DZD`,
    `Bénéfice Net Réel: ${summary.netProfit.toLocaleString()} DZD`,
    `Flux de Caisse Net: ${summary.netCashFlow.toLocaleString()} DZD`,
    `Factures Réalisées: ${summary.invoicesCount}`,
    `Règlements Reçus: ${summary.paymentsCount}`,
    `Généré automatiquement par Hanouti 40 Pro`,
  ].join('\\n');

  // Create .ics format
  const icsDate = dateStr.replace(/-/g, '');
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hanouti40//FinancialCalendar//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:hanouti40-fin-${dateStr}@hanouti.dz`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART;VALUE=DATE:${icsDate}`,
    `DTEND;VALUE=DATE:${icsDate}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Hanouti40_Finance_${dateStr}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate CSV data for Financial Calendar Period
 */
export function generateFinancialCSV(
  events: FinancialEvent[],
  periodSummary: PeriodFinancialSummary,
  storeName: string
): string {
  const headers = [
    'Date',
    'Heure',
    'Type',
    'Référence / N° Facture',
    'Tiers (Client / Fournisseur)',
    'Catégorie',
    'Mode Règlement',
    'Montant (DZD)',
    'Marge Brute Estimée (DZD)',
  ];

  const rows = events.map((e) => [
    e.date,
    e.time,
    e.type,
    `"${(e.reference || e.title).replace(/"/g, '""')}"`,
    `"${(e.partyName || '-').replace(/"/g, '""')}"`,
    `"${(e.category || '-').replace(/"/g, '""')}"`,
    e.paymentMethod,
    e.amount,
    e.profitContribution !== undefined ? e.profitContribution : '-',
  ]);

  const summarySection = [
    [],
    ['=== RÉSUMÉ COMPTABLE DU ' + periodSummary.startDate + ' AU ' + periodSummary.endDate + ' ==='],
    ['Magasin', `"${storeName}"`],
    ['Ventes Brutes Total', periodSummary.grossSales],
    ['Coût des Marchandises Vendues (CAMV)', periodSummary.costOfGoodsSold],
    ['Bénéfice Brut (Marge)', periodSummary.grossProfit],
    ['Dépenses d\'Exploitation', periodSummary.operatingExpenses],
    ['Autres Revenus', periodSummary.otherIncome],
    ['BÉNÉFICE NET RÉEL', periodSummary.netProfit],
    ['Total Encaissé Réel', periodSummary.totalReceived],
    ['Total Décaissements Caisse', periodSummary.totalCashOutflow],
    ['FLUX DE TRÉSORERIE NET', periodSummary.netCashFlow],
  ];

  return (
    [headers.join(';')]
      .concat(rows.map((r) => r.join(';')))
      .concat(summarySection.map((s) => s.join(';')))
      .join('\r\n')
  );
}
