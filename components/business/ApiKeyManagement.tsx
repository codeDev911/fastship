'use client';

import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Plus,
  Loader,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Alert } from '@/components/shared/Alert';
import { Badge } from '@/components/shared/Badge';
import { secureFetch } from '@/lib/secure-fetch';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scope: string;
  rateLimit: number;
  isActive: boolean;
  lastUsedAt: string | null;
  requestCount: number;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
}

interface NewKeyResponse {
  data: ApiKey & { key: string };
  message: string;
}

export function ApiKeyManagement() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNewKey, setShowNewKey] = useState<{ key: string; prefix: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state for creating new key
  const [formData, setFormData] = useState({
    name: '',
    scope: 'read',
    rateLimit: 1000,
    environment: 'test' as 'test' | 'live',
  });

  // Load API keys
  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await secureFetch('/api/auth/api-keys');

      if (!response.ok) {
        throw new Error('Failed to load API keys');
      }

      const data = await response.json();
      console.log(data);
      
      setApiKeys(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async () => {
    try {
      setError(null);

      if (!formData?.name?.trim()) {
        setError('API key name is required');
        return;
      }

      const response = await secureFetch('/api/auth/api-keys', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create API key');
      }

      const data: NewKeyResponse = await response.json();
      
      // Show the new key (only time it's visible!)
      setShowNewKey({
        key: data?.data?.key,
        prefix: data?.data?.prefix,
      });

      // Add to list
      setApiKeys([data?.data, ...apiKeys]);

      // Reset form
      setFormData({
        name: '',
        scope: 'read',
        rateLimit: 1000,
        environment: 'test',
      });

      setSuccessMessage('API key created successfully! Copy it now - you won\'t see it again!');
      setShowCreateModal(false);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);

      const response = await secureFetch(`/api/auth/api-keys/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke API key');
      }

      // Remove from list or mark as revoked
      setApiKeys(apiKeys.map(key => 
        key.id === id ? { ...key, isActive: false, revokedAt: new Date().toISOString() } : key
      ));

      setSuccessMessage('API key revoked successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke API key');
    }
  };

  const handleUpdateKey = async (id: string, updates: Partial<ApiKey>) => {
    try {
      setError(null);

      const response = await secureFetch(`/api/auth/api-keys/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update API key');
      }

      // Update in list
      setApiKeys(apiKeys.map(key =>
        key.id === id ? { ...key, ...updates } : key
      ));

      setEditingId(null);
      setSuccessMessage('API key updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update API key');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScopeColor = (scope: string) => {
    if (scope.includes('write')) return 'variant-yellow';
    if (scope.includes('admin')) return 'variant-red';
    return 'variant-blue';
  };

  return (
    <div className="space-y-6">
    

      {/* New Key Display */}
      {showNewKey && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader
            title="Your New API Key"
            description="This is the only time you'll see this key. Copy it and store it somewhere safe!"
          />
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-white p-4 font-mono text-sm">
                <div className="flex items-center justify-between gap-4">
                  <code className="text-foreground break-all">{showNewKey?.key}</code>
                  <button
                    onClick={() => copyToClipboard(showNewKey?.key, 'new-key')}
                    className="flex-shrink-0 text-green-600 hover:text-green-700"
                  >
                    {copiedId === 'new-key' ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
                ⚠️ Store this key in a secure location (e.g., environment variable, secrets manager).
                You won't be able to retrieve it later!
              </div>
              <Button
                onClick={() => setShowNewKey(null)}
                className="w-full"
              >
                I've Saved My Key
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">API Keys</h2>
          <p className="mt-1 text-muted-foreground">
            Manage API keys for third-party integrations and external applications
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="h-4 w-4" />}
        >
          Create New Key
        </Button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <Card className="border-2 border-accent">
          <CardHeader
            title="Create New API Key"
            action={
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            }
          />
          <CardContent>
            <div className="space-y-4">
                  {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="bg-green-50 border-green-200">
          <Check className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-green-800">{successMessage}</p>
          </div>
        </div>
      )}
              {/* Name */}
              
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Key Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Shopify Integration, Mobile App"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Environment */}
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Environment
                </label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value as 'test' | 'live' })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="test">Test (sk_test_...)</option>
                  <option value="live">Live (sk_live_...)</option>
                </select>
              </div>

              {/* Scope */}
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Permission Scope
                </label>
                <select
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="read">Read Only (GET requests)</option>
                  <option value="write">Write Only (POST/PUT/DELETE)</option>
                  <option value="read,write">Read & Write (Full access)</option>
                  <option value="all">Admin (All permissions)</option>
                </select>
              </div>

              {/* Rate Limit */}
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Rate Limit (requests per hour)
                </label>
                <input
                  type="number"
                  value={formData.rateLimit}
                  onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
                  min={100}
                  max={50000}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="mt-1 text-xs text-muted-foreground">Default: 1000 requests per hour</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCreateKey}
                  className="flex-1"
                >
                  Create Key
                </Button>
                <Button
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : apiKeys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No API keys yet. Create one to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <Card
              key={key.id}
              className={`${
                !key.isActive ? 'opacity-60' : ''
              }`}
            >
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingId === key.id ? (
                        <input
                          type="text"
                          value={key.name}
                          onChange={(e) =>
                            setApiKeys(
                              apiKeys.map((k) =>
                                k.id === key.id ? { ...k, name: e.target.value } : k
                              )
                            )
                          }
                          className="text-lg font-semibold text-foreground"
                          autoFocus
                        />
                      ) : (
                        <h4 className="text-lg font-semibold text-foreground">{key.name}</h4>
                      )}
                      <p className="mt-1 font-mono text-sm text-muted-foreground">{key.prefix}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!key.isActive && (
                        <Badge className="bg-red-100 text-red-800">Revoked</Badge>
                      )}
                      {key.isActive && (
                        <Badge className={`bg-green-100 text-green-800`}>Active</Badge>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {/* Scope */}
                    <div>
                      <p className="text-xs text-muted-foreground">Scope</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {key.scope.split(',').map((s) => (
                          <Badge key={s} className={`bg-blue-100 text-blue-800 text-xs`}>
                            {s.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Rate Limit */}
                    <div>
                      <p className="text-xs text-muted-foreground">Rate Limit</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {key.rateLimit}/hour
                      </p>
                    </div>

                    {/* Created */}
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatDate(key.createdAt)}
                      </p>
                    </div>

                    {/* Last Used */}
                    <div>
                      <p className="text-xs text-muted-foreground">Last Used</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatDate(key.lastUsedAt)}
                      </p>
                    </div>

                    {/* Requests */}
                    <div>
                      <p className="text-xs text-muted-foreground">Total Requests</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {key?.requestCount?.toLocaleString()}
                      </p>
                    </div>

                    {/* Expires */}
                    <div>
                      <p className="text-xs text-muted-foreground">Expires</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {key.expiresAt ? formatDate(key.expiresAt) : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Token</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {key.prefix+"***"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {key.isActive && (
                    <div className="border-t border-border pt-4">
                      <p className="mb-3 text-xs font-semibold text-muted-foreground">ACTIONS</p>
                      <div className="flex flex-wrap gap-2">
                        {editingId === key.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateKey(key.id, { name: key.name })
                              }
                              icon={<Check className="h-4 w-4" />}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              icon={<Edit2 className="h-4 w-4" />}
                              onClick={() => setEditingId(key.id)}
                            >
                              Edit Name
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className='text-white'
                              icon={<Trash2 className="h-4 w-4" />}
                              onClick={() => handleRevokeKey(key.id)}
                            >
                              Revoke
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader
          title="API Key Usage"
          description="How to use API keys in your integrations"
        />
        <CardContent>
          <div className="space-y-3 text-sm text-blue-900">
            <p>
              <strong>cURL:</strong>
              <br />
              <code className="block bg-white p-2 text-xs text-foreground">
                curl -H "Authorization: Bearer sk_test_xxx" https://api.fastship.com/api/shipments
              </code>
            </p>
            <p>
              <strong>Node.js / JavaScript:</strong>
              <br />
              <code className="block bg-white p-2 text-xs text-foreground">
              {/* `      fetch('https://api.fastship.com/api/shipments', {'{'}
                    <br />
                    &nbsp;&nbsp;headers: {'{'}Authorization: `Bearer ${'{')}apiKey{'}'}`{'}'}
                    <br />
                    {'}'})` */}
              </code>
            </p>
            <p>
              📚 See{' '}
              <a href="/docs/api-keys" className="underline hover:text-blue-700">
                full documentation
              </a>{' '}
              for more examples
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
