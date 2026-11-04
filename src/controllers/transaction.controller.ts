import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/HttpError";

// hadiah BP setelah match
const BP_WIN = 300;
const BP_LOSE = 100;

const toId = (value: unknown) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// ===== Fitur 5: Top Up & Match =====

// POST /api/players/:player_id/topup   body: { amount }
export const topUp = async (req: Request, res: Response) => {
  const playerId = toId(req.params.player_id);
  if (!playerId) {
    throw new HttpError(400, "ID player tidak valid");
  }

  const { amount } = req.body ?? {};
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new HttpError(400, "amount harus bilangan bulat lebih dari 0");
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const updated = await prisma.player.update({
    where: { id: playerId },
    data: { diamond: { increment: amount } },
  });

  res.json({
    status: true,
    message: `Top up ${amount} diamond berhasil`,
    data: updated,
  });
};

// POST /api/players/:player_id/match   body: { result: "WIN" | "LOSE" }
export const playMatch = async (req: Request, res: Response) => {
  const playerId = toId(req.params.player_id);
  if (!playerId) {
    throw new HttpError(400, "ID player tidak valid");
  }

  const { result } = req.body ?? {};
  if (result !== "WIN" && result !== "LOSE") {
    throw new HttpError(400, "result harus WIN atau LOSE");
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const reward = result === "WIN" ? BP_WIN : BP_LOSE;

  const updated = await prisma.player.update({
    where: { id: playerId },
    data: { bp: { increment: reward } },
  });

  res.json({
    status: true,
    message: `Match selesai (${result}), dapat ${reward} BP`,
    data: { result, reward, player: updated },
  });
};

// ===== Fitur 6: Beli Hero =====

// POST /api/players/:player_id/heroes   body: { heroId, currency: "BP" | "DIAMOND" }
export const buyHero = async (req: Request, res: Response) => {
  const playerId = toId(req.params.player_id);
  if (!playerId) {
    throw new HttpError(400, "ID player tidak valid");
  }

  const { currency } = req.body ?? {};
  const heroId = toId(req.body?.heroId);
  if (!heroId) {
    throw new HttpError(400, "heroId wajib diisi dan harus angka");
  }
  if (currency !== "BP" && currency !== "DIAMOND") {
    throw new HttpError(400, "currency harus BP atau DIAMOND");
  }

  // semua langkah dalam satu transaksi: kalau satu gagal, semuanya batal
  const result = await prisma.$transaction(async (tx) => {
    const player = await tx.player.findUnique({ where: { id: playerId } });
    if (!player) {
      throw new HttpError(404, "Player tidak ditemukan");
    }

    const hero = await tx.hero.findUnique({ where: { id: heroId } });
    if (!hero) {
      throw new HttpError(404, "Hero tidak ditemukan");
    }

    const owned = await tx.playerHero.findUnique({
      where: { playerId_heroId: { playerId, heroId } },
    });
    if (owned) {
      throw new HttpError(409, "Player sudah memiliki hero ini");
    }

    const price = currency === "BP" ? hero.priceBP : hero.priceDiamond;
    if (price === null) {
      throw new HttpError(400, `Hero ${hero.name} tidak bisa dibeli dengan ${currency}`);
    }

    const balance = currency === "BP" ? player.bp : player.diamond;
    if (balance < price) {
      throw new HttpError(400, `${currency} tidak cukup, butuh ${price} tapi hanya punya ${balance}`);
    }

    const updatedPlayer = await tx.player.update({
      where: { id: playerId },
      data: currency === "BP" ? { bp: { decrement: price } } : { diamond: { decrement: price } },
    });

    const playerHero = await tx.playerHero.create({
      data: { playerId, heroId, currency, pricePaid: price },
    });

    return { hero, playerHero, updatedPlayer };
  });

  res.status(201).json({
    status: true,
    message: `Berhasil membeli ${result.hero.name}`,
    data: {
      heroId: result.hero.id,
      name: result.hero.name,
      currency: result.playerHero.currency,
      pricePaid: result.playerHero.pricePaid,
      bp: result.updatedPlayer.bp,
      diamond: result.updatedPlayer.diamond,
    },
  });
};