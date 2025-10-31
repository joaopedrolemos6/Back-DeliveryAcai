import { auditRepo } from "../../../infra/repositories/audit.repo";

export async function getAudit(orderId: string) {
  return auditRepo.listByOrder(orderId);
}
