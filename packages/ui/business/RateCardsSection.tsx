'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RateCard } from '../../lib/types';
import { useToast } from '../../hooks/use-toast';
import { RateCardFormNew } from '../business/RateCardFormNew';
import { RateCardListNew } from '../business/RateCardListNew';
import { Loader, X } from 'lucide-react';

interface RateCardsPageProps {
  businessId: string;
}

export default function RateCardsPage({ businessId }: RateCardsPageProps) {
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [selectedRateCard, setSelectedRateCard] = useState<RateCard | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  // Fetch rate cards
  const fetchRateCards = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/rate-cards?businessId=${businessId}`);
      if (!response.ok) throw new Error('Failed to fetch rate cards');
      const data = await response.json();
      setRateCards(data.rateCards || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch rate cards',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [businessId, toast]);

  useEffect(() => {
    fetchRateCards();
  }, [fetchRateCards]);

  // Handle form submission
  const handleSubmit = async (formData: any) => {
    setIsFormLoading(true);
    try {
      const url = selectedRateCard 
        ? `/api/rate-cards/${selectedRateCard.id}` 
        : '/api/rate-cards';
      
      const method = selectedRateCard ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save rate card');
      }

      await fetchRateCards();
      setShowForm(false);
      setSelectedRateCard(undefined);
      
      toast({
        title: 'Success',
        description: selectedRateCard 
          ? 'Rate card updated successfully' 
          : 'Rate card created successfully',
        type: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save rate card',
        type: 'error',
      });
      throw error;
    } finally {
      setIsFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/rate-cards/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete rate card');
      }

      await fetchRateCards();
      
      toast({
        title: 'Success',
        description: 'Rate card deleted successfully',
        type: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete rate card',
        type: 'error',
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Rate Card Management</h1>
          <p className="text-muted-foreground">Create and manage delivery rate cards for your business</p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: List */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <RateCardListNew
                  rateCards={rateCards}
                  selectedRateCardId={selectedRateCard?.id}
                  onSelectRateCard={setSelectedRateCard}
                  onCreateNew={handleCreateNew}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isLoading={isFormLoading}
                />
              </div>
            </div>

            {/* Right: Form */}
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
                    businessId={businessId}
                    onSubmit={handleSubmit}
                    isLoading={isFormLoading}
                  />
                </div>
              ) : (
                <div className="bg-secondary/30 rounded-lg border-2 border-dashed border-border p-12 text-center sticky top-4">
                  <p className="text-muted-foreground mb-4">Select a rate card to view details or click "Create New Rate Card" to get started</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
