import { categoriesRepo } from "../../../infra/repositories/categories.repo";
import { v4 as uuid } from "uuid";
import { NotFoundError } from "../../errors/app-error";

export async function listCategories(){ return categoriesRepo.list(); }

export async function createCategory(input:{name:string; sort_order?:number}){
  const id = uuid();
  await categoriesRepo.create({ id, name: input.name, sort_order: input.sort_order ?? 0 });
  return { id, name: input.name, sort_order: input.sort_order ?? 0 };
}

export async function updateCategory(id:string, input:{name:string; sort_order?:number}){
  const ok = await categoriesRepo.update(id, input);
  if (!ok) throw new NotFoundError("Category");
  return { id, ...input, sort_order: input.sort_order ?? 0 };
}

export async function deleteCategory(id:string){
  const ok = await categoriesRepo.delete(id);
  if (!ok) throw new NotFoundError("Category");
}
