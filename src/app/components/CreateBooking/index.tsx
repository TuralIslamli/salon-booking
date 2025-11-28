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

// ✅ yup + resolver
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { AxiosResponse } from 'axios';

interface BookingFormData {
  client_name: string;
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

// ✅ Yup схема (все сообщения — на азербайджанском)
const schema: yup.ObjectSchema<BookingFormData> = yup
  .object({
    client_name: yup
      .string()
      .transform((v) => (typeof v === 'string' ? v.trim() : v))
      .required('Müştəri adı mütləqdir')
      .min(2, 'Minimum 2 simvol')
      .max(80, 'Maksimum 80 simvol')
      .matches(
        /^[\p{L}][\p{L}\p{M}\s.'-]{1,79}$/u,
        'Yalnız hərflər, boşluq, nöqtə, tire və apostrof'
      ),

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
      client_name: '',
      services: [],
      doctor: null,
      date: undefined,
      hour: null,
    },
  });

  const selectedDate = watch('date');
  const selectedHour = watch('hour');

  const { data: servicesData = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: getServiceTypes,
  });

  const { data: hoursData = [], isLoading: loadingHours } = useQuery({
    queryKey: ['hours', selectedDate],
    queryFn: () =>
      getAvailableHours(format(selectedDate as Date, 'yyyy-MM-dd')),
    enabled: !!selectedDate,
  });

  const { data: doctorsData = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors', selectedDate, selectedHour],
    queryFn: () =>
      getDoctorsByDateTime(
        `${format(selectedDate as Date, 'yyyy-MM-dd')} ${selectedHour?.time}`
      ),
    enabled: !!selectedDate && !!selectedHour?.time,
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
    const payload = {
      client_name: data.client_name,
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
      onHide={() => {
        reset();
        onHide();
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {/* Müştəri adı */}
        <label>Müştəri adı</label>
        <Controller
          name="client_name"
          control={control}
          render={({ field }) => (
            <InputText
              {...field}
              className={`${styles.input} ${
                errors.client_name ? 'p-invalid' : ''
              }`}
            />
          )}
        />

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
    </Dialog>
  );
};

export default CreateBooking;
