'use client';

import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import styles from './page.module.scss';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { getBookings } from './api';
import { Message } from 'primereact/message';
import CreateBooking from './components/CreateBooking';
import { IBooking } from './api/models';

export default function BookingsPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

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
  const onLogOut = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Image
          src="/logo15.svg"
          alt="googlePlay"
          width={150}
          height={100}
          className={styles.googlePlay}
        />
        <div className={styles.header__actions}>
          <Button
            label="+"
            severity="warning"
            rounded
            aria-label="Yeni sifariş"
            onClick={() => setIsVisible(true)}
            className={styles.addButton}
          />
          <Button
            icon="pi pi-sign-out"
            severity="warning"
            rounded
            className={styles.addButton}
            onClick={onLogOut}
          />
        </div>
      </header>

      <main className={styles.cardList}>
        {isLoading && <div>Yüklənir...</div>}
        {bookings?.map((booking: IBooking) => (
          <Card key={booking.id} className={styles.card}>
            <div className={styles.item}>
              <span className={styles.label}>Tarix:</span>{' '}
              {booking.reservation_date}
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Məbləğ:</span> {booking.total_amount} ₼
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Müştəri:</span>{' '}
              {booking.client_name}
            </div>
             <div className={styles.item}>
              <span className={styles.label}>Telefon:</span>{' '}
              {booking.client_phone}
            </div>
          </Card>
        ))}
        {!bookings?.length && !isLoading && (
          <Message severity="secondary" text="Rezervasiya mövcüd deyil" />
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
