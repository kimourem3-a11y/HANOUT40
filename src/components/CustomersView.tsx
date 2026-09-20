import React, { useState } from 'react';
import { Users, Plus, Phone, MapPin, Receipt, DollarSign, Edit2, Trash2 } from 'lucide-react';
import { Customer, StoreSettings } from '../types';
import { formatCurrency } from '../utils/formatters';
import { translations } from '../localization/translations';

interface CustomersViewProps {
  customers: Customer[];
  settings: StoreSettings;
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: number) => void;
  onReceivePayment: (customerId: number, amount: number, notes: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  settings,
  onSaveCustomer,
  onDeleteCustomer,
  onReceivePayment,
}) => {
  const t = translations[settings.language];
  const [search, setSearch] = useState('');

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(10000);

  // Payment Modal
  const [payingCustomerId, setPayingCustomerId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const openAdd = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setCreditLimit(15000);
    setIsModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address);
    setCreditLimit(c.creditLimit);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cust: Customer = {
      id: editingCustomer ? editingCustomer.id : Date.now(),
      name,
      phone,
      address,
      creditLimit: Number(creditLimit),
      currentDebt: editingCustomer ? editingCustomer.currentDebt : 0,
    };
    onSaveCustomer(cust);
    setIsModalOpen(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payingCustomerId && paymentAmount > 0) {
      onReceivePayment(payingCustomerId, Number(paymentAmount), paymentNotes);
      setPayingCustomerId(null);
      setPaymentAmount(0);
      setPaymentNotes('');
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const payingCustomer = customers.find((c) => c.id === payingCustomerId);

  return (
    <div id="customers-view-container" className="space-y-5">
      {/* Header bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-950/70 border border-blue-800/40 rounded-lg text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{t.customers}</h2>
            <p className="text-xs text-slate-400">
              {customers.length} {t.itemsCount}
            </p>
          </div>
        </div>

        <button
          id="add-customer-btn"
          onClick={openAdd}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cust) => (
          <div
            key={cust.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-white text-sm">{cust.name}</h3>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                    cust.currentDebt > 0
                      ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                      : 'bg-slate-800 text-emerald-400'
                  }`}
                >
                  {cust.currentDebt > 0
                    ? `Dette: ${formatCurrency(cust.currentDebt, settings.currency)}`
                    : 'Solde Réglé'}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-400">
                {cust.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{cust.phone}</span>
                  </div>
                )}
                {cust.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{cust.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-500">
                  <span>Plafond Crédit:</span>
                  <span className="font-mono text-slate-400">
                    {formatCurrency(cust.creditLimit, settings.currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setPayingCustomerId(cust.id);
                  setPaymentAmount(cust.currentDebt);
                }}
                disabled={cust.currentDebt <= 0}
                className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>{t.receivePayment}</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(cust)}
                  className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  title={t.edit}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(t.confirmDelete)) onDeleteCustomer(cust.id);
                  }}
                  className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                  title={t.delete}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white pb-2 border-b border-slate-800">
              {editingCustomer ? t.edit : 'Ajouter Client'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Nom du Client *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Mohamed Amine"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Téléphone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0550 00 00 00"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Quartier / Ville"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Plafond Crédit Autorisé ({settings.currency})
                </label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment / Debt settlement Modal */}
      {payingCustomer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 sm:p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white pb-2 border-b border-slate-800">
              Règlement Dette — {payingCustomer.name}
            </h3>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs flex justify-between items-center">
              <span className="text-slate-400">Dette actuelle:</span>
              <span className="font-bold text-rose-400 font-mono text-sm">
                {formatCurrency(payingCustomer.currentDebt, settings.currency)}
              </span>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Montant Versé ({settings.currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  max={payingCustomer.currentDebt}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-base font-bold font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Remarque / Référence
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Versement espèces, virement..."
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingCustomerId(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Confirmer Versement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
