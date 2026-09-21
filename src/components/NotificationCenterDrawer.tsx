import React, { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  Package,
  AlertTriangle,
  AlertCircle,
  Clock,
  ExternalLink,
  ShoppingBag,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { AppNotification, Product, Supplier } from '../types';
import { BackgroundMonitor } from '../utils/backgroundMonitor';

interface NotificationCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onViewProduct?: (productId: number) => void;
  onCreatePurchase?: (productId?: number) => void;
  onOpenBackgroundSettings?: () => void;
}

export const NotificationCenterDrawer: React.FC<NotificationCenterDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onViewProduct,
  onCreatePurchase,
  onOpenBackgroundSettings,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'STOCK' | 'REMINDERS'>('ALL');

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'STOCK') return n.channelId === 'stock_alerts';
    if (filter === 'REMINDERS') return n.channelId === 'reminders';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    BackgroundMonitor.markAllAsRead();
  };

  const handleClearAll = () => {
    BackgroundMonitor.clearAllNotifications();
  };

  const handleMarkOneRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    BackgroundMonitor.markAsRead(id);
  };

  const handleViewProductClick = (productId?: number) => {
    if (productId && onViewProduct) {
      onViewProduct(productId);
      onClose();
    }
  };

  const handleCreatePurchaseClick = (productId?: number) => {
    if (onCreatePurchase) {
      onCreatePurchase(productId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-md w-full flex pl-0 sm:pl-10">
        <div className="w-full bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>Notifications & Alertes</span>
                    {unreadCount > 0 && (
                      <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                        {unreadCount} NOUVELLES
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Surveillance stock, ruptures et rappels système
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions & Filters */}
            <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFilter('ALL')}
                  className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                    filter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Toutes ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('STOCK')}
                  className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                    filter === 'STOCK' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Stock
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('REMINDERS')}
                  className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                    filter === 'REMINDERS' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Rappels
                </button>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title="Vider l'historique"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredNotifs.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mb-3 text-slate-600">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-400">Aucune alerte enregistrée</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  Le système de surveillance continue fonctionne en tâche de fond. Dès qu'un produit atteint son seuil de réapprovisionnement, une notification apparaîtra ici.
                </p>
              </div>
            ) : (
              filteredNotifs.map((n) => {
                const isStock = n.channelId === 'stock_alerts';
                const isZero = n.data?.currentStock !== undefined && n.data.currentStock <= 0;

                return (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-xl border transition relative space-y-2 ${
                      !n.read
                        ? 'bg-slate-950 border-emerald-900/60 shadow-xs'
                        : 'bg-slate-950/50 border-slate-800/80 opacity-80'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            isZero
                              ? 'bg-rose-950 text-rose-400'
                              : isStock
                              ? 'bg-amber-950 text-amber-400'
                              : 'bg-indigo-950 text-indigo-400'
                          }`}
                        >
                          {isZero ? (
                            <AlertCircle className="w-4 h-4" />
                          ) : isStock ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white leading-tight">
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(n.timestamp).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {!n.read && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkOneRead(n.id, e)}
                          className="text-slate-500 hover:text-emerald-400 p-1"
                          title="Marquer comme lu"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Body */}
                    <p className="text-xs text-slate-300 whitespace-pre-line pl-8">
                      {n.body}
                    </p>

                    {/* Action buttons if stock alert */}
                    {isStock && n.data?.productId && (
                      <div className="pl-8 pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewProductClick(n.data?.productId)}
                          className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 border border-slate-700"
                        >
                          <Package className="w-3 h-3 text-emerald-400" />
                          <span>[VIEW PRODUCT]</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCreatePurchaseClick(n.data?.productId)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>[CREATE PURCHASE]</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Settings Shortcut */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">
              Surveillance continue WorkManager
            </span>
            {onOpenBackgroundSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBackgroundSettings();
                }}
                className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Paramètres Arrière-plan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
