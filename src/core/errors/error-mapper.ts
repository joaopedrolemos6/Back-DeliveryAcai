import { AppError } from "./app-error";
export function mapErrorToHttp(err: any){
  if (err instanceof AppError) return { status: err.status, code: err.code, message: err.message, details: err.details };
  return { status: 500, code: "INTERNAL_ERROR", message: "Unexpected error", details: undefined };
}
