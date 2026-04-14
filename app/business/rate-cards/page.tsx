'use client';

import React, { useState, useEffect } from 'react';
import { BusinessLayout } from '@/components/business/BusinessLayout';
import { RateCardList } from '@/components/business/RateCardList';
import RateCardForm from '@/components/business/RateCardForm';
import { secureFetch } from '@/lib/secure-fetch';

export default function RateCardsPage() {
  const [rateCards, setRateCards] = useState<any[]>([]);
  const [businessId,setBusinessId] = useState<string>('business-1');
  const [selectedRateCard, setSelectedRateCard] = useState<any>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRateCards = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const businessId = user?.jobId;
      setBusinessId(businessId);
      if (!businessId) {
        console.error('No business ID found for user');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const response = await secureFetch(`/api/rate-cards?businessId=${businessId}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setRateCards(data.data);
      } catch (error) {
        console.error('Error fetching rate cards:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRateCards();
  }, []);

  const handleSelectRateCard = (card: any) => {
    setSelectedRateCard(card);
  };

  const handleCreateNew = () => {
    setSelectedRateCard(undefined);
  };

  const handleSaveRateCard = async (rateCard: any) => {
    try {
      setIsSaving(true);

      if (selectedRateCard) {
        // Update existing
        const response = await secureFetch(`/api/rate-cards/${rateCard.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rateCard),
        });

        if (!response.ok) throw new Error('Failed to update');
        setRateCards((prev) => prev.map((card) => (card.id === rateCard.id ? rateCard : card)));
      } else {
        // Create new
        const response = await secureFetch('/api/rate-cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...rateCard, businessId }),
        });

        if (!response.ok) throw new Error('Failed to create');
        const created = await response.json();
        setRateCards((prev) => [...prev, created]);
      }

      setSelectedRateCard(rateCard);
    } catch (error) {
      console.error('Error saving rate card:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRateCard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rate card?')) return;

    try {
      const response = await secureFetch(`/api/rate-cards/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');

      setRateCards((prev) => prev.filter((card) => card.id !== id));
      if (selectedRateCard?.id === id) {
        setSelectedRateCard(undefined);
      }
    } catch (error) {
      console.error('Error deleting rate card:', error);
    }
  };

  return (
    <BusinessLayout currentPage="rate-cards">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rate Card Management</h1>
          <p className="mt-2 text-muted-foreground">
            Create and manage pricing rates for different shipment types and zones
          </p>
        </div>

        {/* Split View Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Side - Rate Card List */}
          <div className="lg:col-span-1">
            <RateCardList
              rateCards={rateCards}
              selectedRateCardId={selectedRateCard?.id}
              onSelectRateCard={handleSelectRateCard}
              onCreateNew={handleCreateNew}
              onDelete={handleDeleteRateCard}
            />
          </div>

          {/* Right Side - Rate Card Form */}
          <div className="lg:col-span-2">
            <RateCardForm
              rateCard={selectedRateCard}
              onSave={handleSaveRateCard}
              isSaving={isSaving}
            />
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
}
