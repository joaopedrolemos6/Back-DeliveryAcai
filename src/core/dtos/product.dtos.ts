export interface ProductDTO {
  id: string;
  category_id?: string | null;
  name: string;
  description?: string | null;
  price_cents: number;
  image_url?: string | null;
  is_available: boolean;
}
