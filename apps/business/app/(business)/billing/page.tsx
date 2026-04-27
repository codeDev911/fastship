import { BillingPageShared, BusinessLayout } from "@fastship/ui";

export default function BillingPage() {

  return (
    <BusinessLayout
      currentPage="billing"
      walletBalance={0}
      currency="PKR"
    >
      <BillingPageShared apiUrl='/api/wallets?businessId' />
    </BusinessLayout>

  );
}
