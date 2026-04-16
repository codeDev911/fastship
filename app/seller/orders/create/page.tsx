"use client";

import { SellerLayout } from '@/components/seller/SellerLayout';
import React, { useState, useEffect } from 'react';
import { secureFetch } from '@/lib/secure-fetch';
import { Loader } from 'lucide-react';

interface City {
  name: string;
  latitude?: number;
  longitude?: number;
}

const CreateOrderForm = () => {
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState<string[]>([]);
  const [pickupCities, setPickupCities] = useState<City[]>([]);
  const [deliveryCities, setDeliveryCities] = useState<City[]>([]);
  const [loadingPickupCities, setLoadingPickupCities] = useState(false);
  const [loadingDeliveryCities, setLoadingDeliveryCities] = useState(false);

  const [formData, setFormData] = useState({
    pickupName: "", pickupPhone: "", pickupAddress: "", pickupCity: "", pickupState: "", pickupZipCode: "",
    deliveryName: "", deliveryPhone: "", deliveryAddress: "", deliveryCity: "", deliveryState: "", deliveryZipCode: "",
    weight: "", dimensions: "", packageType: "", description: "",
    paymentMethod: "PREPAID", codAmount: 0, expectedRate: "", actualRate: "",
    status: "PENDING", priority: "STANDARD", notes: ""
  });

  // Fetch states on mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch('/api/locations/states');
        const data = await response.json();
        if (data.states) {
          setStates(data.states);
          // Set default states
          if (data.states.length > 0) {
            setFormData(prev => ({ ...prev, pickupState: data.states[0] }));
          }
        }
      } catch (error) {
        console.error('Error fetching states:', error);
      }
    };
    fetchStates();
  }, []);

  // Fetch pickup cities when pickup state changes
  useEffect(() => {
    if (!formData.pickupState) return;
    
    const fetchCities = async () => {
      setLoadingPickupCities(true);
      try {
        const response = await fetch(
          `/api/locations/cities?state=${encodeURIComponent(formData.pickupState)}`
        );
        const data = await response.json();
        setPickupCities(data.cities || []);
        // Set first city as default
        if (data.cities && data.cities.length > 0) {
          setFormData(prev => ({ ...prev, pickupCity: data.cities[0].name }));
        }
      } catch (error) {
        console.error('Error fetching pickup cities:', error);
        setPickupCities([]);
      } finally {
        setLoadingPickupCities(false);
      }
    };
    fetchCities();
  }, [formData.pickupState]);

  // Fetch delivery cities when delivery state changes
  useEffect(() => {
    if (!formData.deliveryState) return;
    
    const fetchCities = async () => {
      setLoadingDeliveryCities(true);
      try {
        const response = await fetch(
          `/api/locations/cities?state=${encodeURIComponent(formData.deliveryState)}`
        );
        const data = await response.json();
        setDeliveryCities(data.cities || []);
        // Set first city as default
        if (data.cities && data.cities.length > 0) {
          setFormData(prev => ({ ...prev, deliveryCity: data.cities[0].name }));
        }
      } catch (error) {
        console.error('Error fetching delivery cities:', error);
        setDeliveryCities([]);
      } finally {
        setLoadingDeliveryCities(false);
      }
    };
    fetchCities();
  }, [formData.deliveryState]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    // if the input is number type, we should convert the value to number before setting it in state
    if (name === "weight" || name === "codAmount" || name === "expectedRate" || name === "actualRate") {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const sellerId = user?.jobId;
    try {
      const response = await secureFetch('/api/sellers/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          { sellerId, ...formData }
        ),
      });
      if (response.ok) {
        alert("Shipment Registered. Distance calculated and saved with shipment.");
        // Reset form
        setFormData({
          pickupName: "", pickupPhone: "", pickupAddress: "", pickupCity: "", pickupState: states[0] || "", pickupZipCode: "",
          deliveryName: "", deliveryPhone: "", deliveryAddress: "", deliveryCity: "", deliveryState: "", deliveryZipCode: "",
          weight: "", dimensions: "", packageType: "", description: "",
          paymentMethod: "PREPAID", codAmount: 0, expectedRate: "", actualRate: "",
          status: "PENDING", priority: "STANDARD", notes: ""
        });
      }
    } catch (err) {
      console.error(err);
      alert('Error creating shipment');
    } finally {
      setLoading(false);
    }
  };

  // The specific input style you requested
  const inputStyle = "w-full bg-white rounded-full border border-slate-300 px-6 py-3 text-sm text-slate-700 outline-none focus:border-red-500 active:bg-red-500 active:text-white transition-all placeholder:text-slate-500";
  const selectStyle = "w-full bg-white rounded-full border border-slate-300 px-6 py-3 text-sm text-slate-700 outline-none focus:border-red-500 transition-all cursor-pointer";

  return (
    <SellerLayout currentPage="orders" walletBalance={0} currency="PKR">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-8 ml-2">
          <h1 className="text-2xl text-slate-800 font-semibold">New Order</h1>
          <p className="text-sm text-slate-500">Fill in the details to create a new delivery order. Distance will be calculated automatically.</p>
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
                    <label className="block text-xs text-slate-400 mb-2 ml-4">State</label>
                    <select name="pickupState" value={formData.pickupState} onChange={handleChange} className={selectStyle}>
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 ml-4">City</label>
                    <select name="pickupCity" value={formData.pickupCity} onChange={handleChange} disabled={loadingPickupCities} className={selectStyle}>
                      <option value="">
                        {loadingPickupCities ? 'Loading...' : 'Select City'}
                      </option>
                      {pickupCities.map((city) => (
                        <option key={city.name} value={city.name}>{city.name}</option>
                      ))}
                    </select>
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
                  <input type="text" name="deliveryAddress" value={formData.deliveryAddress} onChange={handleChange} placeholder="Street address" className={inputStyle} />
                </div>
                <div className="grid grid-cols-2 gap-4 lg:col-span-1">
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 ml-4">State</label>
                    <select name="deliveryState" value={formData.deliveryState} onChange={handleChange} className={selectStyle}>
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 ml-4">City</label>
                    <select name="deliveryCity" value={formData.deliveryCity} onChange={handleChange} disabled={loadingDeliveryCities} className={selectStyle}>
                      <option value="">
                        {loadingDeliveryCities ? 'Loading...' : 'Select City'}
                      </option>
                      {deliveryCities.map((city) => (
                        <option key={city.name} value={city.name}>{city.name}</option>
                      ))}
                    </select>
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
                  <input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleChange} placeholder="2" className={inputStyle} required />
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
                  <select name="priority" value={formData.priority} onChange={handleChange} className={selectStyle}>
                    <option value="STANDARD">Standard</option>
                    <option value="EXPRESS">Express</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-2 ml-4">Payment Method</label>
                  <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className={selectStyle}>
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
                className="bg-red-600 hover:bg-red-700 text-white px-12 py-4 rounded-full text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
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