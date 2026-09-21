/**
 * HANOUTI 40 — BACKGROUND MONITORING & REAL NOTIFICATION ENGINE
 * 
 * Complies with Android & Windows background architectures:
 * - WorkManager / AlarmManager integration via native bridge or Service Worker
 * - Low-stock & Out-of-stock evaluation (Default threshold: 5)
 * - Offline-first: alerts trigger immediately on local stock changes without internet
 * - Scheduled reminders (One-time, Daily, Weekly, Monthly, Custom)
 * - Real notification delivery across Android, Windows, and Web PWA
 * - Notification Channels:
 *     1. Hanouti 40 — Stock Alerts
 *     2. Hanouti 40 — Reminders
 * - Background Sync queue processing with automatic recovery
 * - Battery optimization detection & settings intent handler
 */

import {
  AppNotification,
  BackgroundSettings,
  BackgroundStatus,
  Product,
  ScheduledReminder,
  Supplier,
} from '../types';
import { SyncEngine } from './syncEngine';
import { playNotificationChime } from './notificationAudio';

const SETTINGS_KEY = 'hanouti40_bg_settings';
const NOTIFICATIONS_KEY = 'hanouti40_notifications';
const REMINDERS_KEY = 'hanouti40_reminders';
const ALERTED_STOCK_MAP_KEY = 'hanouti40_alerted_stock_map';

export const NOTIFICATION_CHANNELS = {
  STOCK_ALERTS: {
    id: 'channel_stock_alerts',
    name: 'Hanouti 40 — Stock Alerts',
    description: 'Alertes de stock bas, ruptures de stock et réapprovisionnements',
    importance: 'HIGH',
    sound: true,
    vibration: true,
    badge: true,
  },
  REMINDERS: {
    id: 'channel_reminders',
    name: 'Hanouti 40 — Reminders',
    description: 'Rappels planifiés de commandes fournisseurs, paiements et inventaires',
    importance: 'HIGH',
    sound: true,
    vibration: true,
    badge: true,
  },
};

export const DEFAULT_BACKGROUND_SETTINGS: BackgroundSettings = {
  enableBackgroundMonitoring: true,
  enableLowStockAlerts: true,
  defaultLowStockThreshold: 5,
  enableOutOfStockAlerts: true,
  enableScheduledReminders: true,
  enableBackgroundSync: true,
  keepWindowsRunningInBackground: true,
  soundEnabled: true,
  vibrationEnabled: true,
  badgeEnabled: true,
};

type NotificationListener = (notifications: AppNotification[]) => void;
type StatusListener = (status: BackgroundStatus) => void;
type ActionCallback = (action: string, data: any) => void;

export class BackgroundMonitor {
  private static listeners: Set<NotificationListener> = new Set();
  private static statusListeners: Set<StatusListener> = new Set();
  private static actionCallbacks: Set<ActionCallback> = new Set();
  private static swRegistration: ServiceWorkerRegistration | null = null;
  private static isInitialized = false;
  private static checkIntervalId: any = null;

  /**
   * Initialize Background Monitor & Notification System
   */
  static async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Register Service Worker if supported
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        this.swRegistration = reg;
        console.log('[Hanouti40] ServiceWorker registered successfully for background tasks');

