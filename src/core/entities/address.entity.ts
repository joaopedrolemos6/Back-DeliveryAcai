export interface Address {
  id: string;
  user_id: string;
  street: string;
  number: string;
  complement?: string | null;
  district?: string | null;
  city: string;
  state: string;
  zip: string;
  latitude?: number | null;
  longitude?: number | null;
}
