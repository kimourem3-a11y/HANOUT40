import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Smartphone,
  Monitor,
  Copy,
  CheckCircle2,
  X,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { PairingSession, SyncEngine } from '../utils/syncEngine';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDevicePaired?: () => void;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  isOpen,
  onClose,
  onDevicePaired,
}) => {
  const [session, setSession] = useState<PairingSession | null>(null);
  const [copied, setCopied] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [deviceNameInput, setDeviceNameInput] = useState('');
  const [pairFeedback, setPairFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [mode, setMode] = useState<'SHOW_CODE' | 'ENTER_CODE'>('SHOW_CODE');

  useEffect(() => {
    if (isOpen) {
      generateNewSession();
      setPairFeedback(null);
      setManualCodeInput('');
      setDeviceNameInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const generateNewSession = () => {
    const s = SyncEngine.createPairingSession();
    setSession(s);
  };

  const handleCopyCode = () => {
    if (!session) return;
    navigator.clipboard?.writeText(session.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConnectWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    const res = SyncEngine.completePairingWithCode(
      manualCodeInput.trim(),
      deviceNameInput.trim() || undefined
    );
    setPairFeedback(res);
    if (res.success) {
      setTimeout(() => {
        onClose();
        if (onDevicePaired) onDevicePaired();
      }, 1500);
    }
  };

  return (
    <div
      id="sync-pairing-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="sync-pairing-modal-content"
        className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950/50 border-b border-slate-800 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Couplage Android ↔ PC en Temps Réel
              </h3>
              <p className="text-xs text-slate-400">
                Liez votre téléphone Android et votre ordinateur PC
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

        {/* Tab Toggle: Host vs Join */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('SHOW_CODE')}
            className={`flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'SHOW_CODE'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Afficher QR & Code de Couplage</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('ENTER_CODE')}
            className={`flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'ENTER_CODE'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Saisir un Code Reçu</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {mode === 'SHOW_CODE' && session && (
            <div className="space-y-4 text-center">
              {/* SVG QR Code Simulation */}
              <div className="inline-block p-4 bg-white rounded-2xl shadow-xl border-4 border-indigo-500/20">
                <svg
                  className="w-48 h-48 mx-auto text-slate-900"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                >
                  {/* Outer corner squares */}
                  <rect x="5" y="5" width="26" height="26" rx="2" fill="currentColor" />
                  <rect x="9" y="9" width="18" height="18" fill="white" />
                  <rect x="13" y="13" width="10" height="10" fill="currentColor" />

                  <rect x="69" y="5" width="26" height="26" rx="2" fill="currentColor" />
                  <rect x="73" y="9" width="18" height="18" fill="white" />
                  <rect x="77" y="13" width="10" height="10" fill="currentColor" />

                  <rect x="5" y="69" width="26" height="26" rx="2" fill="currentColor" />
                  <rect x="9" y="73" width="18" height="18" fill="white" />
                  <rect x="13" y="77" width="10" height="10" fill="currentColor" />

                  {/* Inner data pattern simulation */}
                  <rect x="36" y="8" width="6" height="6" />
                  <rect x="46" y="8" width="6" height="6" />
                  <rect x="56" y="8" width="6" height="6" />
                  <rect x="36" y="18" width="6" height="6" />
                  <rect x="46" y="18" width="6" height="6" />
                  <rect x="56" y="18" width="6" height="6" />
                  <rect x="8" y="36" width="6" height="6" />
                  <rect x="18" y="36" width="6" height="6" />
                  <rect x="28" y="36" width="6" height="6" />
                  <rect x="38" y="36" width="6" height="6" />
                  <rect x="48" y="36" width="6" height="6" />
                  <rect x="58" y="36" width="6" height="6" />
                  <rect x="68" y="36" width="6" height="6" />
                  <rect x="78" y="36" width="6" height="6" />
                  <rect x="88" y="36" width="6" height="6" />
                  <rect x="8" y="46" width="6" height="6" />
                  <rect x="28" y="46" width="6" height="6" />
                  <rect x="48" y="46" width="6" height="6" />
                  <rect x="68" y="46" width="6" height="6" />
                  <rect x="88" y="46" width="6" height="6" />
                  <rect x="8" y="56" width="6" height="6" />
                  <rect x="18" y="56" width="6" height="6" />
                  <rect x="38" y="56" width="6" height="6" />
                  <rect x="58" y="56" width="6" height="6" />
                  <rect x="78" y="56" width="6" height="6" />
                  <rect x="36" y="68" width="6" height="6" />
                  <rect x="46" y="68" width="6" height="6" />
                  <rect x="56" y="68" width="6" height="6" />
                  <rect x="68" y="68" width="6" height="6" />
                  <rect x="88" y="68" width="6" height="6" />
                  <rect x="36" y="78" width="6" height="6" />
                  <rect x="56" y="78" width="6" height="6" />
                  <rect x="78" y="78" width="6" height="6" />
                  <rect x="46" y="88" width="6" height="6" />
                  <rect x="68" y="88" width="6" height="6" />
                  <rect x="88" y="88" width="6" height="6" />
                </svg>
              </div>

              {/* Pairing Code Display */}
              <div>
                <p className="text-xs text-slate-400 font-medium mb-1">
                  Ou saisissez ce code sur votre PC :
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-2xl font-black tracking-widest text-amber-400 bg-slate-950 border border-slate-800 px-5 py-2 rounded-xl shadow-inner">
                    {session.code}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    title="Copier le code"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={generateNewSession}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    title="Générer un nouveau code"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 text-left space-y-1">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Identifiant Entreprise : {session.businessId}</span>
                </p>
                <p className="text-slate-400">
                  Ce code expire dans 10 minutes. Une fois couplé, les articles, ventes et factures se synchroniseront instantanément.
                </p>
              </div>
            </div>
          )}

          {mode === 'ENTER_CODE' && (
            <form onSubmit={handleConnectWithCode} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                  Nom de cet appareil (optionnel) :
                </label>
                <input
                  type="text"
                  value={deviceNameInput}
                  onChange={(e) => setDeviceNameInput(e.target.value)}
                  placeholder="Ex: Hanouti PC Bureau ou Tablette 02"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3.5 py-2.5 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                  Code de Couplage Reçu (Format H40-XXX-XXX) :
                </label>
                <input
                  type="text"
                  required
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  placeholder="Ex: H40-891-2KL"
                  className="w-full bg-slate-950 border border-slate-700 text-amber-400 font-mono text-center font-bold tracking-widest uppercase px-3.5 py-3 rounded-lg text-base focus:outline-none focus:border-amber-400"
                  autoFocus
                />
              </div>

              {pairFeedback && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    pairFeedback.success
                      ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                  }`}
                >
                  {pairFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <X className="w-4 h-4 text-rose-400" />
                  )}
                  <span>{pairFeedback.message}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <Zap className="w-4 h-4" />
                <span>Valider et Connecter cet Appareil</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
