'use client';

import Link from 'next/link';
import { Button } from '@fastship/ui';
import { Card } from '@fastship/ui';
import {
  Truck,
  Briefcase,
  ArrowRight,
  Package,
  DollarSign,
  BarChart3,
  MapPin,
  Zap,
  Shield,
  Users,
  Clock,
  Store,
  CheckCircle,
  ArrowUpRight,
  Globe,
  Lock,
  Smartphone,
  Headphones,
  Calculator,
} from 'lucide-react';

export default function HomePage() {
  const stats = [
    { label: 'Active Deliveries', value: '10K+', icon: Package },
    { label: 'Partner Networks', value: '500+', icon: Users },
    { label: 'Success Rate', value: '99.8%', icon: CheckCircle },
    { label: 'Daily Transactions', value: '$2M+', icon: DollarSign },
  ];

  const features = [
    {
      id: 1,
      title: 'Real-Time Tracking',
      description: 'Track every delivery in real-time with GPS precision. Know exactly where your packages are at any moment.',
      icon: MapPin,
    },
    {
      id: 2,
      title: 'Smart Rate Calculator',
      description: 'Get instant quotes from multiple providers. Compare rates and choose the best option for your needs.',
      icon: Calculator,
    },
    {
      id: 3,
      title: 'Secure Payments',
      description: 'Industry-leading encryption and secure escrow system. Your money is always protected.',
      icon: Lock,
    },
    {
      id: 4,
      title: 'Driver Network',
      description: 'Access to verified drivers and logistics partners. Flexible and reliable delivery solutions.',
      icon: Truck,
    },
    {
      id: 5,
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights into your deliveries. Track costs, performance, and optimize operations.',
      icon: BarChart3,
    },
    {
      id: 6,
      title: '24/7 Support',
      description: 'Round-the-clock customer support. We are always here to help you succeed.',
      icon: Headphones,
    },
  ];

  const roles = [
    {
      title: 'For Drivers',
      description: 'Earn flexible income on your schedule',
      icon: Truck,
      benefits: [
        'Flexible working hours',
        'Multiple earning opportunities',
        'Performance bonuses',
        'Vehicle insurance coverage',
      ],
      href: '/register/driver/apply',
      cta: 'Start Earning Today',
    },
    {
      title: 'For Sellers',
      description: 'Streamline your fulfillment process',
      icon: Store,
      benefits: [
        'Auto-fulfillment system',
        'Real-time tracking',
        'Competitive rates',
        'Easy integration',
      ],
      href: '/register/seller',
      cta: 'Get Started',
    },
    {
      title: 'For Businesses',
      description: 'Scale your logistics operations',
      icon: Briefcase,
      benefits: [
        'Bulk rate discounts',
        'API integration',
        'Custom reporting',
        'Dedicated support',
      ],
      href: '/register/business/apply',
      cta: 'Explore Solutions',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Create Account',
      description: 'Sign up as a driver, seller, or business owner in minutes.',
    },
    {
      number: '02',
      title: 'Get Verified',
      description: 'Complete verification for instant access to the platform.',
    },
    {
      number: '03',
      title: 'Start Operating',
      description: 'Begin accepting deliveries or orders immediately.',
    },
    {
      number: '04',
      title: 'Grow & Scale',
      description: 'Expand your business with our advanced tools and analytics.',
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative border-b border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-block rounded-full bg-accent/10 px-4 py-2 mb-6">
              <p className="text-sm font-semibold text-accent flex items-center gap-2">
                <Zap className="h-4 w-4" />
                The Future of Delivery is Here
              </p>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Modern Delivery <span className="text-accent">Management</span> Platform
            </h1>

            {/* Subheading */}
            <p className="mx-auto max-w-3xl text-lg sm:text-xl text-muted-foreground mb-10">
              The most secure, efficient, and user-friendly platform for managing deliveries. Connect drivers, sellers, and businesses in one unified ecosystem.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
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

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 items-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Trusted by 10K+ users</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <span>Bank-level security</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <span>Instant onboarding</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-border/40 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex flex-col items-center text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-accent/10 mb-4">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-b border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Powerful Features for Everyone
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage deliveries efficiently, securely, and at scale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.id} className="p-8 border border-border/40 hover:border-accent/20 transition-colors group">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-accent/10 mb-4 group-hover:bg-accent/20 transition-colors">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-b border-border/40 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Simple & Quick Setup
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our streamlined onboarding process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 -right-3 w-6 h-0.5 bg-gradient-to-r from-accent to-transparent" />
                )}

                {/* Step Card */}
                <Card className="p-8 border border-border/40 relative">
                  <div className="absolute -top-4 -left-4">
                    <div className="h-12 w-12 rounded-lg bg-accent text-background flex items-center justify-center font-bold text-lg">
                      {step.number}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 mt-4">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Built for Every Role
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tailored solutions for drivers, sellers, and businesses of all sizes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <Card key={role.title} className="p-8 border border-border/40 hover:border-accent/20 transition-all group flex flex-col">
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-lg bg-accent/10 mb-6 group-hover:bg-accent/20 transition-colors">
                    <Icon className="h-7 w-7 text-accent" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-foreground mb-2">{role.title}</h3>
                  <p className="text-muted-foreground mb-6 flex-grow">{role.description}</p>

                  <ul className="space-y-3 mb-8">
                    {role.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={role.href}>
                    <Button
                      variant="outline"
                      fullWidth
                      icon={<ArrowRight className="h-4 w-4" />}
                      className="group-hover:bg-accent group-hover:text-background transition-colors"
                    >
                      {role.cta}
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-b border-border/40 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No hidden fees. Pay only for what you use
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <Card className="p-8 border border-border/40">
              <h3 className="text-xl font-bold text-foreground mb-2">For Drivers</h3>
              <p className="text-muted-foreground text-sm mb-6">Flexible earning</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">Free</span>
                <p className="text-sm text-muted-foreground mt-2">Start earning immediately</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                  <span>Access to orders</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                  <span>Real-time tracking</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                  <span>Instant payouts</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                  <span>Insurance coverage</span>
                </li>
              </ul>
              <Link href="/register/driver/apply">
                <Button variant="outline" fullWidth>
                  Get Started
                </Button>
              </Link>
            </Card>

            {/* Professional */}
            <Card className="p-8 border-2 border-accent relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-accent text-background px-3 py-1 rounded-full text-xs font-bold">POPULAR</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">For Sellers</h3>
              <p className="text-muted-foreground text-sm mb-6">Auto-fulfillment</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">2%</span>
                <p className="text-sm text-muted-foreground mt-2">Per order commission</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                  <span>Auto-fulfillment</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                  <span>Rate calculator</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                  <span>Analytics dashboard</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Link href="/register/seller/page">
                <Button variant="primary" fullWidth>
                  Get Started
                </Button>
              </Link>
            </Card>

            {/* Enterprise */}
            <Card className="p-8 border border-border/40">
              <h3 className="text-xl font-bold text-foreground mb-2">For Businesses</h3>
              <p className="text-muted-foreground text-sm mb-6">Scale at your pace</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">Custom</span>
                <p className="text-sm text-muted-foreground mt-2">Contact sales for pricing</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                  <span>API integration</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                  <span>Bulk discounts</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                  <span>Custom reporting</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                  <span>Dedicated support</span>
                </li>
              </ul>
              <Link href="/register/business/apply">
                <Button variant="outline" fullWidth>
                  Contact Sales
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Ready to Transform Your Delivery Business?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of drivers, sellers, and businesses already using FastShip to streamline their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register/driver/apply">
              <Button size="lg" icon={<ArrowRight className="h-5 w-5" />}>
                Get Started Free
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" icon={<ArrowUpRight className="h-5 w-5" />}>
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-secondary/30 border-b border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Why Choose FastShip?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Industry-leading features and support
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <Globe className="h-6 w-6 text-accent flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Global Network</h3>
                <p className="text-muted-foreground">Connect with delivery partners across the country</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Lock className="h-6 w-6 text-accent flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Bank-Level Security</h3>
                <p className="text-muted-foreground">Your data and transactions are always protected</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Smartphone className="h-6 w-6 text-accent flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Mobile-First Design</h3>
                <p className="text-muted-foreground">Manage everything from your smartphone</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Headphones className="h-6 w-6 text-accent flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">24/7 Support</h3>
                <p className="text-muted-foreground">Our team is always here to help you succeed</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
