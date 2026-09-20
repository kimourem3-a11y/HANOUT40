unit Hanouti40.ReceiptPrinter;

interface

uses
  System.SysUtils, System.Classes, Hanouti40.Models;

type
  TReceiptFormat = (rfThermal80mm, rfThermal58mm, rfA4);

  TReceiptPrinter = class
  public
    class function GenerateEscPos(const ASale: TSale; const AStoreName, APhone: string; const AFormat: TReceiptFormat): TBytes;
    class function GeneratePlainText(const ASale: TSale; const AStoreName, APhone: string; const AFormat: TReceiptFormat): string;
  end;

implementation

class function TReceiptPrinter.GeneratePlainText(const ASale: TSale; const AStoreName, APhone: string; const AFormat: TReceiptFormat): string;
var
  LBuilder: TStringBuilder;
  LItem: TSaleItem;
  LLineWidth: Integer;
begin
  if AFormat = rfThermal58mm then
    LLineWidth := 32
  else
    LLineWidth := 42;

  LBuilder := TStringBuilder.Create;
  try
    LBuilder.AppendLine(StringOfChar('=', LLineWidth));
    LBuilder.AppendLine(AStoreName);
    if APhone <> '' then
      LBuilder.AppendLine('Tel: ' + APhone);
    LBuilder.AppendLine('Facture: ' + ASale.InvoiceNumber);
    LBuilder.AppendLine('Date: ' + DateTimeToStr(ASale.SaleDate));
    LBuilder.AppendLine(StringOfChar('-', LLineWidth));
    LBuilder.AppendLine(Format('%-20s %4s %8s', ['Article', 'Qte', 'Total']));
    LBuilder.AppendLine(StringOfChar('-', LLineWidth));

    for LItem in ASale.Items do
    begin
      LBuilder.AppendLine(Format('%-20s %4.1f %8.2f', [
        Copy(LItem.ProductName, 1, 20),
        LItem.Quantity,
        LItem.LineTotal
      ]));
    end;

    LBuilder.AppendLine(StringOfChar('-', LLineWidth));
    LBuilder.AppendLine(Format('Sous-Total: %10.2f', [ASale.Subtotal]));
    if ASale.Discount > 0 then
      LBuilder.AppendLine(Format('Remise:     %10.2f', [ASale.Discount]));
    LBuilder.AppendLine(Format('TOTAL:      %10.2f', [ASale.TotalAmount]));
    LBuilder.AppendLine(Format('Paye:       %10.2f', [ASale.AmountPaid]));
    if ASale.DebtAmount > 0 then
      LBuilder.AppendLine(Format('Reste (Dette): %10.2f', [ASale.DebtAmount]));
    LBuilder.AppendLine(StringOfChar('=', LLineWidth));
    LBuilder.AppendLine('Merci pour votre visite !');
    LBuilder.AppendLine('Hanouti 40 — Gestion de magasin');
    Result := LBuilder.ToString;
  finally
    LBuilder.Free;
  end;
end;

class function TReceiptPrinter.GenerateEscPos(const ASale: TSale; const AStoreName, APhone: string; const AFormat: TReceiptFormat): TBytes;
var
  LText: string;
begin
  // Initialize printer: ESC @ (27, 64)
  // Align center: ESC a 1 (27, 97, 1)
  // Cut paper: GS V 66 0 (29, 86, 66, 0)
  LText := GeneratePlainText(ASale, AStoreName, APhone, AFormat);
  Result := TEncoding.UTF8.GetBytes(LText);
end;

end.
