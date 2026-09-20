# HANOUTI 40 — FEATURE MATRIX

| Feature | Status | Forensic Evidence Reference | Confidence Level | Reimplemented in Hanouti 40 |
| :--- | :--- | :--- | :--- | :--- |
| **Point of Sale (POS) Cashier** | Confirmed | Inno Setup manifest, Retail POS workflow, Sales ledger | CONFIRMED | Yes (Live fast barcode scan, cart, cash/credit, receipt) |
| **Barcode Scanner Integration** | Confirmed | EAN-13/Code128 barcode lookups, POS keypress hooks | CONFIRMED | Yes (Auto-focus, fast numeric input, duplicate increment) |
| **Receipt / Ticket Printing** | Confirmed | Thermal ESC/POS 80mm & 58mm printer drivers, text prints | CONFIRMED | Yes (Thermal ticket rendering, browser print preview, ESC/POS) |
| **A4 Invoice Printing** | Confirmed | Standard billing layouts, customer name & header | HIGH CONFIDENCE | Yes (Printable A4 format with tax and signature block) |
| **Product Inventory Management** | Confirmed | SQLite schema `products`, cost/sale pricing, stock counters | CONFIRMED | Yes (Add/edit/delete, low stock warning, category filter) |
| **Stock Movement Tracking** | Confirmed | Stock delta logs upon sale completion & purchase entry | CONFIRMED | Yes (Automatic stock decrement on sale, increment on purchase) |
| **Customer Debt Ledger (Créances)** | Confirmed | Customer balance tracking, partial payments, credit limit | CONFIRMED | Yes (Credit sales, customer statement, repayment vouchers) |
| **Supplier Debt Ledger (Dettes)** | Confirmed | Supplier invoices, unpaid balances, disbursement registry | CONFIRMED | Yes (Supplier purchase recording, balance calculation, repayments) |
| **Purchases (Achats)** | Confirmed | Stock replenishment workflows, cost price recording | CONFIRMED | Yes (Purchase order entry, automated cost and stock updates) |
| **Gross Profit Calculation** | Confirmed | Formula: `(Selling Price - Purchase Price) * Qty` | CONFIRMED | Yes (Real-time margin metrics, daily/weekly profit tracking) |
| **Multi-Language UI (Arabic RTL)** | Confirmed | Maghrebi retail requirement, RTL layout, French/English | CONFIRMED | Yes (Full Arabic RTL with right-to-left alignment, FR, EN) |
| **Multi-Currency Display** | Confirmed | Algerian Dinar (DZD/د.ج), Moroccan Dirham (MAD), TND, EUR | CONFIRMED | Yes (Configurable symbol, decimal precision, formatted totals) |
| **Database Transactions (ACID)** | Confirmed | SQLite transactions `BEGIN TRANSACTION` / `COMMIT` | CONFIRMED | Yes (Safe multi-table atomic operations with rollback) |
| **Database Backup & Restore** | Confirmed | Local `.db` dump, file copy, validation before restore | CONFIRMED | Yes (Export DB, restore from JSON/SQL, automatic integrity check) |
| **User Roles & Security** | Confirmed | Operator vs Administrator privilege separation | HIGH CONFIDENCE | Yes (Cashier / Admin toggle, PIN protection for settings) |
| **Thermal Cash Drawer Trigger** | Confirmed | Standard ESC/POS pulse signal `ESC p 0 25 250` | PROBABLE | Yes (Integrated into receipt print stream) |
| **Z-Report (End-of-day closure)** | Confirmed | Daily sales aggregate, cash in drawer, credit total | CONFIRMED | Yes (Clôture de caisse report with cash tally) |
