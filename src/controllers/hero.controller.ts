import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/HttpError";
import { Role, Lane } from "../generated/prisma/client";

const isRole = (value: unknown): value is Role => Object.values(Role).includes(value as Role);
const isLane = (value: unknown): value is Lane => Object.values(Lane).includes(value as Lane);

// GET /api/heroes?page=&limit=&search=&role=
export const getAllHeroes = async (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const search = req.query.search as string | undefined;
  const role = req.query.role as string | undefined;

  if (role && !isRole(role)) {
    throw new HttpError(400, "Role tidak valid");
  }

  const where = {
    ...(search && { name: { contains: search, mode: "insensitive" as const } }),
    ...(role && { role: role as Role }),
  };

  const [heroes, totalItems] = await Promise.all([
    prisma.hero.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: "asc" },
    }),
    prisma.hero.count({ where }),
  ]);

  res.json({
    status: true,
    message: "Berhasil mengambil data hero",
    data: heroes,
    metadata: {
      currentPage: page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  });
};

// GET /api/heroes/:hero_id
export const getHeroById = async (req: Request, res: Response) => {
  const id = Number(req.params.hero_id);

  const hero = Number.isInteger(id)
    ? await prisma.hero.findUnique({ where: { id }, include: { skins: true } })
    : null;

  if (!hero) {
    throw new HttpError(404, "Hero tidak ditemukan");
  }

  res.json({ status: true, message: "Berhasil mengambil detail hero", data: hero });
};

// POST /api/heroes
export const createHero = async (req: Request, res: Response) => {
  const { name, role, lane, releaseYear, priceBP, priceDiamond } = req.body ?? {};

  // 1. data wajib → 400
  if (!name || !role || !lane || releaseYear === undefined || releaseYear === null) {
    throw new HttpError(400, "name, role, lane, dan releaseYear wajib diisi");
  }
  if (!isRole(role) || !isLane(lane)) {
    throw new HttpError(400, "role atau lane tidak valid");
  }

  // 2. nama sudah ada → 409
  const existing = await prisma.hero.findUnique({ where: { name } });
  if (existing) {
    throw new HttpError(409, "Nama hero sudah digunakan");
  }

  // 3. berhasil → 201
  const hero = await prisma.hero.create({
    data: {
      name,
      role,
      lane,
      releaseYear: Number(releaseYear),
      priceBP: priceBP ?? null,
      priceDiamond: priceDiamond ?? null,
    },
  });

  res.status(201).json({ status: true, message: "Berhasil menambahkan hero", data: hero });
};