import { usersRepo } from "../../../infra/repositories/users.repo";
import { NotFoundError } from "../../errors/app-error";

export async function getProfile(userId: string) {
  const user = await usersRepo.findByIdWithAddresses(userId);
  if (!user) throw new NotFoundError("User");
  delete user.password_hash;
  return user;
}

export async function updateProfile(userId: string, input: { name?: string; email?: string; phone?: string }) {
  const ok = await usersRepo.update(userId, input);
  if (!ok) throw new NotFoundError("User");
  return { id: userId, ...input };
}
