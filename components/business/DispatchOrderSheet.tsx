'use client';

import React, { useState } from 'react';
import { DispatchOrder, FleetDriver, AutoDispatchSettings } from '@/lib/types';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { X, MapPin, Phone, Truck, Send, Settings, Star } from 'lucide-react';
import { mockFleetDrivers } from '@/lib/mock-data';

interface DispatchOrderSheetProps {
  order: DispatchOrder | null;
  isOpen: boolean;
  onClose: () => void;
  fleetDrivers: FleetDriver[];
  settings: AutoDispatchSettings;
}

export function DispatchOrderSheet({
  order,
  isOpen,
  onClose,
  fleetDrivers,
  settings,
}: DispatchOrderSheetProps) {
  const [activeTab, setActiveTab] = useState<'fleet' | 'marketplace'>('fleet');
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  if (!order) return null;

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700',
    assigned: 'bg-purple-50 text-purple-700',
    'in-transit': 'bg-blue-50 text-blue-700',
    delivered: 'bg-green-50 text-green-700',
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      )}

      {/* Sheet */}
      <div
        className={`fixed right-0 top-0 z-50 h-screen w-full max-w-2xl bg-white shadow-lg transition-transform duration-300 overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="sticky top-0 border-b border-border bg-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{order.orderId}</h2>
            <p className="text-sm text-muted-foreground mt-1">{order.customerName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Details */}
          <Card>
            <CardHeader title="Order Details" />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Weight</p>
                  <p className="text-lg font-semibold text-foreground">{order.weight} kg</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                  <Badge variant={statusColors[order.status]}>{order.status}</Badge>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Pickup Address</p>
                <div className="flex gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  <p className="text-sm text-foreground">{order.pickupAddress}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Delivery Address</p>
                <div className="flex gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  <p className="text-sm text-foreground">{order.deliveryAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dispatch Strategy */}
          <Card>
            <CardHeader
              title="Dispatch Strategy"
              action={
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                  title="Auto-Dispatch Settings"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </button>
              }
            />
            <CardContent>
              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-border">
                <button
                  onClick={() => setActiveTab('fleet')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'fleet'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Internal Fleet
                </button>
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'marketplace'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Marketplace Broadcast
                </button>
              </div>

              {/* Fleet Tab */}
              {activeTab === 'fleet' && (
                <div className="space-y-3">
                  {fleetDrivers.map((driver) => (
                    <div
                      key={driver.id}
                      className={`rounded-2xl border-2 p-4 cursor-pointer transition-all ${selectedDriver === driver.id
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/50'
                        }`}
                      onClick={() => setSelectedDriver(driver.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{driver.name}</h4>
                          <div className="mt-2 space-y-1 text-sm">
                            <p className="text-muted-foreground flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              {driver.vehicleType
                                ? driver?.vehicleType?.charAt(0)?.toUpperCase() + driver.vehicleType?.slice(1)
                                : 'Unknown Vehicle'} • {driver.vehicleNumber}
                            </p>
                            <p className="text-muted-foreground flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {driver.distanceFromPickup} km away
                            </p>
                            <p className="text-muted-foreground flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              {driver.rating} ({driver.totalDeliveries} deliveries)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${driver.status === 'idle'
                              ? 'bg-green-50 text-green-700'
                              : driver.status === 'busy'
                                ? 'bg-orange-50 text-orange-700'
                                : 'bg-gray-50 text-gray-700'
                              }`}
                          >
                            {driver.status
                              ? driver?.status?.charAt(0)?.toUpperCase() + driver?.status?.slice(1)
                              : 'Unknown'}
                          </span>
                        </div>
                      </div>

                      {selectedDriver === driver.id && (
                        <Button
                          variant="primary"
                          fullWidth
                          className="mt-4"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          Assign Directly
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Marketplace Tab */}
              {activeTab === 'marketplace' && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-accent/10 border border-accent/20 p-6">
                    <p className="text-sm text-muted-foreground mb-2">Estimated Marketplace Rate</p>
                    <p className="text-3xl font-bold text-accent">{order.estimatedMarketplaceRate} PKR</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on weight ({order.weight}kg) and destination ({order.destinationCity})
                    </p>
                  </div>

                  <div className="rounded-2xl bg-foreground/5 border border-border p-4">
                    <p className="text-sm text-muted-foreground mb-3">Broadcasting will:</p>
                    <ul className="text-sm space-y-2 text-foreground">
                      <li>• Send request to all nearby marketplace drivers</li>
                      <li>• Collect bids from interested couriers</li>
                      <li>• Respect max bid limit of {settings.maxMarketplaceBidLimit} PKR</li>
                    </ul>
                  </div>

                  <Button
                    variant="primary"
                    fullWidth
                    icon={<Send className="h-4 w-4" />}
                  >
                    Broadcast to Local Drivers
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Auto-Dispatch Settings Modal */}
      {showSettingsModal && (
        <AutoDispatchSettingsModal
          settings={settings}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </>
  );
}

function AutoDispatchSettingsModal({
  settings,
  onClose,
}: {
  settings: AutoDispatchSettings;
  onClose: () => void;
}) {
  const [autoBroadcast, setAutoBroadcast] = useState(settings.autoBroadcastToMarketplace);
  const [bidLimit, setBidLimit] = useState(settings.maxMarketplaceBidLimit);

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white shadow-xl">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Auto-Dispatch Settings</h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Auto-Broadcast Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-medium text-foreground">Auto-Broadcast to Marketplace</label>
              <button
                onClick={() => setAutoBroadcast(!autoBroadcast)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${autoBroadcast ? 'bg-accent' : 'bg-secondary'
                  }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${autoBroadcast ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Automatically broadcast to marketplace if no internal driver is available within {settings.autoBroadcastDelay} minutes
            </p>
          </div>

          {/* Max Bid Limit */}
          <div className="space-y-3">
            <label htmlFor="bidLimit" className="block font-medium text-foreground">
              Maximum Marketplace Bid Limit
            </label>
            <div className="flex items-center gap-2">
              <input
                id="bidLimit"
                type="number"
                value={bidLimit}
                onChange={(e) => setBidLimit(Number(e.target.value))}
                className="flex-1 rounded-full border border-border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Enter maximum bid limit"
              />
              <span className="text-foreground font-semibold">PKR</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Bids exceeding this amount will be automatically rejected
            </p>
          </div>

          {/* Save Button */}
          <Button variant="primary" fullWidth>
            Save Settings
          </Button>
        </div>
      </div>
    </>
  );
}
