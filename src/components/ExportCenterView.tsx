import React, { useState } from 'react';
import {
  FileText,
  Download,
  Archive,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  Building2,
  Package,
  Layers,
  DollarSign,
  PieChart,
  Calendar,
  Crown,
  Lock,
  Smartphone,
} from 'lucide-react';
import {
  Customer,
  Expense,
  Income,
  LicenseInfo,
  Product,
  Purchase,
  Sale,
  StoreSettings,
  Supplier,
} from '../types';
import {
  downloadOrSharePdf,
  generateAllReportsZip,
  generateCustomerStatementPdf,
  generateDashboardPdf,
  generateDebtsReportPdf,
  generateExpenseReportPdf,
  generateIncomeReportPdf,
  generateInventoryReportPdf,
  generateInvoicePdf,
  generateProductListPdf,
  generateProfitLossPdf,
  generatePurchasesReportPdf,
  generateSalesReportPdf,
  generateSupplierStatementPdf,
} from '../utils/pdfGenerator';
import { translations } from '../localization/translations';

interface ExportCenterViewProps {
  sales: Sale[];
  purchases: Purchase[];
  incomes: Income[];
  expenses: Expense[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  settings: StoreSettings;
  licenseInfo?: LicenseInfo;
  onRequirePro?: (featureName: string) => void;
}

export const ExportCenterView: React.FC<ExportCenterViewProps> = ({
  sales,
  purchases,
  incomes,
  expenses,
  products,
  customers,
  suppliers,
  settings,
  licenseInfo,
  onRequirePro,
}) => {
  const t = translations[settings.language];
  const [isZipping, setIsZipping] = useState(false);
  const [lastExported, setLastExported] = useState<string | null>(null);

  const isPro = licenseInfo?.edition === 'PRO' && licenseInfo?.status === 'ACTIVE';

  const notifyExport = (name: string) => {
    setLastExported(name);
    setTimeout(() => setLastExported(null), 3500);
  };

  const handleExportAllZip = async () => {
    if (!isPro) {
      onRequirePro?.('Archive Complète ZIP & Dossier Comptable');
      return;
    }

    setIsZipping(true);
    try {
      const zipBlob = await generateAllReportsZip({
        sales,
        purchases,
        incomes,
        expenses,
        products,
        customers,
        suppliers,
        settings,
      });

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hanouti40_Reports_${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      notifyExport('Archive ZIP Complète');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération de l\'archive ZIP.');
    } finally {
      setIsZipping(false);
    }
  };

  const exportItems = [
    {
      id: 'invoices',
      title: 'Dernière Facture Émise',
      desc: 'Facture format A4 avec détail des articles et totaux',
      icon: FileText,
      color: 'text-indigo-400 bg-indigo-950/70 border-indigo-800/50',
      isProOnly: false,
      action: () => {
        if (sales.length === 0) return alert('Aucune facture enregistrée.');
        const doc = generateInvoicePdf(sales[0], settings);
        downloadOrSharePdf(doc, `Invoice_${sales[0].invoiceNumber}.pdf`, 'Facture de Vente');
        notifyExport('Facture de Vente');
      },
    },
    {
      id: 'sales',
      title: 'Rapport des Ventes',
      desc: 'Historique des transactions, encaissements et crédits',
      icon: ShoppingCart,
      color: 'text-emerald-400 bg-emerald-950/70 border-emerald-800/50',
      isProOnly: false,
      action: () => {
        const doc = generateSalesReportPdf(sales, settings);
        downloadOrSharePdf(doc, `Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`, 'Rapport des Ventes');
        notifyExport('Rapport des Ventes');
      },
    },
    {
      id: 'profit',
      title: 'Compte de Résultat & Profit (P&L)',
      desc: 'Chiffre d\'affaires, Coût d\'achat (COGS), Marge brute et Bénéfice net',
      icon: PieChart,
      color: 'text-amber-400 bg-amber-950/70 border-amber-800/50',
      isProOnly: true,
      action: () => {
        if (!isPro) return onRequirePro?.('Compte de Résultat & Profit (P&L)');
        const doc = generateProfitLossPdf(sales, purchases, expenses, incomes, settings);
        downloadOrSharePdf(doc, `Profit_Report_${new Date().toISOString().split('T')[0]}.pdf`, 'Compte de Résultat (P&L)');
        notifyExport('Compte de Résultat');
      },
    },
    {
      id: 'customers',
      title: 'Relevé de Compte Client',
      desc: 'Fiche du client principal avec historique et solde restant dû',
      icon: Users,
      color: 'text-purple-400 bg-purple-950/70 border-purple-800/50',
      isProOnly: true,
      action: () => {
        if (!isPro) return onRequirePro?.('Relevés de Compte Clients & Dettes');
        if (customers.length === 0) return alert('Aucun client enregistré.');
        const doc = generateCustomerStatementPdf(customers[0], sales, settings);
        downloadOrSharePdf(doc, `Customer_Statement_${customers[0].name}.pdf`, 'Relevé Client');
        notifyExport('Relevé Client');
      },
    },
    {
      id: 'suppliers',
      title: 'Fiche Relevé Fournisseur',
      desc: 'Achats enregistrés, règlements effectués et reste à payer',
      icon: Building2,
      color: 'text-cyan-400 bg-cyan-950/70 border-cyan-800/50',
      isProOnly: true,
      action: () => {
        if (!isPro) return onRequirePro?.('Fiches Relevés Fournisseurs');
        if (suppliers.length === 0) return alert('Aucun fournisseur enregistré.');
        const doc = generateSupplierStatementPdf(suppliers[0], purchases, settings);
        downloadOrSharePdf(doc, `Supplier_Statement_${suppliers[0].name}.pdf`, 'Relevé Fournisseur');
        notifyExport('Relevé Fournisseur');
      },
    },
    {
      id: 'debts',
      title: 'État Global des Dettes & Créances',
      desc: 'Liste des clients débiteurs et des fournisseurs créanciers',
      icon: DollarSign,
      color: 'text-amber-400 bg-amber-950/70 border-amber-800/50',
      isProOnly: true,
      action: () => {
        if (!isPro) return onRequirePro?.('État Global des Dettes & Créances');
        const doc = generateDebtsReportPdf(customers, suppliers, settings);
        downloadOrSharePdf(doc, `Debts_Report_${new Date().toISOString().split('T')[0]}.pdf`, 'État des Dettes');
        notifyExport('État des Dettes');
      },
    },
    {
      id: 'inventory',
      title: 'État d\'Inventaire des Stocks',
      desc: 'Quantités physiques, seuils d\'alerte et valorisation au prix d\'achat',
      icon: Layers,
      color: 'text-emerald-400 bg-emerald-950/70 border-emerald-800/50',
      isProOnly: true,
      action: () => {
        if (!isPro) return onRequirePro?.('État d\'Inventaire & Valorisation');
        const doc = generateInventoryReportPdf(products, settings);
        downloadOrSharePdf(doc, `Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`, 'État des Stocks');
        notifyExport('État des Stocks');
      },
    },
    {
      id: 'income',
      title: 'Rapport des Revenus',
      desc: 'Recettes annexes, versements clients et entrées de fonds',
      icon: TrendingUp,
      color: 'text-emerald-400 bg-emerald-950/70 border-emerald-800/50',
      isProOnly: false,
      action: () => {
        const doc = generateIncomeReportPdf(incomes, settings);
        downloadOrSharePdf(doc, `Income_Report_${new Date().toISOString().split('T')[0]}.pdf`, 'Rapport des Revenus');
        notifyExport('Rapport des Revenus');
      },
    },
    {
      id: 'expenses',
      title: 'Rapport des Dépenses',
      desc: 'Charges d\'exploitation, loyer, électricité, salaires et factures',
      icon: TrendingDown,
      color: 'text-rose-400 bg-rose-950/70 border-rose-800/50',
      isProOnly: false,
      action: () => {
        const doc = generateExpenseReportPdf(expenses, settings);
        downloadOrSharePdf(doc, `Expense_Report_${new Date().toISOString().split('T')[0]}.pdf`, 'Rapport des Dépenses');
        notifyExport('Rapport des Dépenses');
      },
    },
    {
      id: 'purchases',
      title: 'Rapport des Achats Fournisseurs',
      desc: 'Bons de livraison, approvisionnements et décaissements',
      icon: Package,
      color: 'text-blue-400 bg-blue-950/70 border-blue-800/50',
      isProOnly: false,
      action: () => {
        const doc = generatePurchasesReportPdf(purchases, settings);
        downloadOrSharePdf(doc, `Purchase_Report_${new Date().toISOString().split('T')[0]}.pdf`, 'Rapport des Achats');
        notifyExport('Rapport des Achats');
      },
    },
    {
      id: 'products',
      title: 'Catalogue des Produits & Prix',
      desc: 'Tarif complet avec codes-barres, prix de vente et unités',
      icon: Package,
      color: 'text-slate-300 bg-slate-800 border-slate-700',
      isProOnly: false,
      action: () => {
        const doc = generateProductListPdf(products, settings);
        downloadOrSharePdf(doc, `Product_List_${new Date().toISOString().split('T')[0]}.pdf`, 'Catalogue Produits');
        notifyExport('Catalogue Produits');
      },
    },
    {
      id: 'dashboard',
      title: 'Synthèse Exécutive du Tableau de Bord',
      desc: 'Indicateurs clés du magasin, performance et résumé chiffré',
      icon: Calendar,
      color: 'text-indigo-400 bg-indigo-950/70 border-indigo-800/50',
      isProOnly: true,
      action: () => {
        if (!isPro) return onRequirePro?.('Synthèse Exécutive du Tableau de Bord');
        const doc = generateDashboardPdf(
          {
            dailySales: sales.reduce((acc, s) => acc + s.totalAmount, 0),
            dailyProfit: sales.reduce((acc, s) => acc + (s.totalAmount - s.items.reduce((ci, i) => ci + i.purchasePrice * i.quantity, 0)), 0),
            inventoryValue: products.reduce((acc, p) => acc + p.stockQuantity * p.purchasePrice, 0),
            customerDebts: customers.reduce((acc, c) => acc + c.currentDebt, 0),
            supplierDebts: suppliers.reduce((acc, s) => acc + s.currentDebt, 0),
            lowStockCount: products.filter((p) => p.stockQuantity <= p.minStock).length,
            recentSalesCount: sales.length,
          },
          settings
        );
        downloadOrSharePdf(doc, `Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`, 'Tableau de Bord');
        notifyExport('Tableau de Bord');
      },
    },
  ];

  return (
    <div id="export-center-container" className="space-y-6">
      {/* Top Banner & Export All Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-950/80 border border-indigo-800/50 rounded-lg text-indigo-400">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-white">{t.exportCenter}</h2>
          </div>
          <p className="text-xs text-slate-400">
            Génération hors-ligne de documents PDF certifiés pour impression, partage et archivage
          </p>
        </div>

        {/* Export All ZIP Button */}
        <button
          onClick={handleExportAllZip}
          disabled={isZipping}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition shadow-lg cursor-pointer w-full md:w-auto justify-center"
        >
          <Archive className="w-4 h-4" />
          <span>{isZipping ? 'Création de l\'archive ZIP...' : t.exportAll}</span>
          {!isPro && (
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded font-mono">
              PRO
            </span>
          )}
        </button>
      </div>

      {/* Android Native APK Package Download Card */}
      <div className="bg-slate-900 border border-emerald-800/40 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-950 border border-emerald-700/60 rounded-xl text-emerald-400 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white">Application Mobile Android (APK Réel Signé)</h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-400 border border-emerald-700/40">
                Package com.hanouti40.app
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Installez l'application Hanouti 40 directement sur votre smartphone ou tablette Android (Android 5.0 à 14+).
            </p>
          </div>
        </div>

        <a
          href="/Hanouti40-release.apk"
          download="Hanouti40-release.apk"
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-emerald-950/40 cursor-pointer w-full sm:w-auto shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Télécharger APK (4.85 Mo)</span>
        </a>
      </div>

      {/* Success Notification Banner */}
      {lastExported && (
        <div className="bg-emerald-950/70 border border-emerald-800/50 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-300 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>{lastExported}</strong> exporté avec succès !
          </span>
        </div>
      )}

      {/* Grid of Available Exports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exportItems.map((item) => {
          const Icon = item.icon;
          const locked = item.isProOnly && !isPro;
          return (
            <div
              key={item.id}
              className={`bg-slate-900 border rounded-xl p-4.5 shadow-sm flex flex-col justify-between space-y-4 transition ${
                locked ? 'border-amber-500/30 hover:border-amber-500/50' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg border ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-white">{item.title}</h3>
                  </div>
                  {item.isProOnly && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded font-mono flex items-center gap-1 ${
                        isPro
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-amber-500 text-slate-950 shadow-xs'
                      }`}
                    >
                      <Crown className="w-3 h-3" />
                      <span>PRO</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>

              <button
                onClick={item.action}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer border ${
                  locked
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                {locked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Débloquer avec Hanouti 40 PRO</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.exportPdf}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
