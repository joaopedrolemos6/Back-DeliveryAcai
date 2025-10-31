import jwt from "jsonwebtoken";
import { hash } from "bcrypt";
import { v4 as uuid } from "uuid";
import { usersRepo } from "../../../infra/repositories/users.repo";
import { refreshTokensRepo } from "../../../infra/repositories/refresh-tokens.repo";
import { UnauthorizedError } from "../../errors/app-error";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "7d";

export async function refresh(input: { refreshToken: string }) {
  if (!input.refreshToken) throw new UnauthorizedError("Missing refresh token");

  // 1️⃣ Verifica validade do token e extrai payload
  let payload: any;
  try {
    payload = jwt.verify(input.refreshToken, REFRESH_SECRET);
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  // 2️⃣ Confere se token está registrado e não revogado
  const existing = await refreshTokensRepo.findById(payload.jti);
  if (!existing || existing.revoked_at) {
    throw new UnauthorizedError("Refresh token revoked or invalidated");
  }

  // 3️⃣ Busca o usuário
  const user = await usersRepo.findById(payload.sub);
  if (!user || !user.is_active) {
    throw new UnauthorizedError("User not found or inactive");
  }

  // 4️⃣ Gera novo par de tokens (rotação)
  const newJti = uuid();
  const newAccessToken = jwt.sign(
    { sub: user.id, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );
  const newRefreshToken = jwt.sign(
    { sub: user.id, jti: newJti },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES }
  );

  // 5️⃣ Revoga o token antigo e salva o novo
  await refreshTokensRepo.revoke(existing.id);
  const hashedToken = await hash(newRefreshToken, 10);
  await refreshTokensRepo.insert({
    id: newJti,
    user_id: user.id,
    hashed_token: hashedToken,
    expires_at: new Date(Date.now() + msToMs(REFRESH_EXPIRES)),
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
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
  // converte "7d", "15m" etc. para ms
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
