import { pool } from "../db/connection";

export const addressesRepo = {
  async listByUser(user_id:string){
    const [rows] = await pool.query(`SELECT id,street,number,complement,district,city,state,zip,latitude,longitude
      FROM addresses WHERE user_id=? ORDER BY created_at DESC`, [user_id]);
    return rows as any[];
  },

  async findById(id: string) {
    const [rows] = await pool.query(`SELECT * FROM addresses WHERE id=?`, [id]);
    return (rows as any[])[0] ?? null;
  },

  async findOwnedById(user_id:string, id:string){
    const [rows] = await pool.query(`SELECT * FROM addresses WHERE id=? AND user_id=?`, [id, user_id]);
    return (rows as any[])[0] ?? null;
  },

  async insert(a:any){
    await pool.query(
      `INSERT INTO addresses (id,user_id,street,number,complement,district,city,state,zip,latitude,longitude,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW())`,
      [a.id, a.user_id, a.street, a.number, a.complement ?? null, a.district ?? null, a.city, a.state, a.zip, a.latitude ?? null, a.longitude ?? null]
    );
  },

  async updateOwned(user_id:string, id:string, a:any){
    const [ret] = await pool.query(
      `UPDATE addresses SET
        street=COALESCE(?,street), number=COALESCE(?,number), complement=COALESCE(?,complement),
        district=COALESCE(?,district), city=COALESCE(?,city), state=COALESCE(?,state), zip=COALESCE(?,zip),
        latitude=COALESCE(?,latitude), longitude=COALESCE(?,longitude)
       WHERE id=? AND user_id=?`,
      [a.street ?? null, a.number ?? null, a.complement ?? null, a.district ?? null, a.city ?? null, a.state ?? null, a.zip ?? null, a.latitude ?? null, a.longitude ?? null, id, user_id]
    );
    return (ret as any).affectedRows > 0;
  },

  async deleteOwned(user_id:string, id:string){
    const [ret] = await pool.query(`DELETE FROM addresses WHERE id=? AND user_id=?`, [id, user_id]);
    return (ret as any).affectedRows > 0;
  }
};
