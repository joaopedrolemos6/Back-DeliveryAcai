import { pool } from "../db/connection";

export const auditRepo = {
  // 📝 Registra uma mudança de status no histórico
  async append(order_id: string, old_status: string | null, new_status: string, changed_by: string) {
    await pool.query(
      `INSERT INTO order_status_audit (order_id, old_status, new_status, changed_by, changed_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [order_id, old_status, new_status, changed_by]
    );
  },

  // 📜 Lista o histórico de alterações de um pedido
  async listByOrder(order_id: string) {
    const [rows] = await pool.query(
      `SELECT id, old_status, new_status, changed_by, changed_at
       FROM order_status_audit
       WHERE order_id = ?
       ORDER BY changed_at ASC`,
      [order_id]
    );
    return rows as any[];
  },
};
