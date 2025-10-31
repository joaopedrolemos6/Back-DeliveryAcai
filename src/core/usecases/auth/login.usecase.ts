import { usersRepo } from "../../../infra/repositories/users.repo";
import { refreshTokensRepo } from "../../../infra/repositories/refresh-tokens.repo";
import { UnauthorizedError } from "../../errors/app-error";
import jwt from "jsonwebtoken";
import { compare, hash } from "bcrypt";
import { v4 as uuid } from "uuid";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "7d";

export async function login(input: { identifier: string; password: string }) {
  const user = await usersRepo.findByEmailOrPhone(input.identifier);

  if (!user) throw new UnauthorizedError("Invalid credentials");

  const valid = await compare(input.password, user.password_hash);
  if (!valid) throw new UnauthorizedError("Invalid credentials");

  const jti = uuid();
  const accessToken = jwt.sign({ sub: user.id, role: user.role }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  });
  const refreshToken = jwt.sign({ sub: user.id, jti }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  });

  const hashedToken = await hash(refreshToken, 10);
  const expiresAt = new Date(Date.now() + msToMs(REFRESH_EXPIRES));

  await refreshTokensRepo.insert({
    id: jti,
    user_id: user.id,
    hashed_token: hashedToken,
    expires_at: expiresAt,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  };
}

function msToMs(exp: string): number {
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) return 0;
  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case "s": return value * 1000;
    case "m": return value * 60 * 1000;
    case "h": return value * 60 * 60 * 1000;
    case "d": return value * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}
