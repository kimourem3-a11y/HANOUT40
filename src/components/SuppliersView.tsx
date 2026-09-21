import React, { useState } from 'react';
import { Building2, Plus, Phone, DollarSign, Edit2, Trash2 } from 'lucide-react';
import { StoreSettings, Supplier } from '../types';
import { formatCurrency } from '../utils/formatters';
import { translations } from '../localization/translations';

interface SuppliersViewProps {
  suppliers: Supplier[];
  settings: StoreSettings;
  onSaveSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: number) => void;
  onPaySupplier: (supplierId: number, amount: number, notes: string) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  settings,
  onSaveSupplier,
  onDeleteSupplier,
  onPaySupplier,
}) => {
  const t = translations[settings.language];
  const [search, setSearch] = useState('');

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');

  // Payment Modal
  const [payingSupplierId, setPayingSupplierId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const openAdd = () => {
    setEditingSupplier(null);
    setName('');
    setContactPerson('');
    setPhone('');
    setIsModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setContactPerson(s.contactPerson);
    setPhone(s.phone);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const supp: Supplier = {
      id: editingSupplier ? editingSupplier.id : Date.now(),
      name,
      contactPerson,
      phone,
      currentDebt: editingSupplier ? editingSupplier.currentDebt : 0,
    };
    onSaveSupplier(supp);
    setIsModalOpen(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payingSupplierId && paymentAmount > 0) {
      onPaySupplier(payingSupplierId, Number(paymentAmount), paymentNotes);
      setPayingSupplierId(null);
      setPaymentAmount(0);
      setPaymentNotes('');
    }
  };

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search)
  );

  const payingSupplier = suppliers.find((s) => s.id === payingSupplierId);

  return (
    <div id="suppliers-view-container" className="space-y-5">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-950/70 border border-indigo-800/40 rounded-lg text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{t.suppliers}</h2>
            <p className="text-xs text-slate-400">
              {suppliers.length} {t.itemsCount}
            </p>
          </div>
        </div>

        <button
          id="add-supplier-btn"
          onClick={openAdd}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Fournisseur</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((supp) => (
          <div
            key={supp.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-white text-sm">{supp.name}</h3>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                    supp.currentDebt > 0
                      ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                      : 'bg-slate-800 text-emerald-400'
                  }`}
                >
                  {supp.currentDebt > 0
                    ? `À Payer: ${formatCurrency(supp.currentDebt, settings.currency)}`
                    : 'Rien à Payer'}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-400">
                {supp.contactPerson && (
                  <p className="text-slate-300 font-medium">Contact: {supp.contactPerson}</p>
                )}
                {supp.phone && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{supp.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setPayingSupplierId(supp.id);
                  setPaymentAmount(supp.currentDebt);
                }}
                disabled={supp.currentDebt <= 0}
                className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Régler Dette</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(supp)}
                  className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  title={t.edit}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(t.confirmDelete)) onDeleteSupplier(supp.id);
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white pb-2 border-b border-slate-800">
              {editingSupplier ? t.edit : 'Nouveau Fournisseur'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Société / Nom du Fournisseur *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Grossiste Alimentation Centrale"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Personne à contacter
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Ex: M. Rachid"
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
                  placeholder="021 00 00 00"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
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

      {/* Payment Modal */}
      {payingSupplier && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 sm:p-6 max-w-sm w-full shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white pb-2 border-b border-slate-800">
              Règlement Dette Fournisseur
            </h3>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs flex justify-between items-center">
              <span className="text-slate-400">Montant dû:</span>
              <span className="font-bold text-amber-400 font-mono text-sm">
                {formatCurrency(payingSupplier.currentDebt, settings.currency)}
              </span>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Montant à Régler ({settings.currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  max={payingSupplier.currentDebt}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-base font-bold font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Référence / Note
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Chèque n°, virement, espèces..."
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingSupplierId(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Confirmer Paiement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
