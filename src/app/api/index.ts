import { axiosApi } from '@/lib/axios';
import { IBooking, IBookingRs, ILoginFields, IOtpFields } from './models';
import { AxiosResponse } from 'axios';

export const postLogin = (payload: ILoginFields) =>
  axiosApi.post('auth/otp/request', payload);

export const postOtp = (payload: IOtpFields) =>
  axiosApi.post('auth/otp/verify', payload);

export const getBookings = (): Promise<AxiosResponse<IBooking[]>> =>
  axiosApi.get('/reservations');

export const getServiceTypes = async () => {
  const { data } = await axiosApi.get('/service-types/input-search');
  return data;
};

export const getAvailableHours = async (date: string) => {
  const { data } = await axiosApi.get(`/reservation-times/input-search?date=${date}`);
  return data;
};

export const getDoctorsByDateTime = async (dateTime: string) => {
  const { data } = await axiosApi.get(`/reservations/users/input-search?date_time=${dateTime}`);
  return data;
};

export const createBooking = async (payload: any) => axiosApi.post('/reservations', payload);