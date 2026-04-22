'use client';

import { useState } from 'react';
import { Card } from '@fastship/ui';
import { CheckCircle2, ChevronDown, Zap, Shield, Clock, Users, TrendingUp, Lock } from 'lucide-react';

export default function OrderProcessPage() {
  const [expandedPhase, setExpandedPhase] = useState<string | null>('phase1');

  const phases = [
    {
      id: 'phase1',
      number: '01',
      title: 'Order Creation & Escrow Lock',
      icon: Lock,
      steps: [
        'Buyer places order on platform',
        'Order details and payment collected',
        'Funds held in secure escrow account',
        'Order status set to pending',
      ],
      details: 'When an order is created, the buyer provides all necessary details and payment. Our system automatically locks the funds in a secure escrow account, protecting both parties. The seller receives immediate notification and can begin preparation.'
    },
    {
      id: 'phase2',
      number: '02',
      title: 'Payment Processing',
      icon: TrendingUp,
      steps: [
        'Seller confirms order receipt',
        'Payment verification completed',
        'Escrow status locked',
        'Seller preparation begins',
      ],
      details: 'Once confirmed, the payment is verified and the escrow is locked. The seller cannot dispute this and must fulfill the order as specified. This phase ensures both parties are committed to the transaction.'
    },
    {
      id: 'phase3',
      number: '03',
      title: 'Fulfillment & Shipment',
      icon: Zap,
      steps: [
        'Seller prepares order',
        'Quality check performed',
        'Packaging completed',
        'Ready for pickup',
      ],
      details: 'The seller prepares and packages the order according to the specifications. A final quality check ensures everything meets requirements. Once ready, the order awaits pickup from our delivery network.'
    },
    {
      id: 'phase4',
      number: '04',
      title: 'Transit & Delivery',
      icon: Users,
      steps: [
        'Driver assigned to order',
        'Real-time GPS tracking active',
        'Order in transit',
        'Delivery attempted',
      ],
      details: 'Our system assigns the best available driver based on location and capacity. Real-time GPS tracking keeps the buyer informed every step of the way. The driver ensures safe handling and timely delivery.'
    },
    {
      id: 'phase5',
      number: '05',
      title: 'Delivery Confirmation',
      icon: Clock,
      steps: [
        'Order delivered',
        'Buyer signs for receipt',
        'Delivery photo captured',
        'Status updated',
      ],
      details: 'Once delivered, the buyer must confirm receipt. A photo is captured for proof of delivery. Both parties receive confirmation, and the order officially completes.'
    },
    {
      id: 'phase6',
      number: '06',
      title: 'Settlement & Funds Release',
      icon: Shield,
      steps: [
        '7-day hold period begins',
        'Buyer can open dispute',
        'Hold period expires',
        'Funds released to seller',
      ],
      details: 'After delivery confirmation, a 7-day hold period allows the buyer to request refunds if there are issues. Once this period expires without disputes, funds are automatically released to the seller.'
    },
  ];

  const togglePhase = (id: string) => {
    setExpandedPhase(expandedPhase === id ? null : id);
  };

  return (
    <div className="w-full bg-background">
      {/* Hero Section */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <div className="text-center">
            <div className="inline-block rounded-full bg-accent/10 px-4 py-2 mb-6">
              <p className="text-sm font-semibold text-accent">Order Management</p>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground mb-6">
              Complete Order <span className="text-accent">Lifecycle</span>
            </h1>
            <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
              Understand how FastShip handles orders from creation to settlement, ensuring security and transparency at every step
            </p>
          </div>
        </div>
      </section>

      {/* Visual Timeline */}
      <section className="border-b border-border/40 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Six-Phase Process</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {phases.map((phase, idx) => {
              const Icon = phase.icon;
              return (
                <div key={phase.id} className="relative">
                  <Card className="p-6 border border-border/40 hover:border-accent/20 transition-colors h-full">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-accent" />
                      </div>
                      <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-accent text-background font-bold text-sm">
                        {phase.number}
                      </div>
                    </div>
                    <h3 className="font-bold text-foreground text-lg mb-2">{phase.title}</h3>
                    <p className="text-sm text-muted-foreground">{phase.details.substring(0, 100)}...</p>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detailed Phases */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
          <h2 className="text-3xl font-bold text-foreground mb-12">Phase Details</h2>
          
          <div className="space-y-4">
            {phases.map((phase) => {
              const Icon = phase.icon;
              return (
                <Card key={phase.id} className="border border-border/40 overflow-hidden">
                  <button
                    onClick={() => togglePhase(phase.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/10">
                        <Icon className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-accent">{phase.number}</p>
                        <h3 className="text-lg font-bold text-foreground">{phase.title}</h3>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${
                        expandedPhase === phase.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {expandedPhase === phase.id && (
                    <div className="border-t border-border/40 px-6 py-6 bg-secondary/10">
                      <p className="text-muted-foreground mb-6">{phase.details}</p>
                      <h4 className="font-semibold text-foreground mb-4">Steps in this phase:</h4>
                      <ul className="space-y-3">
                        {phase.steps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-foreground">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="bg-secondary/30 border-b border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Why This Process Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <Shield className="h-6 w-6 text-accent flex-shrink-0" />
              <div>
                <h3 className="font-bold text-foreground mb-2">Escrow Protection</h3>
                <p className="text-muted-foreground">Funds are held in escrow until delivery is confirmed, protecting both buyers and sellers from fraud</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Clock className="h-6 w-6 text-accent flex-shrink-0" />
              <div>
                <h3 className="font-bold text-foreground mb-2">7-Day Protection Period</h3>
                <p className="text-muted-foreground">Buyers have a full week to report issues or request refunds before funds are released</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Zap className="h-6 w-6 text-accent flex-shrink-0" />
              <div>
                <h3 className="font-bold text-foreground mb-2">Real-Time Tracking</h3>
                <p className="text-muted-foreground">GPS tracking provides complete transparency throughout the delivery process</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Users className="h-6 w-6 text-accent flex-shrink-0" />
              <div>
                <h3 className="font-bold text-foreground mb-2">Photo Proof</h3>
                <p className="text-muted-foreground">Delivery photos create an undisputable record of order completion</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
