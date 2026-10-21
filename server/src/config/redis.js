import { createClient } from "redis";
import { config } from "./env.js";

export const redisClient = createClient({
  url: config.redisUrl,
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries >= 5) return new Error("Redis connection failed");
      return Math.min(retries * 250, 2000);
    },
  },
});

redisClient.on("error", (err) => {
  console.error("[redis] connection error:", err.message);
});

redisClient.on("ready", () => {
  console.log("[redis] connection ready");
});

let connectionPromise;

export async function connectRedis() {
  if (redisClient.isReady) return;

  if (!connectionPromise) {
    connectionPromise = redisClient.connect().finally(() => {
      connectionPromise = undefined;
    });
  }

  await connectionPromise;
}
