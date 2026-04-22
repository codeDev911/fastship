'use client';

import { Card } from '@fastship/ui';
import { FileText, AlertCircle, Users, DollarSign, Lock, Scale } from 'lucide-react';

export default function TermsPage() {
  const sections = [
    {
      icon: Users,
      title: 'User Eligibility',
      content: [
        'You must be at least 18 years old to use FastShip',
        'You must have valid identification for verification',
        'Business accounts require valid business registration',
        'You agree to provide accurate and complete information',
        'One account per person/business entity',
        'You are responsible for maintaining account security'
      ]
    },
    {
      icon: Lock,
      title: 'Acceptable Use Policy',
      content: [
        'No illegal activities or content',
        'No harassment, threats, or abusive behavior',
        'No spam, bots, or automated access',
        'No fraudulent orders or false information',
        'No intellectual property infringement',
        'FastShip reserves the right to suspend accounts violating these terms'
      ]
    },
    {
      icon: DollarSign,
      title: 'Payments & Fees',
      content: [
        'Drivers: Free to join; commission on earnings',
        'Sellers: 2% commission per order',
        'Businesses: Custom pricing based on volume',
        'All fees are transparent and displayed before confirmation',
        'Prices may change with 30 days notice',
        'Refunds subject to our refund policy'
      ]
    },
    {
      icon: AlertCircle,
      title: 'Dispute Resolution',
      content: [
        'Disputes must be filed within 7 days of delivery',
        'Both parties have the right to respond and provide evidence',
        'FastShip reviews all disputes impartially',
        'Decisions are final and binding',
        'Escrow funds released or refunded based on outcome',
        'For unresolved disputes, arbitration may be required'
      ]
    },
    {
      icon: Scale,
      title: 'Liability & Disclaimers',
      content: [
        'FastShip is provided "as is" without warranties',
        'We are not liable for indirect or consequential damages',
        'Liability limited to the amount paid in the last 12 months',
        'Users assume all risk in using the platform',
        'FastShip not responsible for third-party conduct',
        'Force majeure events exempt us from obligations'
      ]
    },
    {
      icon: FileText,
      title: 'Intellectual Property',
      content: [
        'All FastShip content is our intellectual property',
        'You retain ownership of your submitted content',
        'You grant FastShip license to use your content',
        'No unauthorized use or reproduction allowed',
        'Trademarks and logos are protected',
        'Violation may result in legal action'
      ]
    }
  ];

  return (
    <div>
    <div className="w-full bg-background">
      {/* Hero Section */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <div className="text-center">
            <div className="inline-block rounded-full bg-accent/10 px-4 py-2 mb-6">
              <p className="text-sm font-semibold text-accent">Legal</p>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground mb-6">
              Terms of <span className="text-accent">Service</span>
            </h1>
            <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
              Please read these terms carefully before using FastShip
            </p>
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="border-b border-border/40 bg-secondary/30">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Card className="p-6 border border-accent/20 bg-accent/5">
            <div className="flex gap-4">
              <AlertCircle className="h-6 w-6 text-accent flex-shrink-0" />
              <div>
                <h3 className="font-bold text-foreground mb-2">Important</h3>
                <p className="text-muted-foreground">
                  By accessing or using FastShip, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our platform.
                </p>
              </div>
            </div>
          </Card>
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

      {/* Amendments Section */}
      <section className="bg-secondary/30">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
          <h2 className="text-3xl font-bold text-foreground mb-6">Changes to Terms</h2>
          <Card className="p-8 border border-border/40">
            <p className="text-foreground mb-4">
              FastShip reserves the right to modify these terms at any time. Changes become effective immediately upon posting to the website. Your continued use of FastShip following the posting of revised Terms means that you accept and agree to the changes.
            </p>
            <p className="text-muted-foreground">
              We will notify users of significant changes via email or prominent notice on our platform.
            </p>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Questions About Our Terms?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Contact our legal team for clarification on any terms
          </p>
          <p className="text-foreground"><strong>Email:</strong> legal@fastship.com</p>
        </div>
      </section>

      {/* Last Updated */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <p className="text-sm text-muted-foreground text-center">
            Last updated: April 22, 2026. These terms may be updated at any time.
          </p>
        </div>
      </section>
    </div>
    </div>
  );
} 