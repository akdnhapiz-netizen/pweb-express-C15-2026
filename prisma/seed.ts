import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma";
import type { Lane, Rarity, Role } from "../src/generated/prisma/client";

type HeroJson = {
  name: string;
  primaryRole: string;
  primaryLane: string;
  releaseYear: number;
  priceBP: number | null;
  priceDiamond: number | null;
};

type SkinJson = {
  name: string;
  heroId: number;
  rarity: string;
  priceDiamond: number | null;
};

const readJson = <T>(file: string): T =>
  JSON.parse(readFileSync(new URL(`../data/${file}`, import.meta.url), "utf-8"));

async function main() {
  const heroes = readJson<HeroJson[]>("heroes.json");
  const skins = readJson<SkinJson[]>("skins.json");

  // 1. Kosongkan tabel & reset id ke 1
  await prisma.$executeRawUnsafe(
    'TRUNCATE "PlayerHero", "Player", "Skin", "Hero" RESTART IDENTITY CASCADE'
  );

  // 2. Hero (urutan file = urutan id, Miya id 1)
  await prisma.hero.createMany({
    data: heroes.map((h) => ({
      name: h.name,
      role: h.primaryRole.toUpperCase() as Role,
      lane: h.primaryLane.toUpperCase() as Lane,
      releaseYear: h.releaseYear,
      priceBP: h.priceBP ?? null,
      priceDiamond: h.priceDiamond ?? null,
    })),
  });

  // 3. Skin
  await prisma.skin.createMany({
    data: skins.map((s) => ({
      name: s.name,
      heroId: s.heroId,
      rarity: s.rarity.toUpperCase() as Rarity,
      priceDiamond: s.priceDiamond ?? null,
    })),
  });

  // 4. Player & PlayerHero
  await prisma.player.createMany({
    data: [
      { nickname: "ArekITS", bp: 1500, diamond: 75 },
      { nickname: "SangPushRank", bp: 13000, diamond: 2892 },
      { nickname: "MageSurabaya", bp: 10000, diamond: 0 },
    ],
  });

  await prisma.playerHero.createMany({
    data: [
      { playerId: 1, heroId: 18, currency: "BP", pricePaid: 2000 },
      { playerId: 1, heroId: 1, currency: "BP", pricePaid: 10800 },
      { playerId: 2, heroId: 84, currency: "DIAMOND", pricePaid: 599 },
      { playerId: 2, heroId: 56, currency: "BP", pricePaid: 32000 },
    ],
  });

  console.log("Seed selesai");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());