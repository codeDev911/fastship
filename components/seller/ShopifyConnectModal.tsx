'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, ExternalLink, Info } from 'lucide-react';

interface ShopifyConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: () => void;
}

export function ShopifyConnectModal({
  open,
  onOpenChange,
  onConnect,
}: ShopifyConnectModalProps) {
  const [activeTab, setActiveTab] = useState('custom-app');
  
  // Custom App state
  const [shopUrl, setShopUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnectCustomApp = async () => {
    // Validate input
    if (!shopUrl.trim() || !apiKey.trim() || !apiSecret.trim()) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call API to connect custom app
      const response = await fetch('/api/integrations/shopify/connect-custom-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopUrl: shopUrl.trim(),
          apiKey: apiKey.trim(),
          apiSecret: apiSecret.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to connect store');
      }

      const data = await response.json();
      console.log('Connected:', data);
      
      // Close modal on success
      handleClose();
      onConnect();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect Shopify store'
      );
      setLoading(false);
    }
  };

  const handleConnectOAuth = async () => {
    // Validate input
    if (!shopUrl.trim()) {
      setError('Please enter your Shopify store URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call API to initiate OAuth flow
      const response = await fetch('/api/integrations/shopify/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopUrl: shopUrl.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to initiate OAuth flow');
      }

      const data = await response.json();
      const { authUrl } = data;

      // Redirect to Shopify OAuth
      window.location.href = authUrl;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect Shopify store'
      );
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShopUrl('');
    setApiKey('');
    setApiSecret('');
    setError(null);
    setActiveTab('custom-app');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🛍️</span>
            Connect Shopify Store
          </DialogTitle>
          <DialogDescription>
            Choose how you want to connect your Shopify store to FastShip
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom-app">Custom App (Easy)</TabsTrigger>
            <TabsTrigger value="oauth">OAuth (Public)</TabsTrigger>
          </TabsList>

          {/* Custom App Tab */}
          <TabsContent value="custom-app" className="space-y-4 py-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900 ml-2">
                Best for MVP testing. Use your Shopify Custom App credentials directly.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {/* Shop URL */}
              <div className="space-y-2">
                <Label htmlFor="shop-url-custom">Shopify Store URL</Label>
                <Input
                  id="shop-url-custom"
                  placeholder="mystore.myshopify.com"
                  value={shopUrl}
                  onChange={(e) => setShopUrl(e.target.value)}
                  disabled={loading}
                  type="text"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Find in Settings → Apps and integrations → Develop apps → App info
                </p>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="api-key">API Access Token</Label>
                <Input
                  id="api-key"
                  placeholder="shpua_1234567890abcdef..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={loading}
                  type="password"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Copy from Settings → Apps and integrations → Develop apps → Configuration
                </p>
              </div>

              {/* API Secret */}
              <div className="space-y-2">
                <Label htmlFor="api-secret">API Secret</Label>
                <Input
                  id="api-secret"
                  placeholder="shpss_abcdef1234567890..."
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  disabled={loading}
                  type="password"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Also in Configuration section
                </p>
              </div>

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-xs text-yellow-900 ml-2">
                  Make sure your Custom App has <strong>read_orders</strong> and{' '}
                  <strong>write_orders</strong> scopes enabled
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConnectCustomApp}
                disabled={loading || !shopUrl.trim() || !apiKey.trim() || !apiSecret.trim()}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Custom App'
                )}
              </Button>
            </div>
          </TabsContent>

          {/* OAuth Tab */}
          <TabsContent value="oauth" className="space-y-4 py-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900 ml-2">
                For production Public Apps. Requires app to be installed from Shopify App Store.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="shop-url-oauth">Shopify Store URL</Label>
              <Input
                id="shop-url-oauth"
                placeholder="mystore.myshopify.com"
                value={shopUrl}
                onChange={(e) => setShopUrl(e.target.value)}
                disabled={loading}
                type="text"
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Enter your Shopify store URL
              </p>
            </div>

            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-xs text-yellow-900 ml-2">
                OAuth is for Public Apps. If you just created a Custom App, use the{' '}
                <strong>Custom App</strong> tab instead.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConnectOAuth}
                disabled={loading || !shopUrl.trim()}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect with OAuth
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          <p>
            Don't have a Shopify store?{' '}
            <a
              href="https://shopify.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Create one here
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
