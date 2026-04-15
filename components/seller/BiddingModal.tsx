'use client';

import React, { useState } from 'react';
import { CourierBid, SellerOrder } from '@/lib/types';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Star, X, Clock, DollarSign, CheckCircle2, MapPin, Truck, Info } from 'lucide-react';

interface BiddingModalProps {
  isOpen: boolean;
  order: SellerOrder | null;
  bids: any[]; // Updated to handle new quote format
  onClose: () => void;
  onAcceptBid: (bid: any) => void;
  isLoading?: boolean;
}

export function BiddingModal({
  isOpen,
  order,
  bids,
  onClose,
  onAcceptBid,
  isLoading = false,
}: BiddingModalProps) {
  const [selectedBid, setSelectedBid] = useState<string | null>(null);
  const [acceptingBid, setAcceptingBid] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-6">
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

        {/* Bids List */}
        <div className="space-y-4 p-6">
          {bids.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Truck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-foreground">No couriers available</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your shipment details or contact support
              </p>
            </div>
          ) : (
            bids.map((bid) => (
              <div
                key={bid.id}
                onClick={() => setSelectedBid(bid.id)}
                className={`rounded-2xl border-2 p-5 transition-all cursor-pointer ${
                  selectedBid === bid.id
                    ? 'border-accent'
                    : 'border-border hover:border-accent/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Company Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {bid.companyName}
                      </h3>
                      {bid.driverCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                          <Truck className="h-3 w-3" />
                          {bid.driverCount} drivers
                        </span>
                      )}
                    </div>

                    {/* Why Recommended */}
                    {bid.reasonRecommended && (
                      <p className="text-xs text-accent font-medium mb-3">
                        {bid.reasonRecommended}
                      </p>
                    )}

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(bid.rating)
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

                    {/* Distance & Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">Distance</p>
                          <p className="text-sm font-medium text-foreground">
                            {bid.distance.toFixed(0)} km
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Pickup in
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            ~{bid.estimatedPickupHours}h
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Rate Breakdown */}
                    {selectedBid === bid.id && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-2 bg-secondary/30 rounded-lg p-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Base Rate</span>
                          <span className="font-medium">
                            {bid.baseRate.toFixed(0)} PKR
                          </span>
                        </div>
                        {bid.distanceCharge > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Distance ({bid.distance.toFixed(0)} km)
                            </span>
                            <span className="font-medium">
                              +{bid.distanceCharge.toFixed(0)} PKR
                            </span>
                          </div>
                        )}
                        {bid.weightCharge > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Weight Surcharge
                            </span>
                            <span className="font-medium">
                              +{bid.weightCharge.toFixed(0)} PKR
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Price and Action */}
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">
                        Total Quote
                      </p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-bold text-accent">
                          {bid.totalRate.toFixed(0)}
                        </p>
                        <p className="text-sm text-foreground">PKR</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleAccept(bid)}
                      isLoading={acceptingBid && selectedBid === bid.id}
                      disabled={acceptingBid || isLoading}
                      className="w-full md:w-auto"
                      icon={<CheckCircle2 className="h-4 w-4" />}
                    >
                      Accept Bid
                    </Button>
                  </div>
                </div>

                {/* Selection Indicator */}
                {selectedBid === bid.id && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span className="text-xs font-medium text-accent">
                      Selected - Tap Accept Bid to confirm
                    </span>
                  </div>
                )}
              </div>
            ))
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
