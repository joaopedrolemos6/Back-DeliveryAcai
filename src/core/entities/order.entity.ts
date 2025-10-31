export interface Order {
  id: string;
  user_id: string;
  address_id: string;
  status: "PENDING"|"CONFIRMED"|"OUT_FOR_DELIVERY"|"DELIVERED"|"CANCELED";
  payment_method: "CASH"|"PIX";
  payment_status: "PENDING"|"APPROVED"|"DECLINED";
  total_cents: number;
  note?: string;
  created_at: Date;
  updated_at: Date;
}
