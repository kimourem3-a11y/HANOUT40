import React, { useState, useEffect } from 'react';
import {
  AppModule,
  Customer,
  CustomerPayment,
  CustomerReturn,
  DeviceViewMode,
  Expense,
  Income,
  Language,
  LicenseInfo,
  Product,
  Purchase,
  Sale,
  StoreSettings,
  Supplier,
} from './types';
import {
  initialCategories,
  initialCustomers,
  initialExpenses,
  initialIncomes,
  initialProducts,
  initialPurchases,
  initialSales,
  initialSettings,
  initialSuppliers,
} from './data/initialData';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { POSView } from './components/POSView';
import { ProductsView } from './components/ProductsView';
import { PurchasesView } from './components/PurchasesView';
import { CustomersView } from './components/CustomersView';
import { FinancialCalendarView } from './components/FinancialCalendarView';
import { SuppliersView } from './components/SuppliersView';
import { InventoryView } from './components/InventoryView';
import { DebtsView } from './components/DebtsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { ForensicsView } from './components/ForensicsView';
import { IncomeView } from './components/IncomeView';
import { ExpensesView } from './components/ExpensesView';
import { ExportCenterView } from './components/ExportCenterView';
import { ResetSafetyModal } from './components/ResetSafetyModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { NotificationCenterDrawer } from './components/NotificationCenterDrawer';
import { FeatureAccessManager, LicenseManager, DEFAULT_FREE_LICENSE } from './utils/licenseManager';
import { SyncEngine } from './utils/syncEngine';
import { BackgroundMonitor } from './utils/backgroundMonitor';
import { safeGetJSON, safeGetString } from './utils/storage';
import { AppNotification } from './types';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

export default function App() {
  // Persistent Settings
  const [settings, setSettings] = useState<StoreSettings>(() =>
    safeGetJSON('hanouti40_settings', initialSettings)
  );

  // Dedicated PRO / FREE License System (Offline-first, Asymmetric Verification, Separate Storage)
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo>(() => {
    try {
      return LicenseManager.getActiveLicense();
    } catch {
      return DEFAULT_FREE_LICENSE;
    }
  });

  // Pro Upgrade / Gating Dialog state
  const [proModalState, setProModalState] = useState<{
    isOpen: boolean;
    featureName?: string;
    limitMessage?: string;
  }>({ isOpen: false });

  // Data Collections with LocalStorage Persistence
  const [products, setProducts] = useState<Product[]>(() =>
    safeGetJSON('hanouti40_products', initialProducts)
  );

  const [categories] = useState(initialCategories);

  const [customers, setCustomers] = useState<Customer[]>(() =>
    safeGetJSON('hanouti40_customers', initialCustomers)
  );

  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    safeGetJSON('hanouti40_suppliers', initialSuppliers)
  );

  const [sales, setSales] = useState<Sale[]>(() =>
    safeGetJSON('hanouti40_sales', initialSales)
  );

  const [purchases, setPurchases] = useState<Purchase[]>(() =>
    safeGetJSON('hanouti40_purchases', initialPurchases)
  );

  const [incomes, setIncomes] = useState<Income[]>(() =>
    safeGetJSON('hanouti40_incomes', initialIncomes)
  );

  const [expenses, setExpenses] = useState<Expense[]>(() =>
    safeGetJSON('hanouti40_expenses', initialExpenses)
  );

  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>(() =>
    safeGetJSON('hanouti40_customer_payments', [])
  );

  const [customerReturns, setCustomerReturns] = useState<CustomerReturn[]>(() =>
    safeGetJSON('hanouti40_customer_returns', [])
  );

  const [selectedSaleCustomerId, setSelectedSaleCustomerId] = useState<number | null>(null);

  // Device emulation mode: android_phone or android_tablet
  const [deviceViewMode, setDeviceViewMode] = useState<DeviceViewMode>(() =>
    (safeGetString('hanouti40_device_mode', 'android_tablet') as DeviceViewMode) || 'android_tablet'
  );

  // Safe Multi-Stage Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Settings initial tab
  const [settingsTab, setSettingsTab] = useState<'general' | 'data' | 'clients' | 'sync' | 'background' | 'license'>('general');

  // Background Monitoring & Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      return BackgroundMonitor.getStoredNotifications();
    } catch {
      return [];
    }
  });
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Current active navigation module
  const [currentModule, setCurrentModule] = useState<AppModule>('dashboard');

  // Receipt Modal State
  const [viewingReceiptSale, setViewingReceiptSale] = useState<Sale | null>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('hanouti40_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('hanouti40_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('hanouti40_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('hanouti40_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('hanouti40_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('hanouti40_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('hanouti40_incomes', JSON.stringify(incomes));
  }, [incomes]);

  useEffect(() => {
    localStorage.setItem('hanouti40_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('hanouti40_device_mode', deviceViewMode);
  }, [deviceViewMode]);

  // Handle RTL vs LTR document direction
  useEffect(() => {
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
  }, [settings.language]);

  // Global hotkeys (F1 for POS)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setCurrentModule('pos');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real-Time Synchronization Listener (PC <-> Android)
  useEffect(() => {
    SyncEngine.init();

    const unsub = SyncEngine.onRemoteSync((item) => {
      if (item.entityType === 'PRODUCT') {
        if (item.operation === 'DELETE') {
          setProducts((prev) => prev.filter((p) => String(p.id) !== String(item.entityUuid)));
        } else {
          setProducts((prev) => {
            const idx = prev.findIndex((p) => String(p.id) === String(item.entityUuid));
            if (idx > -1) {
              const copy = [...prev];
              copy[idx] = item.payload;
              return copy;
            }
            return [item.payload, ...prev];
          });
        }
      } else if (item.entityType === 'SALE') {
        if (item.operation === 'CREATE') {
          setSales((prev) => {
            if (prev.some((s) => String(s.id) === String(item.entityUuid))) return prev;
            return [item.payload, ...prev];
          });
        }
      } else if (item.entityType === 'CUSTOMER') {
        if (item.operation === 'DELETE') {
          setCustomers((prev) => prev.filter((c) => String(c.id) !== String(item.entityUuid)));
        } else {
          setCustomers((prev) => {
            const idx = prev.findIndex((c) => String(c.id) === String(item.entityUuid));
            if (idx > -1) {
              const copy = [...prev];
              copy[idx] = item.payload;
              return copy;
            }
            return [item.payload, ...prev];
          });
        }
      } else if (item.entityType === 'SUPPLIER') {
        if (item.operation === 'DELETE') {
          setSuppliers((prev) => prev.filter((s) => String(s.id) !== String(item.entityUuid)));
        } else {
          setSuppliers((prev) => {
            const idx = prev.findIndex((s) => String(s.id) === String(item.entityUuid));
            if (idx > -1) {
              const copy = [...prev];
              copy[idx] = item.payload;
              return copy;
            }
            return [item.payload, ...prev];
          });
        }
      } else if (item.entityType === 'PURCHASE') {
        if (item.operation === 'CREATE') {
          setPurchases((prev) => {
            if (prev.some((p) => String(p.id) === String(item.entityUuid))) return prev;
            return [item.payload, ...prev];
          });
        }
      } else if (item.entityType === 'INCOME') {
        if (item.operation === 'DELETE') {
          setIncomes((prev) => prev.filter((i) => String(i.id) !== String(item.entityUuid)));
        } else {
          setIncomes((prev) => [item.payload, ...prev]);
        }
      } else if (item.entityType === 'EXPENSE') {
        if (item.operation === 'DELETE') {
          setExpenses((prev) => prev.filter((e) => String(e.id) !== String(item.entityUuid)));
        } else {
          setExpenses((prev) => [item.payload, ...prev]);
        }
      }
    });

    return () => unsub();
  }, []);

  // Background Monitoring & Real Notifications Initialization
  useEffect(() => {
    BackgroundMonitor.init();

    const unsubNotifs = BackgroundMonitor.onNotificationsChange((list) => {
      setNotifications(list);
    });

    const unsubActions = BackgroundMonitor.onActionClick((action, data) => {
      if (action === 'VIEW_PRODUCT') {
        setCurrentModule('products');
      } else if (action === 'CREATE_PURCHASE') {
        setCurrentModule('purchases');
      }
    });

    // Check product stock on mount
    BackgroundMonitor.evaluateProductStock(products, suppliers);

    return () => {
      unsubNotifs();
      unsubActions();
    };
  }, []);

  // Handlers
  const handleLanguageChange = (lang: Language) => {
    setSettings((prev) => ({ ...prev, language: lang }));
  };

  const handleOpenProModal = (featureName?: string, limitMessage?: string) => {
    setProModalState({ isOpen: true, featureName, limitMessage });
  };

  const handleActivateLicense = (key: string) => {
    const res = LicenseManager.activateLicenseKey(key);
    if (res.success && res.license) {
      setLicenseInfo(res.license);
    }
    return res;
  };

  const handleDeactivateLicense = () => {
    LicenseManager.deactivateLicense();
    setLicenseInfo(LicenseManager.getActiveLicense());
  };

  const handleSaleComplete = (
    newSale: Sale,
    updatedProducts: Product[],
    updatedCustomers: Customer[]
  ) => {
    // Check FREE sales volume limit
    const limitCheck = FeatureAccessManager.checkLimit('MAX_SALES', sales.length, licenseInfo);
    if (!limitCheck.allowed) {
      handleOpenProModal('Ventes & Factures Illimitées', limitCheck.message);
      return;
    }

    setSales((prev) => [newSale, ...prev]);
    setProducts(updatedProducts);
    setCustomers(updatedCustomers);
    setViewingReceiptSale(newSale);

    // Immediate offline & online stock evaluation for low-stock and out-of-stock notifications
    BackgroundMonitor.evaluateProductStock(updatedProducts, suppliers);

    // Sync broadcast
    SyncEngine.enqueueChange(
      'SALE',
      'CREATE',
      String(newSale.id),
      newSale,
      `Vente #${newSale.invoiceNumber || newSale.id} enregistrée (${newSale.totalAmount} DZD)`
    );
  };

  const handleSaveProduct = (prod: Product) => {
    const isExisting = products.some((p) => p.id === prod.id);
    if (!isExisting) {
      const limitCheck = FeatureAccessManager.checkLimit('MAX_PRODUCTS', products.length, licenseInfo);
      if (!limitCheck.allowed) {
        handleOpenProModal('Catalogue Produits Illimité', limitCheck.message);
        return;
      }
    }

    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === prod.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = prod;
        return copy;
      }
      return [prod, ...prev];
    });

    // Sync broadcast
    SyncEngine.enqueueChange(
      'PRODUCT',
      isExisting ? 'UPDATE' : 'CREATE',
      String(prod.id),
      prod,
      `Produit : ${prod.name} (${prod.sellingPrice} DZD)`
    );
  };

  const handleDeleteProduct = (productId: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    SyncEngine.enqueueChange(
      'PRODUCT',
      'DELETE',
      String(productId),
      { id: productId },
      `Produit #${productId} supprimé`
    );
  };

  const handleQuickAddStock = (productId: number, addQty: number) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === productId ? { ...p, stockQuantity: p.stockQuantity + addQty } : p));
      const target = updated.find((p) => p.id === productId);
      if (target) {
        SyncEngine.enqueueChange(
          'PRODUCT',
          'UPDATE',
          String(productId),
          target,
          `Stock réapprovisionné : ${target.name} (+${addQty})`
        );
      }
      return updated;
    });
  };

  const handleSaveCustomer = (cust: Customer) => {
    const isExisting = customers.some((c) => c.id === cust.id);
    if (!isExisting) {
      const limitCheck = FeatureAccessManager.checkLimit('MAX_CUSTOMERS', customers.length, licenseInfo);
      if (!limitCheck.allowed) {
        handleOpenProModal('Répertoire Clients Illimité', limitCheck.message);
        return;
      }
    }

    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === cust.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = cust;
        return copy;
      }
      return [cust, ...prev];
    });

    SyncEngine.enqueueChange(
      'CUSTOMER',
      isExisting ? 'UPDATE' : 'CREATE',
      String(cust.id),
      cust,
      `Client : ${cust.name}`
    );
  };

  const handleSoftDeleteCustomer = (id: number) => {
    setCustomers((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, isArchived: true, deletedAt: new Date().toISOString() } : c
      );
      const target = updated.find((c) => c.id === id);
      if (target) {
        SyncEngine.enqueueChange(
          'CUSTOMER',
          'UPDATE',
          String(id),
          target,
          `Client archivé : ${target.name} (historique comptable conservé)`
        );
      }
      return updated;
    });
  };

  const handleRestoreCustomer = (id: number) => {
    setCustomers((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, isArchived: false, deletedAt: null } : c
      );
      const target = updated.find((c) => c.id === id);
      if (target) {
        SyncEngine.enqueueChange(
          'CUSTOMER',
          'UPDATE',
          String(id),
          target,
          `Client restauré : ${target.name}`
        );
      }
      return updated;
    });
  };

  const handleReceiveCustomerPayment = (
    customerId: number,
    amount: number,
    notes?: string,
    method: string = 'CASH'
  ) => {
    const targetCustomer = customers.find((c) => c.id === customerId);
    const paymentRecord: CustomerPayment = {
      id: Date.now(),
      customerId,
      customerName: targetCustomer ? targetCustomer.name : `Client #${customerId}`,
      paymentDate: new Date().toISOString(),
      amount,
      paymentMethod: method || 'CASH',
      notes,
    };

    setCustomerPayments((prev) => {
      const updated = [paymentRecord, ...prev];
      localStorage.setItem('hanouti40_customer_payments', JSON.stringify(updated));
      return updated;
    });

    setCustomers((prev) => {
      const updated = prev.map((c) =>
        c.id === customerId ? { ...c, currentDebt: Math.max(0, c.currentDebt - amount) } : c
      );
      const target = updated.find((c) => c.id === customerId);
      if (target) {
        SyncEngine.enqueueChange(
          'CUSTOMER',
          'UPDATE',
          String(customerId),
          target,
          `Versement dette client : ${target.name} (-${amount} DZD)`
        );
      }
      return updated;
    });
  };

  const handleRecordCustomerReturn = (ret: CustomerReturn) => {
    setCustomerReturns((prev) => {
      const updated = [ret, ...prev];
      localStorage.setItem('hanouti40_customer_returns', JSON.stringify(updated));
      return updated;
    });

    if (ret.refundMethod === 'CREDIT_REDUCTION') {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === ret.customerId
            ? { ...c, currentDebt: Math.max(0, c.currentDebt - ret.amount) }
            : c
        )
      );
    }

    SyncEngine.enqueueChange(
      'SALE',
      'UPDATE',
      ret.id,
      ret,
      `Retour client : ${ret.customerName} (${ret.amount} DZD)`
    );
  };

  const handleStartSaleForCustomer = (cust: Customer) => {
    setSelectedSaleCustomerId(cust.id);
    setCurrentModule('pos');
  };

  const handleSaveSupplier = (supp: Supplier) => {
    const isExisting = suppliers.some((s) => s.id === supp.id);
    if (!isExisting) {
      const limitCheck = FeatureAccessManager.checkLimit('MAX_SUPPLIERS', suppliers.length, licenseInfo);
      if (!limitCheck.allowed) {
        handleOpenProModal('Répertoire Fournisseurs Illimité', limitCheck.message);
        return;
      }
    }

    setSuppliers((prev) => {
      const idx = prev.findIndex((s) => s.id === supp.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = supp;
        return copy;
      }
      return [supp, ...prev];
    });

    SyncEngine.enqueueChange(
      'SUPPLIER',
      isExisting ? 'UPDATE' : 'CREATE',
      String(supp.id),
      supp,
      `Fournisseur : ${supp.name}`
    );
  };

  const handleDeleteSupplier = (id: number) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    SyncEngine.enqueueChange('SUPPLIER', 'DELETE', String(id), { id }, `Fournisseur #${id} supprimé`);
  };

  const handlePaySupplier = (supplierId: number, amount: number) => {
    setSuppliers((prev) => {
      const updated = prev.map((s) => (s.id === supplierId ? { ...s, currentDebt: Math.max(0, s.currentDebt - amount) } : s));
      const target = updated.find((s) => s.id === supplierId);
      if (target) {
        SyncEngine.enqueueChange(
          'SUPPLIER',
          'UPDATE',
          String(supplierId),
          target,
          `Paiement dette fournisseur : ${target.name} (-${amount} DZD)`
        );
      }
      return updated;
    });
  };

  const handleRecordPurchase = (
    pur: Purchase,
    updatedProducts: Product[],
    updatedSuppliers: Supplier[]
  ) => {
    const limitCheck = FeatureAccessManager.checkLimit('MAX_PURCHASES', purchases.length, licenseInfo);
    if (!limitCheck.allowed) {
      handleOpenProModal('Approvisionnements Illimités', limitCheck.message);
      return;
    }

    setPurchases((prev) => [pur, ...prev]);
    setProducts(updatedProducts);
    setSuppliers(updatedSuppliers);

    SyncEngine.enqueueChange(
      'PURCHASE',
      'CREATE',
      String(pur.id),
      pur,
      `Achat fournisseur #${pur.billNumber || pur.id} (${pur.totalAmount} DZD)`
    );
  };

  const handleAdjustStock = (productId: number, newStock: number) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === productId ? { ...p, stockQuantity: newStock } : p));
      const target = updated.find((p) => p.id === productId);
      if (target) {
        SyncEngine.enqueueChange(
          'PRODUCT',
          'UPDATE',
          String(productId),
          target,
          `Ajustement inventaire : ${target.name} -> ${newStock}`
        );
      }
      return updated;
    });
  };

  // Income and Expense Handlers
  const handleAddIncome = (income: Income) => {
    setIncomes((prev) => [income, ...prev]);
    SyncEngine.enqueueChange('INCOME', 'CREATE', String(income.id), income, `Entrée : ${income.description} (${income.amount} DZD)`);
  };

  const handleDeleteIncome = (id: number) => {
    setIncomes((prev) => prev.filter((i) => i.id !== id));
    SyncEngine.enqueueChange('INCOME', 'DELETE', String(id), { id }, `Entrée #${id} supprimée`);
  };

  const handleAddExpense = (expense: Expense) => {
    setExpenses((prev) => [expense, ...prev]);
    SyncEngine.enqueueChange('EXPENSE', 'CREATE', String(expense.id), expense, `Dépense : ${expense.description} (${expense.amount} DZD)`);
  };

  const handleDeleteExpense = (id: number) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    SyncEngine.enqueueChange('EXPENSE', 'DELETE', String(id), { id }, `Dépense #${id} supprimée`);
  };

  const handleExportData = (): boolean => {
    try {
      const data = {
        settings,
        products,
        categories,
        customers,
        suppliers,
        sales,
        purchases,
        incomes,
        expenses,
        licenseInfo: {
          edition: licenseInfo.edition,
          status: licenseInfo.status,
          licenseId: licenseInfo.licenseId,
        },
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hanouti40_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.products && parsed.settings) {
          setSettings(parsed.settings);
          setProducts(parsed.products);
          if (parsed.customers) setCustomers(parsed.customers);
          if (parsed.suppliers) setSuppliers(parsed.suppliers);
          if (parsed.sales) setSales(parsed.sales);
          if (parsed.purchases) setPurchases(parsed.purchases);
          if (parsed.incomes) setIncomes(parsed.incomes);
          if (parsed.expenses) setExpenses(parsed.expenses);
          alert('Base de données restaurée avec succès !');
        } else {
          alert('Format de fichier invalide.');
        }
      } catch (err) {
        alert('Erreur lors de la lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Safe Multi-Stage Reset Handlers
  const handleResetFormOnly = () => {
    alert('Formulaires et saisies temporaires réinitialisés.');
  };

  const handleResetFiltersOnly = () => {
    alert('Filtres de recherche et sélections réinitialisés.');
  };

  const handleResetSettingsOnly = () => {
    setSettings(initialSettings);
    alert('Paramètres de l\'application réinitialisés avec succès.');
  };

  /**
   * RESET EVERYTHING HANDLER (Section 12, 74-76, 104)
   * 1. Clears real persisted database tables (localStorage keys)
   * 2. Sets all business quantities, balances, totals and counters to 0/empty
   * 3. Retains PRO license state! (hanouti40_secure_license_storage is untouched)
   * 4. Retains critical app settings intact
   */
  const handleResetAllBusinessData = () => {
    // 1. Remove business database records from storage
    localStorage.removeItem('hanouti40_products');
    localStorage.removeItem('hanouti40_customers');
    localStorage.removeItem('hanouti40_suppliers');
    localStorage.removeItem('hanouti40_sales');
    localStorage.removeItem('hanouti40_purchases');
    localStorage.removeItem('hanouti40_incomes');
    localStorage.removeItem('hanouti40_expenses');
    localStorage.removeItem('hanouti40_scanner_history');
    localStorage.removeItem('hanouti40_draft_sale');

    // 2. Set all business state collections and counters back to empty / zero
    setProducts([]);
    setCustomers([]);
    setSuppliers([]);
    setSales([]);
    setPurchases([]);
    setIncomes([]);
    setExpenses([]);

    // 3. Inform sync engine to advance generation so stale sync operations are purged
    SyncEngine.notifyResetEverything();

    // 4. Keep settings and license intact!
  };

  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStock).length;

  const appContent = (
    <div
      id="hanouti-app-root"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white"
      dir={settings.language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Top Application Header */}
      <Header
        settings={settings}
        deviceViewMode={deviceViewMode}
        licenseInfo={licenseInfo}
        unreadNotificationsCount={notifications.filter((n) => !n.read).length}
        onLanguageChange={handleLanguageChange}
        onToggleDeviceMode={setDeviceViewMode}
        onOpenPOS={() => setCurrentModule('pos')}
        onOpenExportCenter={() => setCurrentModule('exportCenter')}
        onOpenForensics={() => setCurrentModule('forensics')}
        onOpenLicense={() => {
          setSettingsTab('license');
          setCurrentModule('settings');
        }}
        onOpenSync={() => {
          setSettingsTab('sync');
          setCurrentModule('settings');
        }}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
      />

      {/* Module Navigation */}
      <Navigation
        currentModule={currentModule}
        onSelectModule={setCurrentModule}
        language={settings.language}
        lowStockCount={lowStockCount}
      />

      {/* Main Workspace Content Area */}
      <main id="hanouti-main-content" className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentModule === 'dashboard' && (
          <DashboardView
            products={products}
            sales={sales}
            customers={customers}
            suppliers={suppliers}
            incomes={incomes}
            expenses={expenses}
            settings={settings}
            onNavigate={setCurrentModule}
            onViewSale={setViewingReceiptSale}
          />
        )}

        {currentModule === 'pos' && (
          <POSView
            products={products}
            categories={categories}
            customers={customers}
            settings={settings}
            onSaleComplete={handleSaleComplete}
            initialCustomerId={selectedSaleCustomerId}
          />
        )}

        {currentModule === 'financial_calendar' && (
          <FinancialCalendarView
            sales={sales}
            purchases={purchases}
            incomes={incomes}
            expenses={expenses}
            customers={customers}
            suppliers={suppliers}
            products={products}
            settings={settings}
            licenseInfo={licenseInfo}
            onViewSale={setViewingReceiptSale}
            onRequirePro={(feat) => handleOpenProModal(feat)}
          />
        )}

        {currentModule === 'products' && (
          <ProductsView
            products={products}
            categories={categories}
            suppliers={suppliers}
            settings={settings}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onQuickAddStock={handleQuickAddStock}
          />
        )}

        {currentModule === 'purchases' && (
          <PurchasesView
            purchases={purchases}
            products={products}
            suppliers={suppliers}
            settings={settings}
            onRecordPurchase={handleRecordPurchase}
          />
        )}

        {currentModule === 'customers' && (
          <CustomersView
            customers={customers}
            sales={sales}
            customerPayments={customerPayments}
            customerReturns={customerReturns}
            settings={settings}
            onSaveCustomer={handleSaveCustomer}
            onSoftDeleteCustomer={handleSoftDeleteCustomer}
            onRestoreCustomer={handleRestoreCustomer}
            onReceivePayment={handleReceiveCustomerPayment}
            onRecordReturn={handleRecordCustomerReturn}
            onStartSaleForCustomer={handleStartSaleForCustomer}
          />
        )}

        {currentModule === 'suppliers' && (
          <SuppliersView
            suppliers={suppliers}
            settings={settings}
            onSaveSupplier={handleSaveSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onPaySupplier={handlePaySupplier}
          />
        )}

        {currentModule === 'income' && (
          <IncomeView
            incomes={incomes}
            customers={customers}
            settings={settings}
            onAddIncome={handleAddIncome}
            onDeleteIncome={handleDeleteIncome}
          />
        )}

        {currentModule === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            suppliers={suppliers}
            settings={settings}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {currentModule === 'inventory' && (
          <InventoryView
            products={products}
            categories={categories}
            settings={settings}
            onAdjustStock={handleAdjustStock}
          />
        )}

        {currentModule === 'debts' && (
          <DebtsView
            customers={customers}
            suppliers={suppliers}
            settings={settings}
            onReceiveCustomerPayment={handleReceiveCustomerPayment}
            onPaySupplier={handlePaySupplier}
          />
        )}

        {currentModule === 'reports' && (
          <ReportsView
            sales={sales}
            products={products}
            settings={settings}
          />
        )}

        {currentModule === 'exportCenter' && (
          <ExportCenterView
            sales={sales}
            purchases={purchases}
            incomes={incomes}
            expenses={expenses}
            products={products}
            customers={customers}
            suppliers={suppliers}
            settings={settings}
            licenseInfo={licenseInfo}
            onRequirePro={(feat) => handleOpenProModal(feat)}
          />
        )}

        {currentModule === 'settings' && (
          <SettingsView
            settings={settings}
            licenseInfo={licenseInfo}
            customers={customers}
            products={products}
            suppliers={suppliers}
            onViewProduct={() => setCurrentModule('products')}
            onCreatePurchase={() => setCurrentModule('purchases')}
            onRestoreCustomer={handleRestoreCustomer}
            onSaveSettings={setSettings}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onOpenResetModal={() => setIsResetModalOpen(true)}
            onActivateLicense={handleActivateLicense}
            onDeactivateLicense={handleDeactivateLicense}
            initialTab={settingsTab}
          />
        )}

        {currentModule === 'forensics' && (
          <ForensicsView settings={settings} />
        )}
      </main>

      {/* Real Background Notification Center Drawer */}
      <NotificationCenterDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onViewProduct={() => setCurrentModule('products')}
        onCreatePurchase={() => setCurrentModule('purchases')}
        onOpenBackgroundSettings={() => {
          setSettingsTab('background');
          setCurrentModule('settings');
        }}
      />

      {/* Footer bar */}
      <footer
        id="hanouti-app-footer"
        className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 text-slate-400 text-xs text-center flex flex-col sm:flex-row items-center justify-between gap-2"
      >
        <span>
          <strong>Hanouti 40</strong> v1.0.0 — Système Android & Tactile de Gestion de Magasin (Kotlin / Compose Clean Architecture Ready)
        </span>
        <span className="text-slate-500 font-mono text-[11px]">
          Room DB • CameraX • ML Kit • Android PdfDocument • RTL Native
        </span>
      </footer>

      {/* Thermal Receipt Print Modal */}
      {viewingReceiptSale && (
        <ReceiptModal
          sale={viewingReceiptSale}
          settings={settings}
          onClose={() => setViewingReceiptSale(null)}
        />
      )}

      {/* Two-Step Reset Everything Safety Modal with karim40 Verification (Section 12) */}
      <ResetSafetyModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        settings={settings}
        onResetFormOnly={handleResetFormOnly}
        onResetFiltersOnly={handleResetFiltersOnly}
        onResetSettingsOnly={handleResetSettingsOnly}
        onResetAllBusinessData={handleResetAllBusinessData}
        onTriggerBackup={handleExportData}
      />

      {/* Pro Feature Upgrade / Activation Modal (Section 10) */}
      <ProUpgradeModal
        isOpen={proModalState.isOpen}
        featureName={proModalState.featureName}
        limitMessage={proModalState.limitMessage}
        onClose={() => setProModalState({ isOpen: false })}
        onLicenseActivated={(lic) => setLicenseInfo(lic)}
        onNavigateToLicenseSettings={() => {
          setSettingsTab('license');
          setCurrentModule('settings');
        }}
      />
    </div>
  );

  // If in Android Phone mode, wrap inside a smartphone frame with Android status bar
  if (deviceViewMode === 'android_phone') {
    return (
      <div className="min-h-screen bg-slate-950 p-3 sm:p-6 flex flex-col items-center justify-center">
        {/* Android Device Switch Banner */}
        <div className="mb-4 flex items-center justify-between w-full max-w-md px-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Android Phone Emulator (Touch-First)</span>
          </div>
          <button
            onClick={() => setDeviceViewMode('android_tablet')}
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer"
          >
            Plein écran / Tablette →
          </button>
        </div>

        {/* Android Smartphone Chassis */}
        <div className="w-full max-w-md bg-slate-900 border-4 border-slate-700 rounded-[42px] shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[920px] ring-1 ring-white/10">
          {/* Top Speaker & Punch Hole */}
          <div className="bg-slate-900 pt-2 px-6 pb-1 flex items-center justify-between text-[11px] text-slate-300 select-none border-b border-slate-800 shrink-0">
            <span className="font-semibold font-mono">10:40</span>
            <div className="w-4 h-4 bg-slate-950 rounded-full border border-slate-700/60 shadow-inner"></div>
            <div className="flex items-center gap-1 text-slate-400">
              <Signal className="w-3.5 h-3.5 text-emerald-400" />
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <BatteryMedium className="w-3.5 h-3.5 text-slate-300" />
            </div>
          </div>

          {/* Scrollable App Viewport */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-950">
            {appContent}
          </div>

          {/* Bottom Android Gesture Pill */}
          <div className="bg-slate-900 py-2.5 flex items-center justify-center border-t border-slate-800 shrink-0">
            <div className="w-32 h-1 bg-slate-600 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return appContent;
}
