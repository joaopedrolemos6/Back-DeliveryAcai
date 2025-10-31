import { addressesRepo } from "../../../infra/repositories/addresses.repo";
import { v4 as uuid } from "uuid";
import { NotFoundError } from "../../errors/app-error";

export async function listByUser(userId:string){ return addressesRepo.listByUser(userId); }

export async function create(userId:string, input:any){
  const id = uuid();
  await addressesRepo.insert({ id, user_id: userId, ...input });
  return id;
}

export async function update(userId:string, id:string, input:any){
  const ok = await addressesRepo.updateOwned(userId, id, input);
  if (!ok) throw new NotFoundError("Address");
}

export async function remove(userId:string, id:string){
  const ok = await addressesRepo.deleteOwned(userId, id);
  if (!ok) throw new NotFoundError("Address");
}
