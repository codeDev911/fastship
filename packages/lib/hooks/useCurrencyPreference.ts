'use client';

import { useState, useEffect, useCallback } from 'react';
import { Currency } from '@prisma/client';
import { secureFetch } from '../index';

/**
 * Hook to manage user's currency preference
 * Handles fetching, updating, and caching currency settings
 *
 * @example
 * ```tsx
 * const { currency, setCurrency, isLoading } = useCurrencyPreference();
 * 
 * return (
 *   <div>
 *     <p>Current: {currency}</p>
 *     <button onClick={() => setCurrency(Currency.EUR)}>
 *       Change to EUR
 *     </button>
 *   </div>
 * );
 * ```
 */
export function useCurrencyPreference(userId?: string) {
  const [currency, setCurrencyState] = useState<Currency>(Currency.USD);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch currency preference on mount
  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const uid = userId || JSON.parse(localStorage.getItem('user') || '{}')?.id;

        if (!uid) {
          setCurrencyState(Currency.USD);
          setIsLoading(false);
          return;
        }

        const response = await secureFetch(`/api/user/currency?userId=${uid}`);

        if (response.ok) {
          const data = await response.json();
          setCurrencyState(data.preferredCurrency || Currency.USD);
        } else {
          setError('Failed to fetch currency preference');
          setCurrencyState(Currency.USD);
        }
      } catch (err) {
        console.error('Error fetching currency:', err);
        setError('Failed to fetch currency preference');
        setCurrencyState(Currency.USD);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrency();
  }, [userId]);

  // Update currency preference
  const setCurrency = useCallback(
    async (newCurrency: Currency) => {
      try {
        setError(null);
        const uid = userId || JSON.parse(localStorage.getItem('user') || '{}')?.id;

        if (!uid) {
          throw new Error('User not found');
        }

        const response = await secureFetch('/api/user/currency', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: uid,
            preferredCurrency: newCurrency,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update currency');
        }

        setCurrencyState(newCurrency);
        
        // Dispatch custom event for other components to listen
        window.dispatchEvent(
          new CustomEvent('currencyChanged', {
            detail: { currency: newCurrency },
          })
        );

        return true;
      } catch (err: any) {
        setError(err.message || 'Failed to update currency');
        return false;
      }
    },
    [userId]
  );

  return {
    currency,
    setCurrency,
    isLoading,
    error,
  };
}

/**
 * Hook to listen for currency changes across the app
 * Useful for updating UI when currency is changed elsewhere
 *
 * @example
 * ```tsx
 * const onCurrencyChange = (newCurrency: Currency) => {
 *   console.log('Currency changed to:', newCurrency);
 * };
 *
 * useOnCurrencyChange(onCurrencyChange);
 * ```
 */
export function useOnCurrencyChange(
  callback: (currency: Currency) => void
) {
  useEffect(() => {
    const handleCurrencyChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail.currency);
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);

    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange);
    };
  }, [callback]);
}

export default useCurrencyPreference;
