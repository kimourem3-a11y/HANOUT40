import React from 'react';
import { AlertTriangle, Check, ArrowRight, ShieldAlert, X } from 'lucide-react';
import { SyncConflict, SyncEngine } from '../utils/syncEngine';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  conflict: SyncConflict | null;
  onClose: () => void;
  onResolved: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  conflict,
  onClose,
  onResolved,
}) => {
  if (!isOpen || !conflict) return null;

  const handleResolve = (choice: 'KEEP_LOCAL' | 'KEEP_REMOTE' | 'MERGE') => {
    SyncEngine.resolveConflict(conflict.id, choice);
    onResolved();
    onClose();
  };

  const renderValue = (val: any) => {
    if (typeof val === 'object' && val !== null) {
      return (
        <pre className="text-[11px] font-mono bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300 overflow-x-auto max-h-40">
          {JSON.stringify(val, null, 2)}
        </pre>
      );
    }
    return <span className="font-mono font-bold text-white">{String(val)}</span>;
  };

  return (
    <div
      id="conflict-resolution-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="conflict-resolution-modal-content"
        className="bg-slate-900 border border-amber-500/40 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-amber-500/10 border-b border-amber-500/30 p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Résolution de Conflit de Synchronisation
              </h3>
              <p className="text-xs text-amber-300/80">
                Modification concurrente détectée sur : {conflict.entityName}
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

        {/* Content Comparison */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <p className="text-xs text-slate-300 leading-relaxed">
            Cet élément a été modifié simultanément sur cet appareil et sur un autre client connecté. Veuillez sélectionner la version à conserver dans la base de données centrale :
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Local Version */}
            <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Version Locale (Cet Appareil)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(conflict.localTimestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="pt-2">{renderValue(conflict.localValue)}</div>
              <button
                type="button"
                onClick={() => handleResolve('KEEP_LOCAL')}
                className="w-full mt-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-3 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Conserver Version Locale</span>
              </button>
            </div>

            {/* Remote Version */}
            <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider truncate">
                  Distant ({conflict.remoteDevice})
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(conflict.remoteTimestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="pt-2">{renderValue(conflict.remoteValue)}</div>
              <button
                type="button"
                onClick={() => handleResolve('KEEP_REMOTE')}
                className="w-full mt-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 px-3 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Accepter Version Distante</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 flex items-center justify-between text-xs text-slate-400">
          <span>Identifiant UUID : {conflict.entityUuid.slice(0, 8)}...</span>
          <button
            type="button"
            onClick={() => handleResolve('MERGE')}
            className="text-slate-300 hover:text-white underline cursor-pointer"
          >
            Fusionner intelligemment (Union des champs)
          </button>
        </div>
      </div>
    </div>
  );
};
