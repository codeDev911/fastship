'use client';

import Link from 'next/link';
import { Button } from '@fastship/ui';
import { Card, CardContent } from '@fastship/ui';
import { Truck, Briefcase, ArrowRight, Package, DollarSign, BarChart3, MapPin, Zap, Shield, Users, Clock, TrendingUp } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <div className="text-center">
            <div className="inline-block rounded-full bg-accent/10 px-4 py-2 mb-6">
              <p className="text-sm font-semibold text-accent">Welcome to FastShip</p>
            </div>
            <h1 className="text-6xl sm:text-7xl font-bold tracking-tight text-foreground mb-6">
              Modern Delivery Management
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-muted-foreground mb-8">
              The world&apos;s most secure and efficient delivery management platform. Built for drivers, sellers, and businesses who demand excellence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register/driver/apply">
                <Button variant="primary" size="lg" icon={<ArrowRight className="h-5 w-5" />}>
                  Start as Driver
                </Button>
              </Link>
              <Link href="/register/business/apply">
                <Button variant="outline" size="lg" icon={<ArrowRight className="h-5 w-5" />}>
                  Start as Business
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose FastShip?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage deliveries efficiently and securely
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <Card className="flex flex-col p-8 hover:border-accent/50 transition-colors">
            <div className="mb-4">
              <div className="inline-flex p-3 bg-accent/10 rounded-lg">
                <Zap className="h-6 w-6 text-accent" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Real-Time Tracking</h3>
            <p className="text-muted-foreground flex-1">
              Track every shipment in real-time with GPS integration and live updates
            </p>
          </Card>

          {/* Feature 2 */}
          <Card className="flex flex-col p-8 hover:border-accent/50 transition-colors">
            <div className="mb-4">
              <div className="inline-flex p-3 bg-accent/10 rounded-lg">
                <Shield className="h-6 w-6 text-accent" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Secure & Encrypted</h3>
            <p className="text-muted-foreground flex-1">
              Bank-level encryption protects all your data and transactions
            </p>
          </Card>

          {/* Feature 3 */}
          <Card className="flex flex-col p-8 hover:border-accent/50 transition-colors">
            <div className="mb-4">
              <div className="inline-flex p-3 bg-accent/10 rounded-lg">
                <Users className="h-6 w-6 text-accent" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Team Management</h3>
            <p className="text-muted-foreground flex-1">
              Manage drivers, assign shipments, and track performance metrics
            </p>
          </Card>

          {/* Feature 4 */}
          <Card className="flex flex-col p-8 hover:border-accent/50 transition-colors">
            <div className="mb-4">
              <div className="inline-flex p-3 bg-accent/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-accent" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Advanced Analytics</h3>
            <p className="text-muted-foreground flex-1">
              Get insights into delivery patterns, costs, and performance
            </p>
          </Card>

          {/* Feature 5 */}
          <Card className="flex flex-col p-8 hover:border-accent/50 transition-colors">
            <div className="mb-4">
              <div className="inline-flex p-3 bg-accent/10 rounded-lg">
                <Clock className="h-6 w-6 text-accent" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">24/7 Support</h3>
            <p className="text-muted-foreground flex-1">
              Round-the-clock support to keep your operations running smoothly
            </p>
          </Card>

          {/* Feature 6 */}
          <Card className="flex flex-col p-8 hover:border-accent/50 transition-colors">
            <div className="mb-4">
              <div className="inline-flex p-3 bg-accent/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Scale Effortlessly</h3>
            <p className="text-muted-foreground flex-1">
              Grow your business without worrying about infrastructure limits
            </p>
          </Card>
        </div>
      </div>

      {/* Role Selection */}
      <div className="bg-secondary/30 border-y border-border">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Choose Your Role</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Access your dedicated dashboard designed for your specific needs
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Driver Card */}
            <Card className="flex flex-col overflow-hidden hover:shadow-lg transition-all border-border hover:border-accent/50">
              <div className="px-8 py-12">
                <Truck className="h-12 w-12 text-accent mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">For Drivers</h3>
                <p className="text-muted-foreground mb-6">
                  Manage your deliveries and earnings
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    <span className="text-sm text-foreground">Accept shipments</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    <span className="text-sm text-foreground">Track earnings</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    <span className="text-sm text-foreground">Real-time navigation</span>
                  </li>
                </ul>
              </div>
              <div className="border-t border-border px-8 py-4">
                <Link href="/register/driver/apply" className="block">
                  <Button variant="primary" fullWidth icon={<ArrowRight className="h-4 w-4" />}>
                    Get Started
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Business Dashboard */}
            <Card className="flex flex-col overflow-hidden hover:shadow-lg transition-all border-border hover:border-accent/50">
              <div className="px-8 py-12">
                <Briefcase className="h-12 w-12 text-accent mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">For Businesses</h3>
                <p className="text-muted-foreground mb-6">
                  Manage shipments and operations
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    <span className="text-sm text-foreground">Kanban board</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    <span className="text-sm text-foreground">Driver management</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    <span className="text-sm text-foreground">Analytics & reports</span>
                  </li>
                </ul>
              </div>
              <div className="border-t border-border px-8 py-4">
                <Link href="/register/business/apply" className="block">
                  <Button variant="primary" fullWidth icon={<ArrowRight className="h-4 w-4" />}>
                    Get Started
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Seller Card */}
            <Card className="flex flex-col overflow-hidden hover:shadow-lg transition-all border-border hover:border-accent/50">
              <div className="px-8 py-12">
                <Package className="h-12 w-12 text-accent mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">For Sellers</h3>
                <p className="text-muted-foreground mb-6">
                  Ship products and manage orders
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    <span className="text-sm text-foreground">Order management</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    <span className="text-sm text-foreground">Auto-fulfillment</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    <span className="text-sm text-foreground">Rate calculator</span>
                  </li>
                </ul>
              </div>
              <div className="border-t border-border px-8 py-4">
                <Link href="/register/seller/apply" className="block">
                  <Button variant="primary" fullWidth icon={<ArrowRight className="h-4 w-4" />}>
                    Get Started
                  </Button>
                </Link>
              </div>
            </Card>
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
