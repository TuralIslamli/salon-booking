import { Button } from 'primereact/button';
import { InputOtp } from 'primereact/inputotp';
import { Dispatch, SetStateAction, useRef, useState } from 'react';
import styles from './index.module.scss';
import { normalizePhone } from '../utils';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { postOtp } from '../api';
import { Toast } from 'primereact/toast';

interface IProps {
  setStep: Dispatch<SetStateAction<'phone' | 'otp'>>;
  phone: string;
}

function OtpInput({ setStep, phone }: IProps) {
  const [otp, setOtp] = useState<string>('');
  const router = useRouter();
  const toast = useRef<Toast>(null);

  const { mutate: otpMutate } = useMutation({
    mutationKey: ['otp'],
    mutationFn: async () =>
      postOtp({ phone: normalizePhone(phone), code: otp }),
    onSuccess: (data: any) => {
      localStorage.setItem('customerToken', data.data.token.access_token);
      router.push('/');
    },
    onError: (error: any) => {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error?.response?.data?.message,
        life: 3000,
      });
      console.error('Error during otp:', error);
    },
  });

  const handleVerifyOtp = async () => {
    otpMutate();
  };

  return (
    <div className={styles.otpInput}>
      <Toast ref={toast} />
      <InputOtp
        integerOnly
        value={otp}
        onChange={(e) => setOtp(e.value as string)}
        length={4}
        style={{ gap: 10 }}
      />
      <div>
        {/* <Button label="Yenidən göndər" link></Button> */}
        <Button
          label="Təsdiqlə"
          disabled={otp.length < 4}
          onClick={handleVerifyOtp}
        ></Button>
      </div>
    </div>
  );
}

export default OtpInput;
