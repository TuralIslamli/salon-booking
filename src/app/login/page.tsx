'use client';

import { useEffect, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import PhoneInput from './PhoneInput';

import styles from './index.module.scss';
import OtpInput from './OtpInput';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const customerToken = localStorage.getItem('customerToken');
    if (customerToken) {
      router.push('/');
    }
  }, [router]);

  return (
    <div className={styles.login}>
      <div className={styles.card}>
        <div className={styles.logoWrapper}>
          <Image 
            src="/logo15.svg" 
            alt="Salon Logo" 
            width={180} 
            height={120}
            className={styles.logo}
            priority
          />
        </div>
        
        <div className={styles.headerSection}>
          <h2>Daxil ol</h2>
          <p className={styles.subtitle}>Rezervasiya sisteminə xoş gəlmisiniz</p>
        </div>

        {step == 'phone' ? (
          <PhoneInput setStep={setStep} phone={phone} setPhone={setPhone} />
        ) : (
          <OtpInput setStep={setStep} phone={phone}/>
        )}
      </div>
    </div>
  );
}
