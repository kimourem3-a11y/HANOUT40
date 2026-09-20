# HANOUTI 40 — SCREEN MAP & NAVIGATION HIERARCHY

## Application Navigation Flow

```
+-------------------------------------------------------------+
|                          START                              |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                LOGIN / AUTHENTICATION DIALOG                |
|             (Operator / Cashier / Administrator)            |
+-------------------------------------------------------------+
                              |
                              v
+=============================================================+
|                 MAIN WINDOW (HANOUTI 40)                    |
|    Title: "Hanouti 40 — Gestion de magasin / حانوتي 40"     |
+=============================================================+
  |
  +---> [1] DASHBOARD (الرئيسية / Accueil)
  |     ├── Live KPI Cards (Daily Sales, Profit, Inventory, Debt)
  |     ├── Low Stock Urgent Alerts (Alertes rupture de stock)
  |     ├── Quick POS Action Launcher
  |     └── Recent Transactions Summary Feed
  |
  +---> [2] POINT OF SALE / SALES (المبيعات / Ventes & Caisse)
  |     ├── Barcode Scanner Fast Input (EAN-13 / Code128)
  |     ├── Live Product Search / Quick Category Grid
  |     ├── Active Cart Line Items (Qty, Unit Price, Subtotal)
  |     ├── Customer Selection & Debt Ceiling Indicator
  |     ├── Payment Modal (Cash, Customer Credit/Debt, Card, Split)
  |     ├── Receipt Generator (80mm / 58mm ESC/POS Thermal)
  |     └── Sales Transaction History & Invoice Cancellation
  |
  +---> [3] PRODUCTS (المنتجات / Produits)
  |     ├── Product Catalog Table with Live Filtering
  |     ├── Add / Edit Product Modal (Barcode, Name, Category, Prices)
  |     ├── Stock Threshold Rules (Min Stock, Reorder Alert)
  |     ├── Barcode Label Generator
  |     └── CSV/Excel Product Catalog Import & Export
  |
  +---> [4] PURCHASES (المشتريات / Achats)
  |     ├── Purchase Order Registration (Entrée de stock)
  |     ├── Supplier Selection
  |     ├── Stock Arrival Quantity & Cost Price Logging
  |     ├── Purchase Payment Status (Paid / Cash / Supplier Credit)
  |     └── Historical Purchase Invoices Archive
  |
  +---> [5] CUSTOMERS (الزبائن / Clients)
  |     ├── Customer Directory (Name, Phone, Address, Credit Limit)
  |     ├── Account Receivables (Créances / Dettes clients)
  |     ├── Customer Payment Voucher Modal (Versement dette)
  |     └── Customer Statement of Account (Extrait de compte)
  |
  +---> [6] SUPPLIERS (الموردون / Fournisseurs)
  |     ├── Supplier Directory (Company Name, Contact, Phone)
  |     ├── Accounts Payable (Dettes fournisseurs)
  |     ├── Supplier Payment Disbursement (Paiement fournisseur)
  |     └── Supplier Delivery & Purchase History
  |
  +---> [7] INVENTORY & STOCK (المخزون / Stock)
  |     ├── Real-time Inventory Balance Table
  |     ├── Stock Movement Audit Log (Sale, Purchase, Manual Adjustment)
  |     ├── Inventory Valuation (At Cost vs. At Retail Price)
  |     └── Stock Level Warning Filter
  |
  +---> [8] DEBTS & RECEIVABLES (الديون / Dettes & Créances)
  |     ├── Dual Tab View:
  |     │   ├── Customer Debts (الزبائن المدينون)
  |     │   └── Supplier Liabilities (مستحقات الموردين)
  |     ├── Quick Payment Processing Dialog
  |     └── Debt Aging & Settlement History
  |
  +---> [9] REPORTS & ANALYTICS (التقارير / Rapports)
  |     ├── Revenue & Net Profit Calculator (Date Range Filter)
  |     ├── Top Selling Products & Category Breakdown
  |     ├── Daily Z-Report (Clôture de caisse journalière)
  |     └── Financial Summary Export
  |
  +---> [10] SETTINGS (الإعدادات / Paramètres)
        ├── Store Profile (Store Name, Address, Phone, Receipt Header)
        ├── Currency Configuration (DZD, MAD, TND, EUR, USD)
        ├── Multi-Language Switcher (العربية RTL, Français, English)
        ├── Hardware Settings (Thermal Printer 80mm/58mm, Barcode Scanner)
        ├── Database Maintenance (Backup, Restore, Integrity Check)
        └── Security & User Accounts (Admin / Cashier Roles)
```
