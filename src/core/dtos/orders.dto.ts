export interface OrderItemDTO {
  id: string;
  product_id: string;
  quantity: number;
  price_cents_at_order: number;
}
export interface OrderDTO {
  id: string;
  user_id: string;
  address_id: string;
  status: "PENDING"|"CONFIRMED"|"OUT_FOR_DELIVERY"|"DELIVERED"|"CANCELED";
  payment_method: "CASH"|"PIX";
  payment_status: "PENDING"|"APPROVED"|"DECLINED";
  total_cents: number;
  note?: string;
  items: OrderItemDTO[];
}
