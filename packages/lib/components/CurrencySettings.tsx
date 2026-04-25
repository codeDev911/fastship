'use client';

import React, { useState, useEffect } from 'react';
import { Currency } from '@prisma/client';
import { CurrencySelector } from './CurrencySelector';
import { Card, CardHeader, CardContent, CardFooter } from '@fastship/ui';
import { Button } from '@fastship/ui';
import { Alert, AlertDescription } from '@fastship/ui';
import { useToast } from '../../hooks/use-toast';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { secureFetch } from '@fastship/lib';
import { CURRENCY_SYMBOLS, CURRENCY_NAMES } from '../utils/currency.utils';

interface CurrencySettingsProps {
  userId?: string;
  userType?: 'business' | 'driver' | 'seller';
  onCurrencyChange?: (currency: Currency) => void;
  compact?: boolean;
}

/**
 * CurrencySettings Component
 * Allows users to select and save their preferred currency
 * Provides real-time preview of how amounts will be displayed
 *
 * @example
 * ```tsx
 * <CurrencySettings
 *   userId="user-123"
 *   userType="business"
 *   onCurrencyChange={(curr) => console.log('New currency:', curr)}
 * />
 * ```
 */
export function CurrencySettings({
  userId,
  userType = 'business',
  onCurrencyChange,
  compact = false,
}: CurrencySettingsProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(Currency.USD);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch user's current currency preference on mount
  useEffect(() => {
    const fetchUserCurrency = async () => {
      try {
        setIsLoading(true);
        const uid = userId || JSON.parse(localStorage.getItem('user') || '{}')?.id;
        const jobId = JSON.parse(localStorage.getItem('user') || '{}')?.jobId;
        if (!uid) {
          setSelectedCurrency(Currency.USD);
          setIsLoading(false);
          return;
        }

        const response = await secureFetch(`/api/user/currency?userId=${uid}&jobId=${jobId}`);
        if (response.ok) {
          const data = await response.json();
          setSelectedCurrency(data.preferredCurrency || Currency.USD);
        }
      } catch (error) {
        console.error('Error fetching currency preference:', error);
        setSelectedCurrency(Currency.USD);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCurrency();
  }, [userId]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveStatus('idle');
      setStatusMessage('');

      const uid = userId || JSON.parse(localStorage.getItem('user') || '{}')?.id;

      if (!uid) {
        throw new Error('User ID not found');
      }
        const jobId = JSON.parse(localStorage.getItem('user') || '{}')?.jobId;

      const response = await secureFetch('/api/user/currency', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: uid,
          jobId,
          preferredCurrency: selectedCurrency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update currency preference');
      }

      setSaveStatus('success');
      setStatusMessage(`Currency changed to ${CURRENCY_NAMES[selectedCurrency] || selectedCurrency}`);
      
      toast({
        title: 'Success',
        description: `Your preferred currency is now ${selectedCurrency}`,
      });

      // Notify parent component
      onCurrencyChange?.(selectedCurrency);
    } catch (error: any) {
      setSaveStatus('error');
      setStatusMessage(error.message || 'Failed to save currency preference');
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to save currency preference',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <CurrencySelector
          value={selectedCurrency}
          onChange={setSelectedCurrency}
          label="Preferred Currency"
          showSymbol
          showFullName
        />
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
          variant="default"
        >
          {isSaving ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Preference'
          )}
        </Button>
        {saveStatus === 'success' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {statusMessage}
            </AlertDescription>
          </Alert>
        )}
        {saveStatus === 'error' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {statusMessage}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Currency Preferences</h3>
        <p className="text-sm text-gray-600">
          Select your preferred currency for displaying amounts and prices
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <CurrencySelector
            value={selectedCurrency}
            onChange={setSelectedCurrency}
            label="Preferred Currency"
            showSymbol
            showFullName
          />

          {/* Preview */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-2">
            <p className="text-sm font-medium text-gray-700">Preview</p>
            <div className="text-2xl font-bold">
              {CURRENCY_SYMBOLS[selectedCurrency]}1,000.00
            </div>
            <p className="text-sm text-gray-600">
              How amounts will be displayed in {CURRENCY_NAMES[selectedCurrency]}
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {saveStatus === 'success' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {statusMessage}
            </AlertDescription>
          </Alert>
        )}

        {saveStatus === 'error' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {statusMessage}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
          variant="default"
        >
          {isSaving ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Currency Preference'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default CurrencySettings;
