import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ValidationError } from "../../core/errors/app-error";

export function validate(schema: ZodSchema<any>, location: "body"|"query"|"params" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const data = (req as any)[location];
    const result = schema.safeParse(data);
    if (!result.success) {
      return next(new ValidationError("Invalid request", result.error.flatten()));
    }
    (req as any)[location] = result.data; // sanitized
    next();
  };
}
