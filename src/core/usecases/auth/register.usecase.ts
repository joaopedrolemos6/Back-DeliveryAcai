import { usersRepo } from "../../../infra/repositories/users.repo";
import { hash } from "bcrypt";
import { v4 as uuid } from "uuid";
import { ConflictError } from "../../errors/app-error";

export async function register(input: {
  name: string;
  email?: string;
  phone: string;
  password: string;
}) {
  // Verifica se já existe usuário com mesmo e-mail ou telefone
  const existing = await usersRepo.findByEmailOrPhone(input.email, input.phone);
  if (existing) {
    throw new ConflictError("Email or phone already registered");
  }

  const id = uuid();
  const password_hash = await hash(input.password, 12);

  await usersRepo.insert({
    id,
    name: input.name,
    email: input.email ?? null,
    phone: input.phone,
    password_hash,
    role: "CLIENT",
  });

  return { id, name: input.name, email: input.email, phone: input.phone };
}
