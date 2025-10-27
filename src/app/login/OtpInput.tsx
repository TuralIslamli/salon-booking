import { Button } from 'primereact/button';
import { InputOtp } from 'primereact/inputotp';
import { Dispatch, SetStateAction, useState } from 'react';
import styles from './index.module.scss';
import { normalizePhone } from '../utils';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { postOtp } from '../api';

interface IProps {
  setStep: Dispatch<SetStateAction<'phone' | 'otp'>>;
  phone: string;
}

function OtpInput({ setStep, phone }: IProps) {
  const [otp, setOtp] = useState<string>('');
  const router = useRouter();

  const { mutate: otpMutate } = useMutation({
    mutationKey: ['otp'],
    mutationFn: async () =>
      postOtp({ phone: normalizePhone(phone), code: otp }),
    onSuccess: (data: any) => {
      localStorage.setItem("customerToken", data.data.token.access_token);
      router.push('/');
    },
    onError: (error: any) => {
      console.error('Error during otp:', error);
    },
  });

  const handleVerifyOtp = async () => {
    otpMutate();
  };

  return (
    <div className={styles.otpInput}>
      <InputOtp
        value={otp}
        onChange={(e) => setOtp(e.value as string)}
        length={4}
        style={{ gap: 10 }}
      />
      <div>
        <Button label="Yenidən göndər" link></Button>
        <Button label="Təsdiqlə" onClick={handleVerifyOtp}></Button>
      </div>
    </div>
  );
}

export default OtpInput;
