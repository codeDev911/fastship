'use client';

import { useState } from 'react';
import { Card } from '@fastship/ui';
import { CheckCircle2, Circle, ChevronDown } from 'lucide-react';

export default function OrderProcessPage() {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  const phases = [
    {
      id: 'phase1',
      title: 'Order Creation & Escrow Lock',
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
      title: 'Payment Processing',
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
      title: 'Fulfillment & Shipment',
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
      title: 'Transit & Delivery',
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
      title: 'Delivery Confirmation',
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
      title: 'Settlement',
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
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Complete Order Process</h1>
          <p className="text-lg text-muted-foreground">From creation to delivery and settlement</p>
        </div>

        {/* Timeline Overview */}
        <Card className="p-8 mb-12 border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-8">Order Lifecycle</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '1', title: 'Creation', desc: 'Order placed & escrow locked' },
              { num: '2', title: 'Fulfillment', desc: 'Seller prepares order' },
              { num: '3', title: 'Transit', desc: 'Driver delivers order' },
              { num: '4', title: 'Confirmation', desc: 'Buyer confirms delivery' },
              { num: '5', title: 'Hold Period', desc: '7-day protection period' },
              { num: '6', title: 'Settlement', desc: 'Funds released' },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground font-bold flex items-center justify-center mb-3">
                  {item.num}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Phases */}
        <div className="space-y-4">
          {phases.map((phase) => (
            <Card key={phase.id} className="border border-border overflow-hidden">
              <button
                onClick={() => togglePhase(phase.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-secondary/20 transition-colors"
              >
                <div className="flex items-center gap-4 text-left">
                  <Circle className="h-6 w-6 text-accent flex-shrink-0" />
                  <h3 className="text-lg font-bold text-foreground">{phase.title}</h3>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    expandedPhase === phase.id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedPhase === phase.id && (
                <div className="border-t border-border px-6 py-6 bg-secondary/10">
                  <p className="text-muted-foreground mb-6">{phase.details}</p>
                  <h4 className="font-semibold text-foreground mb-4">Steps:</h4>
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
          ))}
        </div>

        {/* Key Features */}
        <Card className="p-8 mt-12 border border-border bg-accent/5">
          <h2 className="text-2xl font-bold text-foreground mb-6">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'Escrow Protection', desc: 'Funds are held securely and only released after delivery confirmation' },
              { title: 'Real-Time Tracking', desc: 'GPS tracking keeps both parties informed throughout the journey' },
              { title: '7-Day Hold Period', desc: 'Buyers have time to report issues without losing their money' },
              { title: 'Dispute Resolution', desc: 'Our system handles conflicts fairly for both parties' },
              { title: 'Transparent Pricing', desc: 'No hidden fees or surprise charges' },
              { title: '24/7 Support', desc: 'Round-the-clock assistance for any order issues' },
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-4">
                <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
