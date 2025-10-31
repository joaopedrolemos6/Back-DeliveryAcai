import { pool } from "../db/connection";
import { v4 as uuid } from "uuid";

export const ordersRepo = {
  /**
   * Cria um pedido e seus itens em transação.
   */
  async create(data: {
    user_id: string;
    address_id: string;
    payment_method: "CASH" | "PIX";
    note: string | null;
    total_cents: number;
    items: Array<{ product_id: string; quantity: number; price_cents: number }>;
  }) {
    const id = uuid();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `INSERT INTO orders (
           id, user_id, address_id, status, payment_method, payment_status,
           total_cents, note, created_at, updated_at
         )
         VALUES (?, ?, ?, 'PENDING', ?, 'PENDING', ?, ?, NOW(), NOW())`,
        [
          id,
          data.user_id,
          data.address_id,
          data.payment_method,
          data.total_cents,
          data.note,
        ]
      );

      for (const it of data.items) {
        await conn.query(
          `INSERT INTO order_items (
             id, order_id, product_id, quantity, price_cents_at_order
           )
           VALUES (UUID(), ?, ?, ?, ?)`,
          [id, it.product_id, it.quantity, it.price_cents]
        );
      }

      await conn.commit();
      return id;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  /**
   * Paginação de pedidos por usuário (cliente).
   */
  async paginateByUser(user_id: string, page: number, pageSize: number) {
    const [[{ total }]]: any = await pool.query(
      `SELECT COUNT(*) AS total FROM orders WHERE user_id=?`,
      [user_id]
    );

    const offset = (page - 1) * pageSize;
    const [rows] = await pool.query(
      `SELECT id, status, payment_method, payment_status, total_cents, created_at
       FROM orders
       WHERE user_id=?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [user_id, pageSize, offset]
    );

    return {
      items: rows as any[],
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  /**
   * Paginação de todos os pedidos (admin), com filtros opcionais.
   */
  async paginateAll({
    status,
    from,
    to,
    page,
    pageSize,
  }: {
    status?: string;
    from?: string;
    to?: string;
    page: number;
    pageSize: number;
  }) {
    const where: string[] = [];
    const params: any[] = [];

    if (status) {
      where.push("status = ?");
      params.push(status);
    }
    if (from) {
      where.push("created_at >= ?");
      params.push(from);
    }
    if (to) {
      where.push("created_at < DATE_ADD(?, INTERVAL 1 DAY)");
      params.push(to);
    }

    const W = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [[{ total }]]: any = await pool.query(
      `SELECT COUNT(*) AS total FROM orders ${W}`,
      params
    );

    const offset = (page - 1) * pageSize;
    const [rows] = await pool.query(
      `SELECT id, user_id, address_id, status, payment_method, payment_status, total_cents, created_at
       FROM orders ${W}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return {
      items: rows as any[],
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  /**
   * Retorna pedido + itens.
   */
  async findWithItems(id: string) {
    const [o] = await pool.query(`SELECT * FROM orders WHERE id=?`, [id]);
    const order = (o as any[])[0];
    if (!order) return null;

    const [items] = await pool.query(
      `SELECT oi.id, oi.product_id, oi.quantity, oi.price_cents_at_order, p.name
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id=?`,
      [id]
    );

    return { ...order, items };
  },

  /**
   * Busca pedido por ID (mínimo).
   */
  async findById(id: string) {
    const [rows] = await pool.query(
      `SELECT id, status, user_id, total_cents, payment_method, payment_status
       FROM orders
       WHERE id=?`,
      [id]
    );
    return (rows as any[])[0] ?? null;
  },

  /**
   * Atualiza status do pedido.
   */
  async updateStatus(id: string, status: string) {
    await pool.query(
      `UPDATE orders SET status=?, updated_at=NOW() WHERE id=?`,
      [status, id]
    );
  },
};
