"use client";

import React, { useEffect } from 'react';
import { 
  X, User, Phone, Mail, Building2, 
  Clock, ShieldCheck, Star, Link, Calendar 
} from 'lucide-react';

const AssignmentDetailsModal = ({ isOpen, onClose, data }:any) => {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const formatDate = (dateString:any) => {
    if (!dateString) return "Pending";
    return new Date(dateString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="fixed w-screen h-screen overflow-auto inset-0 z-50 flex items-center justify-center md:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Main Modal Container - White & 2xl Rounded */}
      <div className="h-full  bg-white w-full max-w-2xl md:rounded-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header Section */}
        <div className="p-8 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {data.assignmentStatus}
              </span>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                ID: {data.id.slice(-6).toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Assignment Details</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors group"
          >
            <X className="w-5 h-5 text-slate-400 group-hover:text-red-600" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 pt-4 overflow-y-auto space-y-10">
          
          {/* Timeline / Status Grid */}
          <div className="grid grid-cols-2 gap-8 border-b border-slate-50 pb-8">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Assigned At</p>
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-4 h-4 text-red-600" />
                <span className="text-sm">{formatDate(data.assignedAt)}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Shipment Link</p>
              <div className="flex items-center gap-2 text-slate-700">
                <Link className="w-4 h-4 text-red-600" />
                <span className="text-sm font-mono truncate">{data.shipmentId}</span>
              </div>
            </div>
          </div>

          {/* Driver Information Section */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-red-50 p-2 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Driver Information</h3>
            </div>
            
            <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl">
              <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center text-red-600 shadow-sm overflow-hidden">
                {data.driver?.user?.profileImage ? (
                  <img src={data.driver.user.profileImage} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="text-lg font-semibold text-slate-900">{data.driver?.user?.name}</p>
                  <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-[11px] font-bold text-slate-700">{data.driver?.rating}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-red-600" />
                    <span className="text-xs">{data.driver?.user?.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-red-600" />
                    <span className="text-xs">{data.driver?.user?.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Business Information Section */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-red-50 p-2 rounded-lg">
                <Building2 className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Handling Business</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6 px-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Company Name</p>
                <p className="text-sm text-slate-700">{data.business?.companyName}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Business Rating</p>
                <div className="flex items-center gap-1 text-sm text-slate-700 font-bold">
                  {data.business?.rating} / 5 <Star className="w-3 h-3 text-red-600 fill-red-600 ml-1" />
                </div>
              </div>
              <div className="col-span-2 pt-2">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Business ID</p>
                <p className="text-xs text-slate-400 font-mono">{data.businessId}</p>
              </div>
            </div>
          </section>

          {/* Milestones / Timestamps */}
          <section className="bg-slate-50 rounded-2xl p-6">
            <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-4 flex items-center gap-2">
              <Calendar className="w-3 h-3 text-red-600" /> Progression
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-400">Pickup Status</p>
                <p className="text-xs font-medium text-slate-700">{data.pickupCompletedAt ? formatDate(data.pickupCompletedAt) : "Not yet picked up"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Delivery Status</p>
                <p className="text-xs font-medium text-slate-700">{data.deliveryCompletedAt ? formatDate(data.deliveryCompletedAt) : "Not yet delivered"}</p>
              </div>
            </div>
          </section>
        <div className="p-4 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-full text-sm font-semibold text-slate-500 hover:bg-white transition-all active:bg-red-500 active:text-white"
          >
            Close Details
          </button>
          <button 
            className="flex-1 px-6 py-4 bg-red-600 text-white rounded-full text-sm font-semibold hover:bg-red-700 transition-all active:scale-95 shadow-none"
          >
            Track Real-time
          </button>
        </div>
        </div>

        {/* Footer Actions */}
      </div>
    </div>
  );
};

export default AssignmentDetailsModal;