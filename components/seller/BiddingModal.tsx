'use client';

import React, { useState } from 'react';
import { CourierBid, SellerOrder } from '@/lib/types';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Star, X, Clock, DollarSign, CheckCircle2 } from 'lucide-react';

interface BiddingModalProps {
  isOpen: boolean;
  order: SellerOrder | null;
  bids: CourierBid[];
  onClose: () => void;
  onAcceptBid: (bid: CourierBid) => void;
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

  const handleAccept = async (bid: CourierBid) => {
    isLoading = true;
    onAcceptBid(bid);
    setAcceptingBid(false);
    setSelectedBid(null);
    isLoading = false;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Select Courier</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Order {order.id} to {order.deliveryAddress} ({order.weight} kg)
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
              <p className="text-lg font-semibold text-foreground">No bids available</p>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your order details</p>
            </div>
          ) : (
            bids.map((bid) => (
              <div
                key={bid.id}
                onClick={() => setSelectedBid(bid.id)}
                className={`rounded-2xl border-2 p-4 transition-all cursor-pointer ${selectedBid === bid.id
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent/50'
                  }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Company Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">{bid?.companyName}</h3>
                    {/* Rating */}
                    <div className="mt-2 flex items-center gap-2">
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
                      <span className="text-sm font-medium text-foreground">{bid.rating}</span>
                      <span className="text-xs text-muted-foreground">({bid.reviewCount} reviews)</span>
                    </div>

                    {/* Details */}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">Pickup Time</p>
                          <p className="text-sm font-medium text-foreground">{bid.pickupTime}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Delivery</p>
                          <p className="text-sm font-medium text-foreground">
                            {bid.estimatedDeliveryTime || '2-3 days'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Price and Action */}
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Base Price</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-bold text-accent">{bid.baseRate}</p>
                        <p className="text-sm text-foreground">PKR</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleAccept(bid)}
                      isLoading={acceptingBid && selectedBid === bid.id}
                      disabled={acceptingBid}
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
                    <span className="text-xs font-medium text-accent">Selected</span>
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
