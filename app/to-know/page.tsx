'use client';

export default function ToKnow() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Essential Information to Know About FastShip</h1>
        <p className="text-slate-600 mb-8">Everything you should understand before joining and using our platform</p>

        <div className="space-y-10">
          {/* Overview */}
          <section>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">🚀 What is FastShip?</h2>
            <p className="text-slate-700 leading-relaxed">
              FastShip is a comprehensive logistics platform connecting drivers, sellers, and business customers to facilitate efficient shipment delivery and order fulfillment. Our platform leverages real-time tracking, intelligent routing, and secure payment processing to create a seamless experience for all users.
            </p>
          </section>

          {/* Platform Architecture */}
          <section>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">🏗️ How FastShip Works</h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-xl font-bold text-slate-900 mb-3">Sellers & Businesses</h3>
                <p className="text-slate-700">
                  List products or schedule shipments through our dashboard. Set preferences, monitor inventory, and track deliveries in real-time.
                </p>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-lg border-l-4 border-slate-500">
                <h3 className="text-xl font-bold text-slate-900 mb-3">FastShip Platform</h3>
                <p className="text-slate-700">
                  Our intelligent system matches shipments to available drivers, optimizes routes, manages payments, and handles customer support.
                </p>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                <h3 className="text-xl font-bold text-slate-900 mb-3">Drivers</h3>
                <p className="text-slate-700">
                  Accept deliveries, navigate to pickups and destinations, complete deliveries, and earn based on performance and volume.
                </p>
              </div>
            </div>
          </section>

          {/* Key Features */}
          <section>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">⭐ Key Features</h2>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📍</span>
                <div>
                  <h4 className="font-bold text-slate-900">Real-Time Tracking</h4>
                  <p className="text-slate-700">Live GPS tracking of shipments from pickup to delivery with accurate ETAs</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">💳</span>
                <div>
                  <h4 className="font-bold text-slate-900">Secure Payments</h4>
                  <p className="text-slate-700">Encrypted payment processing with automatic settlements and multiple payment options</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <h4 className="font-bold text-slate-900">Escrow Protection</h4>
                  <p className="text-slate-700">Funds held securely until delivery confirmation, protecting both sellers and buyers</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <h4 className="font-bold text-slate-900">Analytics & Reporting</h4>
                  <p className="text-slate-700">Detailed dashboards with performance metrics, earnings, and delivery statistics</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">🤝</span>
                <div>
                  <h4 className="font-bold text-slate-900">Dispute Resolution</h4>
                  <p className="text-slate-700">Fair and transparent resolution process for order issues and conflicts</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">🔐</span>
                <div>
                  <h4 className="font-bold text-slate-900">Data Security</h4>
                  <p className="text-slate-700">Enterprise-grade encryption and security protocols protecting all user data</p>
                </div>
              </div>
            </div>
          </section>

          {/* User Roles */}
          <section>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">👥 Understanding User Roles</h2>

            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-slate-900 mb-3">👨‍✈️ Drivers</h3>
                <p className="text-slate-700 mb-3">Independent contractors who pick up and deliver packages.</p>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  <li>Work on your own schedule</li>
                  <li>Accept or reject deliveries</li>
                  <li>Use your own vehicle</li>
                  <li>Earn per delivery + bonuses</li>
                  <li>Build your rating through quality service</li>
                </ul>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-slate-900 mb-3">🏪 Sellers</h3>
                <p className="text-slate-700 mb-3">Businesses that list products for customers to purchase and receive through FastShip.</p>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  <li>Manage product catalog</li>
                  <li>Receive orders from customers</li>
                  <li>Handle inventory and fulfillment</li>
                  <li>Earn revenue minus FastShip commission</li>
                  <li>Access customer insights and analytics</li>
                </ul>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-slate-900 mb-3">🏢 Business Users</h3>
                <p className="text-slate-700 mb-3">Enterprises that use FastShip for bulk shipping and logistics management.</p>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  <li>Bulk shipment management</li>
                  <li>API access for integration</li>
                  <li>Dedicated support</li>
                  <li>Custom pricing and SLAs</li>
                  <li>Advanced analytics</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Safety & Compliance */}
          <section>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">🔒 Safety and Compliance</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Verification Process</h3>
                <p className="text-slate-700">All users undergo verification to ensure legitimacy and safety. This includes background checks for drivers, business verification for sellers, and compliance checks for enterprise users.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Insurance Coverage</h3>
                <p className="text-slate-700">Shipments are covered by default insurance up to stated limits. Enhanced insurance can be purchased for high-value items. Drivers should maintain personal auto insurance.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Prohibited Items</h3>
                <p className="text-slate-700">FastShip does not allow shipping of illegal items, weapons, hazardous materials without proper documentation, counterfeit goods, or items infringing intellectual property rights.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Account Security</h3>
                <p className="text-slate-700">Use strong passwords, enable multi-factor authentication, never share credentials, and report suspicious activity immediately to support@fastship.com.</p>
              </div>
            </div>
          </section>

          {/* Ratings and Reputation */}
          <section>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">⭐ Ratings and Reputation</h2>
            
            <div className="space-y-4">
              <p className="text-slate-700">
                FastShip uses a reputation system where all users can rate their experience. Your rating directly affects your visibility and opportunities on the platform.
              </p>

              <div className="bg-slate-100 p-4 rounded-lg">
                <h4 className="font-bold text-slate-900 mb-2">For Drivers:</h4>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  <li>Rated by sellers on delivery quality and timeliness</li>
                  <li>Ratings affect number of delivery opportunities</li>
                  <li>Ratings below 4.0 may result in account review</li>
                </ul>
              </div>

              <div className="bg-slate-100 p-4 rounded-lg">
                <h4 className="font-bold text-slate-900 mb-2">For Sellers:</h4>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  <li>Rated by buyers on product quality and service</li>
                  <li>Public ratings affect sales and visibility</li>
                  <li>Low ratings can lead to suspension</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Fees and Costs */}
          <section>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">💰 Fees and Costs</h2>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 mb-2">👨‍✈️ For Drivers:</h4>
                <p className="text-slate-700">No upfront fees. You only earn money when you complete deliveries. Earnings are based on delivery distance, time, and complexity. Weekly payouts via direct deposit.</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">🏪 For Sellers:</h4>
                <p className="text-slate-700">Commission-based model where FastShip takes a percentage per transaction (varies by category). Payments settle weekly after a 5-day hold period to ensure order completion and customer satisfaction.</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">🏢 For Business Users:</h4>
                <p className="text-slate-700">Volume-based pricing with negotiated rates. Monthly billing with Net-30 payment terms. Overage charges apply for usage exceeding agreed volumes.</p>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
                <p className="text-slate-700 font-semibold">
                  💡 Always review the pricing details in your category or contact support for specific information about fees applicable to your account.
                </p>
              </div>
            </div>
          </section>

          {/* Getting Started */}
          <section>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">🚀 Getting Started</h2>
            
            <div className="space-y-4">
              <div className="step-item">
                <h4 className="text-lg font-bold text-slate-900 mb-2">1. Create Your Account</h4>
                <p className="text-slate-700">Sign up on FastShip.com or download our mobile app. Choose your user type (driver, seller, or business).</p>
              </div>

              <div className="step-item">
                <h4 className="text-lg font-bold text-slate-900 mb-2">2. Complete Verification</h4>
                <p className="text-slate-700">Provide necessary documents and information. Verification can take 1-3 business days. We'll notify you once approved.</p>
              </div>

              <div className="step-item">
                <h4 className="text-lg font-bold text-slate-900 mb-2">3. Set Up Payment</h4>
                <p className="text-slate-700">Add your bank account or payment method for settlements. Verify your account details.</p>
              </div>

              <div className="step-item">
                <h4 className="text-lg font-bold text-slate-900 mb-2">4. Start Using FastShip</h4>
                <p className="text-slate-700">Drivers: accept deliveries. Sellers: list products. Business users: integrate your systems or contact support for onboarding.</p>
              </div>
            </div>
          </section>

          {/* Support and Resources */}
          <section>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">📞 Support and Resources</h2>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <h4 className="font-bold text-slate-900">Email Support</h4>
                  <p className="text-slate-700">support@fastship.com (general) or role-specific: drivers@fastship.com, sellers@fastship.com, enterprise@fastship.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">💬</span>
                <div>
                  <h4 className="font-bold text-slate-900">Live Chat</h4>
                  <p className="text-slate-700">Available 24/7 on our app and website for quick questions</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">📚</span>
                <div>
                  <h4 className="font-bold text-slate-900">Help Center</h4>
                  <p className="text-slate-700">FAQs, tutorials, and guides for all user types</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">📱</span>
                <div>
                  <h4 className="font-bold text-slate-900">Mobile App</h4>
                  <p className="text-slate-700">Available on iOS and Android with in-app support and tutorials</p>
                </div>
              </div>
            </div>
          </section>

          {/* Important Reminders */}
          <section className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">⚠️ Important Reminders</h2>
            
            <ul className="space-y-3 text-slate-700">
              <li className="flex gap-3">
                <span>✓</span>
                <span>FastShip is a logistics platform facilitating transactions, not a bank. We do not provide loans or credit services.</span>
              </li>
              <li className="flex gap-3">
                <span>✓</span>
                <span>You are responsible for your own taxes, insurance, and legal compliance in your jurisdiction.</span>
              </li>
              <li className="flex gap-3">
                <span>✓</span>
                <span>FastShip reserves the right to modify terms, pricing, and features with notice.</span>
              </li>
              <li className="flex gap-3">
                <span>✓</span>
                <span>All disputes are subject to FastShip's dispute resolution process and arbitration.</span>
              </li>
              <li className="flex gap-3">
                <span>✓</span>
                <span>Do not share your account credentials with anyone. You are responsible for all activity on your account.</span>
              </li>
              <li className="flex gap-3">
                <span>✓</span>
                <span>Report any security concerns or suspicious activity immediately to security@fastship.com.</span>
              </li>
            </ul>
          </section>

          {/* Contact */}
          <section className="bg-slate-900 text-white p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Questions or Need Help?</h2>
            <p className="mb-4">
              Our support team is here to help you get the most out of FastShip. Reach out anytime!
            </p>
            <div className="space-y-2">
              <p>📧 <strong>support@fastship.com</strong></p>
              <p>💬 <strong>Live chat on fastship.com</strong></p>
              <p>📱 <strong>Available on iOS and Android</strong></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
