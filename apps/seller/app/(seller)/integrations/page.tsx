'use client';

import React, { useState, useEffect } from 'react';
import { SellerLayout } from '../../../components/SellerLayout';
import { IntegrationCard } from '../../../components/IntegrationCard';
import { OrderSyncPreview } from '../../../components/OrderSyncPreview';
import { ShopifyConnectModal } from '../../../components/ShopifyConnectModal';
import { Alert, AlertDescription } from '@fastship/ui';
import { Button } from '@fastship/ui';
import { Badge } from '@fastship/ui';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@fastship/hooks';
import { secureFetch } from '@fastship/lib';

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected';
  description: string;
  connectedAt?: Date;
  lastSyncedAt?: Date | null;
  syncStatus?: string;
  icon: string;
  stats?: {
    totalOrders: number;
    importedOrders: number;
  };
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSyncPreview, setShowSyncPreview] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setIsLoading(true);
    setError(null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const sellerId = user?.jobId;
    try {
      const response = await secureFetch(`/api/sellers/integrations?sellerId=${sellerId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch integrations');
      }

      const data = await response.json();
      setIntegrations(data.data || []);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to load integrations';
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (integrationId: string) => {
    try {
      const response = await secureFetch('/api/integrations/shopify/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integrationId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Sync failed');
      }

      const data = await response.json();

      toast({
        title: 'Sync Complete',
        description: `Imported ${data.data.imported} orders, skipped ${data.data.skipped}`,
      });

      // Refresh integrations list
      await fetchIntegrations();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Sync failed';
      toast({
        title: 'Sync Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      const response = await secureFetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect integration');
      }

      toast({
        title: 'Disconnected',
        description: 'Integration has been removed',
      });

      // Refresh integrations list
      await fetchIntegrations();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Disconnection failed';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleImportOrders = async (orderIds: string[]) => {
    if (!selectedIntegration) return;

    try {
      const response = await secureFetch('/api/integrations/shopify/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integrationId: selectedIntegration,
          orderIds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Import failed');
      }

      const data = await response.json();

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${data.data.imported} orders`,
      });

      // Refresh integrations
      await fetchIntegrations();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Import failed';
      toast({
        title: 'Import Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  return (
    <SellerLayout currentPage="integrations" walletBalance={walletBalance} currency="PKR">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Integrations</h1>
          <p className="mt-2 text-muted-foreground">
            Connect your e-commerce platforms to automate order imports and
            shipment tracking
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">Loading integrations...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Simple Integration List */}
            {integrations.length > 0 ? (
              <div className="space-y-3">
                {integrations?.map((integration) => (
                  <div
                    key={integration?.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integration?.icon}</span>
                      <div>
                        <p className="font-medium text-foreground">
                          {integration?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {integration?.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={
                          integration.status === 'connected'
                            ? 'default'
                            : 'secondary'
                        }
                        className="capitalize"
                      >
                        {integration.status === 'connected'
                          ? '✓ Connected'
                          : 'Not Connected'}
                      </Badge>
                      {integration.status === 'connected' ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedIntegration(integration.id);
                              setShowSyncPreview(true);
                            }}
                          >
                            Import
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSync(integration.id)}
                          >
                            Sync
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedIntegration(integration.id);
                              // Handle disconnect
                              handleDisconnect(integration.id);
                            }}
                          >
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            if (integration?.icon === '🛍️') {
                              setShowConnectModal(true);
                            }
                          }}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  No integrations configured yet
                </p>
                <Button onClick={() => setShowConnectModal(true)}>
                  Connect Your First Store
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <ShopifyConnectModal
        open={showConnectModal}
        onOpenChange={setShowConnectModal}
        onConnect={() => {
          setShowConnectModal(false);
          // Integration will be created via OAuth callback
          // Refresh after a moment to show the new integration
          setTimeout(() => fetchIntegrations(), 2000);
        }}
      />

      {selectedIntegration && (
        <OrderSyncPreview
          open={showSyncPreview}
          onOpenChange={setShowSyncPreview}
          integrationId={selectedIntegration}
          onImport={handleImportOrders}
        />
      )}
    </SellerLayout>
  );
}
