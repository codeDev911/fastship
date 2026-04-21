'use client';

import { DriverLayout } from '../../../components/DriverLayout';
import { useNotifications } from '@fastship/lib';

export default function DriverNotificationsPage() {
  const {  getUnreadCount } =
    useNotifications();

  const unreadCount = getUnreadCount();

  return (
    <DriverLayout currentPage="notifications" unreadNotifications={unreadCount}>
      <div><h2>notifications</h2></div>
    </DriverLayout>
  );
}
