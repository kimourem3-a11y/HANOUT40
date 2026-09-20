-- ============================================================
-- HANOUTI 40 — DATABASE DDL SPECIFICATION (SQLite 3 / FireDAC)
-- Application: Hanouti 40 — Gestion de magasin
-- Database File: Hanouti40.db
-- ============================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

-- 1. Categories
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    address TEXT,
    current_debt REAL NOT NULL DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Customers
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    credit_limit REAL NOT NULL DEFAULT 0.00,
    current_debt REAL NOT NULL DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Products
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    purchase_price REAL NOT NULL DEFAULT 0.00,
    selling_price REAL NOT NULL DEFAULT 0.00,
    stock_quantity REAL NOT NULL DEFAULT 0.00,
    min_stock REAL NOT NULL DEFAULT 5.00,
    unit TEXT DEFAULT 'unit',
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Sales Invoices
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL UNIQUE,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    subtotal REAL NOT NULL DEFAULT 0.00,
    discount REAL NOT NULL DEFAULT 0.00,
    tax_amount REAL NOT NULL DEFAULT 0.00,
    total_amount REAL NOT NULL DEFAULT 0.00,
    amount_paid REAL NOT NULL DEFAULT 0.00,
    debt_amount REAL NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL DEFAULT 'CASH', -- CASH, CREDIT, CARD, SPLIT
    status TEXT NOT NULL DEFAULT 'COMPLETED',    -- COMPLETED, CANCELLED
    notes TEXT
);

-- 6. Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity REAL NOT NULL DEFAULT 1.00,
    unit_price REAL NOT NULL DEFAULT 0.00,
    purchase_price REAL NOT NULL DEFAULT 0.00,
    line_total REAL NOT NULL DEFAULT 0.00
);

-- 7. Purchases
CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_number TEXT NOT NULL UNIQUE,
    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    total_amount REAL NOT NULL DEFAULT 0.00,
    amount_paid REAL NOT NULL DEFAULT 0.00,
    debt_amount REAL NOT NULL DEFAULT 0.00,
    notes TEXT
);

-- 8. Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity REAL NOT NULL DEFAULT 1.00,
    unit_cost REAL NOT NULL DEFAULT 0.00,
    line_total REAL NOT NULL DEFAULT 0.00
);

-- 9. Customer Payments (Debt settlements)
CREATE TABLE IF NOT EXISTS customer_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'CASH',
    notes TEXT
);

-- 10. Supplier Payments
CREATE TABLE IF NOT EXISTS supplier_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    amount REAL NOT NULL,
    notes TEXT
);

-- 11. Stock Movements Audit Ledger
CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    movement_type TEXT NOT NULL, -- 'SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN'
    quantity_delta REAL NOT NULL,
    balance_after REAL NOT NULL,
    reference_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Indexes for lightning fast POS lookups
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
