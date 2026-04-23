"use client";

import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Share2, 
  Download, 
  ArrowDownLeft, 
  User,
  ExternalLink
} from 'lucide-react';
import { Button } from '../../../packages/ui/shared/Button';
import { secureFetch } from '@fastship/lib';

interface PaymentReceivedModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?:{}
}

const PaymentReceivedModal = ({ isOpen, onClose, data }: PaymentReceivedModalProps) => {
  // Mock data if none provided
  const receipt = data 
  const [loading,setLoading] = useState(false)

  const handleConfirm = async()=>{
    try {
        setLoading(true)
        let res = await secureFetch("/api/payments",{
            method:"PATCH",
            body:JSON.stringify({
                status:"COMPLETED",
                paymentId:data?.id,
                paidAt:new Date()
            })
        })
        if(res.ok){
            onClose()
        }
    } catch (error) {
        alert("Error occured")
    }finally{
            setLoading(false)

    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed h-screen w-screen inset-0 z-50 flex items-center justify-center md:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      {/* Modal - White 2xl Rounded */}
      <div className="relative  items-center bg-white max-sm:h-screen max-sm:w-screen w-full md:max-w-md md:rounded-2xl md:p-10 p-4 shadow-none overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="text-center">
          <div className="relative inline-flex mb-6">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center animate-bounce-short">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <div className="absolute -right-2 -bottom-2 bg-white p-1.5 rounded-full border border-slate-100 shadow-sm">
              <ArrowDownLeft className="w-4 h-4 text-red-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payment Received</h2>
          <p className="text-sm text-slate-400 mt-1 font-medium italic">COD payments handed over to you</p>
        </div>

        {/* Big Amount Display */}
        <div className="mt-10 mb-10 text-center">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] mb-2">Total Amount</p>
          <h3 className="text-4xl font-black text-slate-900 flex items-center justify-center gap-2">
            <span className="text-xl text-red-600">PKR</span>
            {receipt?.amount.toLocaleString()}
          </h3>
        </div>

        {/* Transaction Details - Flat Style */}
        <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
           
          
          <div className="h-px bg-slate-200/50 w-full" />

          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Transaction ID</span>
            <span className="text-[11px] font-mono font-bold text-slate-700">{receipt?.id}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
            <span className="px-2 py-0.5 rounded-full  text-[9px] font-black uppercase tracking-tighter">
              {receipt.paymentStatus}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-10 space-y-3">
          <Button 
            onClick={handleConfirm}
            disabled={loading}
            className='w-full cursor-pointer'
          >
            {loading?"Processing...":"Confirm"}
          </Button>
          
        </div>

        {/* Timestamp */}
        <p className="text-center mt-8 text-[10px] text-slate-300 font-medium">
          {new Date(receipt?.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default PaymentReceivedModal;