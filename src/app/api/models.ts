export interface ILoginFields {
  phone: string;
}

export interface IOtpFields extends ILoginFields {
  code: string;
}

export interface IBooking {
  id: number;
  reservation_date: string;
  total_amount: number;
  client_name: string;
  client_phone: string;
}

export interface IBookingRs {
  data: IBooking[];
  message: string;
}