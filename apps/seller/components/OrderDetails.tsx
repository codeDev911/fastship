import React, { useEffect, useState } from 'react';
import {
  X, Package, MapPin, Truck, Building2,
  CreditCard, Clock, ShieldCheck, Scale, Hash, Plus,
  SquareArrowOutUpRight,
  Banknote,
  SkullIcon,
  DollarSign,
  Zap,
  AlertCircle,
} from 'lucide-react';
import AssignmentDetailsModal from './AssignmentDetailsModal';
import { Button } from '../../../packages/ui/shared/Button';
import PaymentReceivedModal from './PaymentRecievedModal';
import CancelShipmentModal from './CancelShipmentModal';
import { ServiceTierBadge, InfoCard } from '@fastship/ui';
import { CurrencyDisplay } from '@fastship/lib';

const FullScreenOrderModal = ({ isOpen, onClose, data, onReportIssue }: any) => {

  const [paymentRecievedModal, setPaymentRecievedModal] = useState({ isOpen: false, data: {} })

  const [assignmentModal, setAssignmentModal] = React.useState({ isOpen: false, data: {} })
  const [cancelationModal,setCancelationModal] = useState({isOpen:false,data:{}})
  // Prevent scrolling when modal is open
  useEffect(() => {
    console.log(data);
    
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';

    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !data) return null;

  return (
    <>
      <div className="fixed inset-0 h-screen w-screen z-50 flex items-center justify-center bg-black/50"></div>
      <div className="fixed md:w-[95%] md:rounded-2xl md:h-[95vh] mx-auto my-auto overflow-y-auto inset-0 z-50 flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-200">

        {/* Header Bar (Matching your Wallet Page) */}
        <div className=" px-8 py-6 flex items-center justify-between ">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Order Details</h1>
            <p className="mt-1 text-sm text-slate-500">ID: {data?.id}</p>
          </div>
          <div className="flex items-center gap-4">
            <a href={`/track?id=${data.id}`} target='_blank'>
            <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-full font-medium transition-all">
              <SquareArrowOutUpRight className="h-4 w-4" />
              Track shipment
            </button>
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Main Content Scrollable Area */}
        <div className="flex-1 p-8 space-y-8">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Quick Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <InfoCard 
                icon={<Package className="h-5 w-5" />}
                label="Weight"
                value={`${data?.weight} kg`}
                subtext={data?.packageType || 'Standard'}
              />
              <InfoCard 
                icon={<MapPin className="h-5 w-5" />}
                label="Distance"
                value={`${data?.distance?.toFixed(0) || 'N/A'} km`}
              />
              <InfoCard 
                icon={<Clock className="h-5 w-5" />}
                label="Status"
                value={data?.status?.replace(/_/g, ' ') || 'PENDING'}
              />
              <InfoCard 
                icon={<CreditCard className="h-5 w-5" />}
                label="Payment"
                value={data?.paymentMethod || 'N/A'}
                subtext={data?.payment?.paymentStatus}
              />
            </div>

            {/* Service Tier Badge */}
            <div className="flex items-center gap-3">
              <p className="text-xs font-medium text-muted-foreground">SERVICE TIER</p>
              <ServiceTierBadge 
                rateCardName={data?.rateCard?.name}
                baseRate={data?.baseRate}
                size="lg"
              />
            </div>

         

            {/* Details Table - Built like your Recent Transactions */}
            <div className="bg-white rounded-2xl overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
                <div className="rounded-lg bg-red-50 p-2">
                  <Hash className="h-4 w-4 text-red-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">System Metadata</h2>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/30">
                      <th className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Field Name</th>
                      <th className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Value</th>
                      <th className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Field Name</th>
                      <th className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Value</th>
                      <th className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Field Name</th>
                      <th className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <tr>
                      <td className="px-8 py-4 text-sm text-slate-500">Actual Rate</td>
                      <td className="px-8 py-4 text-sm font-medium text-slate-700"><CurrencyDisplay currency={data?.seller?.wallet?.currency} amount={data?.actualRate}/></td>
                      <td className="px-8 py-4 text-sm text-slate-500">Expected Rate</td>
                      <td className="px-8 py-4 text-sm font-medium text-slate-700"><CurrencyDisplay currency={data?.seller?.wallet?.currency} amount={data?.expectedRate ||0}/></td>
                      <td className="px-8 py-4 text-sm text-slate-500">Business ID</td>
                      <td className="px-8 py-4 text-sm font-medium text-slate-700">{data?.businessId || "—"}</td>
                    </tr>
                    <tr>
                      <td className="px-8 py-4 text-sm text-slate-500">Created At</td>
                      <td className="px-8 py-4 text-sm font-medium text-slate-700">{new Date(data?.createdAt).toLocaleString()}</td>
                      <td className="px-8 py-4 text-sm text-slate-500">Dimensions</td>
                      <td className="px-8 py-4 text-sm font-medium text-slate-700">{data?.dimensions || "Not specified"}</td>
                      <td className="px-8 py-4 text-sm text-slate-500">Payment Status</td>
                      <td className="px-8 py-4 text-sm font-medium text-slate-700">{data?.payment?.paymentStatus}</td>
                    </tr>
                    <tr>
                      <td className="px-8 py-4 text-sm text-slate-500">Assignment</td>
                      <td className="px-8 py-4 text-sm flex space-x-2 font-medium text-slate-700">{data?.assignment?.id || "—"} <button onClick={() => setAssignmentModal({ isOpen: true, data: data?.assignment })} className='text-red-500 mx-2 hover:underline cursor-pointer'>view</button></td>
                      <td className="px-8 py-4 text-sm text-slate-500">Package Type</td>
                      <td className="px-8 py-4 text-sm font-medium text-slate-700">{data?.packageType || "Standard"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>



            {/* Grid for Pickup & Delivery */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Pickup Information */}
              <div className="bg-white rounded-2xl p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg">
                      <MapPin className="h-5 w-5 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">Pickup Information</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Contact Name</p>
                      <p className="font-medium text-slate-900">{data?.pickupName}</p>
                    </div>
                    <p className="text-sm font-medium text-red-600">{data?.pickupPhone}</p>
                  </div>
                  <div className="p-4 border border-slate-100 rounded-2xl space-y-2">
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Address Detail</p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {data?.pickupAddress}, {data?.pickupCity}, {data?.pickupState} {data?.pickupZipCode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="bg-white rounded-2xl p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg">
                      <Truck className="h-5 w-5 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">Delivery Information</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Recipient Name</p>
                      <p className="font-medium text-slate-900">{data?.deliveryName}</p>
                    </div>
                    <p className="text-sm font-medium text-red-600">{data?.deliveryPhone}</p>
                  </div>
                  <div className="p-4 border border-slate-100 rounded-2xl space-y-2">
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Shipping Address</p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {data?.deliveryAddress}, {data?.deliveryCity}, {data?.deliveryState} {data?.deliveryZipCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payments Section - Improved */}
            <div className="bg-white rounded-2xl p-8 border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-50 p-2 rounded-lg">
                  <Banknote className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Payment Status</h3>
              </div>

              {/* Payment Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <InfoCard 
                  icon={<DollarSign className="h-5 w-5" />}
                  label="Amount"
                  value={data?.payment?.amount ? <CurrencyDisplay currency={data?.seller?.wallet?.currency} amount={data?.payment?.amount} /> : 'N/A'}
                />
                <InfoCard 
                  icon={<CreditCard className="h-5 w-5" />}
                  label="Method"
                  value={data?.payment?.paymentMethod || 'N/A'}
                />
                <InfoCard 
                  icon={<Clock className="h-5 w-5" />}
                  label="Status"
                  value={data?.payment?.paymentStatus || 'PENDING'}
                  variant={data?.payment?.paymentStatus === 'COMPLETED' ? 'success' : 'warning'}
                />
              </div>

              {/* Payment Status Workflow */}
              {data?.payment?.paymentMethod === "COD" && data?.payment?.paymentStatus === "PENDING" ? (
                <div className='p-4 rounded-xl bg-yellow-50 border-2 border-yellow-200'>
                  <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-900">Payment Pending</p>
                      <p className="text-sm text-yellow-800 mt-1">Confirm payment received to avoid disputes</p>
                      <Button onClick={() => setPaymentRecievedModal({ isOpen: true, data: data })} className='mt-3'>
                        ✓ Confirm Payment Received
                      </Button>
                    </div>
                  </div>
                </div>
              ) : data?.payment?.paymentMethod === "COD" && data?.payment?.paymentStatus === "COMPLETED" ? (
                <div className='p-4 rounded-xl bg-green-50 border-2 border-green-200'>
                  <p className="font-semibold text-green-900">✓ Payment Received</p>
                  <p className="text-sm text-green-700 mt-2">
                    <CurrencyDisplay currency={data?.seller?.wallet?.currency} amount={data?.payment?.amount} /> was collected on {new Date(data?.payment?.paidAt).toLocaleDateString()}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-50 p-2 rounded-lg">
                  <Building2 className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Business (Handler)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <p className="text-xs text-slate-400 mb-1 font-medium">Company Name</p>
                  <p className="font-semibold text-slate-900">{data?.business?.companyName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1 font-medium">Business Type</p>
                  <p className="text-slate-700">{data?.business?.businessType}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1 font-medium">Tax ID</p>
                  <p className="text-slate-700 font-mono text-sm tracking-tighter">{data?.business?.taxId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1 font-medium">Verification Status</p>
                  <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase ${data?.business?.isVerified ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {data?.seller?.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
            {!["CANCELLED","FAILED","DELIVERED","RETURNED"].includes(data.status) && <div className="bg-white rounded-2xl p-8 border-2 border-red-400">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-50 p-2 rounded-lg">
                  <SkullIcon className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground font-bold">Cancel this shipment?</p>
                </div>
              </div>
              <div>
                <p className="text-sm">If you cancel this shipment, the courier will be notified to stop delivery. Please be advised that the Escrow-locked delivery fee of <strong><CurrencyDisplay currency={data?.seller?.wallet?.currency} showCode={false} amount={data?.actualRate}/></strong> may apply.</p>
                <br />
                <Button onClick={()=>setCancelationModal({isOpen:true,data:data})}>Cancel Shipment</Button>
              </div>
            </div>}

          </div>
        </div>

        {/* Persistent Action Bar at bottom */}
        <div className="p-6 flex justify-center gap-4">
          {onReportIssue && (
            <button 
              onClick={onReportIssue} 
              className="px-10 py-3 rounded-full text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              Report Issue
            </button>
          )}
          <button onClick={onClose} className="px-10 py-3 rounded-full text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors">
            Close Window
          </button>
        </div>
      </div>
      <PaymentReceivedModal onClose={() => setPaymentRecievedModal({ isOpen: false, data: {} })} isOpen={paymentRecievedModal.isOpen} data={paymentRecievedModal.data} />
      <AssignmentDetailsModal isOpen={assignmentModal.isOpen} onClose={() => setAssignmentModal({ isOpen: false, data: {} })} data={assignmentModal.data} />
      <CancelShipmentModal isOpen={cancelationModal.isOpen} onClose={() => {setCancelationModal({isOpen:false,data:{}}) }} data={cancelationModal.data} />
    </>

  );
};

export default FullScreenOrderModal;