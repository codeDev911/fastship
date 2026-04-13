"use client";

import React, { useState, useEffect } from 'react';
import {
  X, Search, User, Check, ArrowLeft,
  Loader2, AlertCircle, Building2, Truck,
  Store, CheckCircle2, XCircle, Share2,
  ShieldCheck, ArrowRight
} from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TransferFundsModal = ({ isOpen, onClose }: TransferModalProps) => {
  // Navigation State: 1: Search, 2: Amount, 3: Review, 4: Success, 5: Error
  const [step, setStep] = useState(1);

  // Search & Data State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("BUSINESS");
  const [users, setUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Transaction State
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);

  // 1.0s Debounce Search Logic
  useEffect(() => {
    if (step !== 1 || !searchQuery.trim()) {
      setUsers([]);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        // Grap search from your API
        const response = await fetch(`/api/users?search=${searchQuery}&type=${selectedType}`);
        const data = await response.json();
        setUsers(data || []);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedType, step]);

  // Handle final submission
  const handleFinalSend = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.jobId;
    const userRole = user.role
    const uniqueId = new Date().toISOString()
    setIsLoading(true);
    try {
      const response = await fetch('/api/transactions/transfer-funds', {
        method: 'POST',
        body: JSON.stringify({ from: userRole?.toLowerCase(), to: selectedUser.role?.toLowerCase(), fromId: userId, toId: selectedUser?.id, amount: Number(amount), uniqueId }),
      });

      const result = await response.json();

      if (response.ok) {
        setTransactionData(result);
        setStep(4); // Success
      } else {
        setStep(5); // Error
      }
    } catch (err) {
      setStep(5);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Global UI Styles based on your requirements
  const inputStyle = "w-full bg-white rounded-full border border-slate-200 px-6 py-4 text-sm text-slate-700 outline-none transition-all focus:border-red-500 active:bg-red-500 active:text-white placeholder:text-slate-300";
  const btnPrimary = "w-full py-5 bg-red-600 text-white rounded-full font-bold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Main Container - 2xl Rounded White */}
      <div className="relative bg-white w-full md:max-w-xl max-sm:w-screen max-sm:h-screen md:rounded-2xl md:p-10 p-6 shadow-none overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Modal Header (Steps 1-3) */}
        {step <= 3 && (
          <div className="  mb-8">
            <div className='flex items-start justify-between'>
              <div>
                <h3 className="text-2xl font-bold">Transfer funds</h3>
              <p className="text-xs text-muted-foreground">Transfer digital funds from your wallet, easy ,secure and relaible </p>
              <br />
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div>
              <div className="flex gap-1.5 mb-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className={`h-1 w-6 rounded-full transition-all ${step >= s ? 'bg-red-600' : 'bg-slate-100'}`} />
                ))}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                {step === 1 && "Find Recipient"}
                {step === 2 && "Enter Amount"}
                {step === 3 && "Review Transfer"}
              </h2>
            </div>

          </div>
        )}

        {/* --- TAB 1: SEARCH & SELECT --- */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Filter Types */}
            <div className="flex flex-wrap gap-2">
              {['BUSINESS', 'SELLER', 'DRIVER'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${selectedType === t ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-slate-100 text-slate-400'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Debounced Search Input */}
            <div className="relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2">
                {isSearching ? <Loader2 className="w-4 h-4 text-red-600 animate-spin" /> : <Search className="w-4 h-4 text-slate-300" />}
              </div>
              <input
                type="text"
                placeholder="Search by email, ID or name..."
                className={`${inputStyle} pl-14`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Results List */}
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
              {users.map((user: any) => (
                <button
                  key={user?.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left ${selectedUser?.id === user?.id ? 'bg-red-50 border-red-200' : 'bg-white border-slate-50 hover:border-red-100'
                    }`}
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-100 text-red-600 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{user.email || user?.id}</p>
                  </div>
                  {selectedUser?.id === user?.id && <Check className="w-5 h-5 text-red-600" />}
                </button>
              ))}
              {searchQuery && !isSearching && users.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-6 italic">No users matching your search.</p>
              )}
            </div>

            <button
              disabled={!selectedUser}
              onClick={() => setStep(2)}
              className={btnPrimary}
            >
              Verify & Proceed <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* --- TAB 2: USER DETAILS & AMOUNT --- */}
        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-red-600 border border-slate-200">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{selectedUser?.name}</h3>
                <p className="text-[10px] text-slate-400 font-medium mb-1">{selectedUser?.id}</p>
                <p className="text-[10px] text-slate-400 font-medium mb-1">{selectedUser?.email}</p>
                <p className="text-[10px] text-slate-400 font-medium mb-1">{selectedUser?.phone}</p>
                <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                  {selectedUser?.role || "CLIENT"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-4">Amount to send (PKR)</label>
              <input
                type="number"
                placeholder="0.00"
                className={inputStyle}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="p-5 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50"><ArrowLeft className="w-5 h-5" /></button>
              <button disabled={!amount} onClick={() => setStep(3)} className={btnPrimary}>Review Transfer</button>
            </div>
          </div>
        )}

        {/* --- TAB 3: REVIEW --- */}
        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
              <div className="p-8 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Target Recipient</span>
                  <div className='flex flex-col text-right'>
                    <span className="text-sm font-bold text-slate-800">{selectedUser?.name}</span>
                    <span className="text-xs  text-slate-800">{selectedUser?.phone}</span>
                    <span className="text-xs  text-slate-800">{selectedUser?.email}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Transfer Fee</span>
                  <span className="text-xs font-bold text-green-600">PKR 0.00</span>
                </div>
              </div>
              <div className="bg-red-600 p-8 flex justify-between items-center text-white">
                <span className="text-xs opacity-70">Total transfer</span>
                <span className="text-2xl font-bold font-mono">PKR {amount}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
              <ShieldCheck className="w-5 h-5 text-yellow-600 shrink-0" />
              <p className="text-[10px] text-yellow-700 font-medium">Funds will be moved to escrow immediately. This action is irreversible.</p>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="p-5 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50"><ArrowLeft className="w-5 h-5" /></button>
              <button onClick={handleFinalSend} disabled={isLoading} className={btnPrimary}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm & Send"}
              </button>
            </div>
          </div>
        )}

        {/* --- TAB 4: SUCCESS --- */}
        {step === 4 && (
          <div className="text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Transfer Complete</h2>
            <p className="text-sm text-slate-400 mt-2">The recipient has been notified of the deposit.</p>

            <div className="mt-8 p-6 bg-slate-50 rounded-2xl space-y-4 text-left border border-slate-100">
              <div className="flex justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">TXN Reference</span>
                <span className="text-[11px] font-mono font-bold text-slate-700">{transactionData?.sender?.id || "TXN-88210"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Amount Sent</span>
                <span className="text-sm font-bold text-red-600">PKR {amount}</span>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button className="flex-1 py-4 border border-slate-200 rounded-full text-xs font-bold text-slate-500 flex items-center justify-center gap-2 active:bg-slate-100"><Share2 className="w-4 h-4" /> Receipt</button>
              <button onClick={onClose} className="flex-1 py-4 bg-slate-900 text-white rounded-full text-xs font-bold active:scale-95 transition-all">Close Modal</button>
            </div>
          </div>
        )}

        {/* --- TAB 5: ERROR --- */}
        {step === 5 && (
          <div className="text-center animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Transaction Failed</h2>
            <p className="text-sm text-slate-400 mt-2 italic">Unable to complete transfer at this time.</p>

            <div className="mt-8 p-6 rounded-2xl border border-red-50 bg-red-50/40">
              <p className="text-xs text-red-600 font-medium leading-relaxed">
                Check your connection or wallet balance. If the problem persists, please contact support with code: <span className="font-bold">ERR-WALLET-01</span>.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button onClick={() => setStep(2)} className="w-full py-5 bg-red-600 text-white rounded-full font-bold text-sm active:scale-95 transition-all">Try Different Amount</button>
              <button onClick={onClose} className="w-full py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TransferFundsModal;