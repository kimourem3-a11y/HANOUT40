import React, { useState } from 'react';
import {
  Settings,
  Store,
  Printer,
  Globe,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Crown,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  Smartphone,
  Calendar,
  Sparkles,
  Zap,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { Currency, Language, LicenseInfo, PrinterType, StoreSettings } from '../types';
import { translations } from '../localization/translations';
import { LicenseManager, TEST_PRO_LICENSES } from '../utils/licenseManager';

interface SettingsViewProps {
  settings: StoreSettings;
  licenseInfo: LicenseInfo;
  onSaveSettings: (settings: StoreSettings) => void;
  onExportData: () => boolean;
  onImportData: (file: File) => void;
  onOpenResetModal: () => void;
  onActivateLicense: (key: string) => { success: boolean; message: string; license?: LicenseInfo };
  onDeactivateLicense: () => void;
  initialTab?: 'general' | 'data' | 'license';
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  licenseInfo,
  onSaveSettings,
  onExportData,
  onImportData,
  onOpenResetModal,
  onActivateLicense,
  onDeactivateLicense,
  initialTab = 'general',
}) => {
  const t = translations[settings.language];

  // Active Settings Sub-Tab
  const [activeTab, setActiveTab] = useState<'general' | 'data' | 'license'>(initialTab);

  // Local Form state
  const [storeName, setStoreName] = useState(settings.storeName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [rcNumber, setRcNumber] = useState(settings.rcNumber || '');
  const [nifNumber, setNifNumber] = useState(settings.nifNumber || '');
  const [currency, setCurrency] = useState<Currency>(settings.currency);
  const [language, setLanguage] = useState<Language>(settings.language);
  const [printerType, setPrinterType] = useState<PrinterType>(settings.printerType);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  const [taxRate, setTaxRate] = useState<number>(settings.taxRate || 0);
  const [invoicePrefix, setInvoicePrefix] = useState<string>(settings.invoicePrefix || 'INV-');
  const [isSaved, setIsSaved] = useState(false);

  // License form state
  const [licenseInput, setLicenseInput] = useState('');
  const [licenseFeedback, setLicenseFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StoreSettings = {
      storeName,
      tagline,
      phone,
      address,
      rcNumber: rcNumber.trim(),
      nifNumber: nifNumber.trim(),
      currency,
      language,
      printerType,
      receiptFooter,
      taxRate,
      invoicePrefix,
      alertMinStock: settings.alertMinStock ?? true,
    };
    onSaveSettings(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportData(e.target.files[0]);
    }
  };

  const handleLicenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLicenseFeedback(null);
    const res = onActivateLicense(licenseInput);
    setLicenseFeedback(res);
    if (res.success) {
      setLicenseInput('');
    }
  };

  const handleQuickActivateTestKey = (testKey: string) => {
    setLicenseInput(testKey);
    const res = onActivateLicense(testKey);
    setLicenseFeedback(res);
  };

  const isPro = licenseInfo.edition === 'PRO' && licenseInfo.status === 'ACTIVE';

  return (
    <div id="settings-view-container" className="space-y-6 max-w-4xl mx-auto">
      {/* Settings Navigation Tabs Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{t.settings}</h2>
            <p className="text-xs text-slate-400">
              Paramètres généraux, Gestion des données et Licence Hanouti 40
            </p>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs w-full sm:w-auto">
          <button
            id="settings-tab-general"
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'general' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Général</span>
          </button>

          <button
            id="settings-tab-data"
            type="button"
            onClick={() => setActiveTab('data')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'data' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Gestion des Données</span>
          </button>

          <button
            id="settings-tab-license"
            type="button"
            onClick={() => setActiveTab('license')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'license'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Hanouti 40 PRO</span>
            {isPro ? (
              <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-mono">
                ACTIF
              </span>
            ) : (
              <span className="bg-slate-800 text-slate-300 text-[9px] px-1.5 py-0.2 rounded-full font-mono">
                FREE
              </span>
            )}
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/50 p-3 rounded-xl shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Paramètres du magasin enregistrés avec succès !</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: GENERAL STORE SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'general' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Store className="w-4 h-4 text-emerald-400" />
              <span>{t.storeDetails}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  {settings.language === 'ar' ? 'اسم المحل' : 'Nom du Magasin'} *
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  {settings.language === 'ar' ? 'الشعار / النشاط' : 'Slogan / Sous-titre'}
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  {t.phone}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  {t.address}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  N° Registre de Commerce (RC)
                </label>
                <input
                  type="text"
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value)}
                  placeholder="Ex: 16/00-1234567B"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  N° Identification Fiscale (NIF)
                </label>
                <input
                  type="text"
                  value={nifNumber}
                  onChange={(e) => setNifNumber(e.target.value)}
                  placeholder="Ex: 001616012345678"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>Régionalisation, Facturation & Impression</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  {t.currency}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="DZD">Dinar Algérien (DZD / د.ج)</option>
                  <option value="MAD">Dirham Marocain (MAD / د.م)</option>
                  <option value="TND">Dinar Tunisien (TND / د.ت)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="USD">US Dollar ($)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  {t.language}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="ar">العربية (RTL)</option>
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Format Imprimante Ticket
                </label>
                <select
                  value={printerType}
                  onChange={(e) => setPrinterType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="thermal80">Standard Thermique 80mm</option>
                  <option value="thermal58">Compact Thermique 58mm</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Taux de TVA (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  placeholder="0.0"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Préfixe des Factures
                </label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="INV-"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">
                Message en bas du ticket
              </label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
            >
              {t.save} les modifications
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DATA MANAGEMENT & RESET EVERYTHING */}
      {/* ========================================================================= */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Backup and Restore Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Sauvegardes & Restauration de la Base de Données</span>
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Exportez ou restaurez l'intégralité de vos articles, ventes, factures, clients, fournisseurs et dépenses dans un format JSON autonome compatible Android Room.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onExportData}
                className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 p-4 rounded-xl text-xs font-semibold flex items-center gap-3 transition cursor-pointer"
              >
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-700/50 rounded-lg text-emerald-400 shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-white block">Exporter Sauvegarde (JSON)</span>
                  <span className="text-[11px] text-slate-400">Télécharger une copie de sécurité</span>
                </div>
              </button>

              <label className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 p-4 rounded-xl text-xs font-semibold flex items-center gap-3 transition cursor-pointer">
                <div className="p-2.5 bg-blue-950/80 border border-blue-700/50 rounded-lg text-blue-400 shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-white block">Restaurer Sauvegarde (JSON)</span>
                  <span className="text-[11px] text-slate-400">Importer un fichier de sauvegarde</span>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Destructive Section: RESET EVERYTHING (User Requirement) */}
          <div
            id="reset-everything-card"
            className="bg-gradient-to-b from-rose-950/30 to-slate-900 border-2 border-rose-800/60 rounded-xl p-5 shadow-lg space-y-4 ring-1 ring-rose-500/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-950 border border-rose-700/80 rounded-xl text-rose-400 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>RESET EVERYTHING</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-rose-600/30 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full">
                      Action Destructive
                    </span>
                  </h3>
                  <p className="text-xs text-rose-200/80 mt-1">
                    Réinitialisation totale de l'ensemble des données commerciales (produits, ventes, dettes, caisse).
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-rose-900/50 rounded-lg p-3 text-xs text-slate-300 space-y-1.5">
              <p className="font-semibold text-rose-300">⚠️ Procédure de sécurité stricte :</p>
              <p>• Une sauvegarde automatique complète sera obligatoirement générée avant réinitialisation.</p>
              <p>• La confirmation exige la saisie du mot de passe administrateur sécurisé (<code className="text-amber-400 font-mono">karim40</code>).</p>
              <p>• <strong className="text-emerald-400">Important :</strong> Votre licence PRO reste conservée intacte après la réinitialisation.</p>
            </div>

            {/* Prominent Reset Everything Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-rose-900/40">
              <span className="text-[11px] text-slate-400">
                Paramètres → Gestion des Données → Reset Everything
              </span>

              <button
                id="btn-reset-everything"
                type="button"
                onClick={onOpenResetModal}
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white px-6 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ring-2 ring-rose-500/30 hover:ring-rose-400"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Everything (Réinitialiser Tout)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: HANOUTI 40 PRO → LICENSE */}
      {/* ========================================================================= */}
      {activeTab === 'license' && (
        <div className="space-y-6">
          {/* Current Edition Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`p-3.5 rounded-2xl border ${
                  isPro
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-inner'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <Crown className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Édition Actuelle
                  </span>
                  {isPro ? (
                    <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full font-mono">
                      PRO ACTIVE
                    </span>
                  ) : (
                    <span className="bg-slate-800 text-slate-300 font-bold text-xs px-2.5 py-0.5 rounded-full font-mono">
                      FREE
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black text-white mt-1">
                  {isPro ? 'Hanouti 40 PRO — Licence Complète' : 'Hanouti 40 — Édition Gratuite'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isPro
                    ? 'Toutes les fonctionnalités avancées, volumes illimités et exports PDF sont débloqués.'
                    : 'Version fonctionnelle avec plafonds de base (100 articles, 500 ventes). Fonctionne 100% hors-ligne.'}
                </p>
              </div>
            </div>

            {isPro && (
              <button
                type="button"
                onClick={onDeactivateLicense}
                className="text-xs text-rose-400 hover:text-rose-300 bg-rose-950/50 hover:bg-rose-950 border border-rose-800/50 px-3.5 py-2 rounded-lg transition cursor-pointer font-semibold"
              >
                Désactiver la Licence
              </button>
            )}
          </div>

          {/* PRO License Detailed Metadata */}
          {isPro && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Informations d'Activation & Périphérique</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Identifiant Licence</span>
                  <span className="font-mono font-bold text-amber-300 mt-0.5 block">
                    {licenseInfo.licenseId}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Statut</span>
                  <span className="font-bold text-emerald-400 mt-0.5 block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {licenseInfo.status} (Vérifié Hors-ligne)
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Date d'Activation</span>
                  <span className="font-mono text-slate-200 mt-0.5 block">
                    {licenseInfo.activationDate
                      ? new Date(licenseInfo.activationDate).toLocaleString()
                      : 'Indéfinie'}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Type de Licence</span>
                  <span className="text-slate-200 mt-0.5 block">
                    {licenseInfo.licenseType || 'PRO Commerciale'}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Identifiant Périphérique (Android Keystore)</span>
                  <span className="font-mono text-slate-300 mt-0.5 block truncate">
                    {licenseInfo.deviceId || 'AND-H40-DEFAULT'}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Signature Numérique</span>
                  <span className="font-mono text-emerald-400 mt-0.5 block truncate">
                    {licenseInfo.signature || 'VALID-CRYPTOGRAPHIC-RSA'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* License Activation Form (Enter License Key) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>{isPro ? 'Saisir une Nouvelle Clé de Licence' : 'Activer Hanouti 40 PRO'}</span>
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Entrez votre clé de licence au format <code className="text-amber-300 font-mono font-bold">H40-PRO-XXXX-XXXX-XXXX</code> ou utilisez l'un des 20 identifiants de développement certifiés.
            </p>

            <form onSubmit={handleLicenseSubmit} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={licenseInput}
                  onChange={(e) => setLicenseInput(e.target.value)}
                  placeholder="Ex: H40-PRO-0001 ou H40-PRO-ABCD-EFGH-1A2B"
                  className="flex-1 bg-slate-950 border border-slate-700 focus:border-amber-400 text-white font-mono px-3.5 py-2.5 rounded-lg text-xs uppercase tracking-wider focus:outline-none"
                />

                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Vérifier & Activer</span>
                </button>
              </div>

              {licenseFeedback && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    licenseFeedback.success
                      ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                  }`}
                >
                  {licenseFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{licenseFeedback.message}</span>
                </div>
              )}
            </form>

            {/* Development / Test 20 License Keys Panel (Section 5) */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2.5 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <Zap className="w-4 h-4" />
                  <span>Mode Développement & Test — 20 Clés PRO Valides (Section 5)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">DEBUG MODE</span>
              </div>

              <p className="text-[11px] text-slate-400">
                Cliquez sur n'importe quel identifiant de test ci-dessous pour activer immédiatement l'édition PRO :
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5 pt-1">
                {TEST_PRO_LICENSES.map((testKey) => (
                  <button
                    key={testKey}
                    type="button"
                    onClick={() => handleQuickActivateTestKey(testKey)}
                    className="text-[11px] font-mono font-semibold py-1 px-2 bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 rounded border border-slate-700/80 transition cursor-pointer text-center"
                    title={`Activer ${testKey}`}
                  >
                    {testKey}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
