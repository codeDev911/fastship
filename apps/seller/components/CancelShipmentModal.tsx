"use client";

import React, { useState } from 'react';
import {
    X,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Info,
    ChevronRight,
    ShieldAlert,
    InfoIcon
} from 'lucide-react';
import { Button } from '../../../packages/ui/shared/Button';
import { CurrencyDisplay, secureFetch } from '@fastship/lib';

const CancelShipmentModal = ({ isOpen, onClose, data }: any) => {
    const [step, setStep] = useState(1); // 1: Warning/Terms, 2: Success, 3: Error
    const [isAgreed, setIsAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState({ isError: false, message: "" })
    if (!isOpen) return null;

    const handleCancel = async () => {

        try {
            setIsLoading(true);

            let res = await secureFetch(`/api/driver/delivery?shipmentId=${data.id}&status=CANCELED&canceledBy=seller`,{
                method:"PATCH"
            })
            let resdata = await res.json()
            if (res.ok) {
                setStep(2);
            } else {
                setError({ isError: true, message: resdata?.error || "Unkown error" })
                setStep(3);
            }

        } catch (error) {
            setError({ isError: true, message: error?.data?.error || "Server error" })
            setStep(3);
        } finally {
            setIsLoading(false);
        }

        setTimeout(() => {
        }, 1500);
    };

    return (
        <div className="fixed inset-0 w-screen h-screen z-50 flex items-center justify-center md:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-white w-full overflow-y-auto  md:max-w-lg max-sm:h-screen  md:rounded-2xl md:p-10 p-6 shadow-none overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Step 1: Warning & Terms */}
                {step === 1 && (
                    <div className="space-y-8">
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600 shrink-0">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-500 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cancel Shipment?</h2>
                            <p className="text-sm text-slate-400 mt-2 font-medium">
                                You are about to cancel shipment <span className="text-slate-900 font-bold">{data?.id}</span>. This action might incur a cancellation fee.
                            </p>
                        </div>

                        {/* Terms Box */}
                        <div className=" rounded-2xl border  p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-slate-500 ">Cancellation Policy</p>
                                    <ul className="text-sm text-slate-600 space-y-1 list-disc ml-3 leading-relaxed">
                                        <li>Shipping fee refund only if cancelled within Pending or Assigned Phase.</li>
                                        <li>{data?.status === "PENDING" || data?.status === "ASSIGNED" ? `Current status: ${data?.status}. No shipping fees will be deducted.` : `A standard delivery fee  will still apply.`} <strong><CurrencyDisplay showCode={false} amount={data?.actualRateDisplay} currency={data?.currency}/></strong></li>
                                        <li>Once canceled, this order cannot be edited or restored.</li>
                                    </ul>
                                </div>
                            </div>


                            <label className="flex items-center gap-3 cursor-pointer group pt-2 border-t border-slate-200/50">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="peer appearance-none w-5 h-5 rounded-full border-2 border-slate-200 checked:bg-red-600 checked:border-red-600 transition-all cursor-pointer"
                                        checked={isAgreed}
                                        onChange={(e) => setIsAgreed(e.target.checked)}
                                    />
                                    <CheckCircle2 className="absolute w-3 h-3 text-white left-1 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                </div>
                                <span className="text-xs  text-slate-500 group-hover:text-slate-700 transition-colors">
                                    I understand and agree to the cancellation terms.
                                </span>
                            </label>
                        </div>
                        
                            {error.isError && <div className="rounded-xl border border-red-500 p-3">
                                <div className="flex items-center space-x-2">
                                    <InfoIcon className='text-red-500 w-4'/>
                                    <h3 className="text-sm font-bold text-red-500">Error occured!</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">{error?.message}</p>
                            </div>}

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={handleCancel}
                                disabled={!isAgreed || isLoading}
                            >
                                {isLoading ? "Processing..." : "Confirm Cancel Shipment"}
                            </Button>
                            <Button
                                onClick={()=>{
                                    setError({isError:false,message:""})
                                    onClose()
                                }}
                                variant='outline'
                            >
                                Keep Shipment
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Success Tab */}
                {step === 2 && (
                    <div className="text-center py-4 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cancelled Successfully</h2>
                        <p className="text-sm text-slate-400 mt-2 font-medium italic">Shipment {data?.id} has been removed.</p>

                        <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Status</span>
                                <span className="text-[10px] font-black uppercase text-red-600">VOIDED</span>
                            </div>
                        </div>

                        <Button
                            onClick={()=>{
                                  setError({isError:false,message:""})
                                    onClose()
                            }}
                        >
                            Close
                        </Button>
                    </div>
                )}

                {/* Step 3: Error Tab */}
                {step === 3 && (
                    <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Failed to Cancel</h2> 

                        <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3 text-left">
                            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-700 leading-relaxed font-medium">
                                {error?.message || "Shipments in transit cannot be cancelled through the app. Please contact our support team."}
                            </p>
                        </div>

                        <div className="mt-10 space-y-3">
                            <Button
                                onClick={() => {
                                    setError({isError:false,message:""})
                                    setStep(1)
                                }}
                                className='w-full'
                            >
                                Try Again
                            </Button>
                            <Button
                                variant='outline'
                                className='w-full'
                                onClick={()=>{
                                    setError({isError:false,message:""})
                                    onClose()
                                }}
                            >
                                Dismiss
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default CancelShipmentModal;