"use client";

import React, { useEffect, useState } from 'react';
import {
    X,
    Wallet,
    Receipt,
    ArrowUpRight,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    ChevronRight,
    Info,
    StarIcon
} from 'lucide-react';
import { Button } from '../shared/Button';
import { secureFetch } from '@/lib/secure-fetch';

const DeptFundReleaseModal = ({ isOpen, onClose, currentDebt }: any) => {
    const [step, setStep] = useState(1); // 1: Form, 2: Success, 3: Error
    const [amount, setAmount] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState({ isError: false, message: "" })

    const [wallet, setWallet]: any = useState({})
    const [business, setBusiness]: any = useState({})
    async function getInfo() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const driverId = user?.jobId;

        try {
            let res = await secureFetch(`/api/wallets?driverId=${driverId}`)
            let res2 = await secureFetch(`/api/driver/${driverId}`)
            const data = await res.json()
            const data2 = await res2.json()
            if (res.ok && res2.ok) {
                setWallet(data.data);
                setBusiness(data2)
            } else {
                setError({ isError: false, "message": data.error || data2.error || "We have a temprary issue" })
                setStep(3)
            }
        } catch (error) {

            setStep(3)
        }
    }

    const handleReleaseFunds = async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const driverId = user?.jobId;

        if (amount > wallet?.balance) {
            setError({ isError: true, "message": "Insufficient balance" })
        }
        try {
            setIsLoading(true)
            const uniqueId = new Date().toISOString()
            const res = await secureFetch('/api/transactions/transfer-funds', {
                method: "POST",
                body: JSON.stringify({ from: "driver", to: "business", fromId: driverId, toId: business?.user?.id, amount, description: "COD debt released",uniqueId })
            })
            const data = await res.json()

            if (res.ok) {
                let r2 = await secureFetch('/api/business/driver-depts', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        driverId: driverId,
                        amount: amount,
                    }),
                }); 
                if (!r2.ok) {
                    await secureFetch('/api/transactions/transfer-funds', {
                        method: "POST",
                        body: JSON.stringify({ from: "business", to: "driver", toId: user.id, fromId: business?.id, amount, description: "Refunded back",uniqueId })
                    })
                    setStep(3)
                    setError({ isError: true, message: "Error occure while clearing Debt" })
                }
                setStep(2)
            } else {
                setError({ isError: true, message: data.error || "Facing Temprary issue" })
            }

        } catch (error) {
            setError({ isError: true, message: error?.data?.message || "Internal server error " })
        }
        finally {
            setIsLoading(false)
        }
    }
    useEffect(() => {
        getInfo()
    }, [])

    // Mock Data
    const walletBalance = wallet?.balance || "0";

    if (!isOpen) return null;


    const inputStyle = "w-full bg-white rounded-full border border-slate-200 px-6 py-4 text-base text-slate-700 outline-none transition-all focus:border-red-500 active:bg-red-500 active:text-white placeholder:text-slate-300";

    return (
        <div className="fixed h-screen w-screen inset-0 z-50 flex items-center justify-center md:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative md:max-h-[97vh] overflow-y-auto bg-white w-full max-sm:h-screen max-w-lg md:rounded-2xl md:p-10 p-5 shadow-none overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Step 1: Input Form */}
                {step === 1 && (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800  ">Release Debt</h2>
                                <p className="text-xs text-slate-400 mt-1">Clear your outstanding balance from your wallet</p>
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Financial Overview Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className=" text-sm  font-semibold  text-slate-400   mb-1">Wallet balance</p>
                                <p className="text-lg font-bold text-slate-800">Rs. {walletBalance.toLocaleString()}</p>
                                <p className=" text-xs mt-2    text-slate-400   ">Remaining balance</p>
                                <p className="text-base font-bold text-slate-800">Rs. {walletBalance - Number(amount)}</p>
                            </div>
                            <div className="p-5 bg-red-50 rounded-2xl border border-red-100">
                                <p className=" text-sm font-semibold text-red-400   mb-1">Current Debt</p>
                                <p className="text-lg font-bold text-red-600">Rs. {currentDebt.toLocaleString()}</p>
                                <p className=" text-xs  text-red-400   mt-2">Remaining Debt</p>
                                <p className="text-base font-bold text-red-600">Rs. {currentDebt - Number(amount)}</p>
                            </div>
                        </div>


                        {/* Pay to */}
                        <div className="rounded-2xl border px-4 py-3">
                            <h3 className="text-sm text-muted-foreground">Pay to </h3>
                            <h4 className="text-base font-bold flex space-x-1">{business?.companyName} <span className="text-sm font-normal mx-2 flex space-x-2 items-center"><StarIcon className='w-3 mr-1' /> {business?.rating}</span></h4>
                            <p className="text-sm text-muted-foreground">{business?.user?.email}</p>
                            <p className="text-sm text-muted-foreground">{business?.user?.phone}</p>
                        </div>

                        {/* Input Section */}
                        <div className="space-y-2">
                            <label className=" text-sm   text-slate-400  mb-2">Release Amount</label>
                            <div className="relative mt-1">
                                <input
                                    type="number"
                                    placeholder="Enter amount to pay..."
                                    className={inputStyle}
                                    value={amount}
                                    required
                                    disabled={currentDebt <= 0}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className=" space-y-4">
                            <Button
                                onClick={handleReleaseFunds}
                                disabled={!amount || isLoading}
                                className="w-full py-3 bg-red-600 text-white rounded-full font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isLoading ? "Processing..." : "Confirm Release"}
                            </Button>

                            <div className="flex items-center justify-center gap-2">
                                <ShieldCheck className="w-3 h-3 text-slate-500" />
                                <span className="text-xs      text-slate-500">Instant Settlement Guaranteed</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Success Tab */}
                {step === 2 && (
                    <div className="text-center py-4 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Debt Released</h2>
                        <p className="text-sm text-slate-400 mt-2">Your payment has been processed successfully.</p>

                        <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-4">
                            <div className="flex justify-between items-center">
                                <span className=" text-sm   font-bold text-slate-400">Payment Amount</span>
                                <span className="text-sm font-bold text-red-600">PKR {Number(amount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className=" text-sm   font-bold text-slate-400">New Debt Balance</span>
                                <span className="text-sm font-bold text-slate-800">PKR {(currentDebt - Number(amount)).toLocaleString()}</span>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="mt-10 w-full py-5 bg-slate-900 text-white rounded-full font-bold text-sm active:scale-95 transition-all"
                        >
                            Close
                        </button>
                    </div>
                )}

                {/* Step 3: Error Tab */}
                {step === 3 && (
                    <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Payment Failed</h2>
                        <p className="text-sm text-slate-400 mt-2">We couldn't process your request.</p>

                        <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3 text-left">
                            <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-700 leading-relaxed font-medium">
                                {error?.message || "Unkown error occured"}
                            </p>
                        </div>

                        <div className="mt-10 space-y-3">
                            <button
                                onClick={() => {
                                    setStep(1)
                                    getInfo()
                                }}
                                className="w-full py-5 bg-red-600 text-white rounded-full font-bold text-sm active:scale-95 transition-all"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-4 text-xs font-bold text-slate-400    "
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default DeptFundReleaseModal;