import { Request, Response } from 'express';
import { Rarity } from '@prisma/client';
import prisma from '../lib/prisma';

export const getAllSkins = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const heroId = req.query.heroId ? parseInt(req.query.heroId as string) : undefined;
    const rarity = req.query.rarity as Rarity | undefined;

    const where: any = {};
    if (heroId && !isNaN(heroId)) {
      where.heroId = heroId;
    }
    if (rarity && Object.values(Rarity).includes(rarity)) {
      where.rarity = rarity;
    }

    const skip = (page - 1) * limit;

    const [totalItems, skins] = await Promise.all([
      prisma.skin.count({ where }),
      prisma.skin.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'asc' },
        include: {
          hero: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      status: true,
      message: 'Berhasil mengambil data skin',
      data: skins,
      metadata: {
        currentPage: page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan pada server',
    });
  }
};

export const getSkinById = async (req: Request, res: Response): Promise<void> => {
  try {
    const skinId = parseInt(req.params.skin_id as string);

    if (isNaN(skinId)) {
      res.status(400).json({
        status: false,
        message: 'ID skin tidak valid',
      });
      return;
    }

    const skin = await prisma.skin.findUnique({
      where: { id: skinId },
      include: {
        hero: true,
      },
    });

    if (!skin) {
      res.status(404).json({
        status: false,
        message: 'Skin tidak ditemukan',
      });
      return;
    }

    res.status(200).json({
      status: true,
      message: 'Berhasil mengambil detail skin',
      data: skin,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan pada server',
    });
  }
};