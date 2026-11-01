
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/HttpError";

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ status: false, message: err.message });
  }

  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ status: false, message: "Format JSON tidak valid" });
  }

  console.error(err);
  res.status(500).json({ status: false, message: "Terjadi kesalahan pada server" });
};