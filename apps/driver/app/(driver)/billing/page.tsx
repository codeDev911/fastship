
import {  BillingPageShared } from '@fastship/ui'; 
import { DriverLayout } from '../../../components/DriverLayout'; 

export default function BillingPage() {
 
  return (
    <DriverLayout
      currentPage="billing"
      unreadNotifications={0}
    >
    <BillingPageShared apiUrl='/api/wallets?driverId'/>
    </DriverLayout>
  );
}
