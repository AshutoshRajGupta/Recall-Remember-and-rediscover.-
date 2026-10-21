import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config/env.js";
import { initializeDatabase, pool } from "./models/db.js";
import { preloadEmbeddingModel } from "./services/embedding.service.js";
import healthRoutes from "./routes/health.routes.js";
import ingestRoutes from "./routes/ingest.routes.js";
import itemsRoutes from "./routes/items.routes.js";
import queryRoutes from "./routes/query.routes.js";
import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import { notFound } from "./middleware/notFound.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/health", healthRoutes);
app.use("/ingest", ingestRoutes);
app.use("/items", itemsRoutes);
app.use("/query", queryRoutes);
app.use("/chat", chatRoutes);

app.use(notFound);
app.use(errorHandler);

async function startServer() {
  try {
    await initializeDatabase();

    const server = app.listen(config.port, "0.0.0.0", () => {
      console.log(`AI Knowledge Inbox server listening on port ${config.port}`);
    });

    server.on("close", () => {
      pool.end().catch((err) => {
        console.error("Error closing PostgreSQL pool:", err);
      });
    });

    preloadEmbeddingModel();
  } catch (err) {
    console.error("Failed to initialize application:", err);
    await pool.end();
    process.exitCode = 1;
  }
}

startServer();

export default app;
