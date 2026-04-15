'use client';

import React, { useState } from 'react';
import { RateCard } from '@/lib/types';
import { Plus, Edit2, Trash2, Check, MapPin, Loader } from 'lucide-react';

interface RateCardListProps {
  rateCards: RateCard[];
  selectedRateCardId?: string;
  onSelectRateCard: (rateCard: RateCard) => void;
  onCreateNew: () => void;
  onEdit: (rateCard: RateCard) => void;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function RateCardListNew({
  rateCards,
  selectedRateCardId,
  onSelectRateCard,
  onCreateNew,
  onEdit,
  onDelete,
  isLoading = false,
}: RateCardListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this rate card?')) {
      return;
    }

    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (card: RateCard, e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(card);
  };

  if (rateCards.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={onCreateNew}
          className="w-full rounded-2xl border-2 border-dashed border-border bg-secondary/30 p-6 hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5 text-accent" />
          <span className="font-medium text-foreground">Create Your First Rate Card</span>
        </button>

        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">No rate cards yet. Create one to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onCreateNew}
        className="w-full rounded-2xl border-2 border-dashed border-border bg-secondary/30 p-4 hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="h-5 w-5 text-accent" />
        <span className="font-medium text-foreground">Create New Rate Card</span>
      </button>

      <div className="space-y-3">
        {rateCards.map((card) => (
          <div
            key={card.id}
            className={`rounded-lg border-2 transition-all cursor-pointer overflow-hidden ${
              selectedRateCardId === card.id
                ? 'border-accent bg-accent/5'
                : 'border-border hover:bg-secondary/30'
            }`}
            onClick={() => onSelectRateCard(card)}
          >
            <div className="p-4 space-y-3">
              {/* Header with Title and Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground truncate text-base">{card.name}</h3>
                    {card.isActive ? (
                      <div className="flex-shrink-0 flex items-center gap-1 rounded-full bg-green-50 px-2 py-1">
                        <Check className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium text-green-600">Active</span>
                      </div>
                    ) : (
                      <div className="flex-shrink-0 flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                        <span className="text-xs font-medium text-gray-600">Inactive</span>
                      </div>
                    )}
                  </div>
                  {card.description && (
                    <p className="text-xs text-muted-foreground truncate mt-1">{card.description}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <button
                    onClick={(e) => handleEdit(card, e)}
                    className="rounded-lg p-2 hover:bg-blue-50 transition-colors text-muted-foreground hover:text-blue-600"
                    title="Edit rate card"
                    disabled={isLoading || deletingId === card.id}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(card.id, e)}
                    className="rounded-lg p-2 hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600 disabled:opacity-50"
                    title="Delete rate card"
                    disabled={isLoading || deletingId !== null}
                  >
                    {deletingId === card.id ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Pricing Details */}
              <div className="grid grid-cols-2 gap-3 py-2 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Base Rate</p>
                  <p className="text-sm font-semibold text-foreground">PKR {card.baseRate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Per KM</p>
                  <p className="text-sm font-semibold text-foreground">PKR {card.perKmRate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Base Weight</p>
                  <p className="text-sm font-semibold text-foreground">{card.minWeight} kg</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Max Weight</p>
                  <p className="text-sm font-semibold text-foreground">{card.maxWeight} kg</p>
                </div>
              </div>

              {/* Distance and Surcharge Details */}
              <div className="grid grid-cols-2 gap-3 py-2 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Distance Range</p>
                  <p className="text-sm font-semibold text-foreground">{card.minimumDistance} - {card.maximumDistance} km</p>
                </div>
                {card.weightSurcharge > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Weight Surcharge</p>
                    <p className="text-sm font-semibold text-foreground">PKR {card.weightSurcharge}/kg</p>
                  </div>
                )}
              </div>

              {/* Service States */}
              {card.serviceStates && card.serviceStates.length > 0 && (
                <div className="py-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Service States</p>
                  <div className="flex flex-wrap gap-1">
                    {card.serviceStates.map((state) => (
                      <span key={state} className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                        <MapPin className="h-3 w-3" />
                        {state}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
