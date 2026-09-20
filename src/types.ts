export type Language = 'ar' | 'fr' | 'en';
export type Currency = 'DZD' | 'MAD' | 'TND' | 'EUR' | 'USD';
export type PrinterType = 'thermal80' | 'thermal58' | 'a4';
export type DeviceViewMode = 'phone' | 'tablet' | 'desktop' | 'android_phone' | 'android_tablet';

export interface Category {
  id: number;
  name: string;
  nameAr?: string;
  description?: string;
}

export interface Product {
  id: number;
  barcode: string;
  name: string;
  nameAr?: string;
  categoryId: number;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStock: number;
  unit: string;
  supplierId?: number;
  sku?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  creditLimit: number;
  currentDebt: number;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  currentDebt: number;
}

export interface SaleItem {
  productId: number;
  barcode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  lineTotal: number;
}

export interface Sale {
  id: number;
  invoiceNumber: string;
  saleDate: string;
  customerId?: number;
  customerName?: string;
  cashierName?: string;
  subtotal: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  debtAmount: number;
  paymentMethod: 'CASH' | 'CREDIT' | 'CARD' | 'SPLIT';
  items: SaleItem[];
  status: 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export interface PurchaseItem {
  productId: number;
  productName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface Purchase {
  id: number;
  billNumber: string;
  purchaseDate: string;
  supplierId: number;
  supplierName: string;
  totalAmount: number;
  amountPaid: number;
  debtAmount: number;
  items: PurchaseItem[];
  notes?: string;
}

export interface CustomerPayment {
  id: number;
  customerId: number;
  customerName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
}

export interface SupplierPayment {
  id: number;
  supplierId: number;
  supplierName: string;
  paymentDate: string;
  amount: number;
  notes?: string;
}

export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  movementType: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN';
  quantityDelta: number;
  balanceAfter: number;
  timestamp: string;
  notes?: string;
}

export type IncomeCategory =
  | 'SALES'
  | 'CUSTOMER_PAYMENT'
  | 'SERVICE'
  | 'RENTAL'
  | 'DELIVERY'
  | 'SCRAP'
  | 'BONUS'
  | 'OTHER';

export interface Income {
  id: number;
  date: string;
  amount: number;
  description: string;
  category: IncomeCategory | string;
  paymentMethod: 'CASH' | 'CARD' | 'CHECK' | 'TRANSFER' | 'OTHER';
  customerId?: number;
  customerName?: string;
  reference?: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'RENT'
  | 'ELECTRICITY'
  | 'WATER'
  | 'INTERNET'
  | 'TRANSPORT'
  | 'SALARIES'
  | 'PURCHASES'
  | 'MAINTENANCE'
  | 'PACKAGING'
  | 'TAXES'
  | 'OTHER';

export interface Expense {
  id: number;
  date: string;
  category: ExpenseCategory | string;
  description: string;
  amount: number;
  paymentMethod: 'CASH' | 'CARD' | 'CHECK' | 'TRANSFER' | 'OTHER';
  supplierId?: number;
  supplierName?: string;
  reference?: string;
  notes?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  phone: string;
  address: string;
  rcNumber: string;
  nifNumber: string;
  email?: string;
  currency: Currency;
  language: Language;
  printerType: PrinterType;
  receiptFooter: string;
  alertMinStock: boolean;
  invoicePrefix?: string;
  taxRate?: number;
  enableTax?: boolean;
}

export type AppModule =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'purchases'
  | 'customers'
  | 'suppliers'
  | 'inventory'
  | 'debts'
  | 'income'
  | 'expenses'
  | 'reports'
  | 'export_center'
  | 'exportCenter'
  | 'settings'
  | 'forensics';

// License & Edition Types (FREE vs PRO)
export type LicenseEdition = 'FREE' | 'PRO';
export type LicenseStatus =
  | 'NOT_ACTIVATED'
  | 'ACTIVE'
  | 'AVAILABLE'
  | 'EXPIRED'
  | 'INVALID'
  | 'REVOKED'
  | 'SUSPENDED'
  | 'ACTIVATION_LIMIT_REACHED';

export interface LicenseInfo {
  licenseId: string;
  edition: LicenseEdition;
  status: LicenseStatus;
  activationDate?: string;
  expiryDate?: string;
  licenseType?: string;
  deviceId?: string;
  signature?: string;
  customerName?: string;
}

export enum Feature {
  UNLIMITED_PRODUCTS = 'UNLIMITED_PRODUCTS',
  UNLIMITED_CUSTOMERS = 'UNLIMITED_CUSTOMERS',
  UNLIMITED_SUPPLIERS = 'UNLIMITED_SUPPLIERS',
  UNLIMITED_INVOICES = 'UNLIMITED_INVOICES',
  UNLIMITED_SALES = 'UNLIMITED_SALES',
  UNLIMITED_PURCHASES = 'UNLIMITED_PURCHASES',
  ADVANCED_DASHBOARD = 'ADVANCED_DASHBOARD',
  ADVANCED_REPORTS = 'ADVANCED_REPORTS',
  EXPORT_ALL_PDF = 'EXPORT_ALL_PDF',
  FULL_PDF_REPORTS = 'FULL_PDF_REPORTS',
  STATEMENTS_PDF = 'STATEMENTS_PDF',
  INVENTORY_PDF = 'INVENTORY_PDF',
  PROFIT_LOSS_PDF = 'PROFIT_LOSS_PDF',
  ADVANCED_ANALYTICS = 'ADVANCED_ANALYTICS',
  HID_SCANNER = 'HID_SCANNER',
  STOCK_ALERTS = 'STOCK_ALERTS',
  EXPIRY_TRACKING = 'EXPIRY_TRACKING',
  CUSTOM_INVOICE_TEMPLATES = 'CUSTOM_INVOICE_TEMPLATES',
  COMPANY_BRANDING = 'COMPANY_BRANDING',
  AUTOMATIC_BACKUP = 'AUTOMATIC_BACKUP',
}

export interface ScannerHistoryItem {
  id: string;
  barcode: string;
  timestamp: string;
  productName?: string;
  status: 'FOUND' | 'NOT_FOUND';
}
