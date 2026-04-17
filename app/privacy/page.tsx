'use client';

import { useState } from 'react';

export default function PrivacyPolicy() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-slate-600 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

        {/* Introduction */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Introduction</h2>
          <p className="text-slate-700 leading-relaxed">
            FastShip is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information across our platform. This policy applies to all users including drivers, sellers, and business customers.
          </p>
        </section>

        {/* Drivers Section */}
        <section className="mb-8 border-l-4 border-blue-500 pl-6">
          <button
            onClick={() => toggleSection('drivers')}
            className="flex items-center justify-between w-full mb-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
          >
            <h2 className="text-2xl font-bold text-slate-900">👨‍✈️ For Drivers</h2>
            <span className="text-2xl">{expandedSection === 'drivers' ? '−' : '+'}</span>
          </button>
          {expandedSection === 'drivers' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Information We Collect</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Personal identification (name, license, phone, email)</li>
                  <li>Vehicle details (registration, insurance, photos)</li>
                  <li>Bank account information for earnings payments</li>
                  <li>Real-time GPS location during active deliveries</li>
                  <li>Delivery history and customer ratings</li>
                  <li>Background check results</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Location Tracking</h3>
                <p className="text-slate-700 leading-relaxed">
                  We collect real-time location data only during active deliveries. This data is used exclusively for route optimization, ETA provision to customers, delivery verification, and safety purposes. Location tracking is disabled when a delivery is completed. You can disable location permissions at any time through your device settings.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Data Protection</h3>
                <p className="text-slate-700 leading-relaxed">
                  Your data is encrypted end-to-end. We implement industry-standard security protocols including multi-factor authentication, regular security audits, and strict access controls. Payment information is tokenized and never stored on our servers.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Your Rights</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Access all data we hold about you</li>
                  <li>Request data correction or deletion</li>
                  <li>Export your data in standard formats</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Request an audit of your location history</li>
                </ul>
                <p className="text-slate-700 mt-3">
                  Contact: <strong>privacy@fastship.com</strong>
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Sellers Section */}
        <section className="mb-8 border-l-4 border-green-500 pl-6">
          <button
            onClick={() => toggleSection('sellers')}
            className="flex items-center justify-between w-full mb-4 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition"
          >
            <h2 className="text-2xl font-bold text-slate-900">🏪 For Sellers</h2>
            <span className="text-2xl">{expandedSection === 'sellers' ? '−' : '+'}</span>
          </button>
          {expandedSection === 'sellers' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Information We Collect</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Business registration and tax identification</li>
                  <li>Owner/authorized representative information</li>
                  <li>Bank account for settlements</li>
                  <li>Product catalog and inventory data</li>
                  <li>Customer orders and delivery addresses</li>
                  <li>Transaction history and financial records</li>
                  <li>Ratings and customer reviews</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Customer Data Handling</h3>
                <p className="text-slate-700 leading-relaxed">
                  When customers order from you, we share limited information (name, address, phone) necessary for delivery. You must comply with privacy laws when handling this data. Do not use customer data for unauthorized marketing or retain it beyond order fulfillment.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Business Analytics</h3>
                <p className="text-slate-700 leading-relaxed">
                  We provide analytics about your sales performance, customer trends, and delivery metrics. Aggregated data may be used to improve FastShip services but never identifies your business specifically to third parties without consent.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Your Rights</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Access all business and customer data</li>
                  <li>Export transaction records and analytics</li>
                  <li>Request data deletion (subject to legal holds)</li>
                  <li>Audit log access for security monitoring</li>
                  <li>Manage data retention policies</li>
                </ul>
                <p className="text-slate-700 mt-3">
                  Contact: <strong>sellers@fastship.com</strong>
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Business Section */}
        <section className="mb-8 border-l-4 border-purple-500 pl-6">
          <button
            onClick={() => toggleSection('business')}
            className="flex items-center justify-between w-full mb-4 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
          >
            <h2 className="text-2xl font-bold text-slate-900">🏢 For Business Users</h2>
            <span className="text-2xl">{expandedSection === 'business' ? '−' : '+'}</span>
          </button>
          {expandedSection === 'business' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Information We Collect</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Corporate entity information and registration</li>
                  <li>Multiple office locations and contacts</li>
                  <li>Tax and financial documentation</li>
                  <li>Employee access credentials</li>
                  <li>API keys and integrations</li>
                  <li>Comprehensive shipment and logistics data</li>
                  <li>Recipient information and delivery addresses</li>
                  <li>Financial transaction records</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Enterprise-Grade Security</h3>
                <p className="text-slate-700 leading-relaxed">
                  We provide SOC 2 Type II certified infrastructure, ISO 27001 compliance, advanced encryption at rest and in transit, multi-factor authentication, role-based access controls, comprehensive audit logging, and 24/7 security monitoring. Data backups are maintained with 99.99% availability SLA.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Data Processing Agreements</h3>
                <p className="text-slate-700 leading-relaxed">
                  Enterprise customers can execute a Data Processing Agreement (DPA) specifying data handling obligations, compliance with regulations (HIPAA, GDPR, SOX), data residency requirements, and incident response procedures.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Your Rights</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Comprehensive data access and audit reports</li>
                  <li>Data portability in standard formats</li>
                  <li>Custom data retention policies</li>
                  <li>Breach notification (within 72 hours)</li>
                  <li>Regulatory compliance reports</li>
                  <li>On-demand forensic analysis</li>
                </ul>
                <p className="text-slate-700 mt-3">
                  Contact: <strong>enterprise@fastship.com</strong>
                </p>
              </div>
            </div>
          )}
        </section>

        {/* General Privacy Practices */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">General Privacy Practices (All Users)</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">How We Use Your Data</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Provide and improve FastShip services</li>
                <li>Process payments and financial settlements</li>
                <li>Verify identity and prevent fraud</li>
                <li>Optimize delivery routes and logistics</li>
                <li>Customer and technical support</li>
                <li>Legal and regulatory compliance</li>
                <li>Service analytics and improvements</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Data Sharing</h3>
              <p className="text-slate-700 leading-relaxed">
                We share data only with service providers necessary to operate FastShip, such as payment processors, mapping services, and analytics platforms. We never sell your data to third parties. Data sharing is governed by strict data processing agreements and confidentiality obligations.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Data Security</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>AES-256 encryption at rest</li>
                <li>TLS 1.3 encryption in transit</li>
                <li>Regular penetration testing</li>
                <li>Automated threat detection</li>
                <li>Incident response protocols</li>
                <li>Employee security training</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Data Retention</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Active account data: Duration of account + 7 years</li>
                <li>Transaction records: 10 years (compliance)</li>
                <li>Location data: 90 days after delivery</li>
                <li>Backup copies: Up to 90 days</li>
                <li>Inactive accounts: 2 years after closure</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Cookies and Tracking</h3>
              <p className="text-slate-700 leading-relaxed">
                We use cookies for authentication, preference management, and analytics. Essential cookies cannot be disabled. You can manage other cookies through your browser settings. We do not track your behavior across third-party websites.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Privacy Rights</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Access: Request a copy of your data</li>
                <li>Correction: Update inaccurate information</li>
                <li>Deletion: Request data removal (with limitations)</li>
                <li>Portability: Export data in standard formats</li>
                <li>Opt-out: Unsubscribe from communications</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Changes to This Policy</h3>
              <p className="text-slate-700 leading-relaxed">
                We may update this Privacy Policy periodically. Material changes require 30 days' notice. Continued use of FastShip constitutes acceptance of the updated policy.
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-slate-100 p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Contact Us</h2>
          <div className="space-y-2 text-slate-700">
            <p><strong>General Privacy:</strong> privacy@fastship.com</p>
            <p><strong>Driver Support:</strong> drivers@fastship.com</p>
            <p><strong>Seller Support:</strong> sellers@fastship.com</p>
            <p><strong>Enterprise:</strong> enterprise@fastship.com</p>
            <p><strong>Legal:</strong> legal@fastship.com</p>
            <p className="mt-4 pt-4 border-t border-slate-300"><strong>Mailing Address:</strong> FastShip Inc., [Your Address]</p>
          </div>
        </section>
      </div>
    </div>
  );
}
