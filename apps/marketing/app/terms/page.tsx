'use client';

import { useState } from 'react';

export default function TermsOfService() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Terms of Service</h1>
        <p className="text-slate-600 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

        {/* Introduction */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
          <p className="text-slate-700 leading-relaxed">
            By using FastShip, you agree to be bound by these Terms of Service. This applies to all users including drivers, sellers, and business customers. If you do not agree to these terms, you may not use our platform.
          </p>
        </section>

        {/* Drivers Terms */}
        <section className="mb-8 border-l-4 border-blue-500 pl-6">
          <button
            onClick={() => toggleSection('driver-terms')}
            className="flex items-center justify-between w-full mb-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
          >
            <h2 className="text-2xl font-bold text-slate-900">👨‍✈️ Driver Terms</h2>
            <span className="text-2xl">{expandedSection === 'driver-terms' ? '−' : '+'}</span>
          </button>
          {expandedSection === 'driver-terms' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Eligibility Requirements</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Must be at least 18 years old (21 in some regions)</li>
                  <li>Valid driver's license</li>
                  <li>Vehicle suitable for deliveries</li>
                  <li>Pass background check and vehicle inspection</li>
                  <li>Current insurance coverage</li>
                  <li>No serious felony convictions</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Independent Contractor Status</h3>
                <p className="text-slate-700 leading-relaxed">
                  You are an independent contractor, not an employee. You maintain control over when you work, which deliveries you accept, vehicle maintenance, and personal presentation. You are responsible for your own taxes, insurance, and benefits.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Your Responsibilities</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Follow all traffic laws and regulations</li>
                  <li>Maintain valid licenses and insurance</li>
                  <li>Do not drive under influence</li>
                  <li>Keep vehicle in safe condition</li>
                  <li>Handle deliveries professionally</li>
                  <li>Deliver to correct addresses on time</li>
                  <li>Report accidents and incidents immediately</li>
                  <li>Maintain professional conduct</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Compensation</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Payment based on delivery distance, time, and complexity</li>
                  <li>Weekly settlements via direct deposit</li>
                  <li>No guaranteed minimum earnings</li>
                  <li>You are responsible for self-employment taxes</li>
                  <li>FastShip may deduct refunds, chargebacks, or policy violations</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Prohibited Conduct</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Theft or unauthorized possession of items</li>
                  <li>Harassment or discrimination</li>
                  <li>Sharing account credentials</li>
                  <li>Manipulating ratings or reviews</li>
                  <li>Dangerous or reckless driving</li>
                  <li>Violations of privacy or confidentiality</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Account Termination</h3>
                <p className="text-slate-700 leading-relaxed">
                  FastShip may deactivate your account immediately for violations of these terms, illegal activity, safety concerns, or poor performance. You may request deactivation at any time but must complete pending deliveries first.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Seller Terms */}
        <section className="mb-8 border-l-4 border-green-500 pl-6">
          <button
            onClick={() => toggleSection('seller-terms')}
            className="flex items-center justify-between w-full mb-4 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition"
          >
            <h2 className="text-2xl font-bold text-slate-900">🏪 Seller Terms</h2>
            <span className="text-2xl">{expandedSection === 'seller-terms' ? '−' : '+'}</span>
          </button>
          {expandedSection === 'seller-terms' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Seller Eligibility</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Must be at least 18 years old</li>
                  <li>Registered business entity</li>
                  <li>Valid tax identification number</li>
                  <li>Accurate business documentation</li>
                  <li>Not previously suspended or banned</li>
                  <li>Comply with all local and federal laws</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Product Listings</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>All product information must be accurate and complete</li>
                  <li>Authentic product images required</li>
                  <li>Clear descriptions and specifications</li>
                  <li>Correct pricing and availability</li>
                  <li>Cannot sell counterfeit or stolen goods</li>
                  <li>No illegal items or controlled substances</li>
                  <li>No intellectual property infringement</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Commission and Payments</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>FastShip charges commission per product category</li>
                  <li>Weekly settlements after 5-day hold period</li>
                  <li>Direct bank transfers to verified account</li>
                  <li>You are responsible for all applicable taxes</li>
                  <li>FastShip may deduct refunds, chargebacks, or violations</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Order Fulfillment</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Accept orders and fulfill within specified timeframe</li>
                  <li>Use reliable shipping methods</li>
                  <li>Package items securely</li>
                  <li>Provide accurate tracking information</li>
                  <li>Ship to customer's provided address</li>
                  <li>Limited cancellations allowed</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Returns and Refunds</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Establish fair return policy</li>
                  <li>Process approved refunds within 7 business days</li>
                  <li>Accept FastShip dispute resolution decisions</li>
                  <li>Maintain acceptable customer satisfaction metrics</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Performance Standards</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Maintain minimum seller rating (typically 4.0 stars)</li>
                  <li>Acceptable product defect rate</li>
                  <li>Timely order processing and shipping</li>
                  <li>Responsive customer communication</li>
                  <li>Failure to maintain standards may result in suspension</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Account Suspension</h3>
                <p className="text-slate-700 leading-relaxed">
                  FastShip may suspend or terminate your account for selling prohibited items, fraud, multiple complaints, poor performance, or policy violations. You may request account closure anytime, but must settle outstanding obligations first.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Business Terms */}
        <section className="mb-8 border-l-4 border-purple-500 pl-6">
          <button
            onClick={() => toggleSection('business-terms')}
            className="flex items-center justify-between w-full mb-4 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
          >
            <h2 className="text-2xl font-bold text-slate-900">🏢 Business Terms</h2>
            <span className="text-2xl">{expandedSection === 'business-terms' ? '−' : '+'}</span>
          </button>
          {expandedSection === 'business-terms' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Business Requirements</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Legally registered business entity</li>
                  <li>Valid business registration and tax ID</li>
                  <li>Authorized representatives</li>
                  <li>Pass Know Your Business (KYB) verification</li>
                  <li>Maintain valid corporate documentation</li>
                  <li>Not subject to sanctions or holds</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Service Level Agreement (SLA)</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Uptime guarantee: 99.9% availability</li>
                  <li>24/7 customer support</li>
                  <li>On-time delivery commitments</li>
                  <li>Performance metrics and reporting</li>
                  <li>Incident response within specified timeframes</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Pricing and Billing</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Volume-based and negotiated rates</li>
                  <li>Monthly invoicing (or per agreement)</li>
                  <li>Net-30 payment terms</li>
                  <li>Overage charges for excess usage</li>
                  <li>Late payment interest at 1.5% monthly</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">API Access and Integrations</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Non-exclusive license to use FastShip APIs</li>
                  <li>Secure API credentials management</li>
                  <li>Rate limits and usage policies apply</li>
                  <li>No API reselling or redistribution</li>
                  <li>Compliance with API terms mandatory</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Shipment Requirements</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Accurate shipment information required</li>
                  <li>Cannot ship prohibited or illegal items</li>
                  <li>Hazardous materials require proper documentation</li>
                  <li>Compliance with export/import regulations</li>
                  <li>Responsible for data accuracy</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Insurance and Liability</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Basic coverage up to $500 per item or $5,000 per shipment</li>
                  <li>Enhanced insurance available for additional fee</li>
                  <li>Claims must be filed within 30 days</li>
                  <li>Liability limited to insurance proceeds</li>
                  <li>Not liable for indirect or consequential damages</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Confidentiality</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Protect pricing and negotiated terms</li>
                  <li>Maintain proprietary information confidentiality</li>
                  <li>Non-disclosure of technical details</li>
                  <li>Confidentiality survives termination for 3 years</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Term and Termination</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Term specified in service agreement (typically 1-3 years)</li>
                  <li>Auto-renewal unless 30-day notice given</li>
                  <li>Either party can terminate with 30 days' notice</li>
                  <li>Immediate termination for material breach or fraud</li>
                  <li>Outstanding obligations must be settled</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Data Processing Agreement</h3>
                <p className="text-slate-700 leading-relaxed">
                  Enterprise customers can execute a Data Processing Agreement (DPA) specifying data handling, regulatory compliance (GDPR, HIPAA, SOX), data residency, and incident response procedures.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* General Terms */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">2. General Terms (All Users)</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Prohibited Activities</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Fraudulent activities or misrepresentation</li>
                <li>Illegal activity or violations of law</li>
                <li>Harassment or discrimination</li>
                <li>Intellectual property infringement</li>
                <li>Accessing unauthorized systems</li>
                <li>Attempting to reverse-engineer services</li>
                <li>Manipulating ratings or reviews</li>
                <li>Soliciting off-platform transactions</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Intellectual Property</h3>
              <p className="text-slate-700 leading-relaxed">
                FastShip retains all rights to its platform, technology, and content. You retain ownership of your content and data. By using FastShip, you grant us a non-exclusive license to display and use your content for platform operation. Do not infringe third-party intellectual property rights.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Indemnification</h3>
              <p className="text-slate-700 leading-relaxed">
                You agree to indemnify and hold FastShip harmless from any claims, damages, or liabilities arising from your use of the platform, your content, violations of these terms, or violation of laws.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Dispute Resolution</h3>
              <p className="text-slate-700 leading-relaxed">
                Disputes are resolved through escalation to support, account manager, and executive review before proceeding to binding arbitration rather than litigation.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Limitation of Liability</h3>
              <p className="text-slate-700 leading-relaxed">
                FastShip is not liable for indirect, incidental, consequential, or punitive damages including lost profits, data loss, or business interruption, even if advised of possibility of such damages.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Changes to Terms</h3>
              <p className="text-slate-700 leading-relaxed">
                FastShip may modify these terms with 30 days' notice. Material changes require your acceptance. Continued use constitutes acceptance of modified terms.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Severability</h3>
              <p className="text-slate-700 leading-relaxed">
                If any provision is invalid or unenforceable, remaining provisions continue in full effect.
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-slate-100 p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Contact Us</h2>
          <div className="space-y-2 text-slate-700">
            <p><strong>General Support:</strong> support@fastship.com</p>
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
