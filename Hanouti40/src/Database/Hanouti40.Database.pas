unit Hanouti40.Database;

interface

uses
  System.SysUtils, System.Classes, System.IOUtils,
  FireDAC.Comp.Client, FireDAC.Stan.Def, FireDAC.Stan.Async,
  FireDAC.Phys.SQLite, FireDAC.Phys.SQLiteDef, FireDAC.DApt;

type
  TDatabaseManager = class
  private
    class var FInstance: TDatabaseManager;
    FConnection: TFDConnection;
    FDatabasePath: string;
    procedure CreateTables;
  public
    constructor Create;
    destructor Destroy; override;
    class function Instance: TDatabaseManager;
    procedure InitializeDatabase;
    procedure ExecuteScript(const ASql: string);
    function BeginTransaction: Boolean;
    procedure CommitTransaction;
    procedure RollbackTransaction;
    property Connection: TFDConnection read FConnection;
  end;

implementation

constructor TDatabaseManager.Create;
var
  LDataDir: string;
begin
  inherited Create;
  LDataDir := TPath.Combine(TPath.GetHomePath, 'Hanouti40');
  if not TDirectory.Exists(LDataDir) then
    TDirectory.CreateDirectory(LDataDir);

  FDatabasePath := TPath.Combine(LDataDir, 'Hanouti40.db');
  FConnection := TFDConnection.Create(nil);
  FConnection.DriverName := 'SQLite';
  FConnection.Params.Values['Database'] := FDatabasePath;
  FConnection.Params.Values['ForeignKeys'] := 'On';
  FConnection.Params.Values['LockingMode'] := 'Normal';
  FConnection.Params.Values['JournalMode'] := 'WAL';
  FConnection.LoginPrompt := False;
end;

destructor TDatabaseManager.Destroy;
begin
  FConnection.Close;
  FConnection.Free;
  inherited Destroy;
end;

class function TDatabaseManager.Instance: TDatabaseManager;
begin
  if FInstance = nil then
    FInstance := TDatabaseManager.Create;
  Result := FInstance;
end;

procedure TDatabaseManager.InitializeDatabase;
begin
  FConnection.Connected := True;
  CreateTables;
end;

procedure TDatabaseManager.CreateTables;
var
  LQuery: TFDQuery;
begin
  LQuery := TFDQuery.Create(nil);
  try
    LQuery.Connection := FConnection;
    LQuery.SQL.Text :=
      'CREATE TABLE IF NOT EXISTS categories (' +
      '  id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      '  name TEXT NOT NULL UNIQUE,' +
      '  description TEXT,' +
      '  created_at DATETIME DEFAULT CURRENT_TIMESTAMP' +
      ');' +
      'CREATE TABLE IF NOT EXISTS products (' +
      '  id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      '  barcode TEXT NOT NULL UNIQUE,' +
      '  name TEXT NOT NULL,' +
      '  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,' +
      '  purchase_price REAL NOT NULL DEFAULT 0.00,' +
      '  selling_price REAL NOT NULL DEFAULT 0.00,' +
      '  stock_quantity REAL NOT NULL DEFAULT 0.00,' +
      '  min_stock REAL NOT NULL DEFAULT 5.00,' +
      '  unit TEXT DEFAULT ''unit''' +
      ');' +
      'CREATE TABLE IF NOT EXISTS customers (' +
      '  id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      '  name TEXT NOT NULL,' +
      '  phone TEXT,' +
      '  address TEXT,' +
      '  credit_limit REAL NOT NULL DEFAULT 0.00,' +
      '  current_debt REAL NOT NULL DEFAULT 0.00' +
      ');' +
      'CREATE TABLE IF NOT EXISTS suppliers (' +
      '  id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      '  name TEXT NOT NULL,' +
      '  contact_person TEXT,' +
      '  phone TEXT,' +
      '  current_debt REAL NOT NULL DEFAULT 0.00' +
      ');' +
      'CREATE TABLE IF NOT EXISTS sales (' +
      '  id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      '  invoice_number TEXT NOT NULL UNIQUE,' +
      '  sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,' +
      '  customer_id INTEGER REFERENCES customers(id),' +
      '  subtotal REAL NOT NULL DEFAULT 0.00,' +
      '  discount REAL NOT NULL DEFAULT 0.00,' +
      '  tax_amount REAL NOT NULL DEFAULT 0.00,' +
      '  total_amount REAL NOT NULL DEFAULT 0.00,' +
      '  amount_paid REAL NOT NULL DEFAULT 0.00,' +
      '  debt_amount REAL NOT NULL DEFAULT 0.00,' +
      '  payment_method TEXT NOT NULL DEFAULT ''CASH''' +
      ');' +
      'CREATE TABLE IF NOT EXISTS sale_items (' +
      '  id INTEGER PRIMARY KEY AUTOINCREMENT,' +
      '  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,' +
      '  product_id INTEGER NOT NULL REFERENCES products(id),' +
      '  quantity REAL NOT NULL DEFAULT 1.00,' +
      '  unit_price REAL NOT NULL DEFAULT 0.00,' +
      '  purchase_price REAL NOT NULL DEFAULT 0.00,' +
      '  line_total REAL NOT NULL DEFAULT 0.00' +
      ');';
    LQuery.ExecSQL;
  finally
    LQuery.Free;
  end;
end;

procedure TDatabaseManager.ExecuteScript(const ASql: string);
begin
  FConnection.ExecSQL(ASql);
end;

function TDatabaseManager.BeginTransaction: Boolean;
begin
  FConnection.StartTransaction;
  Result := True;
end;

procedure TDatabaseManager.CommitTransaction;
begin
  FConnection.Commit;
end;

procedure TDatabaseManager.RollbackTransaction;
begin
  FConnection.Rollback;
end;

end.
