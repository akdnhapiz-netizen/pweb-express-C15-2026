import express from "express";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: true, message: "Server MLBB Shop berjalan dengan baik" });
});

export default app;