'use client';

import React, { useState } from 'react';
import { CourierBid, CurrencyDisplay, SellerOrder } from '@fastship/lib';
import { Button } from '@fastship/ui';
import { Card } from '@fastship/ui';
import { Star, X, Clock, DollarSign, CheckCircle2, MapPin, Truck, Info, TrendingDown, Zap, Award } from 'lucide-react';

interface BiddingModalProps {
  isOpen: boolean;
  order: SellerOrder | null;
  bids: any[]; // Updated to handle new quote format
  onClose: () => void;
  onAcceptBid: (bid: any) => void;
  isLoading?: boolean;
}

// Helper to get service level color & icon
const getServiceLevelStyle = (rateCardName: string | undefined) => {
  const name = (rateCardName || '').toLowerCase();
  if (name.includes('express')) {
    return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '⚡' };
  }
  if (name.includes('economy')) {
    return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '💰' };
  }
  return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: '📦' };
};

// Get recommendation tag
const getRecommendationTag = (bid: any, index: number, totalBids: number) => {
  if (index === 0) return { label: 'Best Price', icon: '💰', color: 'bg-green-100 text-green-700' };
  if (bid.rating >= 4.8 && index < totalBids * 0.3) return { label: 'Top Rated', icon: '⭐', color: 'bg-yellow-100 text-yellow-700' };
  if (bid.estimatedPickupHours <= 2 && index < totalBids * 0.3) return { label: 'Fastest', icon: '🚀', color: 'bg-blue-100 text-blue-700' };
  return null;
};

