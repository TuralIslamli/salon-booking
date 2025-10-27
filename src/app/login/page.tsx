'use client';

import { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import PhoneInput from './PhoneInput';

import styles from './index.module.scss';
import OtpInput from './OtpInput';

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  return (
    <div className={styles.login}>
      <div className={styles.card}>
        <h2>Daxil ol</h2>

        {step == 'phone' ? (
          <PhoneInput setStep={setStep} phone={phone} setPhone={setPhone} />
        ) : (
          <OtpInput setStep={setStep} phone={phone}/>
        )}
      </div>
    </div>
  );
}
