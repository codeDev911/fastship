'use client';

import { useState } from 'react';

export default function OrderProcessPage() {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  const togglePhase = (phase: string) => {
    setExpandedPhase(expandedPhase === phase ? null : phase);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Complete Order Process: From Creation to Delivery</h1>
        <p className="text-slate-600 mb-8">Detailed breakdown of how FastShip manages orders, payments, and escrow throughout the entire transaction lifecycle</p>

        {/* Overview Timeline */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">📋 Order Lifecycle Overview</h2>
          <div className="space-y-2 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <h3 className="font-bold text-slate-900">Order Creation</h3>
                <p className="text-slate-600">Buyer places order, funds held in escrow</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h3 className="font-bold text-slate-900">Payment Processing</h3>
                <p className="text-slate-600">Escrow locked, seller confirmed</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h3 className="font-bold text-slate-900">Fulfillment</h3>
                <p className="text-slate-600">Seller prepares and ships order</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
              <div>
                <h3 className="font-bold text-slate-900">Transit</h3>
                <p className="text-slate-600">Driver picks up and delivers</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">5</div>
              <div>
                <h3 className="font-bold text-slate-900">Delivery Confirmation</h3>
                <p className="text-slate-600">Order marked complete, buyer confirms</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">6</div>
              <div>
                <h3 className="font-bold text-slate-900">Settlement</h3>
                <p className="text-slate-600">Funds released to seller after hold period</p>
              </div>
            </div>
          </div>
        </section>

        {/* Phase 1: Order Creation */}
        <section className="mb-8">
          <button
            onClick={() => togglePhase('phase1')}
            className="w-full mb-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-left"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Phase 1: Order Creation & Escrow Lock</h2>
              <span className="text-2xl">{expandedPhase === 'phase1' ? '−' : '+'}</span>
            </div>
          </button>
          
          {expandedPhase === 'phase1' && (
            <div className="bg-blue-50 p-6 rounded-lg space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">What Happens</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Buyer selects items from seller and adds to cart</li>
                  <li>Buyer reviews order details, shipping address, and estimated delivery date</li>
                  <li>Buyer proceeds to checkout</li>
                  <li>Buyer selects payment method (credit card, debit card, digital wallet, etc.)</li>
                  <li>Buyer reviews final pricing including item cost, shipping fees, taxes, and any discounts</li>
                  <li>Buyer confirms order placement</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Escrow Lock Mechanism</h3>
                <div className="bg-white p-4 rounded border-l-4 border-blue-500">
                  <p className="text-slate-700 mb-3">
                    <strong>What is Escrow?</strong> Escrow is a secure holding mechanism where customer funds are held by FastShip, not the seller. This protects both buyer and seller:
                  </p>
                  <ul className="list-disc list-inside text-slate-700 space-y-2">
                    <li><strong>For Buyers:</strong> Funds aren't released until order is delivered and confirmed</li>
                    <li><strong>For Sellers:</strong> Order is guaranteed payment upon successful delivery</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">When Escrow is Locked</h3>
                <p className="text-slate-700">
                  Immediately after payment authorization succeeds, the following happens:
                </p>
                <div className="space-y-2 mt-3 text-slate-700">
                  <div className="flex gap-3">
                    <span className="font-bold">🔒</span>
                    <span><strong>Escrow Account Created:</strong> Unique escrow account generated for this transaction</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">💰</span>
                    <span><strong>Funds Locked:</strong> Full order amount (item cost + shipping + taxes - discounts) transferred to escrow</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">✓</span>
                    <span><strong>Hold Period Begins:</strong> 5-day hold period starts (protects buyer for inspection)</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">🔔</span>
                    <span><strong>Notifications Sent:</strong> Buyer and seller both receive confirmation</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded border-l-4 border-yellow-500">
                <p className="text-slate-700">
                  <strong>💡 For Sellers:</strong> When escrow is locked, you receive confirmation that payment is guaranteed. You can begin order fulfillment immediately.
                </p>
              </div>

              <div className="bg-white p-4 rounded border-l-4 border-yellow-500">
                <p className="text-slate-700">
                  <strong>💡 For Buyers:</strong> You have peace of mind knowing the seller cannot access funds until you confirm receipt of the order.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Phase 2: Order Confirmation & Processing */}
        <section className="mb-8">
          <button
            onClick={() => togglePhase('phase2')}
            className="w-full mb-4 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition text-left"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Phase 2: Seller Confirmation & Fulfillment</h2>
              <span className="text-2xl">{expandedPhase === 'phase2' ? '−' : '+'}</span>
            </div>
          </button>
          
          {expandedPhase === 'phase2' && (
            <div className="bg-green-50 p-6 rounded-lg space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">What Happens</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Seller receives order notification in dashboard</li>
                  <li>Seller verifies inventory and item availability</li>
                  <li>Seller marks order as "Confirmed" (usually within 1-4 hours)</li>
                  <li>Seller begins order fulfillment process</li>
                  <li>Seller picks items, quality checks, and packages order</li>
                  <li>Seller prepares shipping label with tracking number</li>
                  <li>Seller schedules pickup with FastShip driver network</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">System Actions During Fulfillment</h3>
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded">
                    <h4 className="font-bold text-slate-900 mb-2">🔒 Escrow Remains Locked</h4>
                    <p className="text-slate-700">Funds stay in escrow account. Seller cannot access them yet.</p>
                  </div>
                  <div className="bg-white p-4 rounded">
                    <h4 className="font-bold text-slate-900 mb-2">📦 Inventory Deduction</h4>
                    <p className="text-slate-700">Seller's inventory is automatically reduced to prevent overselling.</p>
                  </div>
                  <div className="bg-white p-4 rounded">
                    <h4 className="font-bold text-slate-900 mb-2">📧 Buyer Notification</h4>
                    <p className="text-slate-700">Buyer receives tracking number and estimated delivery date.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Seller Status Timeline</h3>
                <div className="space-y-2 text-slate-700">
                  <div className="flex gap-3">
                    <span className="font-bold">0-30 min:</span>
                    <span>Order received - seller should confirm</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">1-4 hours:</span>
                    <span>Seller prepares order for pickup</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">4-24 hours:</span>
                    <span>Driver picks up order</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">Next 1-3 days:</span>
                    <span>In transit to delivery address</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded border-l-4 border-amber-500">
                <p className="text-slate-700">
                  <strong>⚠️ Non-Confirmation Cancellation:</strong> If seller doesn't confirm within 24 hours, order is automatically cancelled and escrow funds are returned to buyer.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Phase 3: Pickup & Transit */}
        <section className="mb-8">
          <button
            onClick={() => togglePhase('phase3')}
            className="w-full mb-4 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition text-left"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Phase 3: Driver Pickup & Transit</h2>
              <span className="text-2xl">{expandedPhase === 'phase3' ? '−' : '+'}</span>
            </div>
          </button>
          
          {expandedPhase === 'phase3' && (
            <div className="bg-purple-50 p-6 rounded-lg space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">What Happens</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>FastShip algorithm matches order to available drivers</li>
                  <li>Driver receives pickup notification in app</li>
                  <li>Driver accepts delivery job</li>
                  <li>Driver navigates to seller's location</li>
                  <li>Driver arrives at pickup location</li>
                  <li>Driver inspects package and verifies contents match manifest</li>
                  <li>Driver scans package with unique barcode</li>
                  <li>Driver begins transit to delivery address</li>
                  <li>Real-time GPS tracking available to buyer and seller</li>
                  <li>Driver uses optimized route for fastest delivery</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Real-Time Tracking</h3>
                <div className="bg-white p-4 rounded border-l-4 border-purple-500 space-y-2 text-slate-700">
                  <div>
                    <strong>📍 GPS Location:</strong> Buyer can see driver's real-time location on map
                  </div>
                  <div>
                    <strong>⏱️ Estimated Arrival:</strong> Updated ETA based on traffic and route
                  </div>
                  <div>
                    <strong>📞 Driver Contact:</strong> Buyer can call or message driver
                  </div>
                  <div>
                    <strong>📊 Delivery Status:</strong> Step-by-step status updates (picked up, in transit, arriving soon, etc.)
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Escrow Status During Transit</h3>
                <div className="bg-white p-4 rounded">
                  <p className="text-slate-700">
                    <strong className="block mb-2">🔒 Escrow Remains Locked</strong>
                    Funds are still held in escrow. They will only be released after delivery confirmation from buyer.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Driver Earnings</h3>
                <div className="space-y-2 text-slate-700">
                  <div className="flex gap-3">
                    <span className="font-bold">💰</span>
                    <span>Driver earns delivery fee based on distance, time, and complexity</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">📊</span>
                    <span>Earnings tracked in driver app in real-time</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">⭐</span>
                    <span>Performance bonuses available for on-time and perfect deliveries</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Phase 4: Delivery & Confirmation */}
        <section className="mb-8">
          <button
            onClick={() => togglePhase('phase4')}
            className="w-full mb-4 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition text-left"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Phase 4: Delivery & Confirmation</h2>
              <span className="text-2xl">{expandedPhase === 'phase4' ? '−' : '+'}</span>
            </div>
          </button>
          
          {expandedPhase === 'phase4' && (
            <div className="bg-indigo-50 p-6 rounded-lg space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">What Happens at Delivery</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  <li>Driver arrives at buyer's delivery address</li>
                  <li>Driver calls/texts buyer to confirm availability</li>
                  <li>Buyer comes to door/receives package</li>
                  <li>Driver confirms buyer identity if required</li>
                  <li>Buyer inspects package for damage</li>
                  <li>Driver scans delivery confirmation (photo/signature)</li>
                  <li>Order marked as "Delivered" in system</li>
                  <li>Buyer receives delivery confirmation notification</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">The Inspection Period (Hold Period)</h3>
                <div className="bg-white p-4 rounded border-l-4 border-indigo-500">
                  <p className="text-slate-700 mb-3">
                    <strong>What is the Hold Period?</strong> After delivery, a 5-day hold period begins to allow the buyer time to inspect the item and ensure quality.
                  </p>
                  <div className="space-y-2 text-slate-700">
                    <div><strong>Days 1-5 (After Delivery):</strong> Buyer has time to inspect the order and verify it matches the description.</div>
                    <div><strong>Buyer Actions Available:</strong> Accept order, report damage/defect, or initiate return</div>
                    <div><strong>Escrow Status:</strong> Funds still locked during this period</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Three Possible Outcomes</h3>
                
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded">
                    <h4 className="font-bold text-slate-900 mb-2">✅ Scenario 1: Buyer Accepts Order</h4>
                    <p className="text-slate-700 mb-2">Buyer confirms order is satisfactory and confirms receipt in app.</p>
                    <ul className="list-disc list-inside text-slate-700 space-y-1 ml-2">
                      <li>Order status: "Completed"</li>
                      <li>Escrow hold period ends early (can be same day or within 24 hours)</li>
                      <li>Proceeds to Settlement Phase</li>
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded">
                    <h4 className="font-bold text-slate-900 mb-2">❌ Scenario 2: Item Damaged or Defective</h4>
                    <p className="text-slate-700 mb-2">Buyer reports damage, defect, or item doesn't match description.</p>
                    <ul className="list-disc list-inside text-slate-700 space-y-1 ml-2">
                      <li>Buyer files claim with photos/evidence</li>
                      <li>FastShip disputes team reviews evidence</li>
                      <li>If approved: funds returned to buyer, seller charged or can appeal</li>
                      <li>If denied: buyer can request return authorization</li>
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded">
                    <h4 className="font-bold text-slate-900 mb-2">🔄 Scenario 3: Return Requested</h4>
                    <p className="text-slate-700 mb-2">Buyer initiates return within seller's return window.</p>
                    <ul className="list-disc list-inside text-slate-700 space-y-1 ml-2">
                      <li>Seller evaluates return request (can accept or deny)</li>
                      <li>If accepted: return label provided, buyer ships back</li>
                      <li>Upon return receipt: refund processed from escrow</li>
                      <li>If denied: order remains completed</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded border-l-4 border-amber-500">
                <p className="text-slate-700">
                  <strong>⚠️ Automatic Acceptance:</strong> If buyer doesn't take action after 5 days, the order is automatically marked as accepted and proceeds to settlement.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Phase 5: Cutting & Release */}
        <section className="mb-8">
          <button
            onClick={() => togglePhase('phase5')}
            className="w-full mb-4 p-4 bg-rose-50 hover:bg-rose-100 rounded-lg transition text-left"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Phase 5: Cutting & Escrow Release</h2>
              <span className="text-2xl">{expandedPhase === 'phase5' ? '−' : '+'}</span>
            </div>
          </button>
          
          {expandedPhase === 'phase5' && (
            <div className="bg-rose-50 p-6 rounded-lg space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Understanding "Cutting"</h3>
                <div className="bg-white p-4 rounded border-l-4 border-rose-500">
                  <p className="text-slate-700 mb-3">
                    <strong>"Cutting" refers to the process of releasing funds from escrow and allocating them to the appropriate parties (seller, driver, FastShip commission).</strong>
                  </p>
                  <p className="text-slate-700">
                    Think of it like a pie being sliced: the total escrow amount is divided among seller, driver, and FastShip fees, then distributed.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">When Cutting Occurs</h3>
                <div className="space-y-3 text-slate-700">
                  <div className="flex gap-3">
                    <span className="font-bold">✅</span>
                    <span><strong>Automatic Acceptance:</strong> 5 days after delivery with no issues</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">✅</span>
                    <span><strong>Buyer Confirmation:</strong> Buyer manually confirms receipt before 5 days</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">✅</span>
                    <span><strong>Claim Resolution:</strong> Dispute resolved in seller's favor</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">✅</span>
                    <span><strong>Return Completed:</strong> Return received and processed</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Fund Distribution Process</h3>
                <div className="bg-white p-6 rounded">
                  <p className="text-slate-700 mb-4 font-bold">Example: $100 Order</p>
                  
                  <div className="space-y-2 text-slate-700 mb-4">
                    <div className="flex justify-between items-center p-2 bg-slate-100 rounded">
                      <span>Order Total (in escrow):</span>
                      <span className="font-bold">$100.00</span>
                    </div>
                  </div>

                  <p className="text-slate-700 mb-3 font-bold">Allocation:</p>
                  
                  <div className="space-y-2 text-slate-700">
                    <div className="flex justify-between items-center">
                      <span>FastShip Commission (15%):</span>
                      <span className="text-rose-600 font-bold">-$15.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Driver Earnings (calculated):</span>
                      <span className="text-green-600 font-bold">-$8.50</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2 mt-2">
                      <span>Amount to Seller:</span>
                      <span className="text-blue-600 font-bold">$76.50</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Settlement Timeline</h3>
                <div className="space-y-2 text-slate-700">
                  <div className="flex gap-3">
                    <span className="font-bold">Day 0:</span>
                    <span>Order delivered and confirmed</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">Day 0-1:</span>
                    <span>Escrow cutting occurs (automated)</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">Day 2-5:</span>
                    <span>Funds appear in seller's account pending</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">Weekly:</span>
                    <span>All cut funds are settled via direct deposit</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">What Sellers See</h3>
                <div className="bg-white p-4 rounded space-y-2 text-slate-700">
                  <div className="flex gap-3">
                    <span className="font-bold">📊</span>
                    <span>Dashboard shows "Funds to Be Released" (pending settlement)</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">📈</span>
                    <span>Weekly settlement summary shows all orders cut that week</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">📤</span>
                    <span>Direct deposit confirmation email from FastShip</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">What Drivers See</h3>
                <div className="bg-white p-4 rounded space-y-2 text-slate-700">
                  <div className="flex gap-3">
                    <span className="font-bold">💰</span>
                    <span>Earnings added to weekly settlement immediately after cut</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">📊</span>
                    <span>Detailed earnings breakdown in driver app</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">🏦</span>
                    <span>Funds deposited to driver's bank account weekly</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Phase 6: Settlement */}
        <section className="mb-8">
          <button
            onClick={() => togglePhase('phase6')}
            className="w-full mb-4 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition text-left"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Phase 6: Settlement & Finalization</h2>
              <span className="text-2xl">{expandedPhase === 'phase6' ? '−' : '+'}</span>
            </div>
          </button>
          
          {expandedPhase === 'phase6' && (
            <div className="bg-emerald-50 p-6 rounded-lg space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">What is Settlement?</h3>
                <p className="text-slate-700">
                  Settlement is the final step where all processed funds (that have been "cut" from escrow) are transferred from FastShip to the seller's bank account via direct deposit.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Settlement Frequency</h3>
                <div className="bg-white p-4 rounded space-y-2 text-slate-700">
                  <div className="flex gap-3">
                    <span className="font-bold">📅</span>
                    <span><strong>Weekly:</strong> Settlements process every Friday (or designated day)</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">💳</span>
                    <span><strong>Bank Transfer:</strong> Funds transferred via ACH (automated clearing house)</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">⏱️</span>
                    <span><strong>Processing Time:</strong> 1-3 business days for funds to appear in bank account</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Seller Settlement Example</h3>
                <div className="bg-white p-6 rounded space-y-3">
                  <p className="text-slate-700 font-bold">Weekly Settlement Report:</p>
                  <div className="space-y-2 text-slate-700 text-sm">
                    <div className="flex justify-between items-center p-2 bg-slate-100 rounded">
                      <span>Orders Cut This Week:</span>
                      <span>15 orders</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Gross Sales:</span>
                      <span>$1,500.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>FastShip Commission (15%):</span>
                      <span>-$225.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Platform Fees:</span>
                      <span>-$0.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Chargebacks/Refunds:</span>
                      <span>-$50.00</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2 mt-2 font-bold">
                      <span>Settlement Amount:</span>
                      <span className="text-green-600">$1,225.00</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Driver Settlement Example</h3>
                <div className="bg-white p-6 rounded space-y-3">
                  <p className="text-slate-700 font-bold">Weekly Earnings:</p>
                  <div className="space-y-2 text-slate-700 text-sm">
                    <div className="flex justify-between items-center p-2 bg-slate-100 rounded">
                      <span>Deliveries Completed:</span>
                      <span>32 deliveries</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Base Earnings (per delivery):</span>
                      <span>$240.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>On-Time Bonus:</span>
                      <span>+$30.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Damage/Issue Deduction:</span>
                      <span>-$10.00</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2 mt-2 font-bold">
                      <span>Total Earnings:</span>
                      <span className="text-green-600">$260.00</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Notifications & Confirmations</h3>
                <div className="space-y-2 text-slate-700">
                  <div className="flex gap-3">
                    <span className="font-bold">📧</span>
                    <span>Settlement report email sent to seller/driver</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">📱</span>
                    <span>App notification when funds are transferred</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">🏦</span>
                    <span>Bank confirmation when ACH completes</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold">📊</span>
                    <span>Transaction ID for tracking and accounting</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded border-l-4 border-emerald-500">
                <p className="text-slate-700">
                  <strong>💡 Accounting Tip:</strong> Keep settlement reports for accounting and tax purposes. FastShip provides year-end 1099 reports for sellers and contractors.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Special Situations */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">⚠️ Special Situations & Exceptions</h2>

          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Chargeback / Buyer Dispute</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>If buyer files chargeback or disputes with their bank</li>
                <li>Escrow freeze: All funds remain locked pending investigation</li>
                <li>FastShip disputes team reviews evidence</li>
                <li>Settlement delayed until resolution (can take 30-90 days)</li>
                <li>If buyer loses: funds released to seller; chargeback fee applied to buyer</li>
              </ul>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Undeliverable Order</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>If driver cannot locate delivery address or buyer unavailable</li>
                <li>Driver attempts contact multiple times</li>
                <li>Order marked as "Undeliverable" after failed attempts</li>
                <li>Escrow is placed on hold</li>
                <li>Buyer and seller contacted for resolution</li>
                <li>Typically results in return to sender or refund</li>
              </ul>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Seller Account Suspended</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>If seller account suspended (policy violation, fraud, etc.)</li>
                <li>Pending escrow for cut orders: Still settled per normal schedule</li>
                <li>New orders: Blocked from being placed</li>
                <li>Appeal process available within 7 days</li>
                <li>If suspended permanently: Final settlement occurs after any disputes resolve</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Partial Return / Refund</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Buyer returns some items but keeps others</li>
                <li>Seller evaluates return and offers partial refund</li>
                <li>Escrow is adjusted: reduced refund amount deducted</li>
                <li>Remaining balance settled normally</li>
                <li>Driver earnings adjusted if applicable</li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-slate-50 p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">❓ Frequently Asked Questions</h2>

          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-slate-900 mb-2">How long does the entire process take?</h4>
              <p className="text-slate-700">
                Typical timeline: 1-7 days. Orders can arrive within 1-3 days, inspection takes up to 5 days, and settlement occurs weekly. Total time from order to funds in account: 7-12 days.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2">Can a seller access the escrow early?</h4>
              <p className="text-slate-700">
                No. Escrow funds are locked until after buyer confirmation or automatic acceptance. This protects both buyer and seller. FastShip does offer advances for high-volume sellers on approved request.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2">What if the buyer never confirms receipt?</h4>
              <p className="text-slate-700">
                After 5 days with no action, the order is automatically marked as accepted and proceeds to settlement. Buyer is protected by having that 5-day window.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2">Can I track my settlement in real-time?</h4>
              <p className="text-slate-700">
                Yes! Your dashboard shows orders that are in escrow, orders cut and pending settlement, and historical settlements. You can see exactly when funds will be released.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2">What fees are deducted from my settlement?</h4>
              <p className="text-slate-700">
                FastShip commission (varies by category), payment processing fees, any chargebacks or refunds, and platform fees if applicable. All are transparent and shown in your settlement report.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2">How long does the driver wait for payment?</h4>
              <p className="text-slate-700">
                Once an order is cut (accepted), driver earnings are added to their weekly settlement. Drivers are paid every week via direct deposit, just like sellers.
              </p>
            </div>
          </div>
        </section>

        {/* Key Takeaways */}
        <section className="bg-slate-900 text-white p-8 rounded-lg mt-8">
          <h2 className="text-2xl font-bold mb-4">🎯 Key Takeaways</h2>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span>✓</span>
              <span><strong>Escrow Protection:</strong> Funds are held securely, protecting both buyer and seller until order is confirmed</span>
            </li>
            <li className="flex gap-3">
              <span>✓</span>
              <span><strong>Inspection Period:</strong> 5-day hold allows buyer to inspect before funds are released</span>
            </li>
            <li className="flex gap-3">
              <span>✓</span>
              <span><strong>Transparent Cutting:</strong> Escrow is cut (distributed) automatically once order is accepted</span>
            </li>
            <li className="flex gap-3">
              <span>✓</span>
              <span><strong>Weekly Settlement:</strong> All cut funds are settled and deposited to seller/driver accounts each week</span>
            </li>
            <li className="flex gap-3">
              <span>✓</span>
              <span><strong>Real-Time Tracking:</strong> Dashboard shows all escrow, cut, and settled funds</span>
            </li>
            <li className="flex gap-3">
              <span>✓</span>
              <span><strong>Dispute Resolution:</strong> Transparent process for any issues with orders or funds</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
