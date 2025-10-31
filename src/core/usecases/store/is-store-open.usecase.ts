import { env } from "../../../config/env";
import { DateTime } from "luxon";

export async function validateStoreOpenNow(settings: any){
  const now = DateTime.now().setZone(env.STORE_TZ);
  const weekday = now.weekday % 7; // Luxon Mon=1..Sun=7 → 0..6
  const h = settings.hours.find((x:any) => x.weekday === weekday);
  if (!h) return false;
  const cur = now.toFormat("HH:mm:ss");
  return (cur >= h.open_time && cur <= h.close_time);
}
