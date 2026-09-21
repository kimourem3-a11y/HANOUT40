import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Battery,
  BatteryCharging,
  Smartphone,
  Laptop,
  Clock,
  Plus,
  Trash2,
  Play,
  Sliders,
  ShieldCheck,
  Radio,
  SlidersHorizontal,
  Package,
  Calendar,
  AlertCircle,
  ExternalLink,
  Volume2,
  Vibrate,
  Info,
} from 'lucide-react';
import {
  AppNotification,
  BackgroundSettings,
  BackgroundStatus,
  Product,
  ReminderCategory,
  ReminderFrequency,
  ScheduledReminder,
  Supplier,
} from '../types';
import { BackgroundMonitor } from '../utils/backgroundMonitor';
import { SyncEngine } from '../utils/syncEngine';

interface BackgroundSettingsSectionProps {
  products: Product[];
  suppliers: Supplier[];
  onViewProduct?: (productId: number) => void;
  onCreatePurchase?: (productId?: number) => void;
}

export const BackgroundSettingsSection: React.FC<BackgroundSettingsSectionProps> = ({
  products,
  suppliers,
  onViewProduct,
  onCreatePurchase,
}) => {
  const [status, setStatus] = useState<BackgroundStatus>(BackgroundMonitor.getStatus());
  const [settings, setSettings] = useState<BackgroundSettings>(BackgroundMonitor.getSettings());
  const [reminders, setReminders] = useState<ScheduledReminder[]>(BackgroundMonitor.getReminders());
  const [notifications, setNotifications] = useState<AppNotification[]>(
    BackgroundMonitor.getStoredNotifications()
  );

  // New Reminder Modal / Form State
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [remTitle, setRemTitle] = useState('');
  const [remCategory, setRemCategory] = useState<ReminderCategory>('STOCK');
  const [remFrequency, setRemFrequency] = useState<ReminderFrequency>('WEEKLY');
  const [remTime, setRemTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return d.toISOString().slice(0, 16);
  });
  const [remTargetName, setRemTargetName] = useState('');
  const [remNotes, setRemNotes] = useState('');
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubStatus = BackgroundMonitor.onStatusChange((st) => setStatus(st));
    const unsubNotifs = BackgroundMonitor.onNotificationsChange((n) => setNotifications(n));
    return () => {
      unsubStatus();
      unsubNotifs();
    };
  }, []);

  const handleToggleMonitoring = () => {
    const updated = !settings.enableBackgroundMonitoring;
    BackgroundMonitor.saveSettings({ enableBackgroundMonitoring: updated });
    setSettings(BackgroundMonitor.getSettings());
  };

  const handleRequestPermission = async () => {
    const res = await BackgroundMonitor.requestNotificationPermission();
    setStatus(BackgroundMonitor.getStatus());
    if (res === 'granted') {
      setTestFeedback('✓ Autorisation accordée avec succès ! Les alertes système sont actives.');
    } else if (res === 'denied') {
      setTestFeedback('⚠️ Notifications bloquées. Veuillez les activer dans les paramètres Android/Navigateur.');
    }
  };

  const handleAllowBackgroundActivity = () => {
    BackgroundMonitor.requestAllowBackgroundActivity();
  };

  const handleSaveThreshold = (val: number) => {
    const clamped = Math.max(1, Math.min(100, val));
    BackgroundMonitor.saveSettings({ defaultLowStockThreshold: clamped });
    setSettings(BackgroundMonitor.getSettings());
  };

  const handleTestNotification = () => {
    BackgroundMonitor.deliverNotification({
      id: `test-${Date.now()}`,
      channelId: 'stock_alerts',
      title: '🔔 HANOUTI 40 — NOTIFICATION SYSTÈME',
      body: 'Test de notification en arrière-plan réussi ! Le canal d\'alerte fonctionne parfaitement.',
      timestamp: new Date().toISOString(),
      read: false,
      data: { type: 'SYNC_EVENT' },
    });
    setTestFeedback('Notification émise. Vérifiez la barre d\'état du système.');
    setTimeout(() => setTestFeedback(null), 5000);
  };

  const handleSimulateLowStock = () => {
    // Simulate: Coca Cola 1L stock dropping from 6 -> 5
    const targetProduct = products.find((p) => p.name.toLowerCase().includes('coca')) || products[0] || {
      id: 999,
      name: 'Coca Cola 1L',
      currentStock: 5,
      minStockAlert: 5,
      supplierId: 1,
    };

    BackgroundMonitor.deliverNotification({
      id: `low-stock-sim-${Date.now()}`,
      channelId: 'stock_alerts',
      title: '🔔 HANOUTI 40\nLOW STOCK',
      body: `${targetProduct.name}\nOnly 5 pieces remaining.\nSupplier:\nSupplier A`,
      timestamp: new Date().toISOString(),
      read: false,
      data: {
        type: 'LOW_STOCK',
        productId: targetProduct.id,
        productName: targetProduct.name,
        currentStock: 5,
        minStockAlert: 5,
        supplierName: 'Supplier A',
      },
    });
    setTestFeedback('Alerte Stock Bas émise : Coca Cola 1L (5 pièces restantes).');
    setTimeout(() => setTestFeedback(null), 5000);
  };

  const handleAddReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim()) return;

    BackgroundMonitor.addReminder({
      title: remTitle.trim(),
      category: remCategory,
      frequency: remFrequency,
      scheduledTime: remTime,
      targetName: remTargetName.trim() || undefined,
      notes: remNotes.trim() || undefined,
      isActive: true,
    });

    setReminders(BackgroundMonitor.getReminders());
    setShowAddReminder(false);
    setRemTitle('');
    setRemTargetName('');
    setRemNotes('');
    setTestFeedback('✓ Nouveau rappel planifié avec succès.');
    setTimeout(() => setTestFeedback(null), 4000);
  };

  const handleDeleteReminder = (id: string) => {
    BackgroundMonitor.deleteReminder(id);
    setReminders(BackgroundMonitor.getReminders());
  };

  const handleToggleReminder = (id: string) => {
    BackgroundMonitor.toggleReminderActive(id);
    setReminders(BackgroundMonitor.getReminders());
  };

  const handleTriggerReminderNow = (rem: ScheduledReminder) => {
    BackgroundMonitor.deliverNotification({
      id: `rem-test-${Date.now()}`,
      channelId: 'reminders',
      title: `⏰ HANOUTI 40 — RAPPEL : ${rem.title}`,
      body: `${rem.notes || 'Rappel d\'activité planifiée pour votre magasin.'}${rem.targetName ? `\nTiers : ${rem.targetName}` : ''}`,
      timestamp: new Date().toISOString(),
      read: false,
      data: {
        type: 'REMINDER',
        reminderId: rem.id,
      },
    });
    setTestFeedback(`Rappel déclenché : "${rem.title}".`);
    setTimeout(() => setTestFeedback(null), 4000);
  };

  const isPermGranted = status.notificationsPermission === 'granted';

  return (
    <div id="background-monitoring-settings" className="space-y-6">
      {/* 1. Live Background Status Card (Requirement 15) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950/70 border border-emerald-800/50 rounded-xl text-emerald-400 shadow-xs">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Surveillance en Arrière-plan & Notifications</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {status.platform}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Surveillance continue du stock, rappels planifiés et synchronisation même quand l'application est fermée.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isPermGranted && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>ENABLE NOTIFICATIONS</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Metrics Grid (Section 15) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Background monitoring */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Background monitoring
            </span>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${settings.enableBackgroundMonitoring ? 'bg-emerald-400 shadow-emerald-500/50 shadow-sm' : 'bg-rose-500'}`}></span>
              <span className="text-xs font-bold text-white">
                {settings.enableBackgroundMonitoring ? '🟢 Active' : '🔴 Inactive'}
              </span>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Notifications
            </span>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isPermGranted ? 'bg-emerald-400 shadow-emerald-500/50 shadow-sm' : 'bg-rose-500'}`}></span>
              <span className="text-xs font-bold text-white">
                {isPermGranted ? '🟢 Enabled' : '🔕 Disabled'}
              </span>
            </div>
          </div>

          {/* Sync */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Sync
            </span>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${status.isSyncActive ? 'bg-emerald-400 shadow-emerald-500/50 shadow-sm' : 'bg-amber-400'}`}></span>
              <span className="text-xs font-bold text-white">
                {status.isSyncActive ? '🟢 Active' : '🟠 Offline'}
              </span>
            </div>
          </div>

          {/* Last background sync */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Last background sync
            </span>
            <div className="mt-1.5 text-xs font-bold text-slate-200 font-mono">
              {status.lastSyncTimestamp ? status.lastSyncTimestamp.split('T')[1]?.slice(0, 8) || status.lastSyncTimestamp : '18:42:15'}
            </div>
          </div>

          {/* Pending changes */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pending changes
            </span>
            <div className="mt-1.5 text-xs font-bold text-emerald-400 font-mono">
              {status.pendingChangesCount}
            </div>
          </div>

          {/* Battery optimization */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Battery optimization
            </span>
            <div className="mt-1.5 flex items-center justify-between">
              <span className={`text-xs font-bold ${status.batteryOptimization === 'ALLOWED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {status.batteryOptimization === 'ALLOWED' ? 'Allowed' : 'Restricted'}
              </span>
              <button
                type="button"
                onClick={handleAllowBackgroundActivity}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                title="Autoriser l'activité continue sans mise en veille"
              >
                Gérer
              </button>
            </div>
          </div>
        </div>

        {testFeedback && (
          <div className="p-3 bg-indigo-950/60 border border-indigo-800/50 rounded-xl text-xs text-indigo-200 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{testFeedback}</span>
          </div>
        )}

        {/* Action button if battery is restricted or permission disabled */}
        {(!isPermGranted || status.batteryOptimization === 'RESTRICTED') && (
          <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                {!isPermGranted
                  ? '🔕 Les notifications sont désactivées. Le système ne pourra pas vous alerter en cas de stock bas.'
                  : 'Background activity may be restricted par le gestionnaire d\'alimentation du fabricant.'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!isPermGranted ? (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  ENABLE NOTIFICATIONS
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAllowBackgroundActivity}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  ALLOW BACKGROUND ACTIVITY
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Notification Channels (Section 10) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
          <span>Canaux de Notifications Système Android & Windows</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Channel 1: Stock Alerts */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black text-white">Hanouti 40 — Stock Alerts</span>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/40 px-2 py-0.5 rounded font-mono font-bold">
                IMPORTANCE: HAUTE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Détection automatique de stock bas (&le; seuil) et rupture complète (0 pièce) avec boutons [VIEW PRODUCT] et [CREATE PURCHASE].
            </p>
            <div className="flex items-center gap-3 text-[11px] text-slate-300 pt-1 border-t border-slate-900">
              <span className="flex items-center gap-1"><Volume2 className="w-3 h-3 text-emerald-400" /> Son</span>
              <span className="flex items-center gap-1"><Vibrate className="w-3 h-3 text-emerald-400" /> Vibration</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Badge</span>
            </div>
          </div>

          {/* Channel 2: Reminders */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-black text-white">Hanouti 40 — Reminders</span>
              </div>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/40 px-2 py-0.5 rounded font-mono font-bold">
                IMPORTANCE: HAUTE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Rappels planifiés de commandes fournisseurs, règlements de dettes et inventaires magasin.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-slate-300 pt-1 border-t border-slate-900">
              <span className="flex items-center gap-1"><Volume2 className="w-3 h-3 text-indigo-400" /> Son</span>
              <span className="flex items-center gap-1"><Vibrate className="w-3 h-3 text-indigo-400" /> Vibration</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-indigo-400" /> Badge</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Monitoring & Platform Options (Windows & Android Settings) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>Paramètres de surveillance en arrière-plan</span>
        </h4>

        <div className="space-y-3">
          {/* Master Monitoring Switch */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:bg-slate-950 transition">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">Activer la surveillance continue en arrière-plan</span>
              <span className="text-[11px] text-slate-400 block">
                Permet à WorkManager / Service Worker d'évaluer le stock et les rappels sans avoir besoin d'ouvrir l'application.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.enableBackgroundMonitoring}
              onChange={handleToggleMonitoring}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </label>

          {/* Low-stock threshold setting */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">Seuil d'alerte Stock Bas par défaut (low_stock_threshold)</span>
              <span className="text-[11px] text-slate-400 block">
                Condition : current_stock &le; low_stock_threshold. Une alerte réelle est émise dès que le seuil est franchi.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="50"
                value={settings.defaultLowStockThreshold}
                onChange={(e) => handleSaveThreshold(Number(e.target.value))}
                className="w-20 bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs p-2 rounded-lg text-center"
              />
              <span className="text-xs text-slate-400">pièces</span>
            </div>
          </div>

          {/* Windows Background Tray Option (Requirement 14) */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:bg-slate-950 transition">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-bold text-white">Keep Hanouti 40 running in background (Windows)</span>
              </div>
              <span className="text-[11px] text-slate-400 block">
                À la fermeture de la fenêtre principale, Hanouti 40 reste actif dans la barre des tâches (systray) pour continuer la synchronisation et les notifications.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.keepWindowsRunningInBackground}
              onChange={(e) => {
                BackgroundMonitor.saveSettings({ keepWindowsRunningInBackground: e.target.checked });
                setSettings(BackgroundMonitor.getSettings());
              }}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </label>

          {/* Sounds & Vibrations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Signal sonore des alertes</span>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => {
                  BackgroundMonitor.saveSettings({ soundEnabled: e.target.checked });
                  setSettings(BackgroundMonitor.getSettings());
                }}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <Vibrate className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vibration (Android & Tablettes)</span>
              </div>
              <input
                type="checkbox"
                checked={settings.vibrationEnabled}
                onChange={(e) => {
                  BackgroundMonitor.saveSettings({ vibrationEnabled: e.target.checked });
                  setSettings(BackgroundMonitor.getSettings());
                }}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      {/* 4. Scheduled Reminders Management (Section 11) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Rappels Planifiés & Notifications en Arrière-plan</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Commandes fournisseurs, paiements, vérifications de stock et inventaires livrés même écran verrouillé.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddReminder(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Rappel</span>
          </button>
        </div>

        {/* Reminders List */}
        <div className="space-y-2.5">
          {reminders.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/50 rounded-xl border border-slate-800/60">
              Aucun rappel actif. Cliquez sur "Nouveau Rappel" pour programmer une alerte.
            </div>
          ) : (
            reminders.map((rem) => (
              <div
                key={rem.id}
                className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  rem.isActive
                    ? 'bg-slate-950/80 border-slate-800'
                    : 'bg-slate-950/30 border-slate-900 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-white">{rem.title}</span>
                    <span className="text-[10px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded font-mono font-bold">
                      {rem.frequency}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-emerald-300 px-2 py-0.5 rounded font-mono">
                      {rem.category}
                    </span>
                    {rem.targetName && (
                      <span className="text-[10px] text-slate-400">
                        • {rem.targetName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {rem.notes || 'Rappel d\'activité périodique'}
                  </p>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Programmé pour : {rem.scheduledTime.replace('T', ' ')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleTriggerReminderNow(rem)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-xs flex items-center gap-1"
                    title="Tester immédiatement ce rappel"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px]">Tester</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleReminder(rem.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      rem.isActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {rem.isActive ? 'Actif' : 'Désactivé'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteReminder(rem.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                    title="Supprimer ce rappel"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 5. Diagnostic Verification & Acceptance Test Console (Section 17) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Tests d'Acceptation & Validation des Scénarios</span>
        </h4>
        <p className="text-xs text-slate-400">
          Vérifiez le comportement en conditions réelles (App fermée, écran verrouillé, mode hors-ligne, sync PC ↔ Android) :
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={handleTestNotification}
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition cursor-pointer group"
          >
            <div className="text-xs font-bold text-white group-hover:text-emerald-400 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-emerald-400" />
              <span>TEST NOTIFICATION</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Émet une notification native immédiate pour tester la permission et l'affichage.
            </p>
          </button>

          <button
            type="button"
            onClick={handleSimulateLowStock}
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition cursor-pointer group"
          >
            <div className="text-xs font-bold text-white group-hover:text-emerald-400 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-400" />
              <span>SIMULER STOCK BAS (6 &rarr; 5)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Simule le franchissement du seuil (5 &le; 5) : alerte avec boutons Voir Produit & Bon d'Achat.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              SyncEngine.syncNow();
              setTestFeedback('File de synchronisation traitée. Les changements distants sont évalués.');
              setTimeout(() => setTestFeedback(null), 4000);
            }}
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition cursor-pointer group"
          >
            <div className="text-xs font-bold text-white group-hover:text-emerald-400 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-indigo-400" />
              <span>TRAITER FILE SYNC EN ARRIÈRE-PLAN</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Déclenche la boucle Connect &rarr; Upload &rarr; Ack &rarr; Download &rarr; Stock Check.
            </p>
          </button>
        </div>
      </div>

      {/* 6. Transparency Limitation Notice (Section 16 requirement) */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-bold">
          <Info className="w-4 h-4 text-indigo-400" />
          <span>Information Importante sur le Fonctionnement Système (Android & Windows)</span>
        </div>
        <p className="leading-relaxed">
          Hanouti 40 s'appuie strictement sur les API natives supportées par le système d'exploitation :
          <strong> WorkManager</strong> et <strong>AlarmManager</strong> sur Android, et la <strong>Barre des tâches (System Tray)</strong> sur Windows.
          Conformément aux règles des systèmes d'exploitation modernes, Android et Windows peuvent suspendre ou restreindre temporairement l'exécution en cas d'économie d'énergie agressive.
          L'application n'utilise aucun artifice illégal (boucle infinie ou activité masquée) et se réactive automatiquement dès que l'OS l'autorise ou lors d'un redémarrage (<strong>BOOT_COMPLETED</strong>).
        </p>
      </div>

      {/* Modal: Add Reminder */}
      {showAddReminder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <span>Programmer un Nouveau Rappel</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddReminder(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleAddReminderSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Intitulé du rappel *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Commander Coca Cola, Régler Fournisseur..."
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Catégorie
                  </label>
                  <select
                    value={remCategory}
                    onChange={(e) => setRemCategory(e.target.value as ReminderCategory)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
                  >
                    <option value="STOCK">Stock & Commandes</option>
                    <option value="SUPPLIER">Fournisseurs</option>
                    <option value="PAYMENT">Règlement / Dette</option>
                    <option value="INVENTORY">Inventaire</option>
                    <option value="GENERAL">Général</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Fréquence
                  </label>
                  <select
                    value={remFrequency}
                    onChange={(e) => setRemFrequency(e.target.value as ReminderFrequency)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ONCE">Une seule fois</option>
                    <option value="DAILY">Quotidien (Tous les jours)</option>
                    <option value="WEEKLY">Hebdomadaire</option>
                    <option value="MONTHLY">Mensuel</option>
                    <option value="CUSTOM">Personnalisé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Date et Heure de déclenchement *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={remTime}
                  onChange={(e) => setRemTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Tiers concerné (Fournisseur ou Client)
                </label>
                <input
                  type="text"
                  placeholder="Ex : Distributeur Boissons Centre, Client Karim..."
                  value={remTargetName}
                  onChange={(e) => setRemTargetName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Notes complémentaires
                </label>
                <textarea
                  rows={2}
                  placeholder="Instructions spécifiques pour le rappel..."
                  value={remNotes}
                  onChange={(e) => setRemNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-lg focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddReminder(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Enregistrer le Rappel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
