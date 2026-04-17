'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

interface IntegrationCardProps {
  integration: Integration;
  onSync?: (integrationId: string) => Promise<void>;
  onDisconnect?: (integrationId: string) => Promise<void>;
  onSyncPreview?: (integrationId: string) => void;
}

export function IntegrationCard({
  integration,
  onSync,
  onDisconnect,
  onSyncPreview,
}: IntegrationCardProps) {
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const handleSync = async () => {
    if (!onSync) return;

    setSyncing(true);
    try {
      await onSync(integration.id);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!onDisconnect) return;

    setDisconnecting(true);
    try {
      await onDisconnect(integration.id);
      setShowDisconnectDialog(false);
    } finally {
      setDisconnecting(false);
    }
  };

  const isConnected = integration.status === 'connected';

  const syncStatusIcon =
    integration.syncStatus === 'SUCCESS' ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : integration.syncStatus === 'FAILED' ? (
      <XCircle className="h-4 w-4 text-red-600" />
    ) : (
      <Clock className="h-4 w-4 text-gray-400" />
    );

  return (
    <>
      <Card className={!isConnected ? 'opacity-60' : ''}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{integration.icon}</span>
            <div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <CardDescription>{integration.description}</CardDescription>
            </div>
          </div>
          <Badge
            variant={isConnected ? 'default' : 'secondary'}
            className="capitalize"
          >
            {isConnected ? '✓ Connected' : 'Not Connected'}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          {isConnected && (
            <>
              {/* Sync Status */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Sync:</span>
                <div className="flex items-center gap-2">
                  {syncStatusIcon}
                  {integration.lastSyncedAt ? (
                    <span className="text-gray-900">
                      {formatDistanceToNow(new Date(integration.lastSyncedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  ) : (
                    <span className="text-gray-500">Never synced</span>
                  )}
                </div>
              </div>

              {/* Order Stats */}
              {integration.stats && (
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-md">
                  <div>
                    <p className="text-xs text-gray-600">Total Orders</p>
                    <p className="text-lg font-semibold">
                      {integration.stats.totalOrders}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Imported</p>
                    <p className="text-lg font-semibold text-green-600">
                      {integration.stats.importedOrders}
                    </p>
                  </div>
                </div>
              )}

              {/* Connected Date */}
              {integration.connectedAt && (
                <p className="text-xs text-gray-500">
                  Connected on{' '}
                  {new Date(integration.connectedAt).toLocaleDateString()}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex-1"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Sync Orders
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onSyncPreview && onSyncPreview(integration.id)
                  }
                  disabled={syncing}
                >
                  Preview
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDisconnectDialog(true)}
                  disabled={disconnecting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {!isConnected && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-3">
                Connect your {integration.name.toLowerCase()} store to import
                orders automatically
              </p>
              <Button
                onClick={() => onSyncPreview?.(integration.id)}
                className="w-full"
              >
                Connect Store
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {integration.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect your {integration.name} store. You can reconnect
              anytime. Your imported orders will remain in the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="bg-red-600 hover:bg-red-700"
            >
              {disconnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
