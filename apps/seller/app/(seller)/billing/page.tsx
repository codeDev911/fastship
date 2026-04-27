import { SellerLayout } from '../../../components/SellerLayout';
import { BillingPageShared } from '@fastship/ui'; 
export default function BillingPage() { 


  return (
    <SellerLayout
      currentPage="billing"
      walletBalance={0}
      currency="PKR"
    >
    <BillingPageShared apiUrl='/api/wallets?sellerId'/>
    </SellerLayout>

  );
}
