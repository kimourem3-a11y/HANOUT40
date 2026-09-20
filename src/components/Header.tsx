import React, { useState, useEffect } from 'react';
import { Store, Globe, ShoppingCart, ShieldCheck, Smartphone, Tablet, FileDown, Crown, Radio, RefreshCw, WifiOff } from 'lucide-react';
import { DeviceViewMode, Language, LicenseInfo, StoreSettings } from '../types';
import { translations } from '../localization/translations';
import { SyncEngine, SyncConnectionStatus } from '../utils/syncEngine';

interface HeaderProps {
  settings: StoreSettings;
  deviceViewMode: DeviceViewMode;
  licenseInfo?: LicenseInfo;
  onLanguageChange: (lang: Language) => void;
  onToggleDeviceMode: (mode: DeviceViewMode) => void;
  onOpenPOS: () => void;
  onOpenExportCenter: () => void;
  onOpenForensics: () => void;
  onOpenLicense?: () => void;
  onOpenSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  deviceViewMode,
  licenseInfo,
  onLanguageChange,
  onToggleDeviceMode,
  onOpenPOS,
  onOpenExportCenter,
  onOpenForensics,
  onOpenLicense,
  onOpenSync,
}) => {
  const t = translations[settings.language];
  const isRtl = settings.language === 'ar';
  const isPro = licenseInfo?.edition === 'PRO' && licenseInfo?.status === 'ACTIVE';

  const [syncStatus, setSyncStatus] = useState<SyncConnectionStatus>(SyncEngine.getCurrentStatus());

  useEffect(() => {
    const unsub = SyncEngine.onStatusChange((st) => setSyncStatus(st));
    return () => unsub();
  }, []);

  return (
    <header
      id="hanouti-app-header"
      className="bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-md"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-inner">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  HANOUTI 40
                </span>
                {/* PRO or FREE Edition Badge */}
                <button
                  type="button"
                  onClick={onOpenLicense}
                  className={`text-xs px-2 py-0.5 rounded font-black tracking-wider border transition cursor-pointer flex items-center gap-1 ${
                    isPro
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title={isPro ? 'Édition PRO Active' : 'Édition Gratuite — Cliquer pour passer à PRO'}
                >
                  {isPro ? (
                    <>
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>PRO</span>
                    </>
                  ) : (
                    <span>FREE</span>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {settings.tagline || t.appSubtitle}
              </p>
            </div>
          </div>

          <div className="sm:hidden flex items-center gap-1.5">
            <button
              id="header-mobile-pos-btn"
              onClick={onOpenPOS}
              className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status badges & Controls */}
        <div className="flex items-center flex-wrap justify-end gap-2.5 w-full sm:w-auto text-xs">
          {/* Caisse active indicator */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 text-slate-300 px-3 py-1.5 rounded-md border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium">
              {settings.language === 'ar' ? 'الكاسة نشطة' : 'Caisse 01 Ouverte'}
            </span>
          </div>

          {/* Real-time Sync Status Indicator */}
          <button
            id="header-sync-status-btn"
            type="button"
            onClick={onOpenSync}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition cursor-pointer font-medium ${
              syncStatus === 'SYNCED'
                ? 'bg-slate-800/90 text-emerald-300 border-emerald-500/40 hover:bg-slate-800'
                : syncStatus === 'SYNCING'
                ? 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-950/60'
                : syncStatus === 'OFFLINE'
                ? 'bg-rose-950/40 text-rose-300 border-rose-500/40 hover:bg-rose-950/60'
                : 'bg-orange-950/40 text-orange-300 border-orange-500/40 hover:bg-orange-950/60'
            }`}
            title="État de la synchronisation en temps réel Android ↔ PC"
          >
            {syncStatus === 'SYNCED' && <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />}
            {syncStatus === 'SYNCING' && <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
            {syncStatus === 'OFFLINE' && <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
            {syncStatus === 'ERROR' && <Radio className="w-3.5 h-3.5 text-orange-400" />}
            <span className="hidden lg:inline">
              {syncStatus === 'SYNCED'
                ? 'Sync: Connecté'
                : syncStatus === 'SYNCING'
                ? 'Sync: En cours...'
                : syncStatus === 'OFFLINE'
                ? 'Sync: Hors-ligne'
                : 'Sync: Conflit'}
            </span>
          </button>

          {/* Quick POS button */}
          <button
            id="header-quick-pos-btn"
            onClick={onOpenPOS}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{t.posCashier}</span>
            <span className="bg-emerald-700 text-emerald-100 text-[10px] px-1.5 py-0.5 rounded font-mono">
              F1
            </span>
          </button>

          {/* Quick PDF Export Center Button */}
          <button
            id="header-export-center-btn"
            onClick={onOpenExportCenter}
            className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Centre d'Exportation PDF"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden md:inline">{t.exportPdf}</span>
          </button>

          {/* Android Device View Mode Switcher (Mobile vs Tablet) */}
          <div className="flex items-center bg-slate-800 rounded-md border border-slate-700 p-0.5" title="Changer l'émulation Android">
            <button
              onClick={() => onToggleDeviceMode('android_tablet')}
              className={`p-1.5 rounded transition ${
                deviceViewMode === 'android_tablet'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mode Android Tablette / Bureau"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onToggleDeviceMode('android_phone')}
              className={`p-1.5 rounded transition ${
                deviceViewMode === 'android_phone'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mode Android Smartphone (Tactile)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Forensic Workbench Shortcut */}
          <button
            id="header-forensics-btn"
            onClick={onOpenForensics}
            className="bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/50 px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Forensic Analysis & Clean-Room Inspector"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="hidden md:inline">{t.forensics}</span>
          </button>

          {/* Language selector */}
          <div className="flex items-center bg-slate-800 rounded-md border border-slate-700 p-0.5">
            <Globe className="w-3.5 h-3.5 text-slate-400 mx-1.5" />
            <button
              id="lang-ar-btn"
              onClick={() => onLanguageChange('ar')}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                settings.language === 'ar'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              العربية
            </button>
            <button
              id="lang-fr-btn"
              onClick={() => onLanguageChange('fr')}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                settings.language === 'fr'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              FR
            </button>
            <button
              id="lang-en-btn"
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                settings.language === 'en'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
