import { refreshTokensRepo } from "../../../infra/repositories/refresh-tokens.repo";
import { UnauthorizedError } from "../../errors/app-error";

/**
 * Invalida (revoga) um refresh token ativo.
 * Chamado em /auth/logout
 */
export async function logout(input: { refreshToken?: string }) {
  if (!input.refreshToken) {
    throw new UnauthorizedError("Missing refresh token");
  }

  // O token recebido pelo cliente é apenas o valor JWT
  // Extraímos o ID (jti) do payload para revogar o token no banco.
  const parts = input.refreshToken.split(".");
  if (parts.length !== 3) {
    throw new UnauthorizedError("Invalid token format");
  }

  // Tenta localizar no banco qualquer registro correspondente
  // (mesmo que o payload esteja expirado)
  const allTokens = await refreshTokensRepo.listAll();
  const tokenRecord = allTokens.find(t =>
    input.refreshToken.includes(t.id)
  );

  if (!tokenRecord) {
    // Caso não exista, não faz nada (logout idempotente)
    return { success: true };
  }

  await refreshTokensRepo.revoke(tokenRecord.id);
  return { success: true };
}
