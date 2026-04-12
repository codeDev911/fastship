'use client';

import React from 'react';
import { BusinessLayout } from '@/components/business/BusinessLayout';
import { CashSettlementDesk } from '@/components/business/CashSettlementDesk';

export default function CashSettlementPage() {
  return (
    <BusinessLayout currentPage="analytics">
      <CashSettlementDesk />
    </BusinessLayout>
  );
}
