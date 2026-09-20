# HANOUTI 40 — RECONSTRUCTION & ARCHITECTURAL SPECIFICATION

## 1. Vision & Identity
**Hanouti 40** (Algerian / Maghrebi retail terminology: *حانوتي 40 — Gestion de magasin*) is an independent, clean-room point of sale (POS), stock control, and debts management suite. It delivers high-speed transactional performance, offline durability, barcode scanner ergonomics, thermal receipt generation, and bidirectional Arabic/French/English localization.

---

## 2. Technical Stack & Implementation Architecture

### A. Windows Native Standalone Build
- **Target OS**: Windows 7 SP1, Windows 8.1, Windows 10, Windows 11 (x86 & x64)
- **Primary Language**: Delphi 12+ (Object Pascal) with VCL framework
- **Data Access Layer**: Embarcadero FireDAC with `TFDPhysSQLiteDriverLink`
- **Database Engine**: Embedded SQLite 3 (`sqlite3.dll` or statically linked)
- **Reporting & Printing**: Direct ESC/POS thermal command stream & VCL `TPrinter` canvas
- **Installer**: Inno Setup 6 (`installer/Hanouti40Setup.iss`)

### B. High-Fidelity Cross-Platform / Web Preview Build
- **Frontend Framework**: React 19 with TypeScript
- **Styling & Layout**: Tailwind CSS with native CSS logical properties for Arabic RTL/LTR bidirectional support
- **State & Local Persistence**: Client-side storage with SQL export, JSON backup, and live transaction rollback/commit engine
- **Thermal Receipt Engine**: Standard 80mm & 58mm CSS monospaced thermal receipt emulation with browser printing support
- **Forensic Inspector**: WebCrypto API (SHA-256/MD5) + client-side PE binary header parser

---

## 3. Core Functional Modules

### Module 1: Dashboard (الرئيسية / Accueil)
- Real-time KPI summaries:
  - Daily Revenue & Daily Profit
  - Total Active Inventory Value (at Cost and Retail)
  - Outstanding Customer Debts (*Créances*)
  - Pending Supplier Dettes
- Low-Stock threshold alerts with instant reorder links
- Quick-launch buttons: New Sale (F1), New Product (F2), Customer Repayment (F3)

### Module 2: Point of Sale & Cashier (المبيعات / Caisse)
- Immediate auto-focus on barcode scanner input field
- Rapid product search by Barcode, Name, or Category
- Real-time line item operations:
  - Quantity increment/decrement (`+`, `-`, or numeric entry)
  - Discount per item or whole invoice
  - Line deletion with instant subtotal recomputation
- Customer assignment:
  - Cash / Anonymous walk-in client
  - Named customer with current balance display and credit limit guard
- Checkout modal:
  - Amount received with instant change calculation
  - Multi-payment: Cash, Credit (debt), Card, Split
  - Direct receipt printing (Thermal 80mm/58mm or A4 invoice)
- Atomic ACID transaction: sales record created, sale_items inserted, product stock decremented, and customer balance adjusted in a single atomic transaction.

### Module 3: Products & Catalog (المنتجات / Produits)
- Comprehensive catalog table with live text search and category chips
- Product attributes: Barcode, Name, Category, Purchase Price, Selling Price, Current Stock, Minimum Stock Alert, Unit (Piece, Kg, Box, Litre), Default Supplier
- Margin analysis indicator: displays calculated gross margin percentage ($$\frac{\text{Sale} - \text{Cost}}{\text{Sale}} \times 100$$)
- Low-stock badge indicator

### Module 4: Purchases & Stock Inward (المشتريات / Achats)
- Supplier invoice registration
- Line items with received quantity and unit purchase cost
- Updates product cost price and increments stock level automatically
- Records supplier liability if invoice is unpaid or partially paid

### Module 5: Customers & Receivables (الزبائن / Créances)
- Customer directory with contact information
- Credit limit setting to prevent over-extension
- Real-time debt ledger showing cumulative unpaid balance
- Payment disbursement voucher with printable receipt

### Module 6: Suppliers & Payables (الموردون / Fournisseurs)
- Supplier contact management
- Outstanding payable ledger
- Supplier payment recording

### Module 7: Inventory & Stock Control (المخزون / Stock)
- Global inventory valuation at both Cost Price and Selling Price
- Estimated unrealized gross profit calculation
- Stock adjustment audit trail (Sale, Purchase, Manual Adjustment, Breakage/Return)

### Module 8: Debts Ledger (الديون / Dettes)
- Unified financial balance sheet for customer debts vs supplier payables
- Instant payment recording modal with invoice reference

### Module 9: Reports & Financial Analytics (التقارير / Rapports)
- Configurable date range (Today, Yesterday, Last 7 Days, This Month, All Time)
- Net sales, total cost of goods sold (COGS), gross profit
- Top selling products ranking
- End-of-Day Z-Report with cash-in-drawer tally

### Module 10: Settings & Localization (الإعدادات / Paramètres)
- Store Identity: Store Name, Tagline, Phone, Address, Commercial Register (RC/NIF)
- Currency selector: DZD (Algerian Dinar / د.ج), MAD (Moroccan Dirham / د.م.), TND (Tunisian Dinar), EUR (€), USD ($)
- Language Switcher:
  - العربية (Arabic) with comprehensive RTL layout
  - Français (French)
  - English
- Printer Mode: 80mm Thermal, 58mm Thermal, A4 Billing
- Database Backup (JSON / SQL format) and Restore verification
