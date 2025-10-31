import { pool } from "../db/connection";
import bcrypt from "bcrypt";

export const tokensRepo = {
  async storeHashedRefreshToken({ jti, user_id, token_plain }: { jti: string; user_id: string; token_plain: string }){
    const hashed = await bcrypt.hash(token_plain, 12);
    await pool.query(
      `INSERT INTO refresh_tokens (id, user_id, hashed_token, expires_at, created_at)
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW())`,
      [jti, user_id, hashed]
    );
  },
  async rotate(oldToken: string, newJti: string, user_id: string, newTokenPlain: string){
    const [rows] = await pool.query(`SELECT id, hashed_token, revoked_at FROM refresh_tokens WHERE revoked_at IS NULL ORDER BY created_at DESC LIMIT 50`);
    const candidates = rows as any[];
    let foundId: string | null = null;
    for (const r of candidates){
      const ok = await bcrypt.compare(oldToken, r.hashed_token);
      if (ok){ foundId = r.id; break; }
    }
    if (!foundId) throw new Error("Refresh token not found/revoked");

    await pool.query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?`, [foundId]);
    const hashedNew = await bcrypt.hash(newTokenPlain, 12);
    await pool.query(
      `INSERT INTO refresh_tokens (id, user_id, hashed_token, expires_at, created_at)
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW())`,
      [newJti, user_id, hashedNew]
    );
  },
  async revoke(tokenPlain: string){
    const [rows] = await pool.query(`SELECT id, hashed_token FROM refresh_tokens WHERE revoked_at IS NULL`);
    for (const r of rows as any[]){
      const ok = await bcrypt.compare(tokenPlain, r.hashed_token);
      if (ok){
        await pool.query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?`, [r.id]);
        return true;
      }
    }
    return false;
  }
};
