"use client";

import { SellerLayout } from '@/components/seller/SellerLayout';
import React, { useState } from 'react';

const CreateOrderForm = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pickupName: "", pickupPhone: "", pickupAddress: "", pickupCity: "", pickupState: "", pickupZipCode: "",
    deliveryName: "", deliveryPhone: "", deliveryAddress: "", deliveryCity: "", deliveryState: "", deliveryZipCode: "",
    weight: "", dimensions: "", packageType: "", description: "",
    paymentMethod: "PREPAID", codAmount: 0, expectedRate: "", actualRate: "",
    status: "PENDING", priority: "STANDARD", notes: ""
  });

  const handleChange = (e:any) => {
    const { name, value } = e.target;
    // if the input is number type, we should convert the value to number before setting it in state
    if (name === "weight" || name === "codAmount" || name === "expectedRate" || name === "actualRate") {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    setLoading(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const sellerId = user?.jobId;
    try {
      const response = await fetch('/api/sellers/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          { sellerId, ...formData }
        ),
      });
      if (response.ok) {
        alert("Shipment Registered.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // The specific input style you requested
  const inputStyle = "w-full bg-white rounded-full border border-slate-300 px-6 py-3 text-sm text-slate-700 outline-none focus:border-red-500 active:bg-red-500 active:text-white transition-all placeholder:text-slate-500";

  return (
    <SellerLayout currentPage="orders" walletBalance={0} currency="PKR">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-8 ml-2">
          <h1 className="text-2xl text-slate-800 font-semibold">New Order</h1>
          <p className="text-sm text-slate-500">Fill in the details to create a new delivery order</p>
        </header>

        {/* Main White 2xl Rounded Div */}
        <div className="bg-white rounded-2xl p-10 shadow-none border-none">
          <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* Pickup Section */}
            <section>
              <h2 className="text-xs uppercase tracking-widest text-red-600 font-bold mb-6">1. Pickup Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs text-slate-400 mb-2 ml-4">Pickup Name</label>
                  <input type="text" name="pickupName" value={formData.pickupName} onChange={handleChange} placeholder="John Doe" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 ml-4">Pickup Phone</label>
                  <input type="text" name="pickupPhone" value={formData.pickupPhone} onChange={handleChange} placeholder="+92..." className={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 ml-4">Zip Code</label>
                  <input type="text" name="pickupZipCode" value={formData.pickupZipCode} onChange={handleChange} placeholder="26340" className={inputStyle} />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs text-slate-400 mb-2 ml-4">Address</label>
                  <input type="text" name="pickupAddress" value={formData.pickupAddress} onChange={handleChange} placeholder="Street address, building, apartment" className={inputStyle} />
                </div>
                <div className="grid grid-cols-2 gap-4 lg:col-span-1">
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 ml-4">City</label>
                    <input type="text" name="pickupCity" value={formData.pickupCity} onChange={handleChange} placeholder="Peshawar" className={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 ml-4">State</label>
                    <input type="text" name="pickupState" value={formData.pickupState} onChange={handleChange} placeholder="KPK" className={inputStyle} />
                  </div>
                </div>
              </div>
            </section>

            {/* Delivery Section */}
            <section>
              <h2 className="text-xs uppercase tracking-widest text-red-600 font-bold mb-6">2. Delivery Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs text-slate-400 mb-2 ml-4">Recipient Name</label>
                  <input type="text" name="deliveryName" value={formData.deliveryName} onChange={handleChange} placeholder="Afnan Haad" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 ml-4">Recipient Phone</label>
                  <input type="text" name="deliveryPhone" value={formData.deliveryPhone} onChange={handleChange} placeholder="0305..." className={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 ml-4">Zip Code</label>
                  <input type="text" name="deliveryZipCode" value={formData.deliveryZipCode} onChange={handleChange} placeholder="26340" className={inputStyle} />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs text-slate-400 mb-2 ml-4">Full Address</label>
                  <input type="text" name="deliveryAddress" value={formData.deliveryAddress} onChange={handleChange} placeholder="Hangu, Peshawar" className={inputStyle} />
                </div>
                <div className="grid grid-cols-2 gap-4 lg:col-span-1">
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 ml-4">City</label>
                    <input type="text" name="deliveryCity" value={formData.deliveryCity} onChange={handleChange} placeholder="Peshawar" className={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 ml-4">State</label>
                    <input type="text" name="deliveryState" value={formData.deliveryState} onChange={handleChange} placeholder="KPK" className={inputStyle} />
                  </div>
                </div>
              </div>
            </section>

            {/* Shipment & Logistics */}
            <section>
              <h2 className="text-xs uppercase tracking-widest text-red-600 font-bold mb-6">3. Parcel & Payment</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs text-slate-400 mb-2 ml-4">Weight (KG)</label>
                  <input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleChange} placeholder="2" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 ml-4">Dimensions</label>
                  <input type="text" name="dimensions" value={formData.dimensions} onChange={handleChange} placeholder="10x10x10" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 ml-4">Package Type</label>
                  <input type="text" name="packageType" value={formData.packageType} onChange={handleChange} placeholder="Box, Flyer, etc." className={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 ml-4">Priority</label>
                  <select name="priority" value={formData.priority} onChange={handleChange} className={inputStyle}>
                    <option value="STANDARD">Standard</option>
                    <option value="EXPRESS">Express</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-2 ml-4">Payment Method</label>
                  <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className={inputStyle}>
                    <option value="PREPAID">Prepaid</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 ml-4">COD Amount</label>
                  <input type="number" name="codAmount" value={formData.codAmount} onChange={handleChange} placeholder="0.00" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 ml-4">Expected Rate</label>
                  <input type="number" name="expectedRate" value={formData.expectedRate} onChange={handleChange} placeholder="Rate" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 ml-4">Actual Rate</label>
                  <input type="number" name="actualRate" value={formData.actualRate} onChange={handleChange} placeholder="Actual" className={inputStyle} />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-xs text-slate-400 mb-2 ml-4">Description</label>
                  <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Item details..." className={inputStyle} />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs text-slate-400 mb-2 ml-4">Additional Notes</label>
                  <input type="text" name="notes" value={formData.notes} onChange={handleChange} placeholder="Handle with care..." className={inputStyle} />
                </div>
              </div>
            </section>

            <div className="pt-6 border-t border-slate-50 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white px-12 py-4 rounded-full text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Shipment'}
              </button>
            </div>

          </form>
        </div>
      </div>
      </SellerLayout>
  );
};

export default CreateOrderForm;