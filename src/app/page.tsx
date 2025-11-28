'use client';

import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { Tag } from 'primereact/tag';
import styles from './page.module.scss';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { getBookings } from './api';
import { Message } from 'primereact/message';
import CreateBooking from './components/CreateBooking';
import { IBooking } from './api/models';
import { ECustomerStatus } from './enums';

const STATUS_CONFIG: Record<number, { label: string; severity: 'danger' | 'warning' | 'success' | 'info' }> = {
  [ECustomerStatus.ORDER_REJECTED]: { label: 'Ləğv olundu', severity: 'danger' },
  [ECustomerStatus.ORDER_PLACED]: { label: 'Təsdiq gözlənilir', severity: 'warning' },
  [ECustomerStatus.ORDER_ACCEPTED]: { label: 'Təsdiq olundu', severity: 'success' },
  [ECustomerStatus.ORDER_COMPLETED]: { label: 'Tamamlandı', severity: 'info' },
};

export default function BookingsPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  useEffect(() => {
    const customerToken = localStorage.getItem('customerToken');
    if (!customerToken) {
      router.push('/login');
    }
  }, [router]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => getBookings(),
  });

  const bookings = data?.data || [];

  // Filter active reservations (status_id 1 and 2)
  const activeBookings = bookings.filter(
    (booking: IBooking) =>
      booking.customer_status?.status_id === ECustomerStatus.ORDER_PLACED ||
      booking.customer_status?.status_id === ECustomerStatus.ORDER_ACCEPTED
  );

  // Filter completed reservations (status_id 0 and 3)
  const completedBookings = bookings.filter(
    (booking: IBooking) =>
      booking.customer_status?.status_id === ECustomerStatus.ORDER_REJECTED ||
      booking.customer_status?.status_id === ECustomerStatus.ORDER_COMPLETED
  );

  const onLogOut = () => {
    localStorage.clear();
    router.push('/login');
  };

  const getStatusConfig = (statusId: number) => {
    return STATUS_CONFIG[statusId] ?? { label: 'Naməlum', severity: 'secondary' as const };
  };

  const renderBookingCard = (booking: IBooking) => {
    const statusConfig = getStatusConfig(booking.customer_status?.status_id);
    
    return (
      <Card key={booking.id} className={styles.card}>
        <div className={styles.statusItem}>
          <Tag value={statusConfig.label} severity={statusConfig.severity} />
        </div>
        <div className={styles.item}>
          <i className="pi pi-calendar" />
          <span className={styles.label}>Tarix:</span>
          <span className={styles.value}>{booking.reservation_date?.split(' ')[0]}</span>
        </div>
        <div className={styles.item}>
          <i className="pi pi-clock" />
          <span className={styles.label}>Saat:</span>
          <span className={styles.value}>{booking.reservation_date?.split(' ')[1]}</span>
        </div>
        <div className={styles.item}>
          <i className="pi pi-wallet" />
          <span className={styles.label}>Məbləğ:</span>
          <span className={styles.value}>{booking.total_amount} ₼</span>
        </div>
        <div className={styles.item}>
          <i className="pi pi-user" />
          <span className={styles.label}>Müştəri:</span>
          <span className={styles.value}>{booking.client_name}</span>
        </div>
        <div className={styles.item}>
          <i className="pi pi-phone" />
          <span className={styles.label}>Telefon:</span>
          <span className={styles.value}>{booking.client_phone}</span>
        </div>
      </Card>
    );
  };

  const renderBookingsList = (bookingsList: IBooking[]) => (
    <div className={styles.cardList}>
      {bookingsList.map(renderBookingCard)}
      {!bookingsList.length && !isLoading && (
        <Message severity="secondary" text="Rezervasiya mövcüd deyil" />
      )}
    </div>
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Image src="/logo15.svg" alt="logo" width={200} height={140} />
        <div className={styles.header__actions}>
          <Button
            icon="pi pi-plus"
            rounded
            aria-label="Yeni rezervasiya"
            onClick={() => setIsVisible(true)}
            className={styles.addButton}
            tooltip="Yeni rezervasiya"
            tooltipOptions={{ position: 'bottom' }}
          />
          <Button
            icon="pi pi-sign-out"
            rounded
            className={styles.logoutButton}
            onClick={onLogOut}
            tooltip="Çıxış"
            tooltipOptions={{ position: 'bottom' }}
          />
        </div>
      </header>

      <main className={styles.main}>
        {isLoading && <div className={styles.loading}>Yüklənir...</div>}
        {!isLoading && (
          <TabView className={styles.tabView} activeIndex={activeTabIndex} onTabChange={(e) => setActiveTabIndex(e.index)}>
            <TabPanel header="Aktiv rezervasiyalar">
              {renderBookingsList(activeBookings)}
            </TabPanel>
            <TabPanel header="Bitmiş rezervasiyalar">
              {renderBookingsList(completedBookings)}
            </TabPanel>
          </TabView>
        )}
      </main>
      <CreateBooking
        visible={isVisible}
        onHide={() => setIsVisible(false)}
        refetch={refetch}
      />
    </div>
  );
}
