import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ShoppingBag,
  Users,
  Building2,
  Boxes,
  ReceiptText,
  BarChart3,
  Settings,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  FileDown,
  Calendar,
} from 'lucide-react';
import { AppModule, Language } from '../types';
import { translations } from '../localization/translations';

interface NavigationProps {
  currentModule: AppModule;
  onSelectModule: (mod: AppModule) => void;
  language: Language;
  lowStockCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentModule,
  onSelectModule,
  language,
  lowStockCount,
}) => {
  const t = translations[language];

  const navItems: Array<{
    id: AppModule;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'pos', label: t.posCashier, icon: ShoppingCart },
    { id: 'products', label: t.products, icon: Package },
    { id: 'financial_calendar', label: `📅 ${t.financialCalendar || 'Calendrier Financier'}`, icon: Calendar },
    { id: 'purchases', label: t.purchases, icon: ShoppingBag },
    { id: 'income', label: t.income, icon: TrendingUp },
    { id: 'expenses', label: t.expenses, icon: TrendingDown },
    { id: 'customers', label: t.customers, icon: Users },
    { id: 'suppliers', label: t.suppliers, icon: Building2 },
    { id: 'inventory', label: t.inventory, icon: Boxes, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: 'debts', label: t.debts, icon: ReceiptText },
    { id: 'exportCenter', label: t.exportCenter, icon: FileDown },
    { id: 'reports', label: t.reports, icon: BarChart3 },
    { id: 'settings', label: t.settings, icon: Settings },
    { id: 'forensics', label: t.forensics, icon: ShieldCheck },
  ];

  return (
    <nav
      id="hanouti-main-navigation"
      className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 overflow-x-auto scrollbar-thin"
    >
      <div className="flex items-center gap-1.5 min-w-max mx-auto max-w-7xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentModule === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectModule(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap relative ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.2 rounded-full ml-1">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
