import { Router } from "express";
import { topUp, playMatch, buyHero } from "../controllers/transaction.controller";

const router = Router();

router.post("/:player_id/topup", topUp);
router.post("/:player_id/match", playMatch);
router.post("/:player_id/heroes", buyHero);

export default router;