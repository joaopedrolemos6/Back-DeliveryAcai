import { pool } from "../db/connection";

export const categoriesRepo = {
  async list(){
    const [rows] = await pool.query("SELECT id,name,sort_order FROM categories ORDER BY sort_order,name");
    return rows as any[];
  },
  async create(data:{id:string;name:string;sort_order:number}){
    await pool.query("INSERT INTO categories (id,name,sort_order) VALUES (?,?,?)",
      [data.id, data.name, data.sort_order]);
  },
  async update(id:string, data:{name?:string;sort_order?:number}){
    const [ret] = await pool.query("UPDATE categories SET name=COALESCE(?,name), sort_order=COALESCE(?,sort_order) WHERE id=?",
      [data.name ?? null, data.sort_order ?? null, id]);
    return (ret as any).affectedRows > 0;
  },
  async delete(id:string){
    const [ret] = await pool.query("DELETE FROM categories WHERE id=?", [id]);
    return (ret as any).affectedRows > 0;
  }
};
