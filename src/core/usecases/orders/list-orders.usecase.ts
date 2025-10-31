import { ordersRepo } from "../../../infra/repositories/orders.repo";

export async function listByUser(userId:string, page:number, pageSize:number){
  return ordersRepo.paginateByUser(userId, page, pageSize);
}
export async function listAll(filters:{ status?: string; from?: string; to?: string; page:number; pageSize:number }){
  return ordersRepo.paginateAll(filters);
}
