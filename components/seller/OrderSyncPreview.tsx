'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, AlertCircle } from 'lucide-react';

interface ShopifyOrderPreview {
  id: string;
  orderNumber: string;
  email: string;
  totalPrice: string;
  createdAt: string;
  shippingAddress?: {
    firstName: string;
    lastName: string;
    city: string;
    state: string;
  };
  lineItems?: Array<{
    title: string;
    quantity: number;
  }>;
}

interface OrderSyncPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integrationId: string;
  onImport?: (orderIds: string[]) => Promise<void>;
}

export function OrderSyncPreview({
  open,
  onOpenChange,
  integrationId,
  onImport,
}: OrderSyncPreviewProps) {
  const [orders, setOrders] = useState<ShopifyOrderPreview[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    if (open && integrationId) {
      fetchAvailableOrders();
    }
  }, [open, integrationId]);

  const fetchAvailableOrders = async () => {
    setLoading(true);
    setError(null);
    setSelectedOrders(new Set());

    try {
      const response = await fetch(
        `/api/integrations/shopify/orders?integrationId=${integrationId}&limit=100`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.data?.orders || []);
      setTotalOrders(data.data?.pagination?.total || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch available orders'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (orderId: string, e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleRowClick = (orderId: string) => {
    handleSelectOrder(orderId);
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map((o) => o.id)));
    }
  };

  const handleImport = async () => {
    if (!onImport || selectedOrders.size === 0) return;

    setImporting(true);
    try {
      await onImport(Array.from(selectedOrders));
      // Close dialog and reset on success
      setSelectedOrders(new Set());
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to import orders'
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Preview & Import Orders</DialogTitle>
          <DialogDescription>
            Select orders to import into FastShip. You can import multiple orders
            at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">Loading available orders...</p>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <Alert>
              <AlertDescription>
                No orders available to import. All orders may already be imported.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Order Count */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">
                  {totalOrders} total orders available • {selectedOrders.size}{' '}
                  selected
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedOrders.size === orders.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              </div>

              {/* Orders Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            orders.length > 0 &&
                            selectedOrders.size === orders.length
                          }
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all orders"
                        />
                      </TableHead>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow
                        key={order.id}
                        onClick={() => handleRowClick(order.id)}
                        className={`cursor-pointer ${
                          selectedOrders.has(order.id)
                            ? 'bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <TableCell onClick={(e) => {
                          e.stopPropagation();
                          handleSelectOrder(order.id);
                        }}>
                          <Checkbox
                            checked={selectedOrders.has(order.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedOrders);
                              if (checked) {
                                newSelected.add(order.id);
                              } else {
                                newSelected.delete(order.id);
                              }
                              setSelectedOrders(newSelected);
                            }}
                            aria-label={`Select order ${order.orderNumber}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm font-semibold">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {order.shippingAddress?.firstName}{' '}
                              {order.shippingAddress?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {order.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {order.shippingAddress?.city},{' '}
                          {order.shippingAddress?.state}
                        </TableCell>
                        <TableCell className="font-semibold">
                          Rs{parseFloat(order.totalPrice).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Items preview for selected order */}
              {selectedOrders.size === 1 && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium mb-2">Order Items:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {orders
                      .find((o) => selectedOrders.has(o.id))
                      ?.lineItems?.map((item, idx) => (
                        <li key={idx}>
                          • {item.title} (x{item.quantity})
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={importing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                importing ||
                selectedOrders.size === 0 ||
                loading ||
                orders.length === 0
              }
              className="flex-1"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing {selectedOrders.size} order
                  {selectedOrders.size !== 1 ? 's' : ''}...
                </>
              ) : (
                <>
                  Import ({selectedOrders.size}/{orders.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
