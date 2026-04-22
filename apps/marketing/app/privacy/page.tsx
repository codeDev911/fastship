'use client';

import { Card } from '@fastship/ui';
import { Lock, Eye, Database, Shield, Clock, Users, FileText, AlertCircle } from 'lucide-react';

export default function PrivacyPage() {
  const sections = [
    {
      icon: Eye,
      title: 'Information We Collect',
      content: [
        'Account Information: Name, email, phone number, address',
        'Payment Information: Bank details, payment method (processed securely)',
        'Delivery Information: Pickup/delivery addresses, package contents',
        'Location Data: GPS coordinates during deliveries (for drivers)',
        'Usage Data: How you interact with our platform',
        'Device Information: IP address, browser type, device type'
      ]
    },
    {
      icon: Database,
      title: 'How We Use Your Data',
      content: [
        'Process and fulfill orders and deliveries',
        'Communicate with you about your account and orders',
        'Improve our services and user experience',
        'Prevent fraud and illegal activity',
        'Comply with legal obligations',
        'Analytics and research to enhance our platform'
      ]
    },
    {
      icon: Lock,
      title: 'Data Security',
      content: [
        'Bank-level encryption for all data transmission',
        'Secure password hashing and authentication',
        'Regular security audits and penetration testing',
        'Access controls and role-based permissions',
        'Compliance with GDPR and data protection regulations',
        'Data backups and disaster recovery procedures'
      ]
    },
    {
      icon: Users,
      title: 'Third-Party Sharing',
      content: [
        'Payment processors: To securely process payments',
        'Delivery partners: Only essential delivery information',
        'Analytics providers: Anonymous usage data only',
        'Law enforcement: Only when legally required',
        'We do NOT sell your personal data to third parties',
        'You control what information is shared'
      ]
    },
    {
      icon: Clock,
      title: 'Data Retention',
      content: [
        'Active account data: Retained while your account is active',
        'Transaction records: Kept for 7 years for legal compliance',
        'Delivery records: Maintained for dispute resolution',
        'You can request data deletion: Subject to legal requirements',
        'Personal data is securely deleted upon request',
        'Some data may be retained for fraud prevention'
      ]
    },
    {
      icon: Shield,
      title: 'Your Rights',
      content: [
        'Access: You can request a copy of your personal data',
        'Correction: Update inaccurate information anytime',
        'Deletion: Request removal of your data (with exceptions)',
        'Portability: Export your data in standard format',
        'Withdraw Consent: Opt-out of non-essential data collection',
        'Lodge Complaints: Contact our DPO for privacy concerns'
      ]
    }
  ];

  return (
    <div className="w-full bg-background">
      {/* Hero Section */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <div className="text-center">
            <div className="inline-block rounded-full bg-accent/10 px-4 py-2 mb-6">
              <p className="text-sm font-semibold text-accent">Privacy & Security</p>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground mb-6">
              Your Privacy <span className="text-accent">Matters</span>
            </h1>
            <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
              Learn how FastShip protects, uses, and respects your personal data
            </p>
          </div>
        </div>
      </section>

      {/* Key Points */}
      <section className="border-b border-border/40 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <Lock className="h-6 w-6 text-accent flex-shrink-0" />
              <div>
                <h3 className="font-bold text-foreground mb-1">Bank-Level Security</h3>
                <p className="text-sm text-muted-foreground">All data encrypted with military-grade encryption</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Shield className="h-6 w-6 text-accent flex-shrink-0" />
              <div>
                <h3 className="font-bold text-foreground mb-1">GDPR Compliant</h3>
                <p className="text-sm text-muted-foreground">Full compliance with international data protection laws</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Eye className="h-6 w-6 text-accent flex-shrink-0" />
              <div>
                <h3 className="font-bold text-foreground mb-1">No Data Selling</h3>
                <p className="text-sm text-muted-foreground">We never sell your personal information to third parties</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Sections */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
          <div className="space-y-8">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <Card key={idx} className="p-8 border border-border/40">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-accent" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
                  </div>
                  <ul className="space-y-3">
                    {section.content.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-secondary/30">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Privacy Questions?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Our Data Protection Officer is available to answer any questions about how we handle your data
          </p>
          <div className="space-y-2">
            <p className="text-foreground"><strong>Email:</strong> privacy@fastship.com</p>
            <p className="text-foreground"><strong>Response Time:</strong> Within 48 hours</p>
          </div>
        </div>
      </section>

      {/* Last Updated */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <p className="text-sm text-muted-foreground text-center">
            Last updated: April 22, 2026. This privacy policy may be updated at any time.
          </p>
        </div>
      </section>
    </div>
  );
}
