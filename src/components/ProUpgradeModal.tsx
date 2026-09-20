import React, { useState } from 'react';
import {
  Crown,
  Lock,
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { LicenseInfo } from '../types';
import { LicenseManager, TEST_PRO_LICENSES } from '../utils/licenseManager';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  limitMessage?: string;
  onLicenseActivated?: (newLicense: LicenseInfo) => void;
  onNavigateToLicenseSettings?: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  featureName,
  limitMessage,
  onLicenseActivated,
  onNavigateToLicenseSettings,
}) => {
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = LicenseManager.activateLicenseKey(licenseKeyInput);
    if (result.success && result.license) {
      setSuccessMsg(result.message);
      if (onLicenseActivated) {
        onLicenseActivated(result.license);
      }
      setTimeout(() => {
        onClose();
        setShowKeyInput(false);
        setLicenseKeyInput('');
        setSuccessMsg(null);
      }, 1500);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleUseQuickDevKey = (testKey: string) => {
    setLicenseKeyInput(testKey);
    const result = LicenseManager.activateLicenseKey(testKey);
    if (result.success && result.license) {
      setSuccessMsg(result.message);
      if (onLicenseActivated) {
        onLicenseActivated(result.license);
      }
      setTimeout(() => {
        onClose();
        setShowKeyInput(false);
        setLicenseKeyInput('');
        setSuccessMsg(null);
      }, 1200);
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div
      id="pro-upgrade-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="pro-upgrade-modal-content"
        className="bg-slate-900 border border-amber-500/40 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header Banner */}
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-600/20 border-b border-amber-500/30 p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl shadow-inner">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-mono">
                  PRO
                </span>
                <h3 className="text-lg font-black text-white">Hanouti 40 PRO</h3>
              </div>
              <p className="text-xs text-amber-200/80 mt-1">
                {limitMessage ? 'Limite version GRATUITE atteinte' : 'Fonctionnalité réservée à l\'édition PRO'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Main notification message */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Lock className="w-4 h-4" />
              <span>
                {featureName ? `Fonctionnalité : ${featureName}` : '🔒 Hanouti 40 PRO'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {limitMessage ||
                'Cette fonctionnalité avancée est disponible exclusivement dans Hanouti 40 PRO. Passez à la vitesse supérieure sans limites de catalogue ni de volume.'}
            </p>
          </div>

          {/* Value highlights */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Articles & Stocks Illimités</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Ventes & Factures Illimitées</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dossier Complet & Tous PDF</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Relevés Dettes & Fournisseurs</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Scanners USB/Bluetooth HID</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sauvegardes Automatiques</span>
            </div>
          </div>

          {/* License Activation Form or Quick Dev Trigger */}
          {showKeyInput ? (
            <form onSubmit={handleActivate} className="space-y-3 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block">
                Saisir votre Clé de Licence PRO (Format: H40-PRO-XXXX) :
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={licenseKeyInput}
                  onChange={(e) => setLicenseKeyInput(e.target.value)}
                  placeholder="H40-PRO-0001"
                  className="flex-1 bg-slate-950 border border-slate-700 focus:border-amber-400 text-white font-mono px-3 py-2 rounded-lg text-xs uppercase focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Activer</span>
                </button>
              </div>

              {/* Dev quick test key helper */}
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-semibold block mb-1.5 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Clés de test développement (Section 5) :
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {TEST_PRO_LICENSES.slice(0, 5).map((tk) => (
                    <button
                      key={tk}
                      type="button"
                      onClick={() => handleUseQuickDevKey(tk)}
                      className="text-[10px] font-mono bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 px-2 py-0.5 rounded border border-slate-700 transition cursor-pointer"
                    >
                      {tk}
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-400 font-semibold bg-rose-950/40 p-2 rounded border border-rose-800/40">
                  {errorMsg}
                </p>
              )}
              {successMsg && (
                <p className="text-xs text-emerald-400 font-semibold bg-emerald-950/40 p-2 rounded border border-emerald-800/40 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{successMsg}</span>
                </p>
              )}
            </form>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-950/90 border-t border-slate-800 px-6 py-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Plus tard
          </button>

          <div className="flex items-center gap-2">
            {!showKeyInput ? (
              <button
                type="button"
                onClick={() => setShowKeyInput(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Crown className="w-4 h-4" />
                <span>Saisir une Clé de Licence</span>
              </button>
            ) : null}

            {onNavigateToLicenseSettings ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToLicenseSettings();
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-2 rounded-lg text-xs transition flex items-center gap-1 border border-slate-700 cursor-pointer"
              >
                <span>Gérer Licence</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
