import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Smartphone,
  Monitor,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  QrCode,
  Trash2,
  Filter,
  ShieldCheck,
  Server,
  Layers,
  ArrowRight,
  Database,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';
import {
  SyncConflict,
  SyncConnectionStatus,
  SyncDevice,
  SyncEngine,
  SyncLogEntry,
  SyncQueueItem,
} from '../utils/syncEngine';
import { PairingModal } from './PairingModal';
import { ConflictResolutionModal } from './ConflictResolutionModal';

interface SyncViewProps {
  onSyncTriggered?: () => void;
}

export const SyncView: React.FC<SyncViewProps> = ({ onSyncTriggered }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'devices' | 'logs' | 'conflicts'>('overview');
  const [status, setStatus] = useState<SyncConnectionStatus>(SyncEngine.getCurrentStatus());
  const [lastSyncTime, setLastSyncTime] = useState<string>(SyncEngine.getLastSyncTime());
  const [isOnline, setIsOnline] = useState<boolean>(SyncEngine.isOnline());
  const [devices, setDevices] = useState<SyncDevice[]>(SyncEngine.getDevices());
  const [logs, setLogs] = useState<SyncLogEntry[]>(SyncEngine.getLogs());
  const [conflicts, setConflicts] = useState<SyncConflict[]>(SyncEngine.getConflicts());
  const [queue, setQueue] = useState<SyncQueueItem[]>(SyncEngine.getQueue());
  const [isSyncingNow, setIsSyncingNow] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Modals
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);

  // Filters for log
  const [logFilterEntity, setLogFilterEntity] = useState<string>('ALL');

  useEffect(() => {
    const unsub = SyncEngine.onStatusChange((newStatus) => {
      setStatus(newStatus);
      setLastSyncTime(SyncEngine.getLastSyncTime());
      setDevices(SyncEngine.getDevices());
      setLogs(SyncEngine.getLogs());
      setConflicts(SyncEngine.getConflicts());
      setQueue(SyncEngine.getQueue());
      setIsOnline(SyncEngine.isOnline());
    });
    return () => unsub();
  }, []);

  const refreshAllState = () => {
    setStatus(SyncEngine.getCurrentStatus());
    setLastSyncTime(SyncEngine.getLastSyncTime());
    setDevices(SyncEngine.getDevices());
    setLogs(SyncEngine.getLogs());
    setConflicts(SyncEngine.getConflicts());
    setQueue(SyncEngine.getQueue());
    setIsOnline(SyncEngine.isOnline());
  };

  const handleManualSync = async () => {
    setIsSyncingNow(true);
    setSyncFeedback(null);
    const res = await SyncEngine.syncNow();
    setIsSyncingNow(false);
    setSyncFeedback(res);
    refreshAllState();
    if (onSyncTriggered) onSyncTriggered();
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  const handleToggleOnline = () => {
    const nextState = !isOnline;
    SyncEngine.setNetworkOnline(nextState);
    setIsOnline(nextState);
    refreshAllState();
  };

  const handleRemoveDevice = (deviceId: string) => {
    if (confirm('Voulez-vous vraiment déconnecter et révoquer cet appareil ?')) {
      SyncEngine.removeDevice(deviceId);
      refreshAllState();
    }
  };

  const pendingCount = queue.filter((q) => q.status === 'PENDING' || q.status === 'FAILED').length;
  const unresolvedConflictsCount = conflicts.filter((c) => c.status === 'UNRESOLVED').length;

  const filteredLogs = logFilterEntity === 'ALL'
    ? logs
    : logs.filter((l) => l.entityType === logFilterEntity);

  return (
    <div id="sync-management-container" className="space-y-6">
      {/* Synchronization Top Banner & Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`p-3.5 rounded-2xl border ${
              status === 'SYNCED'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : status === 'SYNCING'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : status === 'OFFLINE'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-orange-500/20 text-orange-400 border-orange-500/40'
            }`}
          >
            <Radio className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Synchronisation Temps Réel
              </span>
              {status === 'SYNCED' && (
                <span className="bg-emerald-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  CONNECTÉ & SYNCHRONISÉ
                </span>
              )}
              {status === 'SYNCING' && (
                <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  SYNCHRONISATION EN COURS...
                </span>
              )}
              {status === 'OFFLINE' && (
                <span className="bg-rose-500 text-white font-black text-xs px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <WifiOff className="w-3.5 h-3.5" />
                  HORS-LIGNE (FILE D'ATTENTE ACTIVE)
                </span>
              )}
              {status === 'ERROR' && (
                <span className="bg-orange-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  CONFLIT OU ERREUR
                </span>
              )}
            </div>

            <h3 className="text-lg font-black text-white mt-1">
              Android Phone ↔ Serveur Cloud ↔ PC Bureau
            </h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Dernière synchronisation : <strong className="text-slate-200">{lastSyncTime}</strong></span>
              <span>•</span>
              <span>En attente : <strong className="text-amber-400 font-mono">{pendingCount}</strong></span>
            </p>
          </div>
        </div>

        {/* Sync Now & Network toggle button */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={handleToggleOnline}
            className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              isOnline
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-rose-950/60 hover:bg-rose-950 text-rose-300 border-rose-800'
            }`}
            title="Basculer le mode réseau pour tester la résilience hors-ligne"
          >
            {isOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-rose-400" />}
            <span>{isOnline ? 'Réseau : En Ligne' : 'Réseau : Hors-ligne'}</span>
          </button>

          <button
            id="btn-sync-now-main"
            type="button"
            onClick={handleManualSync}
            disabled={isSyncingNow || !isOnline}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingNow ? 'animate-spin' : ''}`} />
            <span>Synchroniser Maintenant</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            syncFeedback.success
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-800 text-rose-300'
          }`}
        >
          {syncFeedback.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{syncFeedback.message}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'overview'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-4 h-4 text-indigo-400" />
          <span>Vue d'Ensemble & État</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('devices')}
          className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'devices'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>Appareils Connectés ({devices.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'logs'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Journal d'Événements ({logs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('conflicts')}
          className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'conflicts'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>Conflits</span>
          {unresolvedConflictsCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {unresolvedConflictsCount}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: OVERVIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-xs text-slate-400 font-semibold block">
                Canal de Synchronisation Temps Réel
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-white text-sm">PostgreSQL / Supabase Realtime</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Protocole bidirectionnel avec canal BroadcastChannel pour propagation instantanée inter-onglets et inter-appareils.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-xs text-slate-400 font-semibold block">
                Génération de Base de Données
              </span>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <span className="font-mono font-bold text-white text-sm">
                  Génération #{SyncEngine.getGeneration()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Protège l'intégrité lors d'un « Reset Everything » : les données obsolètes hors-ligne ne sont pas réinjectées.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-xs text-slate-400 font-semibold block">
                Sécurité Financière & Immuabilité
              </span>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-sm">Ventes & Factures Protégées</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Aucun écrasement destructif silencieux des écritures de caisse, paiements et dettes clients.
              </p>
            </div>
          </div>

          {/* Quick Connect New Device Banner */}
          <div className="bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  Associer votre Téléphone Android ou votre PC de Caisse
                </h4>
                <p className="text-xs text-slate-400">
                  Générez un code temporaire ou un QR Code pour connecter un nouvel appareil en 5 secondes.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPairingOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shrink-0"
            >
              <QrCode className="w-4 h-4" />
              <span>Associer un Appareil</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: DEVICES */}
      {/* ========================================================================= */}
      {activeSubTab === 'devices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Appareils Autorisés sur ce Magasin ({devices.length})</span>
            </h4>

            <button
              type="button"
              onClick={() => setIsPairingOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Associer un Appareil</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map((dev) => (
              <div
                key={dev.deviceId}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400">
                      {dev.deviceType === 'ANDROID_PHONE' ? (
                        <Smartphone className="w-5 h-5" />
                      ) : (
                        <Monitor className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{dev.deviceName}</span>
                        {dev.isCurrentDevice && (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.2 rounded-full font-bold">
                            Cet Appareil
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                        ID: {dev.deviceId} • IP: {dev.ipAddress || '192.168.1.100'}
                      </span>
                    </div>
                  </div>

                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {dev.status}
                  </span>
                </div>

                <div className="border-t border-slate-800/80 pt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Dernière synchro : {new Date(dev.lastSyncAt).toLocaleTimeString()}</span>
                  {!dev.isCurrentDevice && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDevice(dev.deviceId)}
                      className="text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Révoquer</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: SYNC AUDIT LOG */}
      {/* ========================================================================= */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Historique Récent des Événements ({filteredLogs.length})</span>
            </h4>

            {/* Filter Entity */}
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={logFilterEntity}
                onChange={(e) => setLogFilterEntity(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">Toutes les Entités</option>
                <option value="PRODUCT">Articles & Stocks</option>
                <option value="SALE">Ventes & Caisses</option>
                <option value="CUSTOMER">Clients & Dettes</option>
                <option value="PURCHASE">Achats</option>
                <option value="SETTINGS">Paramètres & Licence</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Heure</th>
                    <th className="py-3 px-4">Entité</th>
                    <th className="py-3 px-4">Opération</th>
                    <th className="py-3 px-4">Détails de l'Événement</th>
                    <th className="py-3 px-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-sans">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 italic">
                        Aucun événement de synchronisation enregistré pour ce filtre.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.slice(0, 30).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-white">
                          {log.entityType}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              log.operation === 'CREATE'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                                : log.operation === 'UPDATE'
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/50'
                                : 'bg-rose-950 text-rose-300 border border-rose-800/50'
                            }`}
                          >
                            {log.operation}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-300">
                          {log.summary}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : log.status === 'OFFLINE_QUEUED'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {log.status === 'SUCCESS'
                              ? 'Synchronisé'
                              : log.status === 'OFFLINE_QUEUED'
                              ? 'En file locale'
                              : log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: CONFLICTS */}
      {/* ========================================================================= */}
      {activeSubTab === 'conflicts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Conflits Concomitants Détectés ({conflicts.length})</span>
            </h4>
          </div>

          {conflicts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h5 className="font-bold text-white text-sm">Aucun Conflit Détecté</h5>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Toutes les modifications entre PC et Android sont parfaitement alignées et synchronisées sans divergence.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {conflicts.map((conf) => (
                <div
                  key={conf.id}
                  className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{conf.entityName}</span>
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                        {conf.entityType}
                      </span>
                      <span className="text-xs text-slate-400">
                        {conf.status === 'UNRESOLVED' ? '⚠️ En attente de résolution' : '✓ Résolu'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Détecté à {new Date(conf.detectedAt).toLocaleTimeString()} • Appareil distant : {conf.remoteDevice}
                    </p>
                  </div>

                  {conf.status === 'UNRESOLVED' && (
                    <button
                      type="button"
                      onClick={() => setSelectedConflict(conf)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Résoudre Conflit</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pairing Modal */}
      <PairingModal
        isOpen={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
        onDevicePaired={() => refreshAllState()}
      />

      {/* Conflict Resolution Modal */}
      <ConflictResolutionModal
        isOpen={Boolean(selectedConflict)}
        conflict={selectedConflict}
        onClose={() => setSelectedConflict(null)}
        onResolved={() => refreshAllState()}
      />
    </div>
  );
};
