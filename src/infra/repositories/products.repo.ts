import { pool } from "../db/connection";

export const productsRepo = {
  async list({
    categoryId,
    q,
    sort,
    limit,
    offset,
  }: {
    categoryId?: string;
    q?: string;
    sort?: "asc" | "desc";
    limit: number;
    offset: number;
  }) {
    const where: string[] = [];
    const params: any[] = [];

    if (categoryId) {
      where.push("category_id = ?");
      params.push(categoryId);
    }
    if (q) {
      where.push("(name LIKE ? OR description LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }

    const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";

    const [rows] = await pool.query(
      `SELECT * FROM products ${whereClause} ORDER BY created_at ${sort} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM products ${whereClause}`,
      params
    );
    const total = (countRows as any[])[0]?.total ?? 0;

    return [rows as any[], total];
  },

  async findById(id: string) {
    const [rows] = await pool.query("SELECT * FROM products WHERE id=? LIMIT 1", [id]);
    return (rows as any[])[0] ?? null;
  },

  async insert(data: {
    category_id: string | null;
    name: string;
    description: string | null;
    price_cents: number;
    image_url: string | null;
    is_available: boolean;
  }) {
    const [result] = await pool.query(
      `INSERT INTO products (category_id,name,description,price_cents,image_url,is_available,created_at,updated_at)
       VALUES (?,?,?,?,?,?,NOW(),NOW())`,
      [
        data.category_id,
        data.name,
        data.description,
        data.price_cents,
        data.image_url,
        data.is_available,
      ]
    );
    // @ts-ignore
    return result.insertId;
  },

  async update(id: string, fields: Record<string, any>) {
    const keys = Object.keys(fields);
    if (!keys.length) return;
    const updates = keys.map(k => `${k}=?`).join(",");
    const values = Object.values(fields);
    await pool.query(
      `UPDATE products SET ${updates}, updated_at=NOW() WHERE id=?`,
      [...values, id]
    );
  },

  async remove(id: string) {
    await pool.query("DELETE FROM products WHERE id=?", [id]);
  },
};
