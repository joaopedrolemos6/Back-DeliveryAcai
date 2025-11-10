import { BadRequestError, NotFoundError } from "../../errors/app-error";
import { storeRepo } from "../../../infra/repositories/store.repo";
import { productsRepo } from "../../../infra/repositories/products.repo";
import { ordersRepo } from "../../../infra/repositories/orders.repo";
import { addressesRepo } from "../../../infra/repositories/addresses.repo";
// import { validateStoreOpenNow } from "../store/is-store-open.usecase";
import { validateAddressInRadius } from "../store/validate-delivery-radius.usecase";

type CreateOrderInput = {
  userId: string;
  addressId: string;
  paymentMethod: "CASH" | "PIX";
  note?: string;
  items: Array<{ productId: string; quantity: number }>;
};

export async function createOrder(input: CreateOrderInput) {
  // 1) Loja aberta?
  const settings = await storeRepo.getSettingsWithHoursAndLocation();

  // Temporariamente desativado:
  // const open = await validateStoreOpenNow(settings);
  // if (!open) throw new BadRequestError("Loja fechada no momento");

  // 2) Endereço existe?
  const address = await addressesRepo.findById(input.addressId);
  if (!address) throw new NotFoundError("Endereço");

  // 3) Endereço dentro do raio?
  await validateAddressInRadius(input.userId, input.addressId, settings);

  // 4) Itens válidos e disponíveis
  const ids = input.items.map(i => i.productId);
  const products = await productsRepo.findManyByIds(ids);
  if (products.length !== ids.length) throw new BadRequestError("Produto inválido ou não encontrado");

  products.forEach(p => {
    if (!p.is_available) throw new BadRequestError(`Produto '${p.name}' está indisponível`);
  });

  // 5) Total + taxa + mínimo
  const map = new Map(products.map(p => [p.id, p]));
  let subtotal = 0;

  for (const i of input.items) {
    const p = map.get(i.productId);
    if (!p) throw new BadRequestError("Produto não encontrado");
    if (i.quantity <= 0) throw new BadRequestError("Quantidade inválida");
    subtotal += p.price_cents * i.quantity;
  }

  const deliveryFee = settings.delivery_fee_cents;
  const total = subtotal + deliveryFee;

  if (total < settings.min_order_cents) {
    throw new BadRequestError("Valor mínimo de pedido não atingido");
  }

  // 6) Criar pedido (PENDING)
  const orderId = await ordersRepo.create({
    user_id: input.userId,
    address_id: input.addressId,
    payment_method: input.paymentMethod,
    note: input.note ?? null,
    items: input.items.map(i => ({
      product_id: i.productId,
      quantity: i.quantity,
      price_cents: map.get(i.productId)!.price_cents
    })),
    total_cents: total
  });

  return {
    orderId,
    status: "PENDING" as const,
    total_cents: total,
    delivery_fee_cents: deliveryFee
  };
}
