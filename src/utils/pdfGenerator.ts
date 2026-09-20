import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import {
  Customer,
  Expense,
  Income,
  Product,
  Purchase,
  Sale,
  StoreSettings,
  Supplier,
} from '../types';
import { formatCurrency } from './formatters';

// Common PDF Header & Footer Helper
function applyHeaderAndFooter(
  doc: jsPDF,
  title: string,
  settings: StoreSettings,
  subtitle?: string
) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Brand Header Bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('HANOUTI 40', 14, 12);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${settings.storeName} | ${settings.phone} | ${settings.address}`,
      14,
      18
    );

    // Title & Generation timestamp
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 34);

    if (subtitle) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(subtitle, 14, 40);
    }

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const now = new Date().toLocaleString();
    doc.text(`Hanouti 40 Android • Généré le: ${now}`, 14, pageHeight - 8);
    doc.text(
      `Page ${i} sur ${pageCount}`,
      pageWidth - 28,
      pageHeight - 8,
      { align: 'right' }
    );
  }
}

// 1. Invoice PDF (Section 82)
export function generateInvoicePdf(sale: Sale, settings: StoreSettings): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Box
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('HANOUTI 40 — FACTURE DE VENTE', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${settings.storeName} • Tél: ${settings.phone} • ${settings.address}`,
    14,
    18
  );
  if (settings.rcNumber || settings.nifNumber) {
    doc.text(
      `RC: ${settings.rcNumber || '-'} | NIF: ${settings.nifNumber || '-'}`,
      14,
      24
    );
  }

  // Invoice Details Block
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Facture N° : ${sale.invoiceNumber}`, 14, 38);
  doc.text(`Date & Heure : ${sale.saleDate}`, 14, 44);
  doc.text(
    `Client : ${sale.customerName || 'Client Comptoir (Passager)'}`,
    14,
    50
  );
  doc.text(`Mode de Règlement : ${sale.paymentMethod}`, 14, 56);

  // Line items table
  const tableData = sale.items.map((item, idx) => [
    idx + 1,
    item.productName,
    item.barcode,
    item.quantity,
    formatCurrency(item.unitPrice, settings.currency),
    formatCurrency(item.lineTotal, settings.currency),
  ]);

  autoTable(doc, {
    startY: 62,
    head: [['#', 'Désignation Article', 'Code-barres', 'Qté', 'P.U', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Financial summary block
  const summaryX = pageWidth - 80;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Sous-Total :', summaryX, finalY);
  doc.text(
    formatCurrency(sale.subtotal, settings.currency),
    pageWidth - 14,
    finalY,
    { align: 'right' }
  );

  doc.text('Remise Accordée :', summaryX, finalY + 6);
  doc.text(
    formatCurrency(sale.discount, settings.currency),
    pageWidth - 14,
    finalY + 6,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('NET À PAYER :', summaryX, finalY + 14);
  doc.text(
    formatCurrency(sale.totalAmount, settings.currency),
    pageWidth - 14,
    finalY + 14,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Montant Versé :', summaryX, finalY + 20);
  doc.text(
    formatCurrency(sale.amountPaid, settings.currency),
    pageWidth - 14,
    finalY + 20,
    { align: 'right' }
  );

  if (sale.debtAmount > 0) {
    doc.setTextColor(220, 38, 38); // red
    doc.setFont('helvetica', 'bold');
    doc.text('Reste Dû (Crédit) :', summaryX, finalY + 26);
    doc.text(
      formatCurrency(sale.debtAmount, settings.currency),
      pageWidth - 14,
      finalY + 26,
      { align: 'right' }
    );
  }

  // Footer & Thank you note
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text(settings.receiptFooter || 'Merci pour votre confiance !', pageWidth / 2, pageHeight - 16, {
    align: 'center',
  });

  return doc;
}

// 2. Sales Report PDF (Section 83)
export function generateSalesReportPdf(
  sales: Sale[],
  settings: StoreSettings,
  filterName: string = 'Toutes les Ventes'
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  let totalSales = 0;
  let totalPaid = 0;
  let totalDebt = 0;

  const rows = sales.map((s) => {
    totalSales += s.totalAmount;
    totalPaid += s.amountPaid;
    totalDebt += s.debtAmount;
    return [
      s.invoiceNumber,
      s.saleDate,
      s.customerName || 'Comptoir',
      s.paymentMethod,
      formatCurrency(s.totalAmount, settings.currency),
      formatCurrency(s.amountPaid, settings.currency),
      formatCurrency(s.debtAmount, settings.currency),
    ];
  });

  autoTable(doc, {
    startY: 46,
    head: [['N° Facture', 'Date', 'Client', 'Mode', 'Total Vente', 'Payé', 'Reste Dû']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Total Chiffre d'Affaires : ${formatCurrency(totalSales, settings.currency)}`, 14, finalY);
  doc.text(`Total Encaissé : ${formatCurrency(totalPaid, settings.currency)}`, 14, finalY + 5);
  doc.text(`Total Crédit Accordé : ${formatCurrency(totalDebt, settings.currency)}`, 14, finalY + 10);

  applyHeaderAndFooter(doc, 'RAPPORT DES VENTES', settings, `Filtre: ${filterName} • ${sales.length} transactions`);
  return doc;
}

