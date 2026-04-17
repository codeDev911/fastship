'use client';

export default function BusinessTermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Terms of Service for Business Users</h1>
        <p className="text-slate-600 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-700 leading-relaxed">
              By establishing a business account with FastShip and using our enterprise logistics platform, your company agrees to comply with and be bound by these Terms of Service. These terms govern your use of our services, APIs, and all related features. If you do not accept these terms, you may not use FastShip enterprise services.
            </p>
          </section>

          {/* Business Eligibility */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Business Eligibility and Account Setup</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              To establish a business account, your organization must:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>Be a legally registered business entity</li>
              <li>Possess valid business registration and tax identification</li>
              <li>Have authorized representatives capable of signing agreements</li>
              <li>Provide accurate corporate documentation</li>
              <li>Maintain valid contact information and registered address</li>
              <li>Pass Know Your Business (KYB) verification</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not be subject to sanctions or legal holds</li>
            </ul>
          </section>

          {/* Service Agreement */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Service Agreement</h2>
            <div className="space-y-4">
              <p className="text-slate-700">
                <strong>3.1 Service Scope:</strong> FastShip provides enterprise logistics, shipment management, tracking, and delivery services as outlined in your service agreement or statement of work.
              </p>
              <p className="text-slate-700">
                <strong>3.2 Service Levels:</strong> FastShip may provide SLA commitments including uptime guarantees, response times, and performance metrics as specified in your service agreement.
              </p>
              <p className="text-slate-700">
                <strong>3.3 Service Changes:</strong> FastShip may modify services with 30 days' notice. Material changes affecting functionality require your consent.
              </p>
              <p className="text-slate-700">
                <strong>3.4 Suspension:</strong> FastShip may suspend services for non-payment or material breach with 10 days' notice.
              </p>
            </div>
          </section>

          {/* Pricing and Billing */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Pricing, Billing, and Payments</h2>
            <div className="space-y-4">
              <p className="text-slate-700">
                <strong>4.1 Pricing Structure:</strong> Pricing is based on volume, service tier, and negotiated rates. Rates are documented in your service agreement or pricing schedule.
              </p>
              <p className="text-slate-700">
                <strong>4.2 Usage-Based Charges:</strong> Overage charges may apply for usage exceeding agreed volumes. You will receive advance notice before incurring significant overages.
              </p>
              <p className="text-slate-700">
                <strong>4.3 Billing and Payment:</strong>
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Invoices are generated monthly or per agreement schedule</li>
                <li>Payment is due within 30 days of invoice issuance (net-30)</li>
                <li>Payment methods include ACH, wire transfer, and credit cards</li>
                <li>Late payments incur 1.5% monthly interest or maximum legal rate</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-4">
                <strong>4.4 Taxes:</strong> You are responsible for all applicable taxes, duties, and levies unless FastShip is responsible under applicable law.
              </p>
            </div>
          </section>

          {/* Shipment Terms */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Shipment Processing and Standards</h2>
            <div className="space-y-4">
              <p className="text-slate-700">
                <strong>5.1 Shipment Accuracy:</strong> You are responsible for providing accurate shipment information including:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Sender and recipient information</li>
                <li>Item descriptions and classifications</li>
                <li>Correct weight and dimensions</li>
                <li>Hazardous material declarations (if applicable)</li>
                <li>Special handling requirements</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-4">
                <strong>5.2 Prohibited Shipments:</strong> You may not ship:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Prohibited or illegal items</li>
                <li>Hazardous materials without proper documentation</li>
                <li>Items that violate intellectual property rights</li>
                <li>Counterfeit or stolen goods</li>
                <li>Items requiring special permits or licenses</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-4">
                <strong>5.3 Delivery Standards:</strong> FastShip will deliver shipments in accordance with agreed service levels and routing preferences.
              </p>
            </div>
          </section>

          {/* API and Integration */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. API Access and Integrations</h2>
            <div className="space-y-4">
              <p className="text-slate-700">
                <strong>6.1 API License:</strong> FastShip grants you a limited, non-exclusive license to access and use our APIs for shipment management and tracking.
              </p>
              <p className="text-slate-700">
                <strong>6.2 API Credentials:</strong> You are responsible for:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Securing API keys and access credentials</li>
                <li>Not sharing credentials with unauthorized parties</li>
                <li>Rotating credentials regularly</li>
                <li>Reporting compromised credentials immediately</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-4">
                <strong>6.3 API Usage:</strong> You agree to:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Comply with API rate limits and usage policies</li>
                <li>Not reverse-engineer or attempt to access non-authorized APIs</li>
                <li>Not use APIs for competitive intelligence</li>
                <li>Not resell or redistribute API access</li>
                <li>Monitor API usage and comply with thresholds</li>
              </ul>
            </div>
          </section>

          {/* Performance and Compliance */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Performance Standards and Compliance</h2>
            <div className="space-y-4">
              <p className="text-slate-700">
                <strong>7.1 Delivery Performance:</strong> FastShip commits to on-time delivery for scheduled shipments. Performance metrics are tracked and reported.
              </p>
              <p className="text-slate-700">
                <strong>7.2 Data Accuracy:</strong> You are responsible for data quality and accuracy. FastShip is not liable for errors in provided data.
              </p>
              <p className="text-slate-700">
                <strong>7.3 Regulatory Compliance:</strong> Both parties commit to compliance with:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Transportation and logistics regulations</li>
                <li>Data protection and privacy laws</li>
                <li>Customs and import/export regulations</li>
                <li>Industry-specific compliance requirements</li>
              </ul>
            </div>
          </section>

          {/* Liability and Insurance */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Liability, Insurance, and Risk</h2>
            <div className="space-y-4">
              <p className="text-slate-700">
                <strong>8.1 Shipment Insurance:</strong> FastShip provides basic coverage for lost or damaged shipments up to $500 per item or $5,000 per shipment. Enhanced insurance can be purchased separately.
              </p>
              <p className="text-slate-700">
                <strong>8.2 Claim Procedures:</strong> Claims for lost or damaged shipments must be filed within 30 days of delivery with supporting documentation.
              </p>
              <p className="text-slate-700">
                <strong>8.3 Liability Limitation:</strong> FastShip's total liability is limited to the greater of insurance proceeds or the actual charges paid for the applicable shipment.
              </p>
              <p className="text-slate-700">
                <strong>8.4 Exclusions:</strong> FastShip is not liable for:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Indirect, incidental, or consequential damages</li>
                <li>Lost profits or business interruption</li>
                <li>Data loss or corruption</li>
                <li>Third-party claims</li>
                <li>Acts of God or force majeure</li>
              </ul>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Intellectual Property Rights</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              <strong>9.1 FastShip IP:</strong> All FastShip technology, platform, content, and documentation are proprietary and protected by intellectual property laws.
            </p>
            <p className="text-slate-700 leading-relaxed">
              <strong>9.2 Your Content:</strong> You retain ownership of your shipment data and content. You grant FastShip a license to process and store this data for service provision.
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Indemnification</h2>
            <p className="text-slate-700 leading-relaxed">
              You agree to indemnify, defend, and hold harmless FastShip from any third-party claims, damages, or liabilities arising from your use of services, shipment contents, violation of laws, or breach of these terms.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Dispute Resolution and Arbitration</h2>
            <div className="space-y-4">
              <p className="text-slate-700">
                <strong>11.1 Escalation Process:</strong> Disputes are addressed through a tiered escalation:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Level 1: Support team (5 business days)</li>
                <li>Level 2: Account manager (10 business days)</li>
                <li>Level 3: Executive review (15 business days)</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-4">
                <strong>11.2 Mediation:</strong> If unresolved, disputes proceed to mediation.
              </p>
              <p className="text-slate-700">
                <strong>11.3 Arbitration:</strong> Unresolved disputes proceed to binding arbitration rather than litigation.
              </p>
            </div>
          </section>

          {/* Confidentiality */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Confidentiality</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Both parties agree to maintain confidentiality of:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>Pricing and negotiated terms</li>
              <li>Proprietary business information</li>
              <li>Technical details and system architecture</li>
              <li>Customer lists and business relationships</li>
              <li>Performance data and metrics</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-4">
              Confidentiality obligations survive termination for 3 years.
            </p>
          </section>

          {/* Term and Termination */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">13. Term and Termination</h2>
            <div className="space-y-4">
              <p className="text-slate-700">
                <strong>13.1 Term:</strong> This agreement begins on the effective date and continues for the term specified in your service agreement (typically 1-3 years).
              </p>
              <p className="text-slate-700">
                <strong>13.2 Renewal:</strong> Agreements automatically renew unless either party provides 30 days' notice of non-renewal.
              </p>
              <p className="text-slate-700">
                <strong>13.3 Termination for Convenience:</strong> Either party may terminate with 30 days' notice (or as specified in agreement).
              </p>
              <p className="text-slate-700">
                <strong>13.4 Termination for Cause:</strong> FastShip may terminate immediately for:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Material breach not cured within 15 days</li>
                <li>Non-payment of fees</li>
                <li>Illegal activity or fraud</li>
                <li>Violation of service restrictions</li>
              </ul>
            </div>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">14. Changes to Terms</h2>
            <p className="text-slate-700 leading-relaxed">
              FastShip may modify these terms with 30 days' notice. Material changes affecting functionality or costs require your consent. Continued use constitutes acceptance of modified terms.
            </p>
          </section>

          {/* General Provisions */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">15. General Provisions</h2>
            <div className="space-y-3">
              <p className="text-slate-700">
                <strong>Governing Law:</strong> These terms are governed by applicable laws in FastShip's jurisdiction.
              </p>
              <p className="text-slate-700">
                <strong>Entire Agreement:</strong> These terms, along with your service agreement and DPA, constitute the entire agreement.
              </p>
              <p className="text-slate-700">
                <strong>Severability:</strong> If any provision is invalid, remaining provisions continue in effect.
              </p>
              <p className="text-slate-700">
                <strong>Assignment:</strong> You may not assign these terms without FastShip's consent. FastShip may assign rights to successors.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">16. Contact Us</h2>
            <div className="bg-slate-100 p-4 rounded-lg">
              <p className="text-slate-700"><strong>Enterprise Support:</strong> enterprise@fastship.com</p>
              <p className="text-slate-700"><strong>Sales and Contracts:</strong> sales@fastship.com</p>
              <p className="text-slate-700"><strong>Legal:</strong> legal@fastship.com</p>
              <p className="text-slate-700"><strong>Phone:</strong> +1 (XXX) XXX-XXXX ext. 2</p>
              <p className="text-slate-700"><strong>Address:</strong> FastShip Inc., [Your Address]</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
