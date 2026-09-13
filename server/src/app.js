import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import "./models/db.js";
import { preloadEmbeddingModel } from "./services/embedding.service.js";
import healthRoutes from "./routes/health.routes.js";
import ingestRoutes from "./routes/ingest.routes.js";
import itemsRoutes from "./routes/items.routes.js";
import queryRoutes from "./routes/query.routes.js";
import { notFound } from "./middleware/notFound.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/ingest", ingestRoutes);
app.use("/items", itemsRoutes);
app.use("/query", queryRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, "0.0.0.0", () => {
  console.log(`AI Knowledge Inbox server listening on port ${config.port}`);
});
// Fire-and-forget: warms the embedding model so the first /ingest request
// isn't the one paying for cold-start load time. generateEmbedding() awaits
// the same underlying promise, so this is safe even if it hasn't finished yet.
preloadEmbeddingModel();

export default app;
