export interface ILoginFields {
  phone: string;
}

export interface IOtpFields extends ILoginFields {
  code: string;
}

export interface ICustomerStatus {
  status_id: number;
  status_name: string;
}

export interface IBooking {
  id: number;
  reservation_date: string;
  total_amount: number;
  client_name: string;
  client_phone: string;
  customer_status: ICustomerStatus;
}

export interface IBookingRs {
  data: IBooking[];
  message: string;
}
