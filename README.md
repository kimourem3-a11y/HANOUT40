# HANOUTI 40 — Gestion de Magasin (Point of Sale & Store Management)

![Hanouti 40](https://img.shields.io/badge/Release-v1.0.0-blue.svg)
![Delphi](https://img.shields.io/badge/Delphi-12%2B%20VCL-red.svg)
![SQLite](https://img.shields.io/badge/Database-SQLite%203-green.svg)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Web-orange.svg)

**Hanouti 40** (*حانوتي 40*) is an independent, clean-room point-of-sale (POS), stock control, and debts management suite designed specifically for retail grocery stores, general merchants, and commercial shops.

---

## 1. Features
- **Point of Sale (POS) Cashiering**: Real-time barcode scanner integration, fast search, shopping cart with line discounts, instant calculations, and cash change computation.
- **Thermal Receipt & Invoice Printing**: Built-in 80mm and 58mm ESC/POS thermal receipt formatting and standard A4 commercial invoice printing.
- **Inventory & Stock Management**: Real-time stock valuation at cost and retail price, automated low-stock warnings, and stock movement logs.
- **Customer Receivables (Créances / الديون)**: Customer account cards, debt limits, credit sales, and debt repayment vouchers.
- **Supplier Payables (Fournisseurs)**: Supplier purchasing, stock inward registration, and payment tracking.
- **Financial Analytics & Reports**: Gross profit margins, daily revenue, top-selling items, and Daily Z-Report (*clôture de caisse journalière*).
- **Multi-Language with Arabic RTL**: Seamless switching between العربية (Arabic RTL), Français, and English.
- **Data Durability & Backup**: Local SQLite database with transactional ACID safety and 1-click backup/restore.

---

## 2. Technology Stack & Architectures

### A. Windows Desktop Architecture (Native Delphi)
- **Framework**: Embarcadero Delphi 12+ VCL
- **Database Engine**: Embedded SQLite 3 with FireDAC (`TFDConnection`, `TFDQuery`, `TFDPhysSQLiteDriverLink`)
- **Installer**: Inno Setup 6 (`installer/Hanouti40Setup.iss`)
- **Compilation Targets**: Windows 32-bit (x86) and 64-bit (x64)

### B. Interactive Web Preview Architecture
- **Framework**: React 19 + TypeScript + Vite + Tailwind CSS
- **Features**: Complete client-side POS simulator, local storage persistence, printable receipts, and built-in **Forensic Inspector** for PE headers and hash analysis.

---

## 3. Database Schema Setup

The database schema is located at `Hanouti40/database/schema.sql`. It initializes:
1. `categories`
2. `suppliers`
3. `customers`
4. `products`
5. `sales` & `sale_items`
6. `purchases` & `purchase_items`
7. `customer_payments` & `supplier_payments`
8. `stock_movements`

---

## 4. Compilation & Deployment

### Building Windows Native Executable (Delphi)
1. Open `Hanouti40/Hanouti40.dpr` in Embarcadero Delphi 11/12+.
2. Select target configuration: **Release** - **Win32** or **Win64**.
3. Build Project: `Project -> Build Hanouti40` (or `Shift + F9`).
4. Output executable will be produced in `bin/Hanouti40.exe`.

### Building the Installer (Inno Setup)
1. Install [Inno Setup 6+](https://jrsoftware.org/isdl.php).
2. Open `Hanouti40/installer/Hanouti40Setup.iss`.
3. Click **Compile** (`Ctrl + F9`).
4. Output installer: `installer/Output/Hanouti40Setup.exe`.

### Running the Web Application
```bash
npm install
npm run dev
```
Open `http://localhost:3000` to interact with Hanouti 40 in your browser.

---

## 5. Testing
The test suite can be run directly via `Hanouti40/tests/Hanouti40.Tests.pas` or using the built-in test runner in the web interface.
