import { ordersRepo } from "../../../infra/repositories/orders.repo";
import { NotFoundError, BadRequestError } from "../../errors/app-error";

/**
 * Atualiza o status de um pedido existente.
 * Regras do fluxo de status no V1:
 * PENDING → CONFIRMED → OUT_FOR_DELIVERY → DELIVERED (+ CANCELED)
 */
export async function updateStatus(input: {
  orderId: string;
  newStatus: string;
  updatedBy: string;
}) {
  const validStatuses = [
    "PENDING",
    "CONFIRMED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELED",
  ];

  if (!validStatuses.includes(input.newStatus)) {
    throw new BadRequestError("Invalid order status");
  }

  // Busca o pedido
  const order = await ordersRepo.findById(input.orderId);
  if (!order) throw new NotFoundError("Order");

  // Atualiza status
  await ordersRepo.updateStatus(input.orderId, input.newStatus);

  // Retorna resposta padronizada
  return {
    orderId: input.orderId,
    previousStatus: order.status,
    newStatus: input.newStatus,
    updatedBy: input.updatedBy,
    updatedAt: new Date().toISOString(),
  };
}
