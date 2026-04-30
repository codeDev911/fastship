"use client";

import { SellerLayout } from '../../../../components/SellerLayout';
import React, { useState, useEffect } from 'react';
import { secureFetch } from '@fastship/lib';
import { Loader, MapPin, AlertCircle, ArrowLeft } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import InCityLocationPicker from '../../../../components/InCityLocationPicker';

interface City {
  name: string;
  latitude?: number;
  longitude?: number;
}

interface Location {
  name: string;
  latitude: number;
  longitude: number;
    state: string;
    city: string;
    zipCode: any 
  address: any;
}

const CreateOrderForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isEdit = searchParams.get('isEdit') === 'true';
  const shipmentId = searchParams.get('shipmentId');
  
  const [loading, setLoading] = useState(false);
  const [fetchingShipment, setFetchingShipment] = useState(isEdit);
  const [states, setStates] = useState<string[]>([]);
  const [pickupCities, setPickupCities] = useState<City[]>([]);
  const [deliveryCities, setDeliveryCities] = useState<City[]>([]);
  const [loadingPickupCities, setLoadingPickupCities] = useState(false);
  const [loadingDeliveryCities, setLoadingDeliveryCities] = useState(false);
  const [shipmentStatus, setShipmentStatus] = useState<string | null>(null);
  
  // In-city delivery state
  const [isInCityDelivery, setIsInCityDelivery] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [inCityDistance, setInCityDistance] = useState<number | null>(null);
  const [inCityPickupLocation, setInCityPickupLocation] = useState<Location | null>(null);
  const [inCityDeliveryLocation, setInCityDeliveryLocation] = useState<Location | null>(null);

  // Warehouse location state
  const [warehouseLocation, setWarehouseLocation] = useState<any>(null);

  const [formData, setFormData] = useState({
    pickupName: "", pickupPhone: "", pickupAddress: "", pickupCity: "", pickupState: "", pickupZipCode: "",
    deliveryName: "", deliveryPhone: "", deliveryAddress: "", deliveryCity: "", deliveryState: "", deliveryZipCode: "",
    weight: "", dimensions: "", packageType: "", description: "",
    paymentMethod: "PREPAID", codAmount: 0, 
    status: "PENDING", priority: "STANDARD", notes: ""
  });

  // Fetch states on mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await secureFetch('/api/locations/states');
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

  // Fetch seller's warehouse location on mount
  useEffect(() => {
    const fetchWarehouse = async () => {
      try {

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const sellerId = user?.jobId;
        
        if (!sellerId) return;

                // Now fetch warehouse data using the new endpoint
        const warehouseResponse = await secureFetch(`/api/sellers/${sellerId}/warehouse`);
        if (warehouseResponse.ok) {
          const warehouseData = await warehouseResponse.json();
          const warehouseInfo = warehouseData.seller;
          
          if (warehouseInfo?.warehouseAddress) {
            setWarehouseLocation({
              name: warehouseInfo.warehouseName,
              address: warehouseInfo.warehouseAddress,
              state: warehouseInfo.warehouseState,
              city: warehouseInfo.warehouseCity,
              zipCode: warehouseInfo.warehouseZipCode,
              latitude: warehouseInfo.warehouseLatitude,
              longitude: warehouseInfo.warehouseLongitude,
              phone:warehouseInfo.warehousePhone
            });

            setFormData(prev => {
              if (!prev.pickupAddress) {
                return {
                  ...prev,
                  pickupName: warehouseInfo.warehouseName || '',
                  pickupAddress: warehouseInfo.warehouseAddress || '',
                  pickupState: warehouseInfo.warehouseState || '',
                  pickupCity: warehouseInfo.warehouseCity || '',
                  pickupZipCode: warehouseInfo.warehouseZipCode || '',
                  pickupPhone:warehouseInfo.warehousePhone || ''
                };
              }
              return prev;
            });

             
          }
        }
      } catch (error) {
        console.error('Error fetching warehouse:', error);
      }
    };
    fetchWarehouse();
  }, []);

  // Fetch shipment data if in edit mode
  useEffect(() => {
    if (!isEdit || !shipmentId) return;

    const fetchShipment = async () => {
      setFetchingShipment(true);
      try {
        const response = await secureFetch(`/api/sellers/orders/${shipmentId}`, {
          method: 'GET',
        });

        if (response.ok) {
          const shipment = await response.json();
          
          // Check if shipment can be edited
          if (shipment.status !== 'PENDING' && shipment.status !== 'ASSIGNED') {
            alert(`Cannot edit shipment in ${shipment.status} status. Only PENDING and ASSIGNED orders can be edited.`);
            router.back();
            return;
          }
          
          
          setShipmentStatus(shipment.status);
          
          // Populate form data
          setFormData({
            pickupName: shipment.pickupName || "",
            pickupPhone: shipment.pickupPhone || "",
            pickupAddress: shipment.pickupAddress || "",
            pickupCity: shipment.pickupCity || "",
            pickupState: shipment.pickupState || "",
            pickupZipCode: shipment.pickupZipCode || "",
            deliveryName: shipment.deliveryName || "",
            deliveryPhone: shipment.deliveryPhone || "",
            deliveryAddress: shipment.deliveryAddress || "",
            deliveryCity: shipment.deliveryCity || "",
            deliveryState: shipment.deliveryState || "",
            deliveryZipCode: shipment.deliveryZipCode || "",
            weight: shipment.weight?.toString() || "",
            dimensions: shipment.dimensions || "",
            packageType: shipment.packageType || "",
            description: shipment.description || "",
            paymentMethod: shipment.paymentMethod || "PREPAID",
            codAmount: shipment.codAmount || 0,
            status: shipment.status || "PENDING",
            priority: shipment.priority || "STANDARD",
            notes: shipment.notes || ""
          });
          setDeliveryCities([shipment.deliveryCity]);

          // Populate in-city delivery data
          setIsInCityDelivery(shipment.isInCityDelivery || false);
          if (shipment.isInCityDelivery) {
            setInCityDistance(shipment.distance || null);
            setInCityPickupLocation({
              name: shipment.pickupName,
              latitude: shipment.pickupLatitude,
              longitude: shipment.pickupLongitude,
               address: shipment.pickupAddress,
              city:shipment.pickupCity,
              state:shipment.pickupState,
              zipCode:shipment.deliveryZipCOde,
              
            });
            setInCityDeliveryLocation({
              name: shipment.deliveryName,
              latitude: shipment.deliveryLatitude,
              longitude: shipment.deliveryLongitude,
               address: shipment.pickupAddress,
              city:shipment.pickupCity,
              state:shipment.pickupState,
              zipCode:shipment.deliveryZipCOde,
            });
          }
        } else {
          const errorData = await response.json();
          alert(errorData.message || 'Error fetching shipment');
          router.back();
        }
      } catch (error) {
        console.error('Error fetching shipment:', error);
        alert('Error fetching shipment');
        router.back();
      } finally {
        setFetchingShipment(false);
      }
    };

    fetchShipment();
  }, [isEdit, shipmentId, router]);

  // Fetch pickup cities when pickup state changes
  useEffect(() => {
    if (!formData.pickupState) return;
    
    const fetchCities = async () => {
      setLoadingPickupCities(true);
      try {
        const response = await secureFetch(
          `/api/locations/cities?state=${encodeURIComponent(formData.pickupState)}`
        );
        const data = await response.json();
        setPickupCities(data.cities || []);
        // Set first city as default
        if (data.cities && data.cities.length > 0) {
          setFormData(prev => ({ ...prev, pickupCity: formData.pickupCity || data.cities[0].name }));
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
        const response = await secureFetch(
          `/api/locations/cities?state=${encodeURIComponent(formData.deliveryState)}`
        );
        const data = await response.json();
        setDeliveryCities(data.cities || []);
        // Set first city as default
        if (data.cities && data.cities.length > 0) {
          setFormData(prev => ({ ...prev, deliveryCity: formData.deliveryCity|| data.cities[0].name }));
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
    if (name === "weight" || name === "codAmount" ) {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleInCityToggle = (e: any) => {
    const checked = e.target.checked;
    setIsInCityDelivery(checked);
    
    if (checked) {
      // When enabling in-city, set delivery state to pickup state
      setFormData(prev => ({ 
        ...prev, 
        deliveryState: prev.pickupState 
      }));
      // Reset location picker data
      setInCityDistance(null);
      setInCityPickupLocation(null);
      setInCityDeliveryLocation(null);
    } else {
      // When disabling, reset in-city data
      setInCityDistance(null);
      setInCityPickupLocation(null);
      setInCityDeliveryLocation(null);
      setShowLocationPicker(false);
    }
  };

  const handleOpenLocationPicker = () => {
    if (formData.pickupCity && formData.pickupCity === formData.deliveryCity) {
      setShowLocationPicker(true);
    } else {
      alert('Please select the same city for both pickup and delivery');
    }
  };

  const handleLocationsSelected = (
    pickup: Location,
    delivery: Location,
    distance: number
  ) => {
    setInCityPickupLocation(pickup);
    setInCityDeliveryLocation(delivery);
    setInCityDistance(distance);
    setShowLocationPicker(false);
    
    // Update form data with in-city location details
    setFormData(prev => ({
      ...prev,
      pickupName: pickup.name,
      pickupAddress: pickup?.address,
      pickupCity: pickup?.city,
      pickupState: pickup?.state,
      pickupZipCode: pickup?.zipCode,
      deliveryName: delivery.name,
      deliveryAddress: delivery?.address,
      deliveryCity: delivery?.city,
      deliveryState: delivery?.state,
      deliveryZipCode: delivery?.zipCode,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const sellerId = user?.jobId;
    
    try {
      const submitData: any = { sellerId, ...formData };
      
      // Add in-city delivery data if enabled
      if (isInCityDelivery && inCityPickupLocation && inCityDeliveryLocation && inCityDistance) {
        submitData.isInCityDelivery = true;
        submitData.pickupLatitude = inCityPickupLocation.latitude;
        submitData.pickupLongitude = inCityPickupLocation.longitude;
        submitData.deliveryLatitude = inCityDeliveryLocation.latitude;
        submitData.deliveryLongitude = inCityDeliveryLocation.longitude;
        submitData.inCityDistance = inCityDistance
      }
      
      const endpoint = isEdit && shipmentId 
        ? `/api/sellers/orders/${shipmentId}`
        : '/api/sellers/orders/create';
      const method = isEdit ? 'PATCH' : 'POST';
      
      const response = await secureFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      
      if (response.ok) {
        const responseData = await response.json();
        const message = isEdit 
          ? "Shipment updated successfully."
          : "Shipment Registered. Distance calculated and saved with shipment.";
        alert(message);
        
        // Reset form and redirect
        if (isEdit) {
          router.push('/orders');
        } else {
          setFormData({
            pickupName: "", pickupPhone: "", pickupAddress: "", pickupCity: "", pickupState: states[0] || "", pickupZipCode: "",
            deliveryName: "", deliveryPhone: "", deliveryAddress: "", deliveryCity: "", deliveryState: "", deliveryZipCode: "",
            weight: "", dimensions: "", packageType: "", description: "",
            paymentMethod: "PREPAID", codAmount: 0, expectedRate: "", actualRate: "",
            status: "PENDING", priority: "STANDARD", notes: ""
          });
          setIsInCityDelivery(false);
          setInCityDistance(null);
          setInCityPickupLocation(null);
          setInCityDeliveryLocation(null);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error processing shipment');
      }
    } catch (err) {
      console.error(err);
      alert('Error processing shipment');
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
        
        {/* Back Button for Edit Mode */}
        {isEdit && (
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>
        )}

        <header className="mb-8 ml-2">
          <h1 className="text-2xl text-slate-800 font-semibold">
            {isEdit ? `Edit Order (${shipmentStatus})` : 'New Order'}
          </h1>
          <p className="text-sm text-slate-500">
            {isEdit 
              ? 'Update the details of your delivery order. Distance will be recalculated automatically.'
              : 'Fill in the details to create a new delivery order. Distance will be calculated automatically.'}
          </p>
        </header>

        {/* Loading State */}
        {fetchingShipment && (
          <div className="bg-white rounded-2xl p-10 shadow-none border-none flex items-center justify-center min-h-96">
            <div className="flex flex-col items-center gap-4">
              <Loader className="w-8 h-8 animate-spin text-red-600" />
              <p className="text-slate-600">Loading shipment details...</p>
            </div>
          </div>
        )}

        {/* Main White 2xl Rounded Div */}
        {!fetchingShipment && (
        <div className="bg-white rounded-2xl p-10 shadow-none border-none">
          <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* Delivery Type Toggle */}
            <section className="border-b border-slate-200 pb-8">
              <h2 className="text-xs uppercase tracking-widest text-red-600 font-bold mb-6">Delivery Type</h2>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isInCityDelivery} 
                    onChange={handleInCityToggle}
                    className="w-5 h-5 rounded border-slate-300 text-red-600 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-slate-700">In-City Delivery</span>
                  <span className="text-xs text-slate-500">(Pickup and delivery in the same city)</span>
                </label>
              </div>
            </section>
            
            {/* Pickup Section */}
            <section>
              <h2 className="text-xs uppercase tracking-widest text-red-600 font-bold mb-6">1. Pickup Information</h2>
              
              {/* Warehouse Location Helper */}
              {warehouseLocation && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-blue-900 uppercase tracking-widest mb-2">Your Warehouse</p>
                      <p className="text-sm font-medium text-blue-900">{warehouseLocation.name}</p>
                      <p className="text-sm text-blue-800">{warehouseLocation.address}</p>
                      <p className="text-xs text-blue-700">{warehouseLocation.city}, {warehouseLocation.state} {warehouseLocation.zipCode}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          pickupName: warehouseLocation.name || '',
                          pickupAddress: warehouseLocation.address,
                          pickupCity: warehouseLocation.city,
                          pickupPhone:warehouseLocation.phone||'',
                          pickupState: warehouseLocation.state,
                          pickupZipCode: warehouseLocation.zipCode,
                        }));
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Use as Pickup
                    </button>
                  </div>
                </div>
              )}

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
                      {pickupCities.map((city,ind) => (
                        <option key={ind} value={city.name}>{city.name}</option>
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
                      { deliveryCities.map((city,ind) => (
                        <option key={ind} value={city.name}>{city.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* In-City Location Picker Button */}
              {isInCityDelivery && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleOpenLocationPicker}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-50 border border-blue-300 text-blue-700 rounded-full hover:bg-blue-100 transition-all font-medium text-sm"
                  >
                    <MapPin className="w-4 h-4" />
                    {inCityDistance ? `Edit Locations (${inCityDistance.toFixed(2)} km)` : 'Select Exact Locations on Map'}
                  </button>
                </div>
              )}
              
              {/* In-City Distance Display */}
              {isInCityDelivery && inCityDistance && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-green-900 font-medium">In-City Distance Calculated</p>
                    <p className="text-lg font-bold text-green-600">{inCityDistance.toFixed(2)} km</p>
                  </div>
                </div>
              )}
              
              {/* In-City Pickup Location Display */}
              {isInCityDelivery && inCityPickupLocation && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-2">Pickup: {inCityPickupLocation.name}</p>
                  <p className="text-sm text-slate-700">{inCityPickupLocation.address}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {inCityPickupLocation.latitude.toFixed(4)}, {inCityPickupLocation.longitude.toFixed(4)}
                  </p>
                </div>
              )}
              
              {/* In-City Delivery Location Display */}
              {isInCityDelivery && inCityDeliveryLocation && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-2">Delivery: {inCityDeliveryLocation.name}</p>
                  <p className="text-sm text-slate-700">{inCityDeliveryLocation.address}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {inCityDeliveryLocation.latitude.toFixed(4)}, {inCityDeliveryLocation.longitude.toFixed(4)}
                  </p>
                </div>
              )}
              
              {/* Warning for in-city delivery */}
              {isInCityDelivery && !inCityDistance && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">Please select exact pickup and delivery locations to calculate the distance.</p>
                </div>
              )}
            </section>

            {/* Shipment & Logistics */}
            <section>
              <h2 className="text-xs uppercase tracking-widest text-red-600 font-bold mb-6">3. Parcel & Payment</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs text-slate-400 mb-2 ml-4">Weight (KG)</label>
                  <input type="number"  name="weight" value={formData.weight} onChange={handleChange} placeholder="2" className={inputStyle} required />
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

            <div className="pt-6 border-t border-slate-50 flex justify-end gap-4">
              {isEdit && (
                <button 
                  type="button"
                  onClick={() => router.back()}
                  className="px-12 py-4 rounded-full text-sm font-semibold transition-all border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
              <button 
                type="submit" 
                disabled={loading || (isInCityDelivery && !inCityDistance)}
                className="bg-red-600 hover:bg-red-700 text-white px-12 py-4 rounded-full text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Shipment' : 'Create Shipment')}
              </button>
            </div>

          </form>
        </div>
        )}
      </div>
      
      {/* In-City Location Picker Modal */}
      {showLocationPicker && (
        <InCityLocationPicker
          city={formData.pickupCity}
          state={formData.pickupState}
          onLocationsSelected={handleLocationsSelected}
          onCancel={() => setShowLocationPicker(false)}
          initialPickupLocation={inCityPickupLocation}
          initialDeliveryLocation={inCityDeliveryLocation}
          initialDistance={inCityDistance}
        />
      )}
      </SellerLayout>
  );
};

export default CreateOrderForm;