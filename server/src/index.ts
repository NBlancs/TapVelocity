import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import mercurius from "mercurius";
import { schema } from "./graphql/schema.js";
import { resolvers } from "./graphql/resolvers.js";

const PORT = Number(process.env.PORT) || 4000;
const isDev = process.env.NODE_ENV !== "production";

async function main() {
  const app = Fastify({
    logger: {
      level: isDev ? "info" : "warn",
      transport: isDev
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
    },
  });

  // CORS — allow all origins in dev, restrict in production
  await app.register(cors, {
    origin: isDev ? true : false,
  });

  // GraphQL via Mercurius
  await app.register(mercurius, {
    schema,
    resolvers,
    graphiql: isDev, // GraphiQL UI at /graphiql in development
    subscription: true,
  });

  // Health check endpoint
  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  // Start
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    app.log.info(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    if (isDev) {
      app.log.info(`📊 GraphiQL at http://localhost:${PORT}/graphiql`);
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
