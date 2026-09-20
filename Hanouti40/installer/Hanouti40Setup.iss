; =====================================================================
; HANOUTI 40 — INNO SETUP INSTALLER SCRIPT
; Application: Hanouti 40 — Gestion de magasin
; Installer Executable: Hanouti40Setup.exe
; Clean-room generated installer specification
; =====================================================================

#define MyAppName "Hanouti 40"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Hanouti Soft"
#define MyAppExeName "Hanouti40.exe"
#define MyAppAssocName MyAppName + " Database"
#define MyAppAssocExt ".h40"
#define MyAppAssocKey StringChange(MyAppAssocName, " ", "") + MyAppAssocExt

[Setup]
AppId={{D814FA76-8802-4A8E-9214-46AE167BE40E}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=Output
OutputBaseFilename=Hanouti40Setup
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\{#MyAppExeName}
SetupIconFile=..\assets\app_icon.ico

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode

[Files]
Source: "..\bin\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\bin\sqlite3.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\Hanouti40-Windows\*.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\Hanouti40-Windows\*.pak"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\Hanouti40-Windows\*.dat"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\Hanouti40-Windows\*.bin"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\Hanouti40-Windows\locales\*"; DestDir: "{app}\locales"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\..\Hanouti40-Windows\resources\*"; DestDir: "{app}\resources"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\database\schema.sql"; DestDir: "{app}\database"; Flags: ignoreversion
Source: "..\reports\*"; DestDir: "{app}\reports"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\assets\*"; DestDir: "{app}\assets"; Flags: ignoreversion recursesubdirs createallsubdirs

[Dirs]
Name: "{commonappdata}\{#MyAppName}"
Name: "{commonappdata}\{#MyAppName}\Backups"; Permissions: users-full
Name: "{commonappdata}\{#MyAppName}\Logs"; Permissions: users-full

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
