# HANOUTI 40 — DATABASE SCHEMA & ENTITY RELATIONSHIP SPECIFICATION

## Database Engine
- **Engine**: SQLite 3 (Standard for Delphi FireDAC `TFDPhysSQLiteDriverLink` and Client-Side Embedded Storage)
- **File**: `Hanouti40.db`
- **Encoding**: UTF-8
- **Pragmas**:
  ```sql
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  ```

---

## Entity Relationship Diagram (ERD)

```
       +--------------------+
       |     categories     |
       +--------------------+
                 | 1
                 |
                 | N
       +--------------------+          1 +--------------------+
       |      products      |<-----------|     suppliers      |
       +--------------------+            +--------------------+
            | 1          | 1                        | 1
            |            |                          |
            | N          | N                        | N
+-------------------+ +--------------------+ +--------------------+
|    sale_items     | |   purchase_items   | | supplier_payments  |
+-------------------+ +--------------------+ +--------------------+
          N |                      N |
            | 1                      | 1
+-------------------+     +--------------------+
|       sales       |     |     purchases      |
+-------------------+     +--------------------+
       | N                           |
       | 1                           |
+-------------------+                |
|     customers     |<---------------+ (supplier liability links)
+-------------------+
       | 1
       | N
+-------------------+
| customer_payments |
+-------------------+
```

---

## Detailed Table Specifications

### 1. `categories`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique Category ID |
| `name` | TEXT | NOT NULL UNIQUE | Category Name |
| `description` | TEXT | NULL | Optional description |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 2. `products`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique Product ID |
| `barcode` | TEXT | NOT NULL UNIQUE | EAN-13, EAN-8 or custom code |
| `name` | TEXT | NOT NULL | Commercial product name |
| `category_id` | INTEGER | REFERENCES categories(id) | Category classification |
| `purchase_price`| REAL | NOT NULL DEFAULT 0.00 | Cost price (Prix d'achat) |
| `selling_price` | REAL | NOT NULL DEFAULT 0.00 | Retail price (Prix de vente) |
| `stock_quantity`| REAL | NOT NULL DEFAULT 0.00 | Current inventory balance |
| `min_stock` | REAL | NOT NULL DEFAULT 5.00 | Low-stock alert threshold |
| `unit` | TEXT | DEFAULT 'unit' | e.g. Piece, Kg, Box, Litre |
| `supplier_id` | INTEGER | REFERENCES suppliers(id) | Default supplier |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Record creation date |

### 3. `customers`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Customer ID |
| `name` | TEXT | NOT NULL | Customer full name |
| `phone` | TEXT | NULL | Phone number |
| `address` | TEXT | NULL | Physical address / City |
| `credit_limit`| REAL | NOT NULL DEFAULT 0.00 | Max allowed debt ceiling |
| `current_debt` | REAL | NOT NULL DEFAULT 0.00 | Outstanding balance due |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Registration date |

### 4. `suppliers`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Supplier ID |
| `name` | TEXT | NOT NULL | Supplier / Company name |
| `contact_person`| TEXT | NULL | Contact representative |
| `phone` | TEXT | NULL | Telephone |
| `address` | TEXT | NULL | Address |
| `current_debt` | REAL | NOT NULL DEFAULT 0.00 | Amount owed to supplier |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Registration date |

### 5. `sales`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Internal Sale ID |
| `invoice_number`| TEXT | NOT NULL UNIQUE | Formatted invoice: `FAC-YYYYMMDD-XXXX` |
| `sale_date` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Sale timestamp |
| `customer_id` | INTEGER | REFERENCES customers(id) | Null for walk-in client |
| `subtotal` | REAL | NOT NULL DEFAULT 0.00 | Sum of line items |
| `discount` | REAL | NOT NULL DEFAULT 0.00 | Invoice discount |
| `tax_amount` | REAL | NOT NULL DEFAULT 0.00 | Tax / TVA amount |
| `total_amount` | REAL | NOT NULL DEFAULT 0.00 | Final total (`subtotal - discount + tax`) |
| `amount_paid` | REAL | NOT NULL DEFAULT 0.00 | Paid amount at checkout |
| `debt_amount` | REAL | NOT NULL DEFAULT 0.00 | Remaining unpaid credit |
| `payment_method`| TEXT | NOT NULL DEFAULT 'CASH' | CASH, CREDIT, CARD, SPLIT |
| `status` | TEXT | NOT NULL DEFAULT 'COMPLETED'| COMPLETED, CANCELLED |
| `notes` | TEXT | NULL | Order memo |

### 6. `sale_items`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Line Item ID |
| `sale_id` | INTEGER | NOT NULL REFERENCES sales(id) ON DELETE CASCADE | Parent Sale |
| `product_id` | INTEGER | NOT NULL REFERENCES products(id) | Sold product |
| `quantity` | REAL | NOT NULL DEFAULT 1.00 | Quantity sold |
| `unit_price` | REAL | NOT NULL DEFAULT 0.00 | Price applied per unit |
| `purchase_price`| REAL | NOT NULL DEFAULT 0.00 | Cost price snapshot (for profit) |
| `line_total` | REAL | NOT NULL DEFAULT 0.00 | `quantity * unit_price` |

### 7. `purchases`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Purchase ID |
| `bill_number` | TEXT | NOT NULL UNIQUE | Supplier invoice reference |
| `purchase_date` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Date of arrival |
| `supplier_id` | INTEGER | NOT NULL REFERENCES suppliers(id) | Vendor |
| `total_amount` | REAL | NOT NULL DEFAULT 0.00 | Total invoice amount |
| `amount_paid` | REAL | NOT NULL DEFAULT 0.00 | Paid to vendor |
| `debt_amount` | REAL | NOT NULL DEFAULT 0.00 | Owed to vendor |
| `notes` | TEXT | NULL | Memo |

### 8. `purchase_items`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Item ID |
| `purchase_id` | INTEGER | NOT NULL REFERENCES purchases(id) ON DELETE CASCADE | Parent Purchase |
| `product_id` | INTEGER | NOT NULL REFERENCES products(id) | Purchased product |
| `quantity` | REAL | NOT NULL DEFAULT 1.00 | Received quantity |
| `unit_cost` | REAL | NOT NULL DEFAULT 0.00 | Cost per unit |
| `line_total` | REAL | NOT NULL DEFAULT 0.00 | `quantity * unit_cost` |

### 9. `customer_payments`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Payment ID |
| `customer_id` | INTEGER | NOT NULL REFERENCES customers(id) | Paying client |
| `payment_date` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Date of disbursement |
| `amount` | REAL | NOT NULL | Amount paid |
| `payment_method`| TEXT | DEFAULT 'CASH' | CASH, CHECK, TRANSFER |
| `notes` | TEXT | NULL | Receipt reference |

### 10. `supplier_payments`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Disbursement ID |
| `supplier_id` | INTEGER | NOT NULL REFERENCES suppliers(id) | Beneficiary supplier |
| `payment_date` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Date of payment |
| `amount` | REAL | NOT NULL | Amount paid |
| `notes` | TEXT | NULL | Check / Wire reference |

### 11. `stock_movements`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Movement ID |
| `product_id` | INTEGER | NOT NULL REFERENCES products(id) | Affected product |
| `movement_type` | TEXT | NOT NULL | 'SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN' |
| `quantity_delta`| REAL | NOT NULL | Positive (entry) or negative (exit) |
| `balance_after` | REAL | NOT NULL | Resulting stock balance |
| `reference_id` | INTEGER | NULL | Sale ID or Purchase ID |
| `timestamp` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |
| `notes` | TEXT | NULL | Reason for adjustment |
