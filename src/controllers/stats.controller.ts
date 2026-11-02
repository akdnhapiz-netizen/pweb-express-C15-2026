import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// ===== Fitur 7: Statistik =====

// GET /api/stats/heroes  -> jumlah hero per role dan per lane
export const getHeroStats = async (_req: Request, res: Response) => {
  const [totalHeroes, byRole, byLane] = await Promise.all([
    prisma.hero.count(),
    prisma.hero.groupBy({ by: ["role"], _count: { _all: true }, orderBy: { role: "asc" } }),
    prisma.hero.groupBy({ by: ["lane"], _count: { _all: true }, orderBy: { lane: "asc" } }),
  ]);

  res.json({
    status: true,
    message: "Berhasil mengambil statistik hero",
    data: {
      totalHeroes,
      byRole: byRole.map((r) => ({ role: r.role, total: r._count._all })),
      byLane: byLane.map((l) => ({ lane: l.lane, total: l._count._all })),
    },
  });
};

// GET /api/stats/skins  -> jumlah skin per rarity + rata-rata harga diamond
export const getSkinStats = async (_req: Request, res: Response) => {
  const [totalSkins, byRarity] = await Promise.all([
    prisma.skin.count(),
    prisma.skin.groupBy({
      by: ["rarity"],
      _count: { _all: true },
      _avg: { priceDiamond: true },
      orderBy: { rarity: "asc" },
    }),
  ]);

  res.json({
    status: true,
    message: "Berhasil mengambil statistik skin",
    data: {
      totalSkins,
      byRarity: byRarity.map((r) => ({
        rarity: r.rarity,
        total: r._count._all,
        avgPriceDiamond: r._avg.priceDiamond === null ? null : Math.round(r._avg.priceDiamond),
      })),
    },
  });
};

// GET /api/stats/players  -> total player, hero paling banyak dibeli, total belanja per currency
export const getPlayerStats = async (_req: Request, res: Response) => {
  const [totalPlayers, topHeroes, spending] = await Promise.all([
    prisma.player.count(),
    prisma.playerHero.groupBy({
      by: ["heroId"],
      _count: { _all: true },
      orderBy: { _count: { heroId: "desc" } },
      take: 5,
    }),
    prisma.playerHero.groupBy({
      by: ["currency"],
      _count: { _all: true },
      _sum: { pricePaid: true },
      orderBy: { currency: "asc" },
    }),
  ]);

  // ambil nama hero untuk top 5
  const heroes = await prisma.hero.findMany({
    where: { id: { in: topHeroes.map((t) => t.heroId) } },
    select: { id: true, name: true },
  });

  res.json({
    status: true,
    message: "Berhasil mengambil statistik player",
    data: {
      totalPlayers,
      mostOwnedHeroes: topHeroes.map((t) => ({
        heroId: t.heroId,
        name: heroes.find((h) => h.id === t.heroId)?.name,
        totalOwned: t._count._all,
      })),
      spending: spending.map((s) => ({
        currency: s.currency,
        totalTransactions: s._count._all,
        totalSpent: s._sum.pricePaid ?? 0,
      })),
    },
  });
};