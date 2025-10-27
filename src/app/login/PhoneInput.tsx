import { Button } from 'primereact/button';
import { InputMask } from 'primereact/inputmask';
import { Dispatch, SetStateAction, useState } from 'react';
import styles from './index.module.scss';
import { normalizePhone } from '../utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import { postLogin } from '../api';

interface IProps {
  setStep: Dispatch<SetStateAction<'phone' | 'otp'>>;
  phone: string;
  setPhone: Dispatch<SetStateAction<string>>;
}

function PhoneInput({ setStep, phone, setPhone }: IProps) {
  const { mutate: loginMutate } = useMutation({
    mutationFn: async () => postLogin({ phone: normalizePhone(phone) }),
    onSuccess: () => {
      setStep('otp');
    },
    onError: (error: any) => {
      console.error('Error during login:', error);
    },
  });

  const handleSendOtp = async () => {
    loginMutate();
  };

  return (
    <div className={styles.phoneInput}>
      <label htmlFor="phone" className={styles.label}>
        Mobil nömrə
      </label>
      <InputMask
        id="client_phone"
        mask="+999 99 999-99-99"
        placeholder="+994 99 999-99-99"
        value={phone}
        onChange={(e) => setPhone(e.target.value as string)}
        className={styles.input}
      />
      <Button
        label="Kod göndər"
        onClick={handleSendOtp}
        className={styles.button}
        disabled={normalizePhone(phone).length !== 12}
      />
    </div>
  );
}

export default PhoneInput;
