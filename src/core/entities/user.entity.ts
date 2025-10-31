export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  password_hash: string;
  role: "CLIENT" | "ADMIN";
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
