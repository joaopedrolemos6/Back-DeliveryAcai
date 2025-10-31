export class AppError extends Error { constructor(public code: string, public status = 400, public details?: any){ super(code); } }
export class UnauthorizedError extends AppError { constructor(msg="Unauthorized"){ super("AUTH_UNAUTHORIZED",401,{msg}); } }
export class ForbiddenError extends AppError { constructor(msg="Forbidden"){ super("AUTH_FORBIDDEN",403,{msg}); } }
export class NotFoundError extends AppError { constructor(entity="Resource"){ super("NOT_FOUND",404,{entity}); } }
export class ConflictError extends AppError { constructor(msg="Conflict"){ super("CONFLICT",409,{msg}); } }
export class ValidationError extends AppError { constructor(msg="ValidationError", details?:any){ super("VALIDATION_ERROR",422,details); } }
export class BadRequestError extends AppError { constructor(msg="BadRequest"){ super("BAD_REQUEST",400,{msg}); } }
