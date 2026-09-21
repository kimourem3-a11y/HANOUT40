import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  Receipt,
  DollarSign,
  Edit2,
  Trash2,
  Search,
  RotateCcw,
  AlertTriangle,
  Lock,
  CheckCircle2,
  ShoppingCart,
  ArrowRight,
  ShieldAlert,
  FileText,
  UserCheck,
  Archive,
  ExternalLink,
} from 'lucide-react';
import {
  Customer,
  CustomerPayment,
  CustomerReturn,
  Sale,
  StoreSettings,
} from '../types';
import { calculateClientRealDebt } from '../utils/financialCalculations';
import { formatCurrency } from '../utils/formatters';
import { translations } from '../localization/translations';

interface CustomersViewProps {
  customers: Customer[];
  sales: Sale[];
  customerPayments?: CustomerPayment[];
  customerReturns?: CustomerReturn[];
  settings: StoreSettings;
  onSaveCustomer: (customer: Customer) => void;
  onSoftDeleteCustomer: (id: number) => void;
  onRestoreCustomer: (id: number) => void;
  onReceivePayment: (customerId: number, amount: number, notes?: string, method?: string) => void;
  onRecordReturn?: (returnRecord: CustomerReturn) => void;
  onStartSaleForCustomer?: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  sales,
  customerPayments = [],
  customerReturns = [],
  settings,
  onSaveCustomer,
  onSoftDeleteCustomer,
  onRestoreCustomer,
  onReceivePayment,
  onRecordReturn,
  onStartSaleForCustomer,
}) => {
  const t = translations[settings.language];

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'ACTIVE' | 'DEBT_ONLY' | 'NO_DEBT' | 'ARCHIVED'>('ACTIVE');

  // Selected client for full profile / history view
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // Add / Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCityWilaya, setFormCityWilaya] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCreditLimit, setFormCreditLimit] = useState<number>(20000);
  const [formInitialBalance, setFormInitialBalance] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formPhoneWarning, setFormPhoneWarning] = useState<string | null>(null);

  // Payment Modal State
  const [payingCustomerId, setPayingCustomerId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Return / Refund Modal State
  const [returningCustomerId, setReturningCustomerId] = useState<number | null>(null);
  const [returnAmount, setReturnAmount] = useState<number>(0);
  const [returnReason, setReturnReason] = useState<string>('');
  const [returnMethod, setReturnMethod] = useState<'CREDIT_REDUCTION' | 'CASH'>('CREDIT_REDUCTION');

  // Protected Removal (Soft-delete) Modal State
  const [removingCustomerId, setRemovingCustomerId] = useState<number | null>(null);
  const [removalStep, setRemovalStep] = useState<1 | 2>(1);
  const [removalPassword, setRemovalPassword] = useState('');
  const [removalPasswordError, setRemovalPasswordError] = useState(false);
  const [debtAcknowledgement, setDebtAcknowledgement] = useState(false);

  // Transaction history filter inside client profile
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'INVOICES' | 'PAYMENTS' | 'RETURNS'>('ALL');

  // Helper to generate next unique code CLIENT-XXXX
  const generateCustomerCode = () => {
    const nextNum = customers.length + 1;
    return `CLIENT-${String(nextNum).padStart(4, '0')}`;
  };

  // Open Add modal
  const openAdd = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormCityWilaya('');
    setFormCode(generateCustomerCode());
    setFormCreditLimit(25000);
    setFormInitialBalance(0);
    setFormNotes('');
    setFormError(null);
    setFormPhoneWarning(null);
    setIsFormOpen(true);
  };

  // Open Edit modal
  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormEmail(c.email || '');
    setFormAddress(c.address || '');
    setFormCityWilaya(c.cityWilaya || '');
    setFormCode(c.code || `CLIENT-${String(c.id).slice(-4)}`);
    setFormCreditLimit(c.creditLimit);
    setFormInitialBalance(c.initialBalance || 0);
    setFormNotes(c.notes || '');
    setFormError(null);
    setFormPhoneWarning(null);
    setIsFormOpen(true);
  };

  // Phone duplicate warning check
  const handlePhoneChange = (val: string) => {
    setFormPhone(val);
    const clean = val.trim();
    if (clean.length > 5) {
      const duplicate = customers.find(
        (c) => c.phone.trim() === clean && (!editingCustomer || c.id !== editingCustomer.id)
      );
      if (duplicate) {
        setFormPhoneWarning(`⚠️ Un autre client (${duplicate.name}) utilise déjà ce numéro.`);
      } else {
        setFormPhoneWarning(null);
      }
    } else {
      setFormPhoneWarning(null);
    }
  };

  // Submit Add/Edit Form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Le nom du client est obligatoire.');
      return;
    }

    // Code uniqueness validation
    const targetCode = formCode.trim() || generateCustomerCode();
    const duplicateCode = customers.find(
      (c) => c.code === targetCode && (!editingCustomer || c.id !== editingCustomer.id)
    );
    if (duplicateCode) {
      setFormError(`Le code client "${targetCode}" est déjà attribué à ${duplicateCode.name}.`);
      return;
    }

    const now = new Date().toISOString();
    const newCust: Customer = {
      id: editingCustomer ? editingCustomer.id : Date.now(),
      code: targetCode,
      name: formName.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim() || undefined,
      address: formAddress.trim(),
      cityWilaya: formCityWilaya.trim() || undefined,
      notes: formNotes.trim() || undefined,
      creditLimit: Number(formCreditLimit),
      initialBalance: Number(formInitialBalance),
      currentDebt: editingCustomer ? editingCustomer.currentDebt : Number(formInitialBalance),
      isArchived: editingCustomer ? editingCustomer.isArchived : false,
      deletedAt: editingCustomer ? editingCustomer.deletedAt : null,
      createdAt: editingCustomer?.createdAt || now,
      updatedAt: now,
    };

    onSaveCustomer(newCust);
    setIsFormOpen(false);
  };

  // Submit Payment
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payingCustomerId && paymentAmount > 0) {
      onReceivePayment(payingCustomerId, Number(paymentAmount), paymentNotes, paymentMethod);
      setPayingCustomerId(null);
      setPaymentAmount(0);
      setPaymentNotes('');
    }
  };

  // Submit Return
  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (returningCustomerId && returnAmount > 0 && onRecordReturn) {
      const cust = customers.find((c) => c.id === returningCustomerId);
      const retRecord: CustomerReturn = {
        id: `ret-${Date.now()}`,
        date: new Date().toISOString(),
        customerId: returningCustomerId,
        customerName: cust?.name || 'Client',
        amount: Number(returnAmount),
        reason: returnReason.trim() || 'Retour marchandise / Avoir',
        refundMethod: returnMethod,
      };
      onRecordReturn(retRecord);
      setReturningCustomerId(null);
      setReturnAmount(0);
      setReturnReason('');
    }
  };

  // Open Protected Removal Flow
  const openRemoval = (c: Customer) => {
    setRemovingCustomerId(c.id);
    setRemovalStep(1);
    setRemovalPassword('');
    setRemovalPasswordError(false);
    setDebtAcknowledgement(false);
  };

  // Verify Removal Password
  const handleVerifyRemovalPassword = () => {
    // Case-insensitive verification: karim40, KARIM40, Karim40
    if (removalPassword.trim().toLowerCase() === 'karim40') {
      setRemovalPasswordError(false);
      setRemovalStep(2);
    } else {
      setRemovalPasswordError(true);
    }
  };

  // Confirm Removal (Soft-delete)
  const handleConfirmRemoval = () => {
    if (removingCustomerId) {
      onSoftDeleteCustomer(removingCustomerId);
      setRemovingCustomerId(null);
      if (selectedCustomerId === removingCustomerId) {
        setSelectedCustomerId(null);
      }
    }
  };

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Archive filter
      const isArchived = Boolean(c.isArchived || c.deletedAt);
      if (filterTab === 'ARCHIVED') {
        if (!isArchived) return false;
      } else {
        if (isArchived) return false;
      }

      // Debt filter
      const realDebt = calculateClientRealDebt(c, sales, customerPayments, customerReturns).realDebt;
      if (filterTab === 'DEBT_ONLY' && realDebt <= 0) return false;
      if (filterTab === 'NO_DEBT' && realDebt > 0) return false;

      // Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone.includes(q);
        const matchCode = (c.code || '').toLowerCase().includes(q);
        const matchEmail = (c.email || '').toLowerCase().includes(q);
        const matchAddress = (c.address || '').toLowerCase().includes(q);
        return matchName || matchPhone || matchCode || matchEmail || matchAddress;
      }

      return true;
    });
  }, [customers, filterTab, search, sales, customerPayments, customerReturns]);

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Selected customer stats and transaction history
  const selectedCustomerData = useMemo(() => {
    if (!selectedCustomer) return null;
    const stats = calculateClientRealDebt(
      selectedCustomer,
      sales,
      customerPayments,
      customerReturns
    );

    // Build unified transaction history
    const history: Array<{
      id: string;
      date: string;
      type: 'INVOICE' | 'PAYMENT' | 'RETURN';
      ref: string;
      amount: number;
      payment: number;
      remainingDebt: number;
      status: string;
      raw?: any;
    }> = [];

    // Sales
    sales
      .filter((s) => s.customerId === selectedCustomer.id && s.status === 'COMPLETED')
      .forEach((s) => {
        history.push({
          id: `sale-${s.id}`,
          date: s.saleDate,
          type: 'INVOICE',
          ref: s.invoiceNumber || `Facture #${s.id}`,
          amount: s.totalAmount,
          payment: s.amountPaid,
          remainingDebt: s.debtAmount,
          status: s.debtAmount > 0 ? 'Crédit partiel' : 'Payé intégralement',
          raw: s,
        });
      });

    // Payments
    customerPayments
      .filter((p) => p.customerId === selectedCustomer.id)
      .forEach((p) => {
        history.push({
          id: `pay-${p.id}`,
          date: p.paymentDate,
          type: 'PAYMENT',
          ref: p.notes || `Reçu versement #${p.id}`,
          amount: p.amount,
          payment: p.amount,
          remainingDebt: 0,
          status: 'Encaissé',
          raw: p,
        });
      });

    // Returns
    customerReturns
      .filter((r) => r.customerId === selectedCustomer.id)
      .forEach((r) => {
        history.push({
          id: `ret-${r.id}`,
          date: r.date,
          type: 'RETURN',
          ref: r.invoiceNumber ? `Retour s/ ${r.invoiceNumber}` : `Avoir #${r.id}`,
          amount: r.amount,
          payment: 0,
          remainingDebt: 0,
          status: r.refundMethod === 'CASH' ? 'Remboursé espèces' : 'Déduit du solde',
          raw: r,
        });
      });

    // Sort descending by date
    history.sort((a, b) => b.date.localeCompare(a.date));

    // Filter history
    const filteredHistory = history.filter((h) => {
      if (historyFilter === 'INVOICES') return h.type === 'INVOICE';
      if (historyFilter === 'PAYMENTS') return h.type === 'PAYMENT';
      if (historyFilter === 'RETURNS') return h.type === 'RETURN';
      return true;
    });

    return { stats, history: filteredHistory };
  }, [selectedCustomer, sales, customerPayments, customerReturns, historyFilter]);

  // Paying / Removing Customer objects
  const payingCustomer = customers.find((c) => c.id === payingCustomerId);
  const removingCustomer = customers.find((c) => c.id === removingCustomerId);
  const returningCustomer = customers.find((c) => c.id === returningCustomerId);

  const removingStats = removingCustomer
    ? calculateClientRealDebt(removingCustomer, sales, customerPayments, customerReturns)
    : null;

  return (
    <div id="customers-management-view" className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner: Module Header & Quick Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-950/70 border border-blue-800/50 rounded-xl text-blue-400 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Gestion des Clients & Créances
              </h1>
              <span className="bg-slate-800 text-slate-300 text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                {customers.filter((c) => !c.isArchived).length} Actifs
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Fiches clients complètes, historique financier inaltérable et calcul exact de la dette réelle.
            </p>
          </div>
        </div>

        <button
          id="add-new-client-btn"
          onClick={openAdd}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* Main Grid: Client List & Optional Profile Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Client Directory List (Columns 1 to 5 or full width if no selection) */}
        <div className={selectedCustomer ? 'lg:col-span-5 space-y-4' : 'lg:col-span-12 space-y-4'}>
          {/* Search and Tabs Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2.5 shadow-xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone, code client (CLIENT-XXXX)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs pl-8 pr-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin text-xs">
              <button
                onClick={() => setFilterTab('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                  filterTab === 'ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Actifs
              </button>
              <button
                onClick={() => setFilterTab('DEBT_ONLY')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                  filterTab === 'DEBT_ONLY'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Avec Dette
              </button>
              <button
                onClick={() => setFilterTab('NO_DEBT')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                  filterTab === 'NO_DEBT'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Sans Dette
              </button>
              <button
                onClick={() => setFilterTab('ARCHIVED')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                  filterTab === 'ARCHIVED'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Clients Archivés
              </button>
            </div>
          </div>

          {/* Cards Grid / List */}
          <div
            className={
              selectedCustomer
                ? 'space-y-3'
                : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            }
          >
            {filteredCustomers.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs col-span-full">
                {filterTab === 'ARCHIVED'
                  ? 'Aucun client archivé.'
                  : 'Aucun client ne correspond à votre recherche.'}
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const debtStats = calculateClientRealDebt(
                  cust,
                  sales,
                  customerPayments,
                  customerReturns
                );
                const isSelected = selectedCustomerId === cust.id;

                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`bg-slate-900 border rounded-xl p-4 shadow-xs flex flex-col justify-between cursor-pointer transition select-none ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-slate-850'
                        : 'border-slate-800 hover:border-slate-700 hover:bg-slate-850/60'
                    }`}
                  >
                    <div>
                      {/* Top row: Code & Debt Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                            {cust.code || `CLIENT-${String(cust.id).slice(-4)}`}
                          </span>
                          <h3 className="font-bold text-white text-sm mt-0.5">{cust.name}</h3>
                        </div>

                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                            debtStats.realDebt > 0
                              ? 'bg-rose-950 text-rose-400 border border-rose-800/50'
                              : 'bg-slate-800 text-emerald-400'
                          }`}
                        >
                          {debtStats.realDebt > 0
                            ? `Dette: ${formatCurrency(debtStats.realDebt, settings.currency)}`
                            : 'Solde Réglé'}
                        </span>
                      </div>

                      {/* Contact info snippet */}
                      <div className="mt-3 space-y-1 text-xs text-slate-400">
                        {cust.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>{cust.phone}</span>
                          </div>
                        )}
                        {cust.cityWilaya && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>{cust.cityWilaya}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer buttons on card */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      {cust.isArchived ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestoreCustomer(cust.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restaurer</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPayingCustomerId(cust.id);
                            setPaymentAmount(debtStats.realDebt);
                          }}
                          disabled={debtStats.realDebt <= 0}
                          className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Encaisser</span>
                        </button>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(cust);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {!cust.isArchived && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openRemoval(cust);
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            title="Retirer Client (Protégé)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Client Profile / Transaction History Panel (7 cols) */}
        {selectedCustomer && selectedCustomerData && (
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {selectedCustomer.code || `CLIENT-${String(selectedCustomer.id).slice(-4)}`}
                  </span>
                  <h2 className="text-lg font-black text-white">{selectedCustomer.name}</h2>
                  {selectedCustomer.isArchived && (
                    <span className="bg-amber-950 text-amber-400 border border-amber-800/50 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Archivé
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 flex-wrap">
                  {selectedCustomer.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      {selectedCustomer.phone}
                    </span>
                  )}
                  {selectedCustomer.cityWilaya && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {selectedCustomer.cityWilaya}
                    </span>
                  )}
                  {selectedCustomer.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      {selectedCustomer.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {onStartSaleForCustomer && !selectedCustomer.isArchived && (
                  <button
                    onClick={() => onStartSaleForCustomer(selectedCustomer)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Nouvelle Vente</span>
                  </button>
                )}

                {!selectedCustomer.isArchived && (
                  <button
                    onClick={() => {
                      setPayingCustomerId(selectedCustomer.id);
                      setPaymentAmount(selectedCustomerData.stats.realDebt);
                    }}
                    disabled={selectedCustomerData.stats.realDebt <= 0}
                    className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Règlement</span>
                  </button>
                )}

                {!selectedCustomer.isArchived && onRecordReturn && (
                  <button
                    onClick={() => {
                      setReturningCustomerId(selectedCustomer.id);
                      setReturnAmount(0);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                    <span>Retour / Avoir</span>
                  </button>
                )}

                <button
                  onClick={() => openEdit(selectedCustomer)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Modifier Fiche"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {!selectedCustomer.isArchived && (
                  <button
                    onClick={() => openRemoval(selectedCustomer)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    title="Retirer Client (Protégé)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Financial Profile KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-rose-400 font-bold uppercase block">
                  Dette Actuelle Réelle
                </span>
                <span className="text-base font-black text-rose-400 font-mono mt-1 block">
                  {formatCurrency(selectedCustomerData.stats.realDebt, settings.currency)}
                </span>
                <span className="text-[10px] text-slate-500">
                  Calculée sur historique
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold uppercase block">
                  Total Achats Réalisés
                </span>
                <span className="text-base font-black text-white font-mono mt-1 block">
                  {formatCurrency(selectedCustomerData.stats.totalInvoicesAmount, settings.currency)}
                </span>
                <span className="text-[10px] text-slate-500">
                  {selectedCustomerData.stats.invoicesCount} factures émises
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-emerald-400 font-bold uppercase block">
                  Total Versements Reçus
                </span>
                <span className="text-base font-black text-emerald-400 font-mono mt-1 block">
                  {formatCurrency(selectedCustomerData.stats.totalPaid, settings.currency)}
                </span>
                <span className="text-[10px] text-slate-500">
                  {selectedCustomerData.stats.paymentsCount} versements
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-purple-400 font-bold uppercase block">
                  Retours & Avoirs
                </span>
                <span className="text-base font-black text-purple-400 font-mono mt-1 block">
                  {formatCurrency(selectedCustomerData.stats.totalReturns, settings.currency)}
                </span>
                <span className="text-[10px] text-slate-500">
                  {selectedCustomerData.stats.returnsCount} retours
                </span>
              </div>
            </div>

            {/* Transaction History Section */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Historique Financier Inaltérable</span>
                </h3>

                {/* Filter chips */}
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setHistoryFilter('ALL')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                      historyFilter === 'ALL'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Toutes ({selectedCustomerData.history.length})
                  </button>
                  <button
                    onClick={() => setHistoryFilter('INVOICES')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                      historyFilter === 'INVOICES'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Factures
                  </button>
                  <button
                    onClick={() => setHistoryFilter('PAYMENTS')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                      historyFilter === 'PAYMENTS'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Paiements
                  </button>
                  <button
                    onClick={() => setHistoryFilter('RETURNS')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                      historyFilter === 'RETURNS'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Retours
                  </button>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                {selectedCustomerData.history.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    Aucune transaction enregistrée pour ce client.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Réf / Facture</th>
                          <th className="py-2.5 px-3 text-right">Montant</th>
                          <th className="py-2.5 px-3 text-right">Payé</th>
                          <th className="py-2.5 px-3 text-right">Dette Reste</th>
                          <th className="py-2.5 px-3 text-center">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {selectedCustomerData.history.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-900/50 transition">
                            <td className="py-2.5 px-3 font-mono text-slate-400">
                              {row.date.split('T')[0]}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  row.type === 'INVOICE'
                                    ? 'bg-blue-950 text-blue-400 border border-blue-800/40'
                                    : row.type === 'PAYMENT'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                                    : 'bg-purple-950 text-purple-400 border border-purple-800/40'
                                }`}
                              >
                                {row.type === 'INVOICE'
                                  ? 'Facture'
                                  : row.type === 'PAYMENT'
                                  ? 'Versement'
                                  : 'Retour'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-white">
                              {row.ref}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                              {formatCurrency(row.amount, settings.currency)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                              {formatCurrency(row.payment, settings.currency)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-rose-400 font-bold">
                              {row.remainingDebt > 0
                                ? formatCurrency(row.remainingDebt, settings.currency)
                                : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-400 text-[11px]">
                              {row.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / EDIT CLIENT */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white pb-2 border-b border-slate-800">
              {editingCustomer ? 'Modifier Fiche Client' : 'Ajouter un Nouveau Client'}
            </h3>

            {formError && (
              <div className="bg-rose-950/60 border border-rose-800 text-rose-300 p-2.5 rounded-lg text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    Nom & Prénom / Raison Sociale *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Amine Brahimi"
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                {/* Customer Code */}
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    Code Client (Unique)
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="CLIENT-0001"
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    Numéro de Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="0550 00 00 00"
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  />
                  {formPhoneWarning && (
                    <p className="text-[11px] text-amber-400 mt-1">{formPhoneWarning}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    Email (Optionnel)
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="client@domaine.dz"
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* City / Wilaya */}
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    Ville / Wilaya
                  </label>
                  <input
                    type="text"
                    value={formCityWilaya}
                    onChange={(e) => setFormCityWilaya(e.target.value)}
                    placeholder="Ex: Alger / Oran / Constantine"
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    Adresse Complète
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Quartier, Rue, N° de local..."
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Credit Limit */}
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    Plafond Crédit Autorisé ({settings.currency})
                  </label>
                  <input
                    type="number"
                    value={formCreditLimit}
                    onChange={(e) => setFormCreditLimit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Initial Balance */}
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    Solde d'Ouverture / Dette Initiale ({settings.currency})
                  </label>
                  <input
                    type="number"
                    disabled={Boolean(editingCustomer)}
                    value={formInitialBalance}
                    onChange={(e) => setFormInitialBalance(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                  {editingCustomer && (
                    <span className="text-[10px] text-slate-500">
                      Calculé automatiquement sur l'historique
                    </span>
                  )}
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    Remarques / Notes Spécifiques
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Instructions particulières, jours de livraison..."
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECEIVE PAYMENT */}
      {payingCustomer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white pb-2 border-b border-slate-800">
              Encaisser un Versement — {payingCustomer.name}
            </h3>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
              <span className="text-slate-400">Dette actuelle :</span>
              <span className="font-bold text-rose-400 font-mono text-sm">
                {formatCurrency(payingCustomer.currentDebt, settings.currency)}
              </span>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Montant Encaissé ({settings.currency}) *
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
                  Mode d'Encaissement
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="CASH">Espèces (Caisse)</option>
                  <option value="CARD">Carte Bancaire / CIB</option>
                  <option value="CHECK">Chèque</option>
                  <option value="TRANSFER">Virement Bancaire / CCP</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Remarque / Référence
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ex: Versement partiel en espèces"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingCustomerId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Valider l'Encaissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RECORD RETURN / REFUND */}
      {returningCustomer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white pb-2 border-b border-slate-800">
              Retour Marchandise & Avoir — {returningCustomer.name}
            </h3>

            <form onSubmit={handleReturnSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Montant du Retour / Avoir ({settings.currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={returnAmount}
                  onChange={(e) => setReturnAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-base font-bold font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Traitement du Remboursement
                </label>
                <select
                  value={returnMethod}
                  onChange={(e) => setReturnMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="CREDIT_REDUCTION">Déduire de la dette client (Avoir)</option>
                  <option value="CASH">Remboursement immédiat en espèces (Caisse)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Motif du Retour
                </label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Ex: Produit défectueux / Erreur référence"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReturningCustomerId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Enregistrer Retour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PROTECTED REMOVE CLIENT (karim40 CASE-INSENSITIVE + SOFT-DELETE SAFEGUARD) */}
      {removingCustomer && removingStats && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-800/80 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-base font-black text-white">
                Retirer le Client de la Liste Active
              </h3>
            </div>

            {/* Client summary metrics */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Client :</span>
                <span className="font-bold text-white">{removingCustomer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Téléphone :</span>
                <span className="font-mono text-slate-300">{removingCustomer.phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Factures émises :</span>
                <span className="font-mono text-slate-300">{removingStats.invoicesCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Paiements enregistrés :</span>
                <span className="font-mono text-slate-300">{removingStats.paymentsCount}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400 font-bold">Créance / Dette en cours :</span>
                <span className="font-mono font-bold text-rose-400">
                  {formatCurrency(removingStats.realDebt, settings.currency)}
                </span>
              </div>
            </div>

            {/* Crucial Data Integrity Safeguard Notice */}
            <div className="bg-amber-950/40 border border-amber-800/50 p-3 rounded-xl text-xs text-amber-300/90 leading-relaxed">
              <strong>Garantie Comptable Hanouti 40 :</strong> Le retrait du client le retire de la liste active mais <strong>CONSERVE INTÉGRALEMENT tout son historique financier</strong> (factures, paiements, retours et dates). Aucune écriture comptable n'est effacée.
            </div>

            {/* Outstanding Debt Extra Warning */}
            {removingStats.realDebt > 0 && (
              <div className="bg-rose-950/50 border border-rose-700/80 p-3 rounded-xl text-xs text-rose-200 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>⚠️ ATTENTION : CE CLIENT A UNE DETTE EN COURS DE {formatCurrency(removingStats.realDebt, settings.currency)} !</span>
                </div>
                <p className="text-[11px] text-rose-300/80">
                  Le retrait du client n'efface PAS cette dette. Elle demeure enregistrée dans le grand livre et peut être récupérée lors de la restauration.
                </p>
                <label className="flex items-center gap-2 pt-1 cursor-pointer text-white font-semibold">
                  <input
                    type="checkbox"
                    checked={debtAcknowledgement}
                    onChange={(e) => setDebtAcknowledgement(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 bg-slate-900 border-slate-700 focus:ring-rose-500"
                  />
                  <span>J'ai compris et je confirme le maintien de la dette</span>
                </label>
              </div>
            )}

            {/* Step 1: karim40 Password prompt */}
            {removalStep === 1 && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Mot de passe de confirmation administrateur</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Saisir karim40"
                    value={removalPassword}
                    onChange={(e) => {
                      setRemovalPassword(e.target.value);
                      setRemovalPasswordError(false);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-rose-500"
                  />
                  {removalPasswordError && (
                    <p className="text-xs text-rose-400 mt-1">
                      Mot de passe incorrect (Le mot de passe valide est karim40).
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setRemovingCustomerId(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyRemovalPassword}
                    disabled={removingStats.realDebt > 0 && !debtAcknowledgement}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Vérifier le mot de passe
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Final Confirmation */}
            {removalStep === 2 && (
              <div className="space-y-3 pt-1">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-center text-slate-300 font-semibold">
                  Êtes-vous sûr de vouloir retirer ce client ({removingCustomer.name}) de la liste active ?
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setRemovingCustomerId(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRemoval}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Retirer le Client
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
