import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  FileDown,
  Calendar,
  CreditCard,
  DollarSign,
  User,
  Trash2,
} from 'lucide-react';
import { Customer, Income, IncomeCategory, StoreSettings } from '../types';
import { formatCurrency } from '../utils/formatters';
import { downloadOrSharePdf, generateIncomeReportPdf } from '../utils/pdfGenerator';
import { translations } from '../localization/translations';

interface IncomeViewProps {
  incomes: Income[];
  customers: Customer[];
  settings: StoreSettings;
  onAddIncome: (income: Income) => void;
  onDeleteIncome: (id: number) => void;
}

export const IncomeView: React.FC<IncomeViewProps> = ({
  incomes,
  customers,
  settings,
  onAddIncome,
  onDeleteIncome,
}) => {
  const t = translations[settings.language];
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16).replace('T', ' '));
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IncomeCategory>('OTHER');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'CHECK' | 'TRANSFER' | 'OTHER'>('CASH');
  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  // Calculations for KPI Cards
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

  let todayIncome = 0;
  let weeklyIncome = 0;
  let monthlyIncome = 0;
  let totalIncome = 0;

  incomes.forEach((inc) => {
    totalIncome += inc.amount;
    const incDateOnly = inc.date.split(' ')[0];
    const incDate = new Date(incDateOnly);

    if (incDateOnly === todayStr) todayIncome += inc.amount;
    if (incDate >= oneWeekAgo) weeklyIncome += inc.amount;
    if (incDate >= oneMonthAgo) monthlyIncome += inc.amount;
  });

  // Filtered List
  const filtered = incomes.filter((inc) => {
    const matchesSearch =
      inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.customerName && inc.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inc.reference && inc.reference.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || inc.category === categoryFilter;
    const matchesMethod = methodFilter === 'ALL' || inc.paymentMethod === methodFilter;

    return matchesSearch && matchesCategory && matchesMethod;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const selectedCust = customers.find((c) => c.id === customerId);

    const newInc: Income = {
      id: Date.now(),
      date,
      amount: numAmount,
      description,
      category,
      paymentMethod,
      customerId: selectedCust?.id,
      customerName: selectedCust?.name,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onAddIncome(newInc);
    setIsAddModalOpen(false);
    // Reset Form
    setAmount('');
    setDescription('');
    setReference('');
    setNotes('');
  };

  const handleExportPdf = () => {
    const doc = generateIncomeReportPdf(filtered, settings);
    downloadOrSharePdf(doc, `Income_Report_${new Date().toISOString().split('T')[0]}.pdf`, 'Rapport des Revenus');
  };

  return (
    <div id="income-view-container" className="space-y-5">
      {/* View Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-950/70 border border-emerald-800/40 rounded-lg text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{t.income} & Entrées</h2>
            <p className="text-xs text-slate-400">Gestion des encaissements et recettes annexes</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportPdf}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-emerald-400" />
            <span>{t.exportPdf}</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>Enregistrer Entrée</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Today, Weekly, Monthly, Total Income */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Madahel Aujourd'hui</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 font-mono">
            {formatCurrency(todayIncome, settings.currency)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Entrées du jour</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Cette Semaine</span>
          <p className="text-xl sm:text-2xl font-black text-white mt-1 font-mono">
            {formatCurrency(weeklyIncome, settings.currency)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">7 derniers jours</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Ce Mois</span>
          <p className="text-xl sm:text-2xl font-black text-white mt-1 font-mono">
            {formatCurrency(monthlyIncome, settings.currency)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">30 derniers jours</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Cumulé</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 font-mono">
            {formatCurrency(totalIncome, settings.currency)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">{incomes.length} enregistrements</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            placeholder="Rechercher par description, client ou référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg pl-9 pr-3 py-2 rtl:pr-9 rtl:pl-3 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white text-xs px-2.5 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">Toutes les catégories</option>
            <option value="CUSTOMER_PAYMENT">Règlement dette client</option>
            <option value="SERVICE">Prestation / Service</option>
            <option value="DELIVERY">Livraison</option>
            <option value="RENTAL">Location matériel</option>
            <option value="SCRAP">Vente emballages / Déchets</option>
            <option value="OTHER">Autre recette</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white text-xs px-2.5 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">Tous les modes</option>
            <option value="CASH">Espèces</option>
            <option value="CARD">Carte</option>
            <option value="CHECK">Chèque</option>
            <option value="TRANSFER">Virement</option>
          </select>
        </div>
      </div>

      {/* Income Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Catégorie</th>
                <th className="p-3">Description</th>
                <th className="p-3">Client / Réf</th>
                <th className="p-3">Mode</th>
                <th className="p-3 text-right rtl:text-left">Montant</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Aucun revenu trouvé.
                  </td>
                </tr>
              ) : (
                filtered.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono text-slate-400">{inc.date}</td>
                    <td className="p-3">
                      <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[10px] font-bold px-2 py-0.5 rounded">
                        {inc.category}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-white">{inc.description}</td>
                    <td className="p-3 text-slate-400">{inc.customerName || inc.reference || '-'}</td>
                    <td className="p-3">
                      <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                        {inc.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 text-right rtl:text-left font-mono font-bold text-emerald-400">
                      +{formatCurrency(inc.amount, settings.currency)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          if (confirm('Supprimer cet enregistrement ?')) {
                            onDeleteIncome(inc.id);
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record New Income Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Enregistrer une Nouvelle Recette / Entrée</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Date & Heure</label>
                <input
                  type="text"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Montant *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg font-mono font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="Motif ou libellé de l'entrée..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Catégorie</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IncomeCategory)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-2.5 py-2 rounded-lg"
                  >
                    <option value="CUSTOMER_PAYMENT">Règlement client</option>
                    <option value="SERVICE">Service</option>
                    <option value="DELIVERY">Livraison</option>
                    <option value="RENTAL">Location</option>
                    <option value="SCRAP">Vente emballages</option>
                    <option value="BONUS">Remise fournisseur</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Mode de Règlement</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-2.5 py-2 rounded-lg"
                  >
                    <option value="CASH">Espèces</option>
                    <option value="CARD">Carte Bancaire</option>
                    <option value="CHECK">Chèque</option>
                    <option value="TRANSFER">Virement</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Client (Optionnel)</label>
                <select
                  value={customerId || ''}
                  onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-2.5 py-2 rounded-lg"
                >
                  <option value="">-- Aucun client associé --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">N° Réf / Quittance</label>
                <input
                  type="text"
                  placeholder="Ex: QUITT-0045"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
