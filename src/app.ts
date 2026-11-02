import express from "express";
import { logger } from "./middlewares/logger";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";
import heroRoutes from "./routes/hero.routes";
import skinRoutes from "./routes/skin.route";
import playerRoutes from "./routes/player.route";
import transactionRoutes from "./routes/transaction.route";
import statsRoutes from "./routes/stats.route";

const app = express();

app.use(logger);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: true, message: "Server MLBB Shop berjalan dengan baik" });
});

app.use("/api/heroes", heroRoutes);

app.use('/api/skins', skinRoutes);
app.use('/api/players', playerRoutes);
app.use("/api/players", transactionRoutes);
app.use("/api/stats", statsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;