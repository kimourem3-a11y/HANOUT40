unit Hanouti40.Models;

interface

uses
  System.SysUtils, System.Generics.Collections;

type
  TProduct = class
  private
    FId: Integer;
    FBarcode: string;
    FName: string;
    FCategoryId: Integer;
    FPurchasePrice: Double;
    FSellingPrice: Double;
    FStockQuantity: Double;
    FMinStock: Double;
    FUnit: string;
  public
    property Id: Integer read FId write FId;
    property Barcode: string read FBarcode write FBarcode;
    property Name: string read FName write FName;
    property CategoryId: Integer read FCategoryId write FCategoryId;
    property PurchasePrice: Double read FPurchasePrice write FPurchasePrice;
    property SellingPrice: Double read FSellingPrice write FSellingPrice;
    property StockQuantity: Double read FStockQuantity write FStockQuantity;
    property MinStock: Double read FMinStock write FMinStock;
    property UnitName: string read FUnit write FUnit;
    function ProfitMargin: Double;
  end;

  TSaleItem = class
  private
    FId: Integer;
    FSaleId: Integer;
    FProductId: Integer;
    FProductName: string;
    FQuantity: Double;
    FUnitPrice: Double;
    FPurchasePrice: Double;
  public
    property Id: Integer read FId write FId;
    property SaleId: Integer read FSaleId write FSaleId;
    property ProductId: Integer read FProductId write FProductId;
    property ProductName: string read FProductName write FProductName;
    property Quantity: Double read FQuantity write FQuantity;
    property UnitPrice: Double read FUnitPrice write FUnitPrice;
    property PurchasePrice: Double read FPurchasePrice write FPurchasePrice;
    function LineTotal: Double;
    function LineProfit: Double;
  end;

  TSale = class
  private
    FId: Integer;
    FInvoiceNumber: string;
    FSaleDate: TDateTime;
    FCustomerId: Integer;
    FSubtotal: Double;
    FDiscount: Double;
    FTaxAmount: Double;
    FTotalAmount: Double;
    FAmountPaid: Double;
    FDebtAmount: Double;
    FPaymentMethod: string;
    FItems: TObjectList<TSaleItem>;
  public
    constructor Create;
    destructor Destroy; override;
    property Id: Integer read FId write FId;
    property InvoiceNumber: string read FInvoiceNumber write FInvoiceNumber;
    property SaleDate: TDateTime read FSaleDate write FSaleDate;
    property CustomerId: Integer read FCustomerId write FCustomerId;
    property Subtotal: Double read FSubtotal write FSubtotal;
    property Discount: Double read FDiscount write FDiscount;
    property TaxAmount: Double read FTaxAmount write FTaxAmount;
    property TotalAmount: Double read FTotalAmount write FTotalAmount;
    property AmountPaid: Double read FAmountPaid write FAmountPaid;
    property DebtAmount: Double read FDebtAmount write FDebtAmount;
    property PaymentMethod: string read FPaymentMethod write FPaymentMethod;
    property Items: TObjectList<TSaleItem> read FItems;
    procedure RecalculateTotals;
  end;

  TCustomer = class
  private
    FId: Integer;
    FName: string;
    FPhone: string;
    FAddress: string;
    FCreditLimit: Double;
    FCurrentDebt: Double;
  public
    property Id: Integer read FId write FId;
    property Name: string read FName write FName;
    property Phone: string read FPhone write FPhone;
    property Address: string read FAddress write FAddress;
    property CreditLimit: Double read FCreditLimit write FCreditLimit;
    property CurrentDebt: Double read FCurrentDebt write FCurrentDebt;
  end;

  TSupplier = class
  private
    FId: Integer;
    FName: string;
    FContactPerson: string;
    FPhone: string;
    FCurrentDebt: Double;
  public
    property Id: Integer read FId write FId;
    property Name: string read FName write FName;
    property ContactPerson: string read FContactPerson write FContactPerson;
    property Phone: string read FPhone write FPhone;
    property CurrentDebt: Double read FCurrentDebt write FCurrentDebt;
  end;

implementation

{ TProduct }

function TProduct.ProfitMargin: Double;
begin
  if FSellingPrice > 0 then
    Result := ((FSellingPrice - FPurchasePrice) / FSellingPrice) * 100.0
  else
    Result := 0.0;
end;

{ TSaleItem }

function TSaleItem.LineTotal: Double;
begin
  Result := FQuantity * FUnitPrice;
end;

function TSaleItem.LineProfit: Double;
begin
  Result := FQuantity * (FUnitPrice - FPurchasePrice);
end;

{ TSale }

constructor TSale.Create;
begin
  inherited Create;
  FItems := TObjectList<TSaleItem>.Create(True);
  FSaleDate := Now;
  FDiscount := 0.0;
  FTaxAmount := 0.0;
end;

destructor TSale.Destroy;
begin
  FItems.Free;
  inherited Destroy;
end;

procedure TSale.RecalculateTotals;
var
  LItem: TSaleItem;
begin
  FSubtotal := 0.0;
  for LItem in FItems do
    FSubtotal := FSubtotal + LItem.LineTotal;

  FTotalAmount := FSubtotal - FDiscount + FTaxAmount;
  if FTotalAmount < 0.0 then
    FTotalAmount := 0.0;

  FDebtAmount := FTotalAmount - FAmountPaid;
  if FDebtAmount < 0.0 then
    FDebtAmount := 0.0;
end;

end.
