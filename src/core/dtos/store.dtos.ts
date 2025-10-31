export interface StoreSettingsDTO {
  delivery_fee_cents: number;
  min_order_cents: number;
  delivery_radius_km: number;
  latitude: number | null;
  longitude: number | null;
  is_open: boolean;
}
