import { ordersRepo } from "../../../infra/repositories/orders.repo";
import { auditRepo } from "../../../infra/repositories/audit.repo";
import { NotFoundError, BadRequestError } from "../../errors/app-error";

const transitions: Record<string, string[]> = {
  PENDING: ["CONFIRMED","CANCELED"],
  CONFIRMED: ["OUT_FOR_DELIVERY","CANCELED"],
  OUT_FOR_DELIVERY: ["DELIVERED","CANCELED"],
  DELIVERED: [],
  CANCELED: []
};

export async function updateStatus(adminId:string, orderId:string, newStatus:"CONFIRMED"|"OUT_FOR_DELIVERY"|"DELIVERED"|"CANCELED"){
  const o = await ordersRepo.findById(orderId);
  if (!o) throw new NotFoundError("Order");

  const allowed = transitions[o.status] ?? [];
  if (!allowed.includes(newStatus)) throw new BadRequestError("Invalid status transition");

  await ordersRepo.updateStatus(orderId, newStatus);
  await auditRepo.append(orderId, o.status, newStatus, adminId);

  // V1: NÃO faz baixa de estoque automática (manual, conforme escopo)
  return { id: orderId, old_status: o.status, new_status: newStatus };
}
