import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  X,
  Lock,
  Eye,
  EyeOff,
  Download,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { StoreSettings } from '../types';
import { isValidResetPassword } from '../utils/licenseManager';

interface ResetSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetAllBusinessData: () => void;
  onTriggerBackup: () => boolean; // returns true if backup succeeded
  onResetFormOnly?: () => void;
  onResetFiltersOnly?: () => void;
  onResetSettingsOnly?: () => void;
  settings: StoreSettings;
}

type ResetModalStep = 'STEP_1_WARNING' | 'STEP_2_PASSWORD' | 'RESETTING' | 'SUCCESS';

export const ResetSafetyModal: React.FC<ResetSafetyModalProps> = ({
  isOpen,
  onClose,
  onResetAllBusinessData,
  onTriggerBackup,
  onResetFormOnly,
  onResetFiltersOnly,
  onResetSettingsOnly,
  settings,
}) => {
  const [step, setStep] = useState<ResetModalStep>('STEP_1_WARNING');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [backupVerified, setBackupVerified] = useState(false);
  const [backupFilename, setBackupFilename] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('STEP_1_WARNING');
    setPasswordInput('');
    setShowPassword(false);
    setErrorMsg(null);
    setBackupVerified(false);
    setBackupFilename(null);
    onClose();
  };

  // Step 1: User clicks Continue
  const handleContinueToPassword = () => {
    setErrorMsg(null);
    // Automatic backup requirement before destructive reset
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `Hanouti40_AutoBackup_BeforeReset_${dateStr}.json`;

    try {
      const backupCreated = onTriggerBackup();
      if (!backupCreated) {
        setErrorMsg('Échec de la sauvegarde automatique. Réinitialisation annulée par sécurité.');
        return;
      }
      setBackupVerified(true);
      setBackupFilename(filename);
      setStep('STEP_2_PASSWORD');
    } catch {
      setErrorMsg('Erreur lors de la création de la sauvegarde de sécurité. Annulation.');
    }
  };

  // Step 2: Confirm Reset with password
  const handleConfirmReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate password case-insensitive for letters: 'karim40', 'KARIM40', 'Karim40', etc.
    if (!isValidResetPassword(passwordInput)) {
      setErrorMsg('Incorrect password.');
      return;
    }

    if (!backupVerified) {
      setErrorMsg('Erreur : La sauvegarde préalable n\'a pas été validée.');
      return;
    }

    // Begin safe reset
    setStep('RESETTING');

    setTimeout(() => {
      try {
        onResetAllBusinessData();
        setStep('SUCCESS');
      } catch (err) {
        setErrorMsg('Erreur lors de la réinitialisation de la base de données.');
        setStep('STEP_2_PASSWORD');
      }
    }, 800);
  };

  return (
    <div
      id="reset-everything-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        id="reset-everything-dialog"
        className="bg-slate-900 border border-rose-600/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-100 ring-1 ring-rose-500/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-rose-950/80 border border-rose-700/60 rounded-xl text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-rose-300 uppercase tracking-wide">
                RESET EVERYTHING — HANOUTI 40
              </h3>
              <p className="text-xs text-slate-400">Réinitialisation complète de la base de données</p>
            </div>
          </div>
          {step !== 'RESETTING' && (
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* STEP 1: Strong Warning Screen */}
        {step === 'STEP_1_WARNING' && (
          <div className="space-y-4">
            <div className="bg-rose-950/50 border border-rose-700/50 rounded-xl p-4.5 space-y-3">
              <div className="flex items-center gap-2 text-rose-300 font-black text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>⚠️ RESET EVERYTHING</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-semibold">
                This will permanently clear all business data and return Hanouti 40 to a new empty state.
              </p>
              <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-rose-800/40">
                <p>• Les articles, stocks, ventes, achats, factures, crédits et dettes seront remis à 0.</p>
                <p>• Une sauvegarde automatique sera générée avant toute suppression.</p>
                <p>
                  • <strong className="text-amber-300">Votre licence PRO et vos paramètres vitaux seront conservés.</strong>
                </p>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 bg-rose-950/60 border border-rose-800 p-2.5 rounded-lg font-semibold">
                {errorMsg}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleContinueToPassword}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>Continue</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Password Entry Screen */}
        {step === 'STEP_2_PASSWORD' && (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sauvegarde automatique de sécurité vérifiée et téléchargée.</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                  Enter reset password to continue.
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter reset password"
                    autoFocus
                    className="w-full bg-slate-900 border border-slate-700 focus:border-rose-500 text-white px-3.5 py-2.5 rounded-lg text-sm pr-10 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Mot de passe système requis (insensible à la casse des lettres).
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="text-xs text-rose-400 font-bold bg-rose-950/60 border border-rose-800 p-2.5 rounded-lg">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('STEP_1_WARNING')}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Retour
              </button>

              <button
                type="submit"
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-2.5 rounded-lg text-xs transition shadow-lg cursor-pointer flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Confirm Reset</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP: Resetting in progress */}
        {step === 'RESETTING' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-white">Resetting Hanouti 40...</p>
            <p className="text-xs text-slate-400">
              Nettoyage transactionnel de la base de données Room et réinitialisation des soldes...
            </p>
          </div>
        )}

        {/* STEP: Success Screen */}
        {step === 'SUCCESS' && (
          <div className="space-y-4 py-2 text-center">
            <div className="w-14 h-14 bg-emerald-950/80 border border-emerald-600 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-base font-bold text-emerald-400">
                ✓ Hanouti 40 has been reset successfully.
              </h4>
              <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
                Toutes les données commerciales (produits, ventes, factures, crédits, dépenses) ont été remises à zéro.
                La base de données est propre et prête pour une nouvelle activité.
              </p>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleClose}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-lg text-xs transition cursor-pointer shadow-sm"
              >
                Ouvrir Hanouti 40
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
