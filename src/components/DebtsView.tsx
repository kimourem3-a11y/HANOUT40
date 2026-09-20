import React, { useState } from 'react';
import { ReceiptText, Users, Building2, DollarSign, Search } from 'lucide-react';
import { Customer, StoreSettings, Supplier } from '../types';
import { formatCurrency } from '../utils/formatters';
import { translations } from '../localization/translations';

interface DebtsViewProps {
  customers: Customer[];
  suppliers: Supplier[];
  settings: StoreSettings;
  onReceiveCustomerPayment: (customerId: number, amount: number, notes: string) => void;
  onPaySupplier: (supplierId: number, amount: number, notes: string) => void;
}

export const DebtsView: React.FC<DebtsViewProps> = ({
  customers,
  suppliers,
  settings,
  onReceiveCustomerPayment,
  onPaySupplier,
}) => {
  const t = translations[settings.language];
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'SUPPLIERS'>('CUSTOMERS');
  const [search, setSearch] = useState('');

  // Payment modal state
  const [targetCustomerId, setTargetCustomerId] = useState<number | null>(null);
  const [targetSupplierId, setTargetSupplierId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const totalCustomerDebts = customers.reduce((sum, c) => sum + (c.currentDebt || 0), 0);
  const totalSupplierDebts = suppliers.reduce((sum, s) => sum + (s.currentDebt || 0), 0);

  const debtorsCustomers = customers.filter(
    (c) =>
      c.currentDebt > 0 &&
      (c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
  );

  const creditorSuppliers = suppliers.filter(
    (s) =>
      s.currentDebt > 0 &&
      (s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search))
  );

  const targetCustomer = customers.find((c) => c.id === targetCustomerId);
  const targetSupplier = suppliers.find((s) => s.id === targetSupplierId);

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetCustomerId && paymentAmount > 0) {
      onReceiveCustomerPayment(targetCustomerId, Number(paymentAmount), paymentNotes);
      setTargetCustomerId(null);
      setPaymentAmount(0);
      setPaymentNotes('');
    }
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetSupplierId && paymentAmount > 0) {
      onPaySupplier(targetSupplierId, Number(paymentAmount), paymentNotes);
      setTargetSupplierId(null);
      setPaymentAmount(0);
      setPaymentNotes('');
    }
  };

  return (
    <div id="debts-view-container" className="space-y-5">
      {/* Debts Summary Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => setActiveTab('CUSTOMERS')}
          className={`p-5 rounded-xl border transition cursor-pointer ${
            activeTab === 'CUSTOMERS'
              ? 'bg-slate-900 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>{t.customerDebts}</span>
            </span>
            <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded font-mono">
              {debtorsCustomers.length} clients
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-2 font-mono">
            {formatCurrency(totalCustomerDebts, settings.currency)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {settings.language === 'ar' ? 'أموال مستحقة لنا عند الزبائن' : 'Créances à recouvrer auprès des clients'}
          </p>
        </div>

        <div
          onClick={() => setActiveTab('SUPPLIERS')}
          className={`p-5 rounded-xl border transition cursor-pointer ${
            activeTab === 'SUPPLIERS'
              ? 'bg-slate-900 border-rose-500/50 shadow-md ring-1 ring-rose-500/30'
              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
              <Building2 className="w-4 h-4 text-rose-400" />
              <span>{t.supplierDebts}</span>
            </span>
            <span className="text-xs bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded font-mono">
              {creditorSuppliers.length} fournisseurs
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-400 mt-2 font-mono">
            {formatCurrency(totalSupplierDebts, settings.currency)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {settings.language === 'ar' ? 'ديون مستحقة للموردين علينا' : 'Dettes à régler aux fournisseurs'}
          </p>
        </div>
      </div>

      {/* Tabs & Search Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
              activeTab === 'CUSTOMERS'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.customerDebts} ({debtorsCustomers.length})
          </button>
          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
              activeTab === 'SUPPLIERS'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.supplierDebts} ({creditorSuppliers.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom ou téléphone..."
            className="w-full bg-slate-950 border border-slate-800 text-white pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table according to Active Tab */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {activeTab === 'CUSTOMERS' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
                  <th className="py-3 px-4 font-semibold">Client</th>
                  <th className="py-3 px-4 font-semibold">Téléphone</th>
                  <th className="py-3 px-4 font-semibold">Adresse</th>
                  <th className="py-3 px-4 font-semibold text-right">Plafond Crédit</th>
                  <th className="py-3 px-4 font-semibold text-right">Dette Due</th>
                  <th className="py-3 px-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {debtorsCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Aucune dette client enregistrée.
                    </td>
                  </tr>
                ) : (
                  debtorsCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-white">{c.name}</td>
                      <td className="py-3 px-4 text-slate-400">{c.phone || '-'}</td>
                      <td className="py-3 px-4 text-slate-400">{c.address || '-'}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {formatCurrency(c.creditLimit, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-400 font-mono text-sm">
                        {formatCurrency(c.currentDebt, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setTargetCustomerId(c.id);
                            setPaymentAmount(c.currentDebt);
                          }}
                          className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Encaisser</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
                  <th className="py-3 px-4 font-semibold">Fournisseur</th>
                  <th className="py-3 px-4 font-semibold">Contact</th>
                  <th className="py-3 px-4 font-semibold">Téléphone</th>
                  <th className="py-3 px-4 font-semibold text-right">Montant Dû</th>
                  <th className="py-3 px-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {creditorSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Toutes les dettes fournisseurs sont réglées.
                    </td>
                  </tr>
                ) : (
                  creditorSuppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-white">{s.name}</td>
                      <td className="py-3 px-4 text-slate-400">{s.contactPerson || '-'}</td>
                      <td className="py-3 px-4 text-slate-400">{s.phone || '-'}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-400 font-mono text-sm">
                        {formatCurrency(s.currentDebt, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setTargetSupplierId(s.id);
                            setPaymentAmount(s.currentDebt);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Payer Fournisseur</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Settlement Modal */}
      {targetCustomer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white pb-2 border-b border-slate-800">
              Encaisser Dette Client — {targetCustomer.name}
            </h3>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs flex justify-between">
              <span className="text-slate-400">Total dette:</span>
              <span className="font-bold text-amber-400 font-mono">
                {formatCurrency(targetCustomer.currentDebt, settings.currency)}
              </span>
            </div>
            <form onSubmit={handleCustomerSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Montant Réglé ({settings.currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  max={targetCustomer.currentDebt}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-base font-bold font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Remarque
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Versement partiel/total..."
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setTargetCustomerId(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Settlement Modal */}
      {targetSupplier && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white pb-2 border-b border-slate-800">
              Régler Fournisseur — {targetSupplier.name}
            </h3>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs flex justify-between">
              <span className="text-slate-400">Total dû:</span>
              <span className="font-bold text-rose-400 font-mono">
                {formatCurrency(targetSupplier.currentDebt, settings.currency)}
              </span>
            </div>
            <form onSubmit={handleSupplierSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Montant à Payer ({settings.currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  max={targetSupplier.currentDebt}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-base font-bold font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Référence de Paiement
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Chèque, virement..."
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setTargetSupplierId(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Valider Règlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