export function BiddingModal({
  isOpen,
  order,
  bids,
  onClose,
  onAcceptBid,
  isLoading = false,
}: BiddingModalProps) {
  const [selectedBid, setSelectedBid] = useState<string | number | null>(null);
  const [acceptingBid, setAcceptingBid] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'compare'>('list');

  if (!isOpen || !order) return null;

  const handleAccept = async (bid: any) => {
    setAcceptingBid(true);
    try {
      await onAcceptBid(bid);
    } finally {
      setAcceptingBid(false);
      setSelectedBid(null);
    }
  };


  const serviceStyle = (bid: any) => getServiceLevelStyle(bid.rateCardName);
  const recommendationTag = (bid: any, idx: number) => getRecommendationTag(bid, idx, bids.length);

  return (
    <div className="fixed inset-0 w-screen h-screen z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full md:max-w-4xl w-scree h-screen md:mx-4 md:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-2">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Select Courier</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Order {order.id} • {order.weight} kg • {order.pickupCity} → {order.deliveryCity}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-secondary transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* View Mode Toggle */}
        {bids.length > 1 && (
          <div className="flex gap-2 p-2 border-b border-border bg-gray-50">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'list'
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-foreground'
                }`}
            >
              Detailed View
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'compare'
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-foreground'
                }`}
            >
              Compare ({bids.slice(0, 3).length})
            </button>
          </div>
        )}

        {/* Bids List */}
        <div className={viewMode === 'list' ? 'space-y-3 p-2 mt-4' : 'p-2 mt-4'}>
          {isLoading ? (
            // Skeleton Loading State
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : bids.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Truck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-foreground">No couriers available</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting shipment details or contact support
              </p>
            </div>
          ) : viewMode === 'compare' ? (
            // Comparison Grid View (Top 3)
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bids.slice(0, 3).map((bid, idx) => {
                const style = serviceStyle(bid);
                const tag = recommendationTag(bid, idx);
                return (
                  <div
                    key={bid.id}
                    onClick={() => {
                      setSelectedBid(idx);
                      setViewMode('list');
                    }}
                    className={`rounded-xl border-2 p-4 transition-all cursor-pointer relative ${idx === 0
                      ? 'border-accent ring-2 ring-accent/20'
                      : 'border-border hover:border-accent/50'
                      }`}
                  >
                    {/* Recommendation Tag */}
                    {tag && (
                      <div className={`absolute -top-3 left-4 px-2 py-1 rounded-full text-xs font-bold ${tag.color}`}>
                        {tag.icon} {tag.label}
                      </div>
                    )}

                    {/* Service Level */}
                    <div className={`inline-block px-2 py-1 rounded-lg text-xs font-medium mb-2 ${style?.bg} ${style?.border} border ${style.text}`}>
                      {style.icon} {bid.rateCardName || 'Service'}
                    </div>

                    <h3 className="font-semibold text-foreground text-sm">{bid.companyName}</h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1 my-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < Math.floor(bid.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                            }`}
                        />
                      ))}
                      <span className="text-xs font-medium">{bid.rating.toFixed(1)}</span>
                    </div>

                    {/* Key Info */}
                    <div className="space-y-1 my-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pickup:</span>
                        <span className="font-medium">~{bid.estimatedPickupHours}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Drivers:</span>
                        <span className="font-medium">{bid.driverCount || 0}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="border-t border-border/50 pt-2 mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Total</p>
                      <p className="text-xl font-bold text-accent">
                        <CurrencyDisplay amount={bid.totalRate} currency={bid.currencyDisplay} />
                      </p>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccept(bid);
                      }}
                      disabled={acceptingBid}
                      size="sm"
                      className="w-full mt-3"
                    >
                      Select
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            // Detailed List View
            bids.map((bid, idx) => {
              const style = serviceStyle(bid);
              const tag = recommendationTag(bid, idx);
              return (
                <div
                  key={bid.id}
                  onClick={() => setSelectedBid(idx)}
                  className={`rounded-2xl border-2 p-5 transition-all cursor-pointer relative ${selectedBid === idx
                    ? 'border-accent ring-2 ring-accent/20'
                    : 'border-border hover:border-accent/50'
                    }`}
                >
                  {/* Recommendation Badge */}
                  {tag && (
                    <div className={`absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-bold ${tag.color}`}>
                      {tag.icon} {tag.label}
                    </div>
                  )}

                  <div className="md:flex items-start max-sm:space-y-4 justify-between gap-4">
                    {/* Left: Company Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {bid.companyName}
                          </h3>
                          {/* Service Level Badge */}
                          <div className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.border} border ${style.text}`}>
                            {style.icon} {bid.rateCardName || 'Standard Service'}
                          </div>
                        </div>
                        {bid.driverCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium ml-auto">
                            <Truck className="h-3 w-3" />
                            {bid.driverCount} drivers
                          </span>
                        )}
                      </div>

                      {/* Why Recommended */}
                      {bid.reasonRecommended && (
                        <p className="text-xs text-accent font-semibold mb-3">
                          ✨ {bid.reasonRecommended}
                        </p>
                      )}

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < Math.floor(bid.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {bid.rating.toFixed(1)}
                        </span>
                      </div>

                      {/* Distance & Details */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-accent" />
                          <div>
                            <p className="text-xs text-muted-foreground">Distance</p>
                            <p className="text-sm font-medium text-foreground">
                              {bid.distance.toFixed(2)} km
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-accent" />
                          <div>
                            <p className="text-xs text-muted-foreground">Pickup</p>
                            <p className="text-sm font-medium text-foreground">
                              ~{bid.estimatedPickupHours}h
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-accent" />
                          <div>
                            <p className="text-xs text-muted-foreground">Commission</p>
                            <p className="text-sm font-medium text-foreground">
                              {bid.commission || 10}%
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Rate Breakdown */}
                      {selectedBid === idx && (
                        <div className="mt-4 pt-4 border-t border-border/50 space-y-2 bg-accent/5 rounded-lg p-4">
                          <p className="text-xs font-semibold text-foreground mb-3">Price Breakdown</p>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Base Rate</span>
                            <span className="font-medium"><CurrencyDisplay amount={bid.baseRate} currency={bid.currencyDisplay} />
                            </span>
                          </div>
                          {bid.distanceCharge > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Distance Charge ({bid.distance.toFixed(2)} km)</span>
                              <span className="font-medium flex">+<CurrencyDisplay amount={bid.distanceCharge} currency={bid.currencyDisplay} /></span>
                            </div>
                          )}
                          {bid.weightCharge > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Weight Surcharge</span>
                              <span className="font-medium flex">+<CurrencyDisplay amount={bid.weightCharge} currency={bid.currencyDisplay} /></span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-bold border-t border-border/50 pt-2 mt-2">
                            <span>Total</span>
                            <span className="text-accent"><CurrencyDisplay amount={bid.totalRate} currency={bid.currencyDisplay} /> </span>
                          </div>

                        </div>
                      )}
                    </div>

                    {/* Right: Price and Action */}
                    <div className="flex flex-col items-end gap-3 text-right">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Quote</p>
                        <div className="flex items-baseline gap-1 justify-end">
                          <p className="text-3xl font-bold text-accent">
                            <CurrencyDisplay  amount={bid.totalRate} currency={bid.currencyDisplay} />

                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleAccept(bid)}
                        isLoading={acceptingBid && selectedBid === idx}
                        disabled={acceptingBid || isLoading}
                        className="w-full md:w-auto"
                        icon={<CheckCircle2 className="h-4 w-4" />}
                      >
                        Accept Bid
                      </Button>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {selectedBid === idx && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-xs">
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                      <span className="font-medium text-accent">
                        Selected - Tap Accept Bid to confirm
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
