import { pool } from "../db/connection";

export const storeRepo = {
  // 🏪 Obter configurações + horários + localização
  async getSettingsWithHoursAndLocation() {
    const [s] = await pool.query(
      `SELECT id, delivery_fee_cents, min_order_cents, delivery_radius_km, latitude, longitude, is_open
       FROM store_settings
       WHERE id = 1`
    );
    const set = (s as any[])[0];
    const [h] = await pool.query(
      `SELECT weekday, open_time, close_time
       FROM store_hours
       ORDER BY weekday ASC`
    );
    return { ...set, hours: h };
  },

  // ⏰ Obter horários de funcionamento
  async getHours() {
    const [h] = await pool.query(
      `SELECT weekday, open_time, close_time
       FROM store_hours
       ORDER BY weekday ASC`
    );
    return h as any[];
  },

  // ⚙️ Atualizar configurações da loja
  async updateSettings(s: any) {
    await pool.query(
      `UPDATE store_settings SET
        delivery_fee_cents = ?,
        min_order_cents = ?,
        delivery_radius_km = ?,
        latitude = ?,
        longitude = ?,
        is_open = ?,
        updated_at = NOW()
       WHERE id = 1`,
      [
        s.delivery_fee_cents,
        s.min_order_cents,
        s.delivery_radius_km,
        s.latitude,
        s.longitude,
        s.is_open ? 1 : 0,
      ]
    );
  },

  // 🔄 Substituir completamente os horários de funcionamento (transação segura)
  async replaceHours(hours: Array<{ weekday: number; open_time: string; close_time: string }>) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("DELETE FROM store_hours");
      for (const h of hours) {
        await conn.query(
          `INSERT INTO store_hours (weekday, open_time, close_time) VALUES (?,?,?)`,
          [h.weekday, h.open_time, h.close_time]
        );
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },
};