// 3. Income Report PDF (Section 84)
export function generateIncomeReportPdf(incomes: Income[], settings: StoreSettings): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let total = 0;

  const rows = incomes.map((inc) => {
    total += inc.amount;
    return [
      inc.date,
      inc.category,
      inc.description,
      inc.customerName || inc.reference || '-',
      inc.paymentMethod,
      formatCurrency(inc.amount, settings.currency),
    ];
  });

  autoTable(doc, {
    startY: 46,
    head: [['Date', 'Catégorie', 'Description', 'Réf / Client', 'Mode', 'Montant']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 8 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total des Revenus & Entrées : ${formatCurrency(total, settings.currency)}`, 14, finalY);

  applyHeaderAndFooter(doc, 'RAPPORT DES REVENUS & ENTRÉES', settings, `Total entrées enregistrées: ${incomes.length}`);
  return doc;
}

// 4. Expense Report PDF (Section 85)
export function generateExpenseReportPdf(expenses: Expense[], settings: StoreSettings): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let total = 0;

  const rows = expenses.map((exp) => {
    total += exp.amount;
    return [
      exp.date,
      exp.category,
      exp.description,
      exp.supplierName || exp.reference || '-',
      exp.paymentMethod,
      formatCurrency(exp.amount, settings.currency),
    ];
  });

  autoTable(doc, {
    startY: 46,
    head: [['Date', 'Catégorie', 'Description', 'Fournisseur / Réf', 'Mode', 'Montant']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [225, 29, 72] }, // rose-600
    styles: { fontSize: 8 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total des Dépenses : ${formatCurrency(total, settings.currency)}`, 14, finalY);

  applyHeaderAndFooter(doc, 'RAPPORT DES DÉPENSES & CHARGES', settings, `Total dépenses: ${expenses.length}`);
  return doc;
}

// 5. Profit & Loss Report PDF (Section 86)
export function generateProfitLossPdf(
  sales: Sale[],
  purchases: Purchase[],
  expenses: Expense[],
  otherIncomes: Income[],
  settings: StoreSettings
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  let grossSales = 0;
  let cogs = 0;
  sales.forEach((s) => {
    if (s.status === 'COMPLETED') {
      grossSales += s.totalAmount;
      s.items.forEach((item) => {
        cogs += item.purchasePrice * item.quantity;
      });
    }
  });

  const grossProfit = grossSales - cogs;
  const totalOtherIncome = otherIncomes.reduce((acc, i) => acc + i.amount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netIncome = grossProfit + totalOtherIncome - totalExpenses;

  const summaryTable = [
    ['1. Ventes Brutes Totales (CA)', formatCurrency(grossSales, settings.currency)],
    ['2. Coût des Marchandises Vendues (COGS)', `-${formatCurrency(cogs, settings.currency)}`],
    ['3. MARGE COMMERCIALE BRUTE (1 - 2)', formatCurrency(grossProfit, settings.currency)],
    ['4. Autres Revenus & Recettes', `+${formatCurrency(totalOtherIncome, settings.currency)}`],
    ['5. Charges d\'Exploitation & Dépenses', `-${formatCurrency(totalExpenses, settings.currency)}`],
    ['6. RÉSULTAT NET / BÉNÉFICE NET (3 + 4 - 5)', formatCurrency(netIncome, settings.currency)],
  ];

  autoTable(doc, {
    startY: 48,
    head: [['Poste Comptable', 'Montant']],
    body: summaryTable,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 10, cellPadding: 3.5 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  });

  applyHeaderAndFooter(doc, 'COMPTE DE RÉSULTAT & BÉNÉFICE NET (P&L)', settings);
  return doc;
}

// 6. Purchases Report PDF (Section 87)
export function generatePurchasesReportPdf(purchases: Purchase[], settings: StoreSettings): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let totalPurchases = 0;
  let totalPaid = 0;
  let totalRemaining = 0;

  const rows = purchases.map((p) => {
    totalPurchases += p.totalAmount;
    totalPaid += p.amountPaid;
    totalRemaining += p.debtAmount;
    return [
      p.billNumber,
      p.purchaseDate,
      p.supplierName,
      p.items.length,
      formatCurrency(p.totalAmount, settings.currency),
      formatCurrency(p.amountPaid, settings.currency),
      formatCurrency(p.debtAmount, settings.currency),
    ];
  });

  autoTable(doc, {
    startY: 46,
    head: [['N° Bon / BL', 'Date', 'Fournisseur', 'Articles', 'Total Achat', 'Réglé', 'Reste Dû']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Achats : ${formatCurrency(totalPurchases, settings.currency)}`, 14, finalY);
  doc.text(`Total Payé Fournisseurs : ${formatCurrency(totalPaid, settings.currency)}`, 14, finalY + 5);
  doc.text(`Total Dettes Fournisseurs : ${formatCurrency(totalRemaining, settings.currency)}`, 14, finalY + 10);

  applyHeaderAndFooter(doc, 'RAPPORT DES ACHATS & APPROVISIONNEMENTS', settings);
  return doc;
}

// 7. Customer Statement PDF (Section 88)
export function generateCustomerStatementPdf(
  customer: Customer,
  sales: Sale[],
  settings: StoreSettings
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const clientSales = sales.filter((s) => s.customerId === customer.id);
  const rows = clientSales.map((s) => [
    s.saleDate,
    s.invoiceNumber,
    formatCurrency(s.totalAmount, settings.currency),
    formatCurrency(s.amountPaid, settings.currency),
    formatCurrency(s.debtAmount, settings.currency),
  ]);

  autoTable(doc, {
    startY: 56,
    head: [['Date', 'N° Facture', 'Montant Total', 'Versement', 'Dette Générée']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 8.5 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`SOLDE ACTUEL DÛ PAR LE CLIENT : ${formatCurrency(customer.currentDebt, settings.currency)}`, 14, finalY);

  applyHeaderAndFooter(
    doc,
    `RELEVÉ DE COMPTE CLIENT : ${customer.name}`,
    settings,
    `Téléphone: ${customer.phone} • Adresse: ${customer.address} • Plafond: ${formatCurrency(customer.creditLimit, settings.currency)}`
  );
  return doc;
}

// 8. Supplier Statement PDF (Section 89)
export function generateSupplierStatementPdf(
  supplier: Supplier,
  purchases: Purchase[],
  settings: StoreSettings
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const suppPurchases = purchases.filter((p) => p.supplierId === supplier.id);

  const rows = suppPurchases.map((p) => [
    p.purchaseDate,
    p.billNumber,
    formatCurrency(p.totalAmount, settings.currency),
    formatCurrency(p.amountPaid, settings.currency),
    formatCurrency(p.debtAmount, settings.currency),
  ]);

  autoTable(doc, {
    startY: 56,
    head: [['Date', 'N° Bon Achat', 'Total Bon', 'Payé', 'Reste à Régler']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 8.5 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.text(`SOLDE TOTAL RESTANT DÛ AU FOURNISSEUR : ${formatCurrency(supplier.currentDebt, settings.currency)}`, 14, finalY);

  applyHeaderAndFooter(
    doc,
    `FICHE FOURNISSEUR : ${supplier.name}`,
    settings,
    `Contact: ${supplier.contactPerson} • Tél: ${supplier.phone}`
  );
  return doc;
}

// 9. Inventory Report PDF (Section 90)
export function generateInventoryReportPdf(
  products: Product[],
  settings: StoreSettings,
  filterType: 'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'ALL'
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  let filtered = products;
  if (filterType === 'LOW_STOCK') {
    filtered = products.filter((p) => p.stockQuantity <= p.minStock && p.stockQuantity > 0);
  } else if (filterType === 'OUT_OF_STOCK') {
    filtered = products.filter((p) => p.stockQuantity <= 0);
  }

  let totalCostVal = 0;
  let totalSellVal = 0;

  const rows = filtered.map((p) => {
    const costVal = p.stockQuantity * p.purchasePrice;
    const sellVal = p.stockQuantity * p.sellingPrice;
    totalCostVal += costVal;
    totalSellVal += sellVal;
    return [
      p.name,
      p.barcode,
      p.stockQuantity,
      p.minStock,
      formatCurrency(p.purchasePrice, settings.currency),
      formatCurrency(p.sellingPrice, settings.currency),
      formatCurrency(costVal, settings.currency),
    ];
  });

  autoTable(doc, {
    startY: 46,
    head: [['Article', 'Code-barres', 'Stock', 'Alerte', 'P. Achat', 'P. Vente', 'Valeur Achat']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 8 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.text(`Valeur Stock (Prix d'Achat) : ${formatCurrency(totalCostVal, settings.currency)}`, 14, finalY);
  doc.text(`Valeur Réalisable (Prix de Vente) : ${formatCurrency(totalSellVal, settings.currency)}`, 14, finalY + 5);

  applyHeaderAndFooter(doc, 'ÉTAT D\'INVENTAIRE DES STOCKS', settings, `Articles listés: ${filtered.length}`);
  return doc;
}

// 10. Product Catalog List PDF (Section 91)
export function generateProductListPdf(products: Product[], settings: StoreSettings): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const rows = products.map((p) => [
    p.barcode,
    p.name,
    p.unit,
    formatCurrency(p.purchasePrice, settings.currency),
    formatCurrency(p.sellingPrice, settings.currency),
    p.stockQuantity,
  ]);

  autoTable(doc, {
    startY: 46,
    head: [['Code-barres', 'Désignation Produit', 'Unité', 'Prix Achat', 'Prix Vente', 'Stock']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 8 },
  });

  applyHeaderAndFooter(doc, 'CATALOGUE DES PRODUITS & PRIX', settings, `Total références: ${products.length}`);
  return doc;
}

// 11. Debts Report PDF (Section 92)
export function generateDebtsReportPdf(
  customers: Customer[],
  suppliers: Supplier[],
  settings: StoreSettings
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const debtorCustomers = customers.filter((c) => c.currentDebt > 0);
  const creditorSuppliers = suppliers.filter((s) => s.currentDebt > 0);

  const totalCustDebt = debtorCustomers.reduce((acc, c) => acc + c.currentDebt, 0);
  const totalSuppDebt = creditorSuppliers.reduce((acc, s) => acc + s.currentDebt, 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. CRÉANCES CLIENTS (À RECOUVRER)', 14, 46);

  const custRows = debtorCustomers.map((c) => [
    c.name,
    c.phone,
    formatCurrency(c.creditLimit, settings.currency),
    formatCurrency(c.currentDebt, settings.currency),
  ]);

  autoTable(doc, {
    startY: 50,
    head: [['Nom du Client', 'Téléphone', 'Plafond', 'Solde Dû']],
    body: custRows,
    theme: 'striped',
    headStyles: { fillColor: [245, 158, 11] }, // amber-500
    styles: { fontSize: 8 },
  });

  const suppStartY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. DETTES FOURNISSEURS (ENGAGEMENTS À PAYER)', 14, suppStartY);

  const suppRows = creditorSuppliers.map((s) => [
    s.name,
    s.contactPerson,
    s.phone,
    formatCurrency(s.currentDebt, settings.currency),
  ]);

  autoTable(doc, {
    startY: suppStartY + 4,
    head: [['Fournisseur', 'Contact', 'Téléphone', 'Reste à Payer']],
    body: suppRows,
    theme: 'striped',
    headStyles: { fillColor: [225, 29, 72] },
    styles: { fontSize: 8 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Total Créances Clients : ${formatCurrency(totalCustDebt, settings.currency)}`, 14, finalY);
  doc.text(`Total Dettes Fournisseurs : ${formatCurrency(totalSuppDebt, settings.currency)}`, 14, finalY + 5);

  applyHeaderAndFooter(doc, 'ÉTAT GLOBAL DES DETTES & CRÉANCES', settings);
  return doc;
}

// 12. Dashboard Summary PDF (Section 94)
export function generateDashboardPdf(
  stats: {
    dailySales: number;
    dailyProfit: number;
    inventoryValue: number;
    customerDebts: number;
    supplierDebts: number;
    lowStockCount: number;
    recentSalesCount: number;
  },
  settings: StoreSettings
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const summaryData = [
    ['Chiffre d\'Affaires du Jour', formatCurrency(stats.dailySales, settings.currency)],
    ['Bénéfice Brut Estimé du Jour', formatCurrency(stats.dailyProfit, settings.currency)],
    ['Valeur Totale du Stock (Prix d\'Achat)', formatCurrency(stats.inventoryValue, settings.currency)],
    ['Créances Clients Totales (À recouvrer)', formatCurrency(stats.customerDebts, settings.currency)],
    ['Dettes Fournisseurs Totales (À régler)', formatCurrency(stats.supplierDebts, settings.currency)],
    ['Articles en Alerte de Stock', `${stats.lowStockCount} références`],
    ['Transactions Récents Enregistrées', `${stats.recentSalesCount} ventes`],
  ];

  autoTable(doc, {
    startY: 48,
    head: [['Indicateur Clé de Performance (KPI)', 'Valeur Actuelle']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 10, cellPadding: 3.5 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  });

  applyHeaderAndFooter(doc, 'TABLEAU DE BORD EXÉCUTIF', settings);
  return doc;
}

// 13. Export All Reports into a ZIP Archive (Section 103)
export async function generateAllReportsZip(data: {
  sales: Sale[];
  purchases: Purchase[];
  incomes: Income[];
  expenses: Expense[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  settings: StoreSettings;
}): Promise<Blob> {
  const zip = new JSZip();
  const dateStr = new Date().toISOString().split('T')[0];

  // 1. Sales
  const salesPdf = generateSalesReportPdf(data.sales, data.settings);
  zip.file(`Sales/Sales_Report_${dateStr}.pdf`, salesPdf.output('blob'));

  // 2. Income
  const incomePdf = generateIncomeReportPdf(data.incomes, data.settings);
  zip.file(`Income/Income_Report_${dateStr}.pdf`, incomePdf.output('blob'));

  // 3. Expenses
  const expensesPdf = generateExpenseReportPdf(data.expenses, data.settings);
  zip.file(`Expenses/Expense_Report_${dateStr}.pdf`, expensesPdf.output('blob'));

  // 4. Profit & Loss
  const pnlPdf = generateProfitLossPdf(data.sales, data.purchases, data.expenses, data.incomes, data.settings);
  zip.file(`Profit/Profit_Report_${dateStr}.pdf`, pnlPdf.output('blob'));

  // 5. Purchases
  const purchasesPdf = generatePurchasesReportPdf(data.purchases, data.settings);
  zip.file(`Purchases/Purchase_Report_${dateStr}.pdf`, purchasesPdf.output('blob'));

  // 6. Inventory
  const inventoryPdf = generateInventoryReportPdf(data.products, data.settings);
  zip.file(`Inventory/Inventory_Report_${dateStr}.pdf`, inventoryPdf.output('blob'));

  // 7. Products
  const productsPdf = generateProductListPdf(data.products, data.settings);
  zip.file(`Products/Product_List_${dateStr}.pdf`, productsPdf.output('blob'));

  // 8. Debts
  const debtsPdf = generateDebtsReportPdf(data.customers, data.suppliers, data.settings);
  zip.file(`Debts/Debts_Report_${dateStr}.pdf`, debtsPdf.output('blob'));

  // 9. Recent Invoices
  data.sales.slice(0, 5).forEach((sale) => {
    const invPdf = generateInvoicePdf(sale, data.settings);
    zip.file(`Invoices/Invoice_${sale.invoiceNumber}.pdf`, invPdf.output('blob'));
  });

  return await zip.generateAsync({ type: 'blob' });
}

// Download or Share Trigger
export async function downloadOrSharePdf(doc: jsPDF, filename: string, title?: string) {
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: title || filename,
        text: `Rapport Hanouti 40: ${filename}`,
      });
      return;
    } catch (e) {
      // Fallback to direct download
    }
  }

  // Direct download fallback
  doc.save(filename);
}

// Native Print Trigger
export function printPdf(doc: jsPDF) {
  const blobUrl = doc.output('bloburl');
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = typeof blobUrl === 'string' ? blobUrl : (blobUrl as any).toString();
  document.body.appendChild(iframe);
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  };
}
