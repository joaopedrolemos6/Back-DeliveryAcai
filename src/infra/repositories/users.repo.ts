import { pool } from "../db/connection";

type UserRole = "CLIENT" | "ADMIN";

interface InsertUserDTO {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  password_hash: string;
  role: UserRole;
}

export const usersRepo = {
  // 🔍 Buscar por e-mail OU telefone (login)
  async findByEmailOrPhone(identifier: string) {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, password_hash, role, is_active
       FROM users
       WHERE email = ? OR phone = ?
       LIMIT 1`,
      [identifier, identifier]
    );
    return (rows as any[])[0] ?? null;
  },

  // 🔍 Buscar por e-mail e/ou telefone (uso em cadastro para checar duplicidade)
  async findByEmailOrPhoneFlexible(email?: string, phone?: string) {
    const conditions: string[] = [];
    const params: any[] = [];

    if (email) {
      conditions.push("email = ?");
      params.push(email);
    }
    if (phone) {
      conditions.push("phone = ?");
      params.push(phone);
    }

    if (!conditions.length) return null;

    const where = conditions.join(" OR ");
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, password_hash, role, is_active
       FROM users
       WHERE ${where}
       LIMIT 1`,
      params
    );

    return (rows as any[])[0] ?? null;
  },

  // ➕ Inserir novo usuário (usado no cadastro)
  async insert(u: InsertUserDTO) {
    await pool.query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [u.id, u.name, u.email ?? null, u.phone ?? null, u.password_hash, u.role]
    );
  },

  // ➕ Inserção detalhada (modo alternativo, mais explícito)
  async insertDetailed(user: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    password_hash: string;
    role: "CLIENT" | "ADMIN";
  }) {
    await pool.query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        user.id,
        user.name,
        user.email,
        user.phone,
        user.password_hash,
        user.role,
      ]
    );
  },

  // 🔎 Buscar por ID
  async findById(id: string) {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, role, is_active, created_at
       FROM users
       WHERE id = ?`,
      [id]
    );
    return (rows as any[])[0] ?? null;
  },

  // 🏠 Buscar usuário com endereços vinculados
  async findByIdWithAddresses(id: string) {
    const [userRows] = await pool.query(
      `SELECT id, name, email, phone, role, is_active, created_at
       FROM users
       WHERE id = ?`,
      [id]
    );
    const user = (userRows as any[])[0];
    if (!user) return null;

    const [addr] = await pool.query(
      `SELECT id, street, number, city, state, zip
       FROM addresses
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [id]
    );

    return { ...user, addresses: addr };
  },

  // ✏️ Atualizar dados do usuário
  async update(id: string, data: { name?: string; email?: string; phone?: string }) {
    const [ret] = await pool.query(
      `UPDATE users SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        updated_at = NOW()
       WHERE id = ?`,
      [data.name ?? null, data.email ?? null, data.phone ?? null, id]
    );
    return (ret as any).affectedRows > 0;
  },
};
