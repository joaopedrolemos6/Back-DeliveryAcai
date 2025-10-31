import { storeRepo } from "../../../infra/repositories/store.repo";
import { getSettingsWithHoursAndLocation } from "./is-store-open.usecase"; // já existente para validação runtime

export async function getSettings(){
  const s = await storeRepo.getSettingsWithHoursAndLocation();
  const hours = await storeRepo.getHours();
  return { ...s, hours };
}

export async function updateSettings(input:{
  delivery_fee_cents:number; min_order_cents:number; delivery_radius_km:number;
  latitude:number|null; longitude:number|null; is_open:boolean;
}){
  await storeRepo.updateSettings(input);
  return getSettings();
}
