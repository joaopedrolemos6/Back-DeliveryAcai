import { pool } from "../db/connection";
export const auditRepo = {
  async append(order_id:string, old_status:string|null, new_status:string, changed_by:string){
    await pool.query(
      `INSERT INTO order_status_audit (order_id,old_status,new_status,changed_by,changed_at)
       VALUES (?,?,?,?,NOW())`,
      [order_id, old_status, new_status, changed_by]
    );
  }
};
