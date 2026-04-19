'use client';

import React, { useState, useEffect } from 'react';
import { BusinessLayout } from '@fastship/ui';
import { DriversList } from '@fastship/ui';
import { useNotifications } from '@fastship/lib';
import { Card, CardContent } from '@fastship/ui';
import { Button } from '@fastship/ui';
import { Input } from '@fastship/ui';
import { Search, Plus } from 'lucide-react';
import { secureFetch } from '@fastship/lib';

export default function BusinessDriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { getUnreadCount } = useNotifications();

  const unreadCount = getUnreadCount();

  // Fetch business drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const businessId = user?.jobId
      try {
        setIsLoading(true);
        const response = await secureFetch(`/api/business/drivers?businessId=${businessId}`);
        if (response.ok) {
          const data = await response.json();
          setDrivers(data.data);
        }
      } catch (error) {
        console.error('[v0] Error fetching drivers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  // Search drivers
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await secureFetch(
        `/api/drivers/search?q=${encodeURIComponent(query)}&type=all&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error('[v0] Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Add driver to business
  const handleAddDriver = async (driverId: string) => {
    try {
      const response = await secureFetch('/api/business/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, driverId }),
      });

      if (response.ok) {
        const newDriver = await response.json();
        setDrivers((prev) => [...prev, newDriver.driver]);
        setSearchResults((prev) => prev.filter((d) => d.id !== driverId));
        setSearchQuery('');
        alert('Driver added successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('[v0] Add driver error:', error);
      alert('Failed to add driver');
    }
  };

  return (
    <BusinessLayout currentPage="drivers" unreadNotifications={unreadCount}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Driver Management</h1>
            <p className="mt-2 text-muted-foreground">Add and manage drivers for your business</p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowSearch(!showSearch)}
          >
            Add Driver
          </Button>
        </div>

        {/* Search Section */}
        {showSearch && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Input
                  placeholder="Search by ID, email, name, or vehicle number..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
                {isSearching && <p className="text-sm text-muted-foreground">Searching...</p>}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((driver) => (
                      <div
                        key={driver.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-foreground">{driver.name}</p>
                          <p className="text-sm text-muted-foreground">{driver.email}</p>
                          <p className="text-xs text-muted-foreground">{driver.vehicleNumber}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleAddDriver(driver.id)}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Drivers List */}
        <DriversList drivers={drivers} isLoading={isLoading} />
      </div>
    </BusinessLayout>
  );
}
