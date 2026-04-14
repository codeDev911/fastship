'use client';

import React, { useState, useEffect } from 'react';
import { SellerLayout } from '@/components/seller/SellerLayout';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Star, TrendingUp } from 'lucide-react';
import { secureFetch } from '@/lib/secure-fetch';

export default function BiddingMarketplacePage() {
  const [sellerId] = useState<string>('seller-1');
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [businessRes, walletRes] = await Promise.all([
          fetch('/api/bids/business-rates'),
          fetch(`/api/wallets?sellerId=${sellerId}`),
        ]);

        if (businessRes.ok) {
          const data = await businessRes.json();
          setBusinesses(data.data);
        }

        if (walletRes.ok) {
          const data = await walletRes.json();
          setWalletBalance(data.data?.balance || 0);
        }
      } catch (error) {
        console.error('[v0] Error fetching bidding data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sellerId]);

  const company: any = {}

  return (
    <SellerLayout
      currentPage="bidding"
      walletBalance={walletBalance}
      currency="PKR"
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bidding Marketplace</h1>
          <p className="mt-2 text-muted-foreground">
            Explore available logistics providers and their competitive bidding rates
          </p>
        </div>

        {/* Featured Providers */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Top Logistics Providers</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business: any) => (
              <Card
                key={business.id}
                onClick={() => setSelectedBusinessId(business.id)}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedBusinessId === business.id ? 'ring-2 ring-accent' : ''
                  }`}
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{business.companyName || 'Business'}</h3>
                    </div>
                    {business.commissionRate && business.commissionRate <= 10 && (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                        ⭐ Best Rate
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < Math.floor(company?.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-foreground">{company?.rating}</span>
                    <span className="text-xs text-muted-foreground">({company?.reviewCount})</span>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Commission Rate</p>
                      <p className="text-sm font-bold text-accent">{business.commissionRate || 10}%</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="text-sm font-bold text-foreground">{business.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Current Bids */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Top Business Rates</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {businesses.slice(0, 4).map((bid: any) => (
              <Card key={bid.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">{bid.companyName || 'Business'}</h3>

                      {/* Commission Rate */}
                      <div className="mt-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-foreground">
                          {bid.commissionRate || 10}% Commission
                        </span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{bid.rating}</span>
                    </div>

                    {/* Details */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Pickup Time</span>
                        <span className="font-medium text-foreground">{bid.pickupTime||"NAN"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Delivery Est.</span>
                        <span className="font-medium text-foreground">{bid.estimatedDeliveryTime||"NAN"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Base Price</p>
                    <p className="text-2xl font-bold text-accent">{bid.baseRate}</p>
                    <p className="text-xs text-foreground">PKR</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats */}
        <Card>
          <CardHeader title="Marketplace Statistics" />
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-50 p-3">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Bid Requests</p>
                  <p className="text-2xl font-bold text-foreground">3.2</p>
                  <p className="text-xs text-muted-foreground">per order</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="rounded-full bg-green-50 p-3">
                  <Star className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Provider Rating</p>
                  <p className="text-2xl font-bold text-foreground">4.6</p>
                  <p className="text-xs text-muted-foreground">out of 5</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="rounded-full bg-purple-50 p-3">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cost Savings</p>
                  <p className="text-2xl font-bold text-foreground">15-25%</p>
                  <p className="text-xs text-muted-foreground">vs standard rates</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SellerLayout >
  );
}
