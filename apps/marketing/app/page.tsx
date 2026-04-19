'use client';

import Link from 'next/link';
import { Button } from '@fastship/ui';
import { Card, CardContent } from '@fastship/ui';
import { Truck, Briefcase, ArrowRight, Package, DollarSign, BarChart3, Eye, Store, Gavel } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Hero Section */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <div className="text-center">
            <div className="inline-block rounded-lg bg-accent/10 px-4 py-2 mb-4">
              <p className="text-sm font-semibold text-accent">FastShip Delivery Platform</p>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
              Fast. Secure. Modern.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-xl text-muted-foreground">
              The world&apos;s most modern delivery management platform. Choose your role to get started.
            </p>
          </div>
        </div>
      </div>

      {/* Role Selection */}
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Choose Your Dashboard</h2>
          <p className="text-muted-foreground">Select your role to access the appropriate dashboard</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Business Dashboard */}
          <Card className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
            <div className="bg-gradient-to-r from-accent/20 to-orange-500/20 px-6 py-8">
              <Briefcase className="h-12 w-12 text-accent mb-4" />
              <h3 className="text-2xl font-bold text-foreground">Business Manager</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage shipments, drivers, and analytics
              </p>
            </div>

            <CardContent className="flex-1 space-y-4 pt-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Shipment Kanban Board</p>
                    <p className="text-sm text-muted-foreground">Drag-and-drop shipment management across 5 stages</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Driver Management</p>
                    <p className="text-sm text-muted-foreground">Assign drivers and track performance</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Advanced Analytics</p>
                    <p className="text-sm text-muted-foreground">Real-time insights and reporting</p>
                  </div>
                </div>
              </div>
            </CardContent>

            <div className="border-t border-border px-6 py-4">
              <Link href="/business/overview" className="block">
                <Button variant="primary" fullWidth icon={<ArrowRight className="h-4 w-4" />}>
                  Enter Business Dashboard
                </Button>
              </Link>
            </div>
          </Card>

          {/* Driver Dashboard */}
          <Card className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-6 py-8">
              <Truck className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold text-foreground">Delivery Driver</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Track deliveries and monitor earnings
              </p>
            </div>

            <CardContent className="flex-1 space-y-4 pt-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">My Orders</p>
                    <p className="text-sm text-muted-foreground">View and manage assigned deliveries</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Income Tracking</p>
                    <p className="text-sm text-muted-foreground">Monitor earnings and payouts</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Performance Stats</p>
                    <p className="text-sm text-muted-foreground">Track ratings and delivery history</p>
                  </div>
                </div>
              </div>
            </CardContent>

            <div className="border-t border-border px-6 py-4">
              <Link href="/driver/overview" className="block">
                <Button variant="primary" fullWidth icon={<ArrowRight className="h-4 w-4" />}>
                  Enter Driver Dashboard
                </Button>
              </Link>
            </div>
          </Card>

          {/* Seller Dashboard */}
          <Card className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-6 py-8">
              <Store className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-2xl font-bold text-foreground">Seller Dashboard</h3>
              <p className="mt-2 text-muted-foreground">
                Manage orders and find logistics providers
              </p>
            </div>

            <CardContent className="flex-1 px-6 py-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Order Management</p>
                    <p className="text-sm text-muted-foreground">Track and manage all your shipments</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Gavel className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Bidding Marketplace</p>
                    <p className="text-sm text-muted-foreground">Find best courier rates instantly</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Wallet Management</p>
                    <p className="text-sm text-muted-foreground">Prepaid balance and billing</p>
                  </div>
                </div>
              </div>
            </CardContent>

            <div className="border-t border-border px-6 py-4">
              <Link href="/seller/overview" className="block">
                <Button variant="primary" fullWidth icon={<ArrowRight className="h-4 w-4" />}>
                  Enter Seller Dashboard
                </Button>
              </Link>
            </div>
          </Card>

          {/* Customer Tracking */}
          <Card className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-6 py-8">
              <Eye className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold text-foreground">Track Order</h3>
              <p className="mt-2 text-muted-foreground">
                Follow your delivery in real-time
              </p>
            </div>

            <CardContent className="flex-1 px-6 py-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Eye className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Real-time Tracking</p>
                    <p className="text-sm text-muted-foreground">Monitor your shipment status</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Order Details</p>
                    <p className="text-sm text-muted-foreground">View all order information</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Driver Info</p>
                    <p className="text-sm text-muted-foreground">Contact your delivery driver</p>
                  </div>
                </div>
              </div>
            </CardContent>

            <div className="border-t border-border px-6 py-4">
              <Link href="/track" className="block">
                <Button variant="primary" fullWidth icon={<ArrowRight className="h-4 w-4" />}>
                  Track Order
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="border-t border-border bg-gray-50/50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Platform Features
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                    <Package className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground">Smart Shipments</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Manage shipments with our intuitive Kanban board system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                    <Truck className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground">Real-time Tracking</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Track deliveries in real-time with live updates
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                    <DollarSign className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground">Income Management</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Transparent earnings tracking and secure payouts
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 FastShip. Secure, Fast, and Modern Delivery Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
