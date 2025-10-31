import { pool } from "../db/connection";

export const refreshTokensRepo = {
  // ➕ Inserir novo refresh token
  async insert(data: { id: string; user_id: string; hashed_token: string; expires_at: Date }) {
    await pool.query(
      `INSERT INTO refresh_tokens (id, user_id, hashed_token, expires_at, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [data.id, data.user_id, data.hashed_token, data.expires_at]
    );
  },

  // 🔍 Buscar token por ID
  async findById(id: string) {
    const [rows] = await pool.query(
      `SELECT * FROM refresh_tokens WHERE id = ? LIMIT 1`,
      [id]
    );
    return (rows as any[])[0] ?? null;
  },

  // 🚫 Revogar token específico
  async revoke(id: string) {
    await pool.query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?`, [id]);
  },

  // 🧹 Deletar tokens expirados
  async deleteExpired() {
    await pool.query(`DELETE FROM refresh_tokens WHERE expires_at < NOW()`);
  },

  // 📋 Listar todos os refresh tokens (admin/debug)
  async listAll() {
    const [rows] = await pool.query(`SELECT * FROM refresh_tokens`);
    return rows as any[];
  },
};
