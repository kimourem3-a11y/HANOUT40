import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, WifiOff, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { clearHanoutiCache } from '../utils/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Hanouti40 ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleContinueOffline = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('hanouti40_sync_sim_online', 'false');
      }
    } catch {}
    this.handleRetry();
  };

  handleResetTransientData = () => {
    if (window.confirm('Voulez-vous vider le cache temporaire et recharger Hanouti 40 ? Vos produits et ventes restent sécurisés.')) {
      clearHanoutiCache();
      this.handleRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans select-none">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Header / Brand */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
                  HANOUTI 40
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
                    Mode Sécurisé
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Incident d'exécution détecté — Récupération automatique
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-4 text-xs text-rose-300 space-y-1">
              <p className="font-semibold text-rose-200">
                Une exception a interrompu le rendu de l'interface :
              </p>
              <p className="font-mono text-[11px] text-rose-400 break-words">
                {this.state.error?.message || 'Erreur non spécifiée'}
              </p>
            </div>

            {/* Recovery Actions */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={this.handleRetry}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Réessayer / Recharger l'application</span>
              </button>

              <button
                type="button"
                onClick={this.handleContinueOffline}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <WifiOff className="w-4 h-4 text-amber-400" />
                <span>Continuer en Mode Hors-Ligne</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetTransientData}
                className="w-full py-2 px-4 bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-300 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Nettoyer le cache temporaire</span>
              </button>
            </div>

            {/* Debug Details Accordion */}
            <div className="border-t border-slate-800/80 pt-4">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="text-xs text-slate-500 hover:text-slate-400 flex items-center gap-1.5 transition cursor-pointer"
              >
                {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>Détails techniques (Mode Diagnostic)</span>
              </button>

              {this.state.showDetails && (
                <pre className="mt-3 p-3 bg-slate-950 rounded-lg text-[10px] text-slate-400 font-mono overflow-auto max-h-48 border border-slate-800">
                  {this.state.error?.stack || 'Aucune trace de pile disponible'}
                  {'\n\nComponent Stack:\n'}
                  {this.state.errorInfo?.componentStack || 'Non disponible'}
                </pre>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
