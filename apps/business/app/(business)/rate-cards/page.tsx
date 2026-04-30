'use client';

import React, { useState, useEffect } from 'react';
import { BusinessLayout } from '@fastship/ui';
import { RateCardListNew } from '@fastship/ui';
import { RateCardFormNew } from '@fastship/ui';
import { useToast } from '@fastship/hooks';
import { Loader, X } from 'lucide-react';
import { RateCard, secureFetch } from '@fastship/lib';

export default function RateCardsPage() {
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [peferredCurrency,setPeferredCurrency] = useState("USD")
  const [businessId, setBusinessId] = useState<string>('');
  const [selectedRateCard, setSelectedRateCard] = useState<RateCard | undefined>(undefined);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRateCards = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const bid = user?.jobId || user?.businessId;
      setBusinessId(bid);
      
      if (!bid) {
        console.error('No business ID found for user');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await secureFetch(`/api/rate-cards?businessId=${bid}`);
        if (!response.ok) throw new Error('Failed to fetch rate cards');
        const data = await response.json();
        setRateCards(data.data.rateCards || []);
        setPeferredCurrency(data.data.peferredCurrency || "USD")
      } catch (error: any) {
        console.error('Error fetching rate cards:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch rate cards',
          variant:"destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRateCards();
  }, [toast]);

  const handleSubmit = async (formData: any) => {
    setIsFormLoading(true);
    try {
      const url = selectedRateCard 
        ? `/api/rate-cards/${selectedRateCard.id}` 
        : '/api/rate-cards';
      
      const method = selectedRateCard ? 'PATCH' : 'POST';
      
      const response = await secureFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save rate card');
      }

      // Refetch rate cards
      const fetchResponse = await secureFetch(`/api/rate-cards?businessId=${businessId}`);
      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        setRateCards(data.rateCards || []);
      }

      setShowForm(false);
      setSelectedRateCard(undefined);
      
      toast({
        title: 'Success',
        description: selectedRateCard 
          ? 'Rate card updated successfully' 
          : 'Rate card created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save rate card',
      });
      throw error;
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await secureFetch(`/api/rate-cards/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete rate card');
      }

      setRateCards((prev) => prev.filter((card) => card.id !== id));
      if (selectedRateCard?.id === id) {
        setSelectedRateCard(undefined);
      }

      toast({
        title: 'Success',
        description: 'Rate card deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete rate card',
      });
      throw error;
    }
  };

  const handleCreateNew = () => {
    setSelectedRateCard(undefined);
    setShowForm(true);
  };

  const handleEdit = (card: RateCard) => {
    setSelectedRateCard(card);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedRateCard(undefined);
  };

  return (
    <BusinessLayout currentPage="rate-cards">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rate Card Management</h1>
          <p className="mt-2 text-muted-foreground">
            Create and manage pricing rates for different shipment types and service areas
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : (
          /* Split View Layout */
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Side - Rate Card List */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <RateCardListNew
                  rateCards={rateCards}
                  selectedRateCardId={selectedRateCard?.id}
                  onSelectRateCard={setSelectedRateCard}
                  onCreateNew={handleCreateNew}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                    currency={peferredCurrency}

                  isLoading={isFormLoading}
                />
              </div>
            </div>

            {/* Right Side - Rate Card Form */}
            <div className="lg:col-span-2">
              {showForm ? (
                <div className="bg-white rounded-lg border border-border p-6 sticky top-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-foreground">
                      {selectedRateCard ? 'Edit Rate Card' : 'Create New Rate Card'}
                    </h2>
                    <button
                      onClick={handleCloseForm}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      title="Close form"
                    >
                      <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </div>

                  <RateCardFormNew
                    rateCard={selectedRateCard}
                    currency={peferredCurrency}
                    businessId={businessId}
                    onSubmit={handleSubmit}
                    isLoading={isFormLoading}
                  />
                </div>
              ) : (
                <div className="bg-secondary/30 rounded-lg border-2 border-dashed border-border p-12 text-center sticky top-4">
                  <p className="text-muted-foreground mb-4">
                    Select a rate card to view details or click "Create New Rate Card" to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </BusinessLayout>
  );
}
