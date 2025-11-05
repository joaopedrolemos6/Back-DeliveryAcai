import { productsRepo } from "../../../infra/repositories/products.repo";
import { categoriesRepo } from "../../../infra/repositories/categories.repo";
import { NotFoundError, BadRequestError } from "../../errors/app-error";

/**
 * Lista produtos com filtros opcionais (com paginação, busca e ordenação)
 */
export async function listProducts(params?: {
  categoryId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
}) {
  const page = Number(params?.page ?? 1);
  const pageSize = Number(params?.pageSize ?? 12);
  const offset = (page - 1) * pageSize;

  const [products, total] = await productsRepo.list({
    categoryId: params?.categoryId,
    q: params?.q,
    sort: params?.sort ?? "asc",
    limit: pageSize,
    offset,
  });

  return {
    data: products,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Busca produto por ID
 */
export async function getProduct(id: string) {
  const product = await productsRepo.findById(id);
  if (!product) throw new NotFoundError("Product not found");
  return product;
}

/**
 * Cria novo produto
 */
export async function createProduct(input: {
  category_id?: string | null;
  name: string;
  description?: string | null;
  price_cents: number;
  image_url?: string | null;
  is_available?: boolean;
}) {
  if (!input.name?.trim() || !input.price_cents) {
    throw new BadRequestError("Name and price are required");
  }

  // 🔍 Valida categoria se informada
  if (input.category_id) {
    const category = await categoriesRepo.findById(input.category_id);
    if (!category) throw new NotFoundError("Category not found");
  }

  // 💾 Cria registro
  const id = await productsRepo.insert({
    category_id: input.category_id ?? null,
    name: input.name.trim(),
    description: input.description ?? null,
    price_cents: input.price_cents,
    image_url: input.image_url ?? null,
    is_available: input.is_available ?? true,
  });

  const newProduct = await productsRepo.findById(id);
  return newProduct;
}

/**
 * Atualiza produto existente
 */
export async function updateProduct(
  id: string,
  input: Partial<{
    category_id: string | null;
    name: string;
    description: string | null;
    price_cents: number;
    image_url: string | null;
    is_available: boolean;
  }>
) {
  const product = await productsRepo.findById(id);
  if (!product) throw new NotFoundError("Product not found");

  // 🔍 Valida categoria se informada
  if (input.category_id) {
    const cat = await categoriesRepo.findById(input.category_id);
    if (!cat) throw new NotFoundError("Category not found");
  }

  await productsRepo.update(id, input);

  const updated = await productsRepo.findById(id);
  return updated;
}

/**
 * Remove um produto
 */
export async function deleteProduct(id: string) {
  const product = await productsRepo.findById(id);
  if (!product) throw new NotFoundError("Product not found");

  await productsRepo.remove(id);
  return { success: true };
}
