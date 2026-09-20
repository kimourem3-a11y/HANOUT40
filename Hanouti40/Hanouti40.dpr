program Hanouti40;

{$R *.dres}

uses
  Vcl.Forms,
  Vcl.Themes,
  Vcl.Styles,
  Hanouti40.Database in 'src\Database\Hanouti40.Database.pas',
  Hanouti40.Models in 'src\Models\Hanouti40.Models.pas',
  Hanouti40.SalesService in 'src\Services\Hanouti40.SalesService.pas',
  Hanouti40.StockService in 'src\Services\Hanouti40.StockService.pas',
  Hanouti40.Localization in 'src\Localization\Hanouti40.Localization.pas',
  Hanouti40.ReceiptPrinter in 'src\Printing\Hanouti40.ReceiptPrinter.pas';

{$R *.res}

begin
  Application.Initialize;
  Application.MainFormOnTaskbar := True;
  Application.Title := 'Hanouti 40 — Gestion de magasin';
  
  // Initialize Database connection and verify local schema
  TDatabaseManager.Instance.InitializeDatabase;
  
  // Run Application Event Loop
  Application.Run;
end.
