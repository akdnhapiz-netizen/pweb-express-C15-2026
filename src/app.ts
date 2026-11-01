import express from "express";
import { logger } from "./middlewares/logger";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";
import heroRoutes from "./routes/hero.routes";

const app = express();

app.use(logger);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: true, message: "Server MLBB Shop berjalan dengan baik" });
});

app.use("/api/heroes", heroRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;