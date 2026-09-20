import { Language } from '../types';

export interface TranslationDict {
  appName: string;
  appSubtitle: string;
  dashboard: string;
  products: string;
  sales: string;
  purchases: string;
  customers: string;
  suppliers: string;
  inventory: string;
  debts: string;
  reports: string;
  settings: string;
  forensics: string;
  posCashier: string;
  dailySales: string;
  dailyProfit: string;
  stockValue: string;
  customerDebts: string;
  supplierDebts: string;
  lowStockAlerts: string;
  quickNewSale: string;
  quickNewProduct: string;
  quickCustomerPayment: string;
  recentSales: string;
  barcodeSearchPlaceholder: string;
  productSearchPlaceholder: string;
  barcode: string;
  productName: string;
  allCategories: string;
  addToCart: string;
  cartEmpty: string;
  cartSubtotal: string;
  discount: string;
  tax: string;
  cartTotal: string;
  amountReceived: string;
  changeDue: string;
  paymentMethod: string;
  cash: string;
  credit: string;
  card: string;
  split: string;
  checkout: string;
  printReceipt: string;
  customer: string;
  anonymousClient: string;
  actions: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
  close: string;
  qty: string;
  unitPrice: string;
  costPrice: string;
  sellingPrice: string;
  stock: string;
  minStock: string;
  unit: string;
  margin: string;
  phone: string;
  address: string;
  creditLimit: string;
  balanceDue: string;
  receivePayment: string;
  makePayment: string;
  amount: string;
  notes: string;
  success: string;
  error: string;
  confirmDelete: string;
  date: string;
  invoiceNumber: string;
  itemsCount: string;
  status: string;
  completed: string;
  cancelled: string;
  language: string;
  currency: string;
  storeDetails: string;
  printerSettings: string;
  backupRestore: string;
  exportDatabase: string;
  importDatabase: string;
  resetDemoData: string;
  income: string;
  expenses: string;
  exportCenter: string;
  exportPdf: string;
  exportAll: string;
  reset: string;
  resetForm: string;
  resetFilters: string;
  resetSettings: string;
  resetDatabase: string;
  grossProfit: string;
  netProfit: string;
  scanCamera: string;
  deviceMode: string;
}

export const translations: Record<Language, TranslationDict> = {
  ar: {
    appName: 'حانوتي 40',
    appSubtitle: 'برنامج إدارة المحل والمخزون ونقاط البيع',
    dashboard: 'الرئيسية',
    products: 'المنتجات',
    sales: 'المبيعات',
    purchases: 'المشتريات',
    customers: 'الزبائن',
    suppliers: 'الموردون',
    inventory: 'المخزون',
    debts: 'الديون',
    reports: 'التقارير',
    settings: 'الإعدادات',
    forensics: 'الفحص الجنائي',
    posCashier: 'نقطة البيع (الكاسة)',
    dailySales: 'مبيعات اليوم',
    dailyProfit: 'الربح التقديري',
    stockValue: 'قيمة المخزون',
    customerDebts: 'ديون الزبائن (لنا)',
    supplierDebts: 'مستحقات الموردين (علينا)',
    lowStockAlerts: 'تنبيهات انخفاض المخزون',
    quickNewSale: 'عملية بيع سريعة',
    quickNewProduct: 'إضافة منتج جديد',
    quickCustomerPayment: 'تسديد دين زبون',
    recentSales: 'آخر عمليات البيع',
    barcodeSearchPlaceholder: 'امسح الباركود أو ابحث برقم المنتج...',
    productSearchPlaceholder: 'ابحث عن اسم المنتج أو التصنيف...',
    barcode: 'الباركود',
    productName: 'اسم المنتج',
    allCategories: 'جميع الأصناف',
    addToCart: 'إضافة للسلة',
    cartEmpty: 'السلة فارغة حالياً. امسح الباركود للبدء.',
    cartSubtotal: 'المجموع الفرعي',
    discount: 'الخصم',
    tax: 'الضريبة',
    cartTotal: 'المبلغ الإجمالي',
    amountReceived: 'المبلغ المستلم',
    changeDue: 'الباقي للزبون',
    paymentMethod: 'طريقة الدفع',
    cash: 'نقداً',
    credit: 'دين (آجل)',
    card: 'بطاقة بنكية',
    split: 'دفع مجزأ',
    checkout: 'تأكيد ودفع (F12)',
    printReceipt: 'طباعة الوصل',
    customer: 'الزبون',
    anonymousClient: 'زبون عادي (نقدي)',
    actions: 'إجراءات',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    close: 'إغلاق',
    qty: 'الكمية',
    unitPrice: 'سعر البيع',
    costPrice: 'سعر الشراء',
    sellingPrice: 'سعر البيع',
    stock: 'المخزون الحالي',
    minStock: 'الحد الأدنى',
    unit: 'الوحدة',
    margin: 'نسبة الهامش',
    phone: 'رقم الهاتف',
    address: 'العنوان',
    creditLimit: 'سقف الدين المسموح',
    balanceDue: 'الرصيد المستحق',
    receivePayment: 'قبض دفعة من زبون',
    makePayment: 'تسديد دفعة لمورد',
    amount: 'المبلغ',
    notes: 'ملاحظات',
    success: 'تمت العملية بنجاح',
    error: 'حدث خطأ غير متوقع',
    confirmDelete: 'هل أنت متأكد من الحذف؟',
    date: 'التاريخ',
    invoiceNumber: 'رقم الوصل',
    itemsCount: 'عدد المواد',
    status: 'الحالة',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    language: 'لغة الواجهة',
    currency: 'العملة',
    storeDetails: 'بيانات المحل',
    printerSettings: 'إعدادات الطابعة الحرارية',
    backupRestore: 'النسخ الاحتياطي والاستعادة',
    exportDatabase: 'تصدير قاعدة البيانات (JSON/SQL)',
    importDatabase: 'استعادة من ملف',
    resetDemoData: 'إعادة ضبط البيانات التجريبية',
    income: 'المداخيل',
    expenses: 'المصاريف',
    exportCenter: 'مركز التصدير PDF',
    exportPdf: 'تصدير PDF',
    exportAll: 'تصدير كل التقارير (ZIP)',
    reset: 'إعادة التعيين الآمنة',
    resetForm: 'إعادة تعيين النموذج الحالي',
    resetFilters: 'إعادة تعيين الفلاتر والبحث',
    resetSettings: 'استعادة الإعدادات الافتراضية',
    resetDatabase: 'مسح جميع بيانات النشاط التجاري',
    grossProfit: 'إجمالي هامش الربح',
    netProfit: 'صافي الربح الفعلي',
    scanCamera: 'مسح الباركود بالكاميرا',
    deviceMode: 'شاشة أندرويد',
  },
  fr: {
    appName: 'Hanouti 40',
    appSubtitle: 'Gestion de magasin & Point de Vente',
    dashboard: 'Accueil',
    products: 'Produits',
    sales: 'Ventes',
    purchases: 'Achats',
    customers: 'Clients',
    suppliers: 'Fournisseurs',
    inventory: 'Stock',
    debts: 'Dettes',
    reports: 'Rapports',
    settings: 'Paramètres',
    forensics: 'Analyse Légale',
    posCashier: 'Caisse / Point de Vente',
    dailySales: 'Ventes du Jour',
    dailyProfit: 'Marge Estimée',
    stockValue: 'Valeur du Stock',
    customerDebts: 'Créances Clients',
    supplierDebts: 'Dettes Fournisseurs',
    lowStockAlerts: 'Alertes Rupture de Stock',
    quickNewSale: 'Nouvelle Vente',
    quickNewProduct: 'Nouveau Produit',
    quickCustomerPayment: 'Encaisser Dette',
    recentSales: 'Dernières Ventes',
    barcodeSearchPlaceholder: 'Scanner code-barres ou saisir...',
    productSearchPlaceholder: 'Rechercher par nom ou catégorie...',
    barcode: 'Code-barres',
    productName: 'Désignation',
    allCategories: 'Toutes les catégories',
    addToCart: 'Ajouter au panier',
    cartEmpty: 'Panier vide. Scannez un article pour commencer.',
    cartSubtotal: 'Sous-Total',
    discount: 'Remise',
    tax: 'TVA',
    cartTotal: 'Net à Payer',
    amountReceived: 'Montant Reçu',
    changeDue: 'Monnaie Rendu',
    paymentMethod: 'Mode de Paiement',
    cash: 'Espèces',
    credit: 'Crédit (Dette)',
    card: 'Carte Bancaire',
    split: 'Mixte / Partiel',
    checkout: 'Valider Vente (F12)',
    printReceipt: 'Imprimer Ticket',
    customer: 'Client',
    anonymousClient: 'Client Comptoir',
    actions: 'Actions',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    close: 'Fermer',
    qty: 'Qté',
    unitPrice: 'Prix Unitaire',
    costPrice: "Prix d'Achat",
    sellingPrice: 'Prix de Vente',
    stock: 'Stock Actuel',
    minStock: 'Alerte Min',
    unit: 'Unité',
    margin: 'Marge %',
    phone: 'Téléphone',
    address: 'Adresse',
    creditLimit: 'Plafond Crédit',
    balanceDue: 'Reste Dû',
    receivePayment: 'Versement Client',
    makePayment: 'Règlement Fournisseur',
    amount: 'Montant',
    notes: 'Notes',
    success: 'Opération réussie',
    error: 'Une erreur est survenue',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer ?',
    date: 'Date',
    invoiceNumber: 'N° Facture',
    itemsCount: 'Articles',
    status: 'Statut',
    completed: 'Terminé',
    cancelled: 'Annulé',
    language: "Langue de l'interface",
    currency: 'Devise',
    storeDetails: 'Coordonnées du Magasin',
    printerSettings: 'Imprimante Ticket (ESC/POS)',
    backupRestore: 'Sauvegarde & Restauration',
    exportDatabase: 'Exporter la Base (JSON/SQL)',
    importDatabase: 'Restaurer depuis un fichier',
    resetDemoData: 'Réinitialiser Données Démo',
    income: 'Revenus & Entrées',
    expenses: 'Dépenses & Charges',
    exportCenter: 'Centre d\'Exportation PDF',
    exportPdf: 'Exporter en PDF',
    exportAll: 'Tout Exporter (Archive ZIP)',
    reset: 'Réinitialisation Sécurisée',
    resetForm: 'Réinitialiser le formulaire',
    resetFilters: 'Réinitialiser les filtres',
    resetSettings: 'Restaurer paramètres par défaut',
    resetDatabase: 'Effacer toutes les données commerciales',
    grossProfit: 'Marge Commerciale Brute',
    netProfit: 'Bénéfice Net Réalisé',
    scanCamera: 'Scanner avec la caméra',
    deviceMode: 'Affichage Android',
  },
  en: {
    appName: 'Hanouti 40',
    appSubtitle: 'Store Management & Point of Sale System',
    dashboard: 'Dashboard',
    products: 'Products',
    sales: 'Sales',
    purchases: 'Purchases',
    customers: 'Customers',
    suppliers: 'Suppliers',
    inventory: 'Inventory',
    debts: 'Debts',
    reports: 'Reports',
    settings: 'Settings',
    forensics: 'Forensic Analysis',
    posCashier: 'Point of Sale (Cashier)',
    dailySales: 'Daily Sales',
    dailyProfit: 'Estimated Profit',
    stockValue: 'Inventory Value',
    customerDebts: 'Customer Debts',
    supplierDebts: 'Supplier Debts',
    lowStockAlerts: 'Low Stock Alerts',
    quickNewSale: 'New Sale',
    quickNewProduct: 'New Product',
    quickCustomerPayment: 'Customer Payment',
    recentSales: 'Recent Transactions',
    barcodeSearchPlaceholder: 'Scan barcode or enter code...',
    productSearchPlaceholder: 'Search by product name or category...',
    barcode: 'Barcode',
    productName: 'Product Name',
    allCategories: 'All Categories',
    addToCart: 'Add to Cart',
    cartEmpty: 'Cart is empty. Scan an item or select a product to begin.',
    cartSubtotal: 'Subtotal',
    discount: 'Discount',
    tax: 'Tax',
    cartTotal: 'Total Payable',
    amountReceived: 'Amount Received',
    changeDue: 'Change Due',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    credit: 'Credit / Debt',
    card: 'Card',
    split: 'Split Payment',
    checkout: 'Checkout (F12)',
    printReceipt: 'Print Receipt',
    customer: 'Customer',
    anonymousClient: 'Walk-in Customer',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    qty: 'Qty',
    unitPrice: 'Unit Price',
    costPrice: 'Cost Price',
    sellingPrice: 'Selling Price',
    stock: 'Current Stock',
    minStock: 'Min Stock',
    unit: 'Unit',
    margin: 'Margin %',
    phone: 'Phone',
    address: 'Address',
    creditLimit: 'Credit Limit',
    balanceDue: 'Balance Due',
    receivePayment: 'Receive Customer Payment',
    makePayment: 'Pay Supplier',
    amount: 'Amount',
    notes: 'Notes',
    success: 'Operation completed successfully',
    error: 'An unexpected error occurred',
    confirmDelete: 'Are you sure you want to delete this record?',
    date: 'Date',
    invoiceNumber: 'Invoice #',
    itemsCount: 'Items',
    status: 'Status',
    completed: 'Completed',
    cancelled: 'Cancelled',
    language: 'Interface Language',
    currency: 'Currency',
    storeDetails: 'Store Information',
    printerSettings: 'Thermal Printer Settings',
    backupRestore: 'Backup & Restore',
    exportDatabase: 'Export Database (JSON/SQL)',
    importDatabase: 'Restore from File',
    resetDemoData: 'Reset Demo Data',
    income: 'Income',
    expenses: 'Expenses',
    exportCenter: 'Export Center (PDF)',
    exportPdf: 'Export to PDF',
    exportAll: 'Export All Reports (ZIP)',
    reset: 'Safe Reset',
    resetForm: 'Reset Current Form',
    resetFilters: 'Reset Filters',
    resetSettings: 'Reset Application Settings',
    resetDatabase: 'Reset All Business Data',
    grossProfit: 'Gross Profit',
    netProfit: 'Net Income',
    scanCamera: 'Scan with Camera',
    deviceMode: 'Android Device View',
  }
};
