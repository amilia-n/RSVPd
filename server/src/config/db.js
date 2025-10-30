import { config } from "./env.js";

export const pgConfig = config.DATABASE_URL
  ? {
      connectionString: config.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { 
            rejectUnauthorized: false,  // Changed to true for prod
          }
          : undefined,
    }
  : {
      user: config.DB_USER,
      host: config.DB_HOST ?? "localhost",
      database: config.DB_NAME,
      password: config.DB_PASSWORD,
      port: Number(config.DB_PORT ?? 5432),
      // ssl: { rejectUnauthorized: false },
    };


