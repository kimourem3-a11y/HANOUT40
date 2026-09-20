unit Hanouti40.SalesService;

interface

uses
  System.SysUtils, Hanouti40.Database, Hanouti40.Models, FireDAC.Comp.Client;

type
  TSalesService = class
  private
    FDb: TDatabaseManager;
  public
    constructor Create;
    function ProcessSale(const ASale: TSale): Boolean;
    function VoidSale(const ASaleId: Integer): Boolean;
  end;

implementation

constructor TSalesService.Create;
begin
  inherited Create;
  FDb := TDatabaseManager.Instance;
end;

function TSalesService.ProcessSale(const ASale: TSale): Boolean;
var
  LQuery: TFDQuery;
  LItem: TSaleItem;
  LNewSaleId: Integer;
begin
  Result := False;
  ASale.RecalculateTotals;
  
  FDb.BeginTransaction;
  LQuery := TFDQuery.Create(nil);
  try
    LQuery.Connection := FDb.Connection;
    
    // 1. Insert Master Sale record
    LQuery.SQL.Text :=
      'INSERT INTO sales (invoice_number, customer_id, subtotal, discount, tax_amount, ' +
      'total_amount, amount_paid, debt_amount, payment_method) VALUES ' +
      '(:inv, :cust, :sub, :disc, :tax, :tot, :paid, :debt, :method);';
    LQuery.ParamByName('inv').AsString := ASale.InvoiceNumber;
    if ASale.CustomerId > 0 then
      LQuery.ParamByName('cust').AsInteger := ASale.CustomerId
    else
      LQuery.ParamByName('cust').Clear;
    LQuery.ParamByName('sub').AsFloat := ASale.Subtotal;
    LQuery.ParamByName('disc').AsFloat := ASale.Discount;
    LQuery.ParamByName('tax').AsFloat := ASale.TaxAmount;
    LQuery.ParamByName('tot').AsFloat := ASale.TotalAmount;
    LQuery.ParamByName('paid').AsFloat := ASale.AmountPaid;
    LQuery.ParamByName('debt').AsFloat := ASale.DebtAmount;
    LQuery.ParamByName('method').AsString := ASale.PaymentMethod;
    LQuery.ExecSQL;
    
    // Get generated sale ID
    LQuery.SQL.Text := 'SELECT last_insert_rowid() AS last_id;';
    LQuery.Open;
    LNewSaleId := LQuery.FieldByName('last_id').AsInteger;
    ASale.Id := LNewSaleId;
    LQuery.Close;

    // 2. Insert Sale Items and decrement inventory stock
    for LItem in ASale.Items do
    begin
      LQuery.SQL.Text :=
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, purchase_price, line_total) ' +
        'VALUES (:sid, :pid, :qty, :uprice, :pprice, :ltotal);';
      LQuery.ParamByName('sid').AsInteger := LNewSaleId;
      LQuery.ParamByName('pid').AsInteger := LItem.ProductId;
      LQuery.ParamByName('qty').AsFloat := LItem.Quantity;
      LQuery.ParamByName('uprice').AsFloat := LItem.UnitPrice;
      LQuery.ParamByName('pprice').AsFloat := LItem.PurchasePrice;
      LQuery.ParamByName('ltotal').AsFloat := LItem.LineTotal;
      LQuery.ExecSQL;

      // Decrement stock
      LQuery.SQL.Text :=
        'UPDATE products SET stock_quantity = stock_quantity - :qty WHERE id = :pid;';
      LQuery.ParamByName('qty').AsFloat := LItem.Quantity;
      LQuery.ParamByName('pid').AsInteger := LItem.ProductId;
      LQuery.ExecSQL;
    end;

    // 3. Update Customer Outstanding Debt if applicable
    if (ASale.CustomerId > 0) and (ASale.DebtAmount > 0) then
    begin
      LQuery.SQL.Text :=
        'UPDATE customers SET current_debt = current_debt + :debt WHERE id = :cid;';
      LQuery.ParamByName('debt').AsFloat := ASale.DebtAmount;
      LQuery.ParamByName('cid').AsInteger := ASale.CustomerId;
      LQuery.ExecSQL;
    end;

    FDb.CommitTransaction;
    Result := True;
  except
    on E: Exception do
    begin
      FDb.RollbackTransaction;
      raise Exception.Create('Error processing sale transaction: ' + E.Message);
    end;
  end;
  LQuery.Free;
end;

function TSalesService.VoidSale(const ASaleId: Integer): Boolean;
var
  LQuery: TFDQuery;
begin
  Result := False;
  FDb.BeginTransaction;
  LQuery := TFDQuery.Create(nil);
  try
    LQuery.Connection := FDb.Connection;
    // Restore product stock from sale items
    LQuery.SQL.Text :=
      'UPDATE products SET stock_quantity = stock_quantity + (' +
      '  SELECT COALESCE(SUM(quantity), 0) FROM sale_items ' +
      '  WHERE sale_items.product_id = products.id AND sale_items.sale_id = :sid' +
      ') WHERE id IN (SELECT product_id FROM sale_items WHERE sale_id = :sid);';
    LQuery.ParamByName('sid').AsInteger := ASaleId;
    LQuery.ExecSQL;

    // Reverse customer debt if applicable
    LQuery.SQL.Text :=
      'UPDATE customers SET current_debt = current_debt - (' +
      '  SELECT debt_amount FROM sales WHERE id = :sid' +
      ') WHERE id = (SELECT customer_id FROM sales WHERE id = :sid AND customer_id IS NOT NULL);';
    LQuery.ParamByName('sid').AsInteger := ASaleId;
    LQuery.ExecSQL;

    // Mark sale as CANCELLED
    LQuery.SQL.Text := 'UPDATE sales SET status = ''CANCELLED'' WHERE id = :sid;';
    LQuery.ParamByName('sid').AsInteger := ASaleId;
    LQuery.ExecSQL;

    FDb.CommitTransaction;
    Result := True;
  except
    on E: Exception do
    begin
      FDb.RollbackTransaction;
      raise;
    end;
  end;
  LQuery.Free;
end;

end.
