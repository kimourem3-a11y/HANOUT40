import React, { useState } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  FileDown,
  DollarSign,
  Calendar,
  Building2,
  Trash2,
} from 'lucide-react';
import { Expense, ExpenseCategory, StoreSettings, Supplier } from '../types';
import { formatCurrency } from '../utils/formatters';
import { downloadOrSharePdf, generateExpenseReportPdf } from '../utils/pdfGenerator';
import { translations } from '../localization/translations';

interface ExpensesViewProps {
  expenses: Expense[];
  suppliers: Supplier[];
  settings: StoreSettings;
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: number) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  suppliers,
  settings,
  onAddExpense,
  onDeleteExpense,
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
  const [category, setCategory] = useState<ExpenseCategory>('RENT');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'CHECK' | 'TRANSFER' | 'OTHER'>('CASH');
  const [supplierId, setSupplierId] = useState<number | undefined>(undefined);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  // Calculations for KPIs
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

  let todayExpenses = 0;
  let weeklyExpenses = 0;
  let monthlyExpenses = 0;
  let totalExpenses = 0;

  expenses.forEach((exp) => {
    totalExpenses += exp.amount;
    const expDateOnly = exp.date.split(' ')[0];
    const expDate = new Date(expDateOnly);

    if (expDateOnly === todayStr) todayExpenses += exp.amount;
    if (expDate >= oneWeekAgo) weeklyExpenses += exp.amount;
    if (expDate >= oneMonthAgo) monthlyExpenses += exp.amount;
  });

  // Filtered List
  const filtered = expenses.filter((exp) => {
    const matchesSearch =
      exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.supplierName && exp.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (exp.reference && exp.reference.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || exp.category === categoryFilter;
    const matchesMethod = methodFilter === 'ALL' || exp.paymentMethod === methodFilter;

    return matchesSearch && matchesCategory && matchesMethod;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const selectedSupp = suppliers.find((s) => s.id === supplierId);

    const newExp: Expense = {
      id: Date.now(),
      date,
      category,
      description,
      amount: numAmount,
      paymentMethod,
      supplierId: selectedSupp?.id,
      supplierName: selectedSupp?.name,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onAddExpense(newExp);
    setIsAddModalOpen(false);
    // Reset Form
    setAmount('');
    setDescription('');
    setReference('');
    setNotes('');
  };

  const handleExportPdf = () => {
    const doc = generateExpenseReportPdf(filtered, settings);
    downloadOrSharePdf(doc, `Expense_Report_${new Date().toISOString().split('T')[0]}.pdf`, 'Rapport des Dépenses');
  };

  return (
    <div id="expenses-view-container" className="space-y-5">
      {/* View Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-950/70 border border-rose-800/40 rounded-lg text-rose-400">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{t.expenses} & Charges</h2>
            <p className="text-xs text-slate-400">Suivi des coûts d'exploitation et décaissements</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportPdf}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-rose-400" />
            <span>{t.exportPdf}</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Dépense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Dépenses Aujourd'hui</span>
          <p className="text-xl sm:text-2xl font-black text-rose-400 mt-1 font-mono">
            {formatCurrency(todayExpenses, settings.currency)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Charges du jour</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Cette Semaine</span>
          <p className="text-xl sm:text-2xl font-black text-white mt-1 font-mono">
            {formatCurrency(weeklyExpenses, settings.currency)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">7 derniers jours</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Ce Mois</span>
          <p className="text-xl sm:text-2xl font-black text-white mt-1 font-mono">
            {formatCurrency(monthlyExpenses, settings.currency)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">30 derniers jours</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Dépenses</span>
          <p className="text-xl sm:text-2xl font-black text-rose-400 mt-1 font-mono">
            {formatCurrency(totalExpenses, settings.currency)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">{expenses.length} enregistrements</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            placeholder="Rechercher par description, fournisseur ou référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg pl-9 pr-3 py-2 rtl:pr-9 rtl:pl-3 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white text-xs px-2.5 py-2 rounded-lg focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">Toutes les charges</option>
            <option value="RENT">Loyer du local</option>
            <option value="ELECTRICITY">Électricité / Gaz</option>
            <option value="WATER">Eau</option>
            <option value="INTERNET">Internet & Téléphonie</option>
            <option value="SALARIES">Salaires & Primes</option>
            <option value="TRANSPORT">Transport & Carburant</option>
            <option value="PACKAGING">Emballages & Fournitures</option>
            <option value="MAINTENANCE">Maintenance & Réparations</option>
            <option value="TAXES">Taxes & Impôts</option>
            <option value="OTHER">Autre dépense</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white text-xs px-2.5 py-2 rounded-lg focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">Tous les modes</option>
            <option value="CASH">Espèces</option>
            <option value="CARD">Carte</option>
            <option value="CHECK">Chèque</option>
            <option value="TRANSFER">Virement</option>
          </select>
        </div>
      </div>

      {/* Expenses Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Catégorie</th>
                <th className="p-3">Description</th>
                <th className="p-3">Fournisseur / Réf</th>
                <th className="p-3">Mode</th>
                <th className="p-3 text-right rtl:text-left">Montant</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Aucune dépense trouvée.
                  </td>
                </tr>
              ) : (
                filtered.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono text-slate-400">{exp.date}</td>
                    <td className="p-3">
                      <span className="bg-rose-950/60 text-rose-400 border border-rose-800/40 text-[10px] font-bold px-2 py-0.5 rounded">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-white">{exp.description}</td>
                    <td className="p-3 text-slate-400">{exp.supplierName || exp.reference || '-'}</td>
                    <td className="p-3">
                      <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                        {exp.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 text-right rtl:text-left font-mono font-bold text-rose-400">
                      -{formatCurrency(exp.amount, settings.currency)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          if (confirm('Supprimer cette dépense ?')) {
                            onDeleteExpense(exp.id);
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

      {/* Record New Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Enregistrer une Dépense / Charge</h3>
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
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg font-mono font-bold text-rose-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="Motif de la dépense..."
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
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-2.5 py-2 rounded-lg"
                  >
                    <option value="RENT">Loyer</option>
                    <option value="ELECTRICITY">Électricité / Gaz</option>
                    <option value="WATER">Eau</option>
                    <option value="INTERNET">Internet & Télécom</option>
                    <option value="SALARIES">Salaires</option>
                    <option value="TRANSPORT">Transport</option>
                    <option value="PACKAGING">Emballages</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="TAXES">Taxes</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Mode de Paiement</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-2.5 py-2 rounded-lg"
                  >
                    <option value="CASH">Espèces</option>
                    <option value="CARD">Carte</option>
                    <option value="CHECK">Chèque</option>
                    <option value="TRANSFER">Virement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Fournisseur / Bénéficiaire</label>
                <select
                  value={supplierId || ''}
                  onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-2.5 py-2 rounded-lg"
                >
                  <option value="">-- Aucun fournisseur associé --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">N° Réf / Facture / Reçu</label>
                <input
                  type="text"
                  placeholder="Ex: FAC-9021"
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
                  className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
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
