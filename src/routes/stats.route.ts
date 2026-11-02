import { Router } from "express";
import { getHeroStats, getSkinStats, getPlayerStats } from "../controllers/stats.controller";

const router = Router();

router.get("/heroes", getHeroStats);
router.get("/skins", getSkinStats);
router.get("/players", getPlayerStats);

export default router;