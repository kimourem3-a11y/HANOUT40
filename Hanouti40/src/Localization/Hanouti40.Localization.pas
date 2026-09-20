unit Hanouti40.Localization;

interface

type
  TLanguage = (langArabic, langFrench, langEnglish);

  TLocKey = (
    lkAppName,
    lkDashboard,
    lkProducts,
    lkSales,
    lkPurchases,
    lkCustomers,
    lkSuppliers,
    lkInventory,
    lkDebts,
    lkReports,
    lkSettings,
    lkTotalSales,
    lkProfit,
    lkStockValue,
    lkCustomerDebts,
    lkBarcode,
    lkProductName,
    lkPrice,
    lkQuantity,
    lkTotal,
    lkPay,
    lkCash,
    lkCredit,
    lkPrintReceipt
  );

  TLocalization = class
  public
    class function GetText(const AKey: TLocKey; const ALang: TLanguage): string;
    class function IsRTL(const ALang: TLanguage): Boolean;
  end;

implementation

class function TLocalization.IsRTL(const ALang: TLanguage): Boolean;
begin
  Result := (ALang = langArabic);
end;

class function TLocalization.GetText(const AKey: TLocKey; const ALang: TLanguage): string;
begin
  case ALang of
    langArabic:
      case AKey of
        lkAppName: Result := 'حانوتي 40';
        lkDashboard: Result := 'الرئيسية';
        lkProducts: Result := 'المنتجات';
        lkSales: Result := 'المبيعات';
        lkPurchases: Result := 'المشتريات';
        lkCustomers: Result := 'الزبائن';
        lkSuppliers: Result := 'الموردون';
        lkInventory: Result := 'المخزون';
        lkDebts: Result := 'الديون';
        lkReports: Result := 'التقارير';
        lkSettings: Result := 'الإعدادات';
        lkTotalSales: Result := 'إجمالي المبيعات';
        lkProfit: Result := 'الربح الصافي';
        lkStockValue: Result := 'قيمة المخزون';
        lkCustomerDebts: Result := 'ديون الزبائن';
        lkBarcode: Result := 'الباركود';
        lkProductName: Result := 'اسم المنتج';
        lkPrice: Result := 'السعر';
        lkQuantity: Result := 'الكمية';
        lkTotal: Result := 'المجموع';
        lkPay: Result := 'دفع';
        lkCash: Result := 'نقداً';
        lkCredit: Result := 'آجل (دين)';
        lkPrintReceipt: Result := 'طباعة الوصل';
      end;
    langFrench:
      case AKey of
        lkAppName: Result := 'Hanouti 40';
        lkDashboard: Result := 'Accueil';
        lkProducts: Result := 'Produits';
        lkSales: Result := 'Ventes';
        lkPurchases: Result := 'Achats';
        lkCustomers: Result := 'Clients';
        lkSuppliers: Result := 'Fournisseurs';
        lkInventory: Result := 'Stock';
        lkDebts: Result := 'Dettes';
        lkReports: Result := 'Rapports';
        lkSettings: Result := 'Paramètres';
        lkTotalSales: Result := 'Total Ventes';
        lkProfit: Result := 'Bénéfice Brut';
        lkStockValue: Result := 'Valeur du Stock';
        lkCustomerDebts: Result := 'Créances Clients';
        lkBarcode: Result := 'Code-barres';
        lkProductName: Result := 'Désignation';
        lkPrice: Result := 'Prix';
        lkQuantity: Result := 'Qté';
        lkTotal: Result := 'Total';
        lkPay: Result := 'Encaisser';
        lkCash: Result := 'Espèces';
        lkCredit: Result := 'Crédit';
        lkPrintReceipt: Result := 'Imprimer Ticket';
      end;
    langEnglish:
      case AKey of
        lkAppName: Result := 'Hanouti 40';
        lkDashboard: Result := 'Dashboard';
        lkProducts: Result := 'Products';
        lkSales: Result := 'Sales';
        lkPurchases: Result := 'Purchases';
        lkCustomers: Result := 'Customers';
        lkSuppliers: Result := 'Suppliers';
        lkInventory: Result := 'Inventory';
        lkDebts: Result := 'Debts';
        lkReports: Result := 'Reports';
        lkSettings: Result := 'Settings';
        lkTotalSales: Result := 'Total Sales';
        lkProfit: Result := 'Gross Profit';
        lkStockValue: Result := 'Inventory Value';
        lkCustomerDebts: Result := 'Customer Receivables';
        lkBarcode: Result := 'Barcode';
        lkProductName: Result := 'Product Name';
        lkPrice: Result := 'Price';
        lkQuantity: Result := 'Qty';
        lkTotal: Result := 'Total';
        lkPay: Result := 'Pay';
        lkCash: Result := 'Cash';
        lkCredit: Result := 'Credit';
        lkPrintReceipt: Result := 'Print Receipt';
      end;
  end;
end;

end.
