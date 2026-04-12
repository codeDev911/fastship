'use client';

import React from 'react';
import { RateCard } from '@/lib/types';
import { Card, CardContent } from '@/components/shared/Card';
import { Plus, Edit2, Trash2, Check } from 'lucide-react';

interface RateCardListProps {
  rateCards: RateCard[];
  selectedRateCardId?: string;
  onSelectRateCard: (rateCard: RateCard) => void;
  onCreateNew: () => void;
  onDelete: (id: string) => void;
}

export function RateCardList({
  rateCards,
  selectedRateCardId,
  onSelectRateCard,
  onCreateNew,
  onDelete,
}: RateCardListProps) {
  console.log(rateCards);
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
          <Card
            key={card.id}
            className={`cursor-pointer transition-all border-2 ${
              selectedRateCardId === card.id
                ? 'border-accent bg-accent/5'
                : 'border-transparent hover:bg-secondary/50'
            }`}
            onClick={() => onSelectRateCard(card)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{card.name}</h3>
                    {card.isActive && (
                      <div className="flex-shrink-0 flex items-center gap-1 rounded-full bg-green-50 px-2 py-1">
                        <Check className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium text-green-600">Active</span>
                      </div>
                    )}
                  </div>
                  {card.description && (
                    <p className="text-xs text-muted-foreground truncate">{card.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Base Price</p>
                      <p className="text-sm font-semibold text-foreground">PKR {card.baseRate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Base Weight</p>
                      <p className="text-sm font-semibold text-foreground">{card.baseWeight} kg</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(card.id);
                  }}
                  className="flex-shrink-0 rounded-lg p-2 hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
                  title="Delete rate card"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