        // Listen for messages from Service Worker (e.g. notification action clicks or sync signals)
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'NOTIFICATION_ACTION_CLICKED') {
            this.handleActionClick(event.data.action, event.data.data);
          } else if (event.data?.type === 'PROCESS_SYNC_QUEUE') {
            SyncEngine.syncNow();
          } else if (event.data?.type === 'CHECK_STOCK_AND_REMINDERS') {
            this.runPeriodicCheck();
          }
        });

        // Request Background Sync if available
        if ('sync' in (reg as any)) {
          try {
            await (reg as any).sync.register('hanouti40-sync-queue');
          } catch {}
        }
      } catch (err) {
        console.warn('[Hanouti40] ServiceWorker registration deferred:', err);
      }
    }

    // 2. Register native Android channel configurations if running in Android Native APK
    if (this.isAndroidNative()) {
      try {
        (window as any).HanoutiAndroid?.initNotificationChannels(
          JSON.stringify([NOTIFICATION_CHANNELS.STOCK_ALERTS, NOTIFICATION_CHANNELS.REMINDERS])
        );
      } catch (e) {
        console.warn('Native Android bridge channel setup omitted', e);
      }
    }

    // 3. Hook into SyncEngine remote events to react in background
    SyncEngine.onRemoteSync((event) => {
      // Background processing evaluates incoming sync changes
      this.handleRemoteSyncChange(event);
    });

    // 4. Start periodic background check (every 30 seconds while window/tab is active, plus on visibility resume)
    this.checkIntervalId = setInterval(() => {
      this.runPeriodicCheck();
    }, 30000);

    // 5. Visibility change handler: when user returns or OS restores app, re-evaluate immediately
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.runPeriodicCheck();
          this.notifyStatusListeners();
        }
      });
    }

    // 6. Run initial check
    setTimeout(() => {
      this.runPeriodicCheck();
      this.notifyStatusListeners();
    }, 1200);
  }

  /**
   * Platform Detection
   */
  static isAndroidNative(): boolean {
    return typeof window !== 'undefined' && !!(window as any).HanoutiAndroid;
  }

  static isWindowsNative(): boolean {
    return typeof window !== 'undefined' && !!(window as any).HanoutiWindows;
  }

  static getPlatform(): 'ANDROID' | 'WINDOWS' | 'WEB_PWA' {
    if (this.isAndroidNative()) return 'ANDROID';
    if (this.isWindowsNative()) return 'WINDOWS';
    return 'WEB_PWA';
  }

  /**
   * Notification Permission Handling
   */
  static getPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (this.isAndroidNative()) {
      try {
        const nativeGranted = (window as any).HanoutiAndroid.checkNotificationPermission();
        return nativeGranted ? 'granted' : 'denied';
      } catch {
        // fallback
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  }

  static async requestNotificationPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
    // 1. Android Native Bridge (POST_NOTIFICATIONS on Android 13+)
    if (this.isAndroidNative()) {
      try {
        const granted = await (window as any).HanoutiAndroid.requestNotificationPermission();
        this.notifyStatusListeners();
        return granted ? 'granted' : 'denied';
      } catch (err) {
        console.warn('Native Android permission request error', err);
      }
    }

    // 2. Web / PWA Notification API
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        this.notifyStatusListeners();
        return permission;
      } catch (err) {
        console.warn('Notification permission request error', err);
        return 'denied';
      }
    }

    return 'unsupported';
  }

  /**
   * Battery Optimization Detection & Settings
   */
  static getBatteryOptimizationStatus(): 'ALLOWED' | 'RESTRICTED' | 'UNKNOWN' {
    if (this.isAndroidNative()) {
      try {
        const isIgnoring = (window as any).HanoutiAndroid.checkBatteryOptimization();
        return isIgnoring ? 'ALLOWED' : 'RESTRICTED';
      } catch {
        return 'UNKNOWN';
      }
    }
    return 'ALLOWED';
  }

  static requestAllowBackgroundActivity(): void {
    if (this.isAndroidNative()) {
      try {
        (window as any).HanoutiAndroid.openBatterySettings();
      } catch (e) {
        console.warn('Failed to open Android battery settings', e);
      }
    } else if (this.isWindowsNative()) {
      try {
        (window as any).HanoutiWindows.openBackgroundSettings();
      } catch {}
    } else {
      // In web browser, show friendly guidance
      alert(
        "Sur Android/PC : Vérifiez les paramètres de la batterie de votre navigateur ou de l'application et désactivez la mise en veille profonde pour garantir la réception instantanée des alertes en arrière-plan."
      );
    }
  }

  /**
   * Settings Management
   */
  static getSettings(): BackgroundSettings {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return { ...DEFAULT_BACKGROUND_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_BACKGROUND_SETTINGS;
  }

  static saveSettings(settings: Partial<BackgroundSettings>): void {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));

    // Update Windows Tray background flag if in Electron
    if (this.isWindowsNative() && updated.keepWindowsRunningInBackground !== undefined) {
      try {
        (window as any).HanoutiWindows.setKeepInBackground(updated.keepWindowsRunningInBackground);
      } catch {}
    }

    this.notifyStatusListeners();
  }

  /**
   * Background Status Snapshot
   */
  static getStatus(): BackgroundStatus {
    const settings = this.getSettings();
    const perm = this.getPermissionStatus();
    const pendingQueue = SyncEngine.getQueue().filter((item) => item.status === 'PENDING');
    const lastSync = SyncEngine.getLastSyncTime();

    return {
      isMonitoringActive: settings.enableBackgroundMonitoring,
      notificationsPermission: perm,
      isSyncActive: SyncEngine.isOnline(),
      lastSyncTimestamp: lastSync,
      pendingChangesCount: pendingQueue.length,
      batteryOptimization: this.getBatteryOptimizationStatus(),
      platform: this.getPlatform(),
    };
  }

  /**
   * Low-Stock & Out-of-Stock Monitoring Logic
   * 
   * Condition: currentStock <= lowStockThreshold (Default: 5)
   * Real Notification:
   * 🔔 HANOUTI 40
   * LOW STOCK
   * [Product Name]
   * Only [currentStock] pieces remaining.
   * Supplier: [Supplier Name]
   * Actions: [VIEW PRODUCT] [CREATE PURCHASE]
   */
  static evaluateProductStock(
    products: Product[],
    suppliers: Supplier[] = [],
    forceAlert = false
  ): void {
    const settings = this.getSettings();
    if (!settings.enableBackgroundMonitoring || !settings.enableLowStockAlerts) return;

    const threshold = settings.defaultLowStockThreshold || 5;
    const alertedMap = this.getAlertedStockMap();
    let hasNewAlerts = false;

    for (const product of products) {
      const currentStock = product.stockQuantity;
      const productThreshold = product.minStock !== undefined ? product.minStock : threshold;

      // Find supplier name
      const supplier = suppliers.find((s) => s.id === product.supplierId);
      const supplierName = supplier ? supplier.name : 'Fournisseur A (Principal)';

      // Check condition: currentStock <= threshold
      if (currentStock <= productThreshold) {
        const alertKey = `${product.id}_${currentStock}`;

        // Deduplication: only alert once per specific stock value unless forceAlert is requested
        if (!alertedMap[alertKey] || forceAlert) {
          alertedMap[alertKey] = new Date().toISOString();
          hasNewAlerts = true;

          const isZero = currentStock <= 0;
          const title = isZero ? '⚠️ HANOUTI 40 — RUPTURE DE STOCK' : '🔔 HANOUTI 40 — STOCK BAS';
          const body = isZero
            ? `${product.name}\n0 pièce restante en rayon.\nFournisseur : ${supplierName}`
            : `${product.name}\nSeulement ${currentStock} pièce${currentStock > 1 ? 's' : ''} restante${currentStock > 1 ? 's' : ''}.\nFournisseur : ${supplierName}`;

          this.deliverNotification({
            id: `stock-${product.id}-${Date.now()}`,
            channelId: 'stock_alerts',
            title,
            body,
            timestamp: new Date().toISOString(),
            read: false,
            data: {
              type: isZero ? 'OUT_OF_STOCK' : 'LOW_STOCK',
              productId: product.id,
              productName: product.name,
              currentStock,
              minStockAlert: productThreshold,
              supplierId: product.supplierId,
              supplierName,
            },
          });
        }
      }
    }

    if (hasNewAlerts) {
      this.saveAlertedStockMap(alertedMap);
    }
  }

  /**
   * Single product stock check after a sale or purchase (works immediately OFFLINE)
   */
  static checkSingleProductStock(
    product: Product,
    suppliers: Supplier[] = []
  ): void {
    this.evaluateProductStock([product], suppliers);
  }

  /**
   * Scheduled Reminders Management
   */
  static getReminders(): ScheduledReminder[] {
    try {
      const raw = localStorage.getItem(REMINDERS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return this.getDefaultReminders();
  }

  static saveReminders(reminders: ScheduledReminder[]): void {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));

    // Sync to Android native AlarmManager / JobScheduler if running on Android
    if (this.isAndroidNative()) {
      try {
        (window as any).HanoutiAndroid.syncScheduledReminders(JSON.stringify(reminders));
      } catch (e) {
        console.warn('Native Android reminder sync error', e);
      }
    }
  }

  static addReminder(reminder: Omit<ScheduledReminder, 'id' | 'createdAt'>): ScheduledReminder {
    const reminders = this.getReminders();
    const newReminder: ScheduledReminder = {
      ...reminder,
      id: `rem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    reminders.push(newReminder);
    this.saveReminders(reminders);
    return newReminder;
  }

  static deleteReminder(id: string): void {
    const reminders = this.getReminders().filter((r) => r.id !== id);
    this.saveReminders(reminders);
  }

  static toggleReminderActive(id: string): void {
    const reminders = this.getReminders().map((r) =>
      r.id === id ? { ...r, isActive: !r.isActive } : r
    );
    this.saveReminders(reminders);
  }

  /**
   * Evaluate Scheduled Reminders (runs periodically and in background)
   */
  static evaluateReminders(): void {
    const settings = this.getSettings();
    if (!settings.enableBackgroundMonitoring || !settings.enableScheduledReminders) return;

    const reminders = this.getReminders();
    const now = new Date();
    const nowTime = now.getTime();
    let updated = false;

    const modifiedReminders = reminders.map((rem) => {
      if (!rem.isActive) return rem;

      const schedTime = new Date(rem.scheduledTime).getTime();
      // If scheduled time has arrived or passed, and hasn't been triggered in the last 15 minutes
      const lastTriggered = rem.lastTriggeredAt ? new Date(rem.lastTriggeredAt).getTime() : 0;
      const isDue = schedTime <= nowTime && nowTime - lastTriggered > 15 * 60 * 1000;

      if (isDue) {
        updated = true;
        this.deliverNotification({
          id: `reminder-${rem.id}-${Date.now()}`,
          channelId: 'reminders',
          title: `⏰ HANOUTI 40 — RAPPEL : ${rem.title}`,
          body: `${rem.notes || 'Rappel d\'activité planifiée pour votre magasin.'}${rem.targetName ? `\nTiers : ${rem.targetName}` : ''}`,
          timestamp: now.toISOString(),
          read: false,
          data: {
            type: 'REMINDER',
            reminderId: rem.id,
          },
        });

        // Recalculate next scheduled time for recurring reminders
        let nextScheduledTime = rem.scheduledTime;
        if (rem.frequency === 'DAILY') {
          const next = new Date(nowTime + 24 * 60 * 60 * 1000);
          nextScheduledTime = next.toISOString();
        } else if (rem.frequency === 'WEEKLY') {
          const next = new Date(nowTime + 7 * 24 * 60 * 60 * 1000);
          nextScheduledTime = next.toISOString();
        } else if (rem.frequency === 'MONTHLY') {
          const next = new Date(now);
          next.setMonth(next.getMonth() + 1);
          nextScheduledTime = next.toISOString();
        } else if (rem.frequency === 'ONCE') {
          // Deactivate one-time reminder once triggered
          return {
            ...rem,
            isActive: false,
            lastTriggeredAt: now.toISOString(),
          };
        }

        return {
          ...rem,
          scheduledTime: nextScheduledTime,
          lastTriggeredAt: now.toISOString(),
        };
      }

      return rem;
    });

    if (updated) {
      this.saveReminders(modifiedReminders);
    }
  }

  /**
   * Deliver a Real Notification across Android, Windows, and Browser
   */
  static deliverNotification(notification: AppNotification): void {
    const settings = this.getSettings();

    // 1. Store in local notifications list
    const list = this.getStoredNotifications();
    list.unshift(notification);
    // Keep last 100
    this.saveStoredNotifications(list.slice(0, 100));
    this.notifyListeners();

    // 2. Play Audio Chime if enabled
    if (settings.soundEnabled) {
      playNotificationChime(notification.channelId === 'stock_alerts' ? 'STOCK_ALERT' : 'REMINDER');
    }

    // 3. Vibration if supported
    if (settings.vibrationEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {}
    }

    // 4. Android Native APK Notification via Java Bridge
    if (this.isAndroidNative()) {
      try {
        (window as any).HanoutiAndroid.postNativeNotification(
          notification.channelId === 'stock_alerts'
            ? NOTIFICATION_CHANNELS.STOCK_ALERTS.id
            : NOTIFICATION_CHANNELS.REMINDERS.id,
          notification.title,
          notification.body,
          JSON.stringify(notification.data || {})
        );
        return;
      } catch (e) {
        console.warn('Native Android notification post omitted', e);
      }
    }

    // 5. Windows Native Electron Notification
    if (this.isWindowsNative()) {
      try {
        (window as any).HanoutiWindows.showNotification({
          title: notification.title,
          body: notification.body,
          data: notification.data,
        });
        return;
      } catch (e) {
        console.warn('Windows native notification post omitted', e);
      }
    }

    // 6. Web Service Worker Notification (Displays even when page is in background or minimized)
    if (this.swRegistration && 'showNotification' in this.swRegistration) {
      try {
        const actions: Array<{ action: string; title: string }> = [];
        if (notification.data?.type === 'LOW_STOCK' || notification.data?.type === 'OUT_OF_STOCK') {
          actions.push(
            { action: 'VIEW_PRODUCT', title: 'Voir Produit' },
            { action: 'CREATE_PURCHASE', title: 'Bon d\'Achat' }
          );
        }

        (this.swRegistration as any).showNotification(notification.title, {
          body: notification.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: notification.id,
          data: notification.data,
          actions,
          vibrate: [200, 100, 200],
        });
        return;
      } catch (err) {
        console.warn('ServiceWorker notification display failed', err);
      }
    }

    // 7. Standard Web Notification API fallback
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification(notification.title, {
          body: notification.body,
          icon: '/favicon.ico',
          tag: notification.id,
          data: notification.data,
        });
        n.onclick = () => {
          window.focus();
          if (notification.data?.productId) {
            this.handleActionClick('VIEW_PRODUCT', notification.data);
          }
        };
      } catch (e) {
        console.warn('Browser Notification construction error', e);
      }
    }
  }

  /**
   * Action Handler (Handles click on [VIEW PRODUCT] or [CREATE PURCHASE])
   */
  static handleActionClick(action: string, data: any) {
    this.actionCallbacks.forEach((cb) => {
      try {
        cb(action, data);
      } catch (e) {
        console.error('Action callback error', e);
      }
    });
  }

  static onActionClick(cb: ActionCallback): () => void {
    this.actionCallbacks.add(cb);
    return () => this.actionCallbacks.delete(cb);
  }

  /**
   * Periodic check execution (WorkManager / Job equivalent)
   */
  private static runPeriodicCheck(): void {
    try {
      // 1. Evaluate scheduled reminders
      this.evaluateReminders();

      // 2. Process pending sync queue if online
      const pendingItems = SyncEngine.getQueue().filter((item) => item.status === 'PENDING');
      if (SyncEngine.isOnline() && pendingItems.length > 0) {
        SyncEngine.syncNow();
      }

      this.notifyStatusListeners();
    } catch (e) {
      console.warn('Periodic background check exception', e);
    }
  }

  /**
   * React to remote sync changes received from PC or Android
   */
  private static handleRemoteSyncChange(event: any): void {
    if (!event) return;

    // If a remote sale was received, stock was decremented on another device!
    if (event.entityType === 'SALE' || event.entityType === 'PRODUCT') {
      // Fetch latest products from storage and evaluate stock
      try {
        const productsRaw = localStorage.getItem('hanouti40_products');
        const suppliersRaw = localStorage.getItem('hanouti40_suppliers');
        if (productsRaw) {
          const products: Product[] = JSON.parse(productsRaw);
          const suppliers: Supplier[] = suppliersRaw ? JSON.parse(suppliersRaw) : [];
          this.evaluateProductStock(products, suppliers);
        }
      } catch {}
    }

    this.notifyStatusListeners();
  }

  /**
   * Notifications Storage & Listeners
   */
  static getStoredNotifications(): AppNotification[] {
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  private static saveStoredNotifications(list: AppNotification[]): void {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));
  }

  static markAsRead(id: string): void {
    const list = this.getStoredNotifications().map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    this.saveStoredNotifications(list);
    this.notifyListeners();
  }

  static markAllAsRead(): void {
    const list = this.getStoredNotifications().map((n) => ({ ...n, read: true }));
    this.saveStoredNotifications(list);
    this.notifyListeners();
  }

  static clearAllNotifications(): void {
    this.saveStoredNotifications([]);
    this.notifyListeners();
  }

  static getUnreadCount(): number {
    return this.getStoredNotifications().filter((n) => !n.read).length;
  }

  static onNotificationsChange(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    listener(this.getStoredNotifications());
    return () => this.listeners.delete(listener);
  }

  private static notifyListeners(): void {
    const list = this.getStoredNotifications();
    this.listeners.forEach((l) => l(list));
  }

  static onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.getStatus());
    return () => this.statusListeners.delete(listener);
  }

  private static notifyStatusListeners(): void {
    const s = this.getStatus();
    this.statusListeners.forEach((l) => l(s));
  }

  /**
   * Stock Deduplication Map
   */
  private static getAlertedStockMap(): Record<string, string> {
    try {
      const raw = localStorage.getItem(ALERTED_STOCK_MAP_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  }

  private static saveAlertedStockMap(map: Record<string, string>): void {
    localStorage.setItem(ALERTED_STOCK_MAP_KEY, JSON.stringify(map));
  }

  /**
   * Default initial reminders
   */
  private static getDefaultReminders(): ScheduledReminder[] {
    return [
      {
        id: 'rem-coca',
        title: 'Commander Coca Cola 1L',
        category: 'STOCK',
        frequency: 'WEEKLY',
        scheduledTime: '2026-09-22T10:00',
        notes: 'Vérifier la réserve de sodas et passer commande auprès du fournisseur.',
        targetName: 'Distributeur Boissons Centre',
        isActive: true,
        createdAt: '2026-09-20T08:00:00.000Z',
      },
      {
        id: 'rem-supplier-a',
        title: 'Règlement Fournisseur Nord',
        category: 'PAYMENT',
        frequency: 'WEEKLY',
        scheduledTime: '2026-09-24T14:30',
        notes: 'Paiement de la facture BL-2026-0891 en espèces ou virement.',
        targetName: 'Ets Fournitures & Confiserie Nord',
        isActive: true,
        createdAt: '2026-09-20T08:00:00.000Z',
      },
      {
        id: 'rem-inventory',
        title: 'Contrôle & Inventaire des Stocks',
        category: 'INVENTORY',
        frequency: 'MONTHLY',
        scheduledTime: '2026-09-30T18:00',
        notes: 'Comptage physique des rayons frais et boissons pour réconciliation.',
        targetName: 'Magasin Principal',
        isActive: true,
        createdAt: '2026-09-20T08:00:00.000Z',
      },
    ];
  }
}
