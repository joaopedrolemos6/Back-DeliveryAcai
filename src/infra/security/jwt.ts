import jwt from "jsonwebtoken";
import { env } from "../../config/env";

type AccessPayload = { sub: string; role: "ADMIN"|"CLIENT" };
type RefreshPayload = { sub: string; jti: string };

export function signAccessToken(sub: string, role: "ADMIN"|"CLIENT"){
  return jwt.sign({ sub, role } as AccessPayload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES });
}
export function signRefreshToken(sub: string, jti: string){
  return jwt.sign({ sub, jti } as RefreshPayload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES });
}
export function verifyAccessToken(token: string){ return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload; }
export function verifyRefreshToken(token: string){ return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload; }
