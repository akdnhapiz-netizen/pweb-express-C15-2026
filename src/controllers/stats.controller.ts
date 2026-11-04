import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// GET /api/statistics
export const getStatistics = async (_req: Request, res: Response) => {
  const [totalPlayers, totalHeroesOwned, diamondSum, topOwned, perRole] = await Promise.all([
    prisma.player.count(),
    prisma.playerHero.count(),
    prisma.player.aggregate({ _sum: { diamond: true } }),
    prisma.playerHero.groupBy({
      by: ["heroId"],
      _count: { heroId: true },
      orderBy: [{ _count: { heroId: "desc" } }, { heroId: "asc" }],
      take: 1,
    }),
    prisma.hero.groupBy({
      by: ["role"],
      _count: { role: true },
      orderBy: { role: "asc" },
    }),
  ]);

  let mostOwnedHero = null;
  if (topOwned.length > 0) {
    const hero = await prisma.hero.findUnique({ where: { id: topOwned[0].heroId } });
    mostOwnedHero = {
      heroId: topOwned[0].heroId,
      name: hero?.name ?? null,
      owners: topOwned[0]._count.heroId,
    };
  }

  res.json({
    status: true,
    message: "Berhasil mengambil statistik",
    data: {
      totalPlayers,
      totalHeroesOwned,
      totalDiamond: diamondSum._sum.diamond ?? 0,
      mostOwnedHero,
      heroesPerRole: perRole.map((r) => ({ role: r.role, total: r._count.role })),
    },
  });
};