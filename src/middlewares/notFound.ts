
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/HttpError";

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new HttpError(404, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`));
};