import { pool } from "../infra/db/connection";

(async () => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS now");
    console.log("✅ DB Connected:", rows);
    process.exit(0);
  } catch (err) {
    console.error("❌ DB Error:", err);
    process.exit(1);
  }
})();
