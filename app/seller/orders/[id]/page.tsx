'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SellerLayout } from '@/components/seller/SellerLayout';
import OrderDetailsSheet from '@/components/seller/OrderDetails';
import { Loader, ArrowLeft } from 'lucide-react';
import { secureFetch } from '@/lib/secure-fetch';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setIsLoading(true);
        const [orderRes, walletRes] = await Promise.all([
          secureFetch(`/api/sellers/orders?shipmentId=${orderId}&sellerId=${JSON.parse(localStorage.getItem('user') || '{}').jobId}`),
          secureFetch(`/api/wallets?sellerId=${JSON.parse(localStorage.getItem('user') || '{}').jobId}`),
        ]);

        if (orderRes.ok) {
          const data = await orderRes.json();
          // Find the specific order
          const foundOrder = data.data?.find((o: any) => o.id === orderId);
          if (foundOrder) {
            setOrder(foundOrder);
          } else {
            setError('Order not found');
          }
        } else {
          setError('Failed to fetch order');
        }

        if (walletRes.ok) {
          const walletData = await walletRes.json();
          setWalletBalance(walletData.data?.balance || 0);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        setError('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  if (isLoading) {
    return (
      <SellerLayout currentPage="orders" walletBalance={walletBalance} currency="PKR">
        <div className="flex items-center justify-center min-h-96">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-red-600" />
            <p className="text-slate-600">Loading order details...</p>
          </div>
        </div>
      </SellerLayout>
    );
  }

  if (error || !order) {
    return (
      <SellerLayout currentPage="orders" walletBalance={walletBalance} currency="PKR">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>
          <div className="bg-white rounded-2xl p-10 text-center">
            <p className="text-red-600 font-medium">{error || 'Order not found'}</p>
          </div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout currentPage="orders" walletBalance={walletBalance} currency="PKR">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>
        <OrderDetailsSheet 
          isOpen={true} 
          data={order} 
          onClose={() => router.back()}
        />
      </div>
    </SellerLayout>
  );
}
