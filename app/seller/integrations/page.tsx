'use client';

import React, { useState, useEffect } from 'react';
import { SellerLayout } from '@/components/seller/SellerLayout';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Zap, Check, X } from 'lucide-react';
import { secureFetch } from '@/lib/secure-fetch';

export default function IntegrationsPage() {
  const [sellerId] = useState<string>('seller-1');
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [intRes, walletRes] = await Promise.all([
          secureFetch(`/api/sellers/integrations?sellerId=${sellerId}`),
          secureFetch(`/api/wallets?sellerId=${sellerId}`),
        ]);

        if (intRes.ok) {
          const data = await intRes.json();
          setIntegrations(data.data);
        }

        if (walletRes.ok) {
          const data = await walletRes.json();
          setWalletBalance(data.data?.balance || 0);
        }
      } catch (error) {
        console.error('[v0] Error fetching integrations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sellerId]);

  return (
    <SellerLayout
      currentPage="integrations"
      walletBalance={walletBalance}
      currency="PKR"
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Integrations</h1>
          <p className="mt-2 text-muted-foreground">
            Connect your e-commerce platforms to automate order management
          </p>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-3xl">{integration.icon}</div>
                    <h3 className="mt-3 text-lg font-semibold text-foreground">{integration.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{integration.description}</p>
                  </div>
                  {integration.connected && (
                    <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
                  )}
                </div>

                {integration.connectedSince && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Connected since {integration.connectedSince}
                  </p>
                )}

                <div className="mt-6">
                  <Button
                    variant={integration.connected ? 'secondary' : 'primary'}
                    fullWidth
                  >
                    {integration.connected ? 'Manage' : 'Connect'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SellerLayout>
  );
}
