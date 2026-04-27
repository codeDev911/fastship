"use client"
import React, { useState } from 'react';
import { X, CreditCard, Wallet, ChevronRight } from 'lucide-react';

export const TopUpModal = ({ isOpen, onClose }:any) => {
  const [amount, setAmount] = useState('');
  
  if (!isOpen) return null;

  const quickAmounts = ["500", "1000", "2000", "5000"];

  // Your specific input style
  const inputStyle = "w-full bg-white rounded-full border border-slate-200 px-6 py-4 text-sm text-slate-700 outline-none transition-all focus:border-red-500 active:bg-red-500 active:text-white placeholder:text-slate-300";

  return (
    <div className="fixed w-screen h-screen inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />

      {/* Modal - White 2xl Rounded */}
      <div className="relative bg-white w-full max-w-lg rounded-2xl p-8 shadow-none animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <Wallet className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Top Up Wallet</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-8">
          {/* Quick Selection */}
          <div className="grid grid-cols-4 gap-3">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt)}
                className={`py-3 rounded-full text-xs font-bold border transition-all ${
                  amount === amt 
                    ? 'bg-red-600 border-red-600 text-white' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-red-500 hover:text-red-600'
                }`}
              >
                {amt}
              </button>
            ))}
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-4">
              Custom Amount (PKR)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={inputStyle}
              />
            </div>
          </div>

          {/* Payment Method Preview */}
          <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-full border border-slate-100">
                <CreditCard className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">Mastercard **** 4242</p>
                <p className="text-[10px] text-slate-400">Default Payment Method</p>
              </div>
            </div>
            <button className="text-[10px] font-bold text-red-600 hover:underline">Change</button>
          </div>

          {/* Action Button */}
          <button className="w-full bg-red-600 hover:bg-red-700 text-white rounded-full py-4 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            Confirm Payment
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Security Footer */}
        <p className="mt-6 text-center text-[10px] text-slate-300 font-medium">
          Payments are secured by end-to-end encryption
        </p>
      </div>
    </div>
  );
};
