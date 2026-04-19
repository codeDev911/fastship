"use client";

import  { useEffect, useState } from 'react';
import {
    X,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    Info,
} from 'lucide-react';
import { Button } from '../shared/Button';
import { secureFetch } from '../../lib/secure-fetch';

export const ReleaseCODPaymentModal = ({ isOpen, onClose, shipment }: any) => {
    const [step, setStep] = useState(1); // 1: Form, 2: Success, 3: Error
    const [amount, setAmount] = useState(shipment?.codAmount);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState({ isError: false, message: "" })

    const [wallet, setWallet]: any = useState({}) 
    
    async function getInfo() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const businessId = user?.jobId;

        try {
            // Fetch only business info, seller info comes from shipment
            let res = await secureFetch(`/api/wallets?businessId=${businessId}`)
            const data = await res.json()
            if (res.ok) {
                setWallet(data.data);
                
            } else {
                setError({ isError: true, message: data.error || "Failed to fetch business info" })
                setStep(3)
            }
        } catch (error) {
            setError({ isError: true, message: "Failed to fetch business information" })
            setStep(3)
        }
    }

    const handleReleaseFunds = async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const businessId = user?.jobId;

        if (!amount || Number(amount) <= 0) {
            setError({ isError: true, message: "Please enter a valid amount" })
            return;
        }

        if (Number(amount) > (shipment?.codAmount || 0)) {
            setError({ isError: true, message: "Amount exceeds COD amount" })
            return;
        }

        try {
            setIsLoading(true)
            const uniqueId = new Date().toISOString()
            
            // Step 1: Transfer funds from business to seller
            const res = await secureFetch('/api/transactions/transfer-funds', {
                method: "POST",
                body: JSON.stringify({ 
                    from: "business", 
                    to: "seller", 
                    fromId: businessId,     
                    toId: shipment?.sellerId, 
                    amount: Number(amount), 
                    description: "COD payment released to seller",
                    uniqueId 
                })
            })
            const data = await res.json()

            if (res.ok) {
                // Step 2: Update payment status to COMPLETED
                let r2 = await secureFetch('/api/payments', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paymentId: shipment?.payment?.id,
                        status: 'COMPLETED',
                        paidAt: new Date().toISOString(),
                    }),
                }); 
                
                if (!r2.ok) {
                    // Revert transaction if payment update fails
                    await secureFetch('/api/transactions/transfer-funds', {
                        method: "POST",
                        body: JSON.stringify({ 
                            from: "seller", 
                            to: "business", 
                            toId: businessId, 
                            fromId: shipment?.sellerId, 
                            amount: Number(amount), 
                            description: "COD payment reversal - failed to update payment",
                            uniqueId 
                        })
                    })
                    setStep(3)
                    setError({ isError: true, message: "Error occurred while completing payment. Funds have been reversed." })
                } else {
                    setStep(2)
                }
            } else {
                setError({ isError: true, message: data.error || "Failed to transfer funds" })
                setStep(3)
            }

        } catch (error: any) {
            setError({ isError: true, message: error?.data?.message || "Internal server error" })
            setStep(3)
        }
        finally {
            setIsLoading(false)
        }
    }
    
    useEffect(() => {
        if (isOpen) {
            setStep(1)
            setError({ isError: false, message: "" })
            getInfo()
        }
    }, [isOpen])

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
                                <h2 className="text-2xl font-bold text-slate-800">Release COD Payment</h2>
                                <p className="text-xs text-slate-400 mt-1">Transfer collected COD amount to seller</p>
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Financial Overview Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-sm font-semibold text-slate-400 mb-1">Wallet</p>
                                <p className="text-lg font-bold text-slate-800">Rs. {(wallet?.balance || 0).toLocaleString()}</p>
                                <p className="text-xs mt-2 text-slate-400">Remaining</p>
                                <p className="text-base font-bold text-slate-800">Rs. {(wallet?.balance - Number(amount)).toLocaleString()}</p>
                            </div>
                            <div className="p-5 bg-red-50 rounded-2xl border border-red-100">
                                <p className="text-sm font-semibold text-red-400 mb-1">Releasing Amount</p>
                                <p className="text-lg font-bold text-red-600">Rs. {Number(amount || 0).toLocaleString()}</p>
                                <p className="text-xs mt-2 text-red-400">To seller account</p>
                                <p className="text-xs text-red-400">Shipment: {shipment?.id}</p>
                            </div>
                        </div>

                        {/* Pay to */}
                        <div className="rounded-2xl border px-4 py-3">
                            <h3 className="text-sm text-muted-foreground">Receiving Seller</h3>
                            <h4 className="text-base font-bold flex items-center gap-2 mt-1">
                                {shipment?.seller?.companyName || "Seller"}
                                <span className="text-xs font-normal px-2 py-1 bg-red-100 text-red-600 rounded">Seller shop</span>
                            </h4>
                            <p className="text-sm text-muted-foreground mt-2">{shipment?.seller?.user.name}</p>
                            <p className="text-sm text-muted-foreground">{shipment?.seller?.user?.email}</p>
                            <p className="text-sm text-muted-foreground">{shipment?.seller?.user?.phone}</p>
                        </div>

                        {/* Input Section */}
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400 mb-2">Release Amount</label>
                            <div className="relative mt-1">
                                <input
                                    type="number"
                                    placeholder="Enter amount to release..."
                                    className={inputStyle}
                                    value={shipment?.codAmount}
                                    required
                                    disabled
                                    max={shipment?.codAmount}
                                />
                            </div>
                            <p className="text-xs text-slate-400">Max: Rs. {(shipment?.codAmount || 0).toLocaleString()}</p>
                        </div>

                        {/* Action Button */}
                        <div className="space-y-4">
                            <Button
                                onClick={handleReleaseFunds}
                                disabled={!amount || isLoading}
                                className="w-full py-3 bg-red-600 text-white rounded-full font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isLoading ? "Processing..." : "Confirm Release"}
                            </Button>

                            <div className="flex items-center justify-center gap-2">
                                <ShieldCheck className="w-3 h-3 text-slate-500" />
                                <span className="text-xs text-slate-500">Instant Settlement Guaranteed</span>
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
                        <h2 className="text-2xl font-bold text-slate-800">Payment Released</h2>
                        <p className="text-sm text-slate-400 mt-2">COD payment has been successfully transferred to the seller.</p>

                        <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-400">Released Amount</span>
                                <span className="text-sm font-bold text-red-600">PKR {Number(amount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-400">Shipment ID</span>
                                <span className="text-sm font-bold text-slate-800">{shipment?.id}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-400">Payment Status</span>
                                <span className="text-sm font-bold text-green-600">COMPLETED</span>
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
                        <h2 className="text-2xl font-bold text-slate-800">Release Failed</h2>
                        <p className="text-sm text-slate-400 mt-2">We couldn't process your payment release request.</p>

                        <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3 text-left">
                            <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-700 leading-relaxed font-medium">
                                {error?.message || "Unknown error occurred"}
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
                                className="w-full py-4 text-xs font-bold text-slate-400"
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

