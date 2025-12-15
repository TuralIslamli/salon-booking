'use client';

import { Dialog } from 'primereact/dialog';
import { Controller, useForm } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import styles from './styles.module.scss';
import {
  QueryObserverResult,
  RefetchOptions,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import {
  createBooking,
  getAvailableHours,
  getDoctorsByDateTime,
  getServiceTypes,
} from '@/app/api';
import { format } from 'date-fns';
import { useState } from 'react';

// ✅ yup + resolver
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { AxiosResponse } from 'axios';

interface BookingFormData {
  client_first_name: string;
  client_last_name: string;
  services: { id: number; name: string }[];
  doctor: { id: number; full_name: string } | null;
  date?: Date;
  hour: { time: string } | null;
}

interface BookingDialogProps {
  visible: boolean;
  onHide: () => void;
  refetch: (
    options?: RefetchOptions | undefined
  ) => Promise<QueryObserverResult<AxiosResponse<any, any>, Error>>;
}

// ✅ helper: проверка, что дата+время не в прошлом
const isFutureDateTime = (date?: Date | null, timeStr?: string | null) => {
  if (!date || !timeStr) return false;
  try {
    const [hh, mm] = timeStr.split(':').map((v) => parseInt(v, 10));
    const dt = new Date(date);
    dt.setHours(hh || 0, mm || 0, 0, 0);
    return dt.getTime() >= Date.now();
  } catch {
    return false;
  }
};

// Валидация для имени/фамилии
const nameValidation = yup
  .string()
  .transform((v) => (typeof v === 'string' ? v.trim() : v))
  .required('Bu sahə mütləqdir')
  .min(2, 'Minimum 2 simvol')
  .max(40, 'Maksimum 40 simvol')
  .matches(
    /^[\p{L}][\p{L}\p{M}\s.'-]{1,39}$/u,
    'Yalnız hərflər, boşluq, nöqtə, tire və apostrof'
  );

// ✅ Yup схема (все сообщения — на азербайджанском)
const schema: yup.ObjectSchema<BookingFormData> = yup
  .object({
    client_first_name: nameValidation.clone().required('Ad mütləqdir'),
    client_last_name: nameValidation.clone().required('Soyad mütləqdir'),

    services: yup
      .array(
        yup.object({
          id: yup.number().required(),
          name: yup.string().required(),
        })
      )
      .min(1, 'Ən azı bir xidmət seçin')
      .required('Ən azı bir xidmət seçin'),

    date: yup
      .mixed<Date>()
      // .nullable()
      .required('Tarix seçin')
      .test(
        'is-date',
        'Düzgün tarix seçin',
        (v) => v instanceof Date && !isNaN(v.getTime())
      ),

    hour: yup
      .object({
        time: yup.string().required(),
      })
      .nullable()
      .required('Saat seçin')
      .test(
        'has-time',
        'Saat seçin',
        (v) => !!v && typeof v.time === 'string' && v.time.length > 0
      ),

    doctor: yup
      .object({
        id: yup.number().required(),
        full_name: yup.string().required(),
      })
      .nullable()
      .required('Həkim seçin'),
  })
  // ✅ кросс-полевая проверка: date+hour не в прошлом
  .test('future-datetime', 'Keçmiş zaman seçilə bilməz', (values) => {
    const date = values.date ?? null;
    const time = values.hour?.time ?? null;
    // если одно из полей ещё не выбрано — не блокируем (их собственные проверки сработают)
    if (!date || !time) return true;
    return isFutureDateTime(date, time);
  });

const CreateBooking = ({ visible, onHide, refetch }: BookingDialogProps) => {
  const [step, setStep] = useState<'warning' | 'form'>('warning');
  
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid, isSubmitting },
  } = useForm<BookingFormData>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(schema), // <-- ВАЖНО: подключаем yup
    shouldUnregister: false,
    defaultValues: {
      client_first_name: '',
      client_last_name: '',
      services: [],
      doctor: null,
      date: undefined,
      hour: null,
    },
  });
  
  const handleClose = () => {
    reset();
    setStep('warning');
    onHide();
  };

  const selectedDate = watch('date');
  const selectedHour = watch('hour');

  const { data: servicesData = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: getServiceTypes,
    enabled: visible && step === 'form',
  });

  const { data: hoursData = [], isLoading: loadingHours } = useQuery({
    queryKey: ['hours', selectedDate],
    queryFn: () =>
      getAvailableHours(format(selectedDate as Date, 'yyyy-MM-dd')),
    enabled: visible && step === 'form' && !!selectedDate,
  });

  const { data: doctorsData = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors', selectedDate, selectedHour],
    queryFn: () =>
      getDoctorsByDateTime(
        `${format(selectedDate as Date, 'yyyy-MM-dd')} ${selectedHour?.time}`
      ),
    enabled: visible && step === 'form' && !!selectedDate && !!selectedHour?.time,
  });

  const { mutate: bookingCreate } = useMutation({
    mutationFn: (payload: {
      client_name: string;
      doctor_id?: number;
      reservation_date: string;
      service_types: { id: number }[];
    }) => createBooking(payload),
  });

  const onSubmit = (data: BookingFormData) => {
    // Соединяем имя и фамилию для отправки на бэкенд
    const fullName = `${data.client_first_name.trim()} ${data.client_last_name.trim()}`;
    
    const payload = {
      client_name: fullName,
      doctor_id: data.doctor?.id,
      reservation_date: `${format(data.date as Date, 'dd-MM-yyyy')} ${
        data.hour!.time
      }`,
      service_types: data.services.map((s) => ({ id: s.id })),
    };

    bookingCreate(payload, {
      onSuccess: () => {
        reset();
        onHide();
        refetch();
      },
    });
  };

  return (
    <Dialog
      header="Yeni rezervasiya"
      visible={visible}
      style={{ width: '100%', maxWidth: '500px' }}
      modal
      onHide={handleClose}
    >
      {step === 'warning' ? (
        <div className={styles.warningStep}>
          <div className={styles.warningIcon}>
            <i className="pi pi-info-circle" />
          </div>
          <p className={styles.warningText}>
            Rezervasiya etdiyiniz zaman sizdən avans depozit istəniləcəkdir
          </p>
          <Button
            label="Aydındır"
            onClick={() => setStep('form')}
            className={styles.submit}
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Müştəri adı və soyadı */}
          <div className={styles.nameFields}>
            <div className={styles.nameField}>
              <label>Ad</label>
              <Controller
                name="client_first_name"
                control={control}
                render={({ field }) => (
                  <InputText
                    {...field}
                    placeholder="Adınızı daxil edin"
                    className={`${styles.input} ${
                      errors.client_first_name ? 'p-invalid' : ''
                    }`}
                  />
                )}
              />
            </div>
            <div className={styles.nameField}>
              <label>Soyad</label>
              <Controller
                name="client_last_name"
                control={control}
                render={({ field }) => (
                  <InputText
                    {...field}
                    placeholder="Soyadınızı daxil edin"
                    className={`${styles.input} ${
                      errors.client_last_name ? 'p-invalid' : ''
                    }`}
                  />
                )}
              />
            </div>
          </div>

          {/* Xidmətlər */}
          <label>Xidmətlər</label>
          <Controller
            name="services"
            control={control}
            render={({ field }) => (
              <MultiSelect
                {...field}
                filter
                options={servicesData}
                optionLabel="name"
                placeholder={loadingServices ? 'Yüklənir...' : 'Xidmət seçin'}
                className={`${styles.input} ${
                  errors.services ? 'p-invalid' : ''
                }`}
                disabled={loadingServices}
                onChange={(e) => field.onChange(e.value)}
              />
            )}
          />

          {/* Tarix */}
          <label>Tarix</label>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <Calendar
                {...field}
                dateFormat="dd.mm.yy"
                minDate={new Date()}
                showIcon
                className={`${styles.input} ${errors.date ? 'p-invalid' : ''}`}
                onChange={(e) => {
                  field.onChange(e.value);
                  // сброс часов/врача при смене даты
                  setValue('hour', null, { shouldValidate: true });
                  setValue('doctor', null, { shouldValidate: true });
                }}
              />
            )}
          />

          {/* Saat */}
          <label>Saat</label>
          <Controller
            name="hour"
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                options={hoursData}
                optionLabel="time"
                placeholder={loadingHours ? 'Yüklənir...' : 'Saat seçin'}
                className={`${styles.input} ${errors.hour ? 'p-invalid' : ''}`}
                disabled={!selectedDate || loadingHours}
                onChange={(e) => field.onChange(e.value)}
              />
            )}
          />

          {/* Həkim */}
          <label>Həkim</label>
          <Controller
            name="doctor"
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                options={doctorsData}
                optionLabel="full_name"
                placeholder={loadingDoctors ? 'Yüklənir...' : 'Həkim seçin'}
                className={`${styles.input} ${errors.doctor ? 'p-invalid' : ''}`}
                disabled={!selectedDate || !selectedHour?.time || loadingDoctors}
                onChange={(e) => field.onChange(e.value)}
              />
            )}
          />

          <Button
            type="submit"
            label={isSubmitting ? 'Göndərilir...' : 'Təsdiqlə'}
            className={styles.submit}
            disabled={!isValid || isSubmitting}
          />
        </form>
      )}
    </Dialog>
  );
};

export default CreateBooking;
