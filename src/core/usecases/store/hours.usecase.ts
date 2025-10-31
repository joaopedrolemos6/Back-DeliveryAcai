import { storeRepo } from "../../../infra/repositories/store.repo";
import { BadRequestError } from "../../errors/app-error";

export async function listHours() {
  return storeRepo.getHours();
}

export async function updateHours(hours: Array<{ weekday: number; open_time: string; close_time: string }>) {
  for (const h of hours) {
    if (h.weekday < 0 || h.weekday > 6) throw new BadRequestError("Invalid weekday");
  }
  await storeRepo.replaceHours(hours);
  return storeRepo.getHours();
}
