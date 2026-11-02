import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const createPlayer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nickname } = req.body;

    if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
      res.status(400).json({
        status: false,
        message: 'Nickname wajib diisi',
      });
      return;
    }

    const cleanNickname = nickname.trim();

    const existingPlayer = await prisma.player.findUnique({
      where: { nickname: cleanNickname },
    });

    if (existingPlayer) {
      res.status(409).json({
        status: false,
        message: 'Nickname sudah digunakan',
      });
      return;
    }

    const newPlayer = await prisma.player.create({
      data: {
        nickname: cleanNickname,
      },
    });

    res.status(201).json({
      status: true,
      message: 'Player berhasil dibuat',
      data: newPlayer,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan pada server',
    });
  }
};

export const getPlayerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = parseInt(req.params.player_id as string);

    if (isNaN(playerId)) {
      res.status(400).json({
        status: false,
        message: 'ID player tidak valid',
      });
      return;
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        heroes: {
          include: {
            hero: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!player) {
      res.status(404).json({
        status: false,
        message: 'Player tidak ditemukan',
      });
      return;
    }

    const formattedHeroes = player.heroes.map((ph: any) => ({
      heroId: ph.heroId,
      name: ph.hero.name,
      currency: ph.currency,
      pricePaid: ph.pricePaid,
    }));

    res.status(200).json({
      status: true,
      message: 'Berhasil mengambil data player',
      data: {
        id: player.id,
        nickname: player.nickname,
        bp: player.bp,
        diamond: player.diamond,
        createdAt: player.createdAt,
        heroes: formattedHeroes,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan pada server',
    });
  }
};

export const updatePlayer = async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = parseInt(req.params.player_id as string);
    const { nickname } = req.body;

    if (isNaN(playerId)) {
      res.status(400).json({
        status: false,
        message: 'ID player tidak valid',
      });
      return;
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      res.status(404).json({
        status: false,
        message: 'Player tidak ditemukan',
      });
      return;
    }

    if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
      res.status(400).json({
        status: false,
        message: 'Nickname wajib diisi',
      });
      return;
    }

    const cleanNickname = nickname.trim();

    const existing = await prisma.player.findUnique({
      where: { nickname: cleanNickname },
    });

    if (existing && existing.id !== playerId) {
      res.status(409).json({
        status: false,
        message: 'Nickname sudah digunakan',
      });
      return;
    }

    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: { nickname: cleanNickname },
    });

    res.status(200).json({
      status: true,
      message: 'Nickname berhasil diperbarui',
      data: updatedPlayer,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan pada server',
    });
  }
};

export const deletePlayer = async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = parseInt(req.params.player_id as string);

    if (isNaN(playerId)) {
      res.status(400).json({
        status: false,
        message: 'ID player tidak valid',
      });
      return;
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      res.status(404).json({
        status: false,
        message: 'Player tidak ditemukan',
      });
      return;
    }

    await prisma.player.delete({
      where: { id: playerId },
    });

    res.status(200).json({
      status: true,
      message: 'Player berhasil dihapus',
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan pada server',
    });
  }
};