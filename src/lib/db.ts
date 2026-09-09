import "server-only";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Next.js reloads route modules in dev and reuses the same Node process in
 * serverless deployments, so the connection promise is cached on `global`
 * rather than a module-level variable — otherwise every hot reload (dev) or
 * concurrent invocation (Vercel) would open a new connection to Atlas.
 */
declare global {
    var mongooseConnection: Promise<typeof mongoose> | undefined;
}

/**
 * `DayActivity` had a single-field unique index on `date` before the
 * tracker became multi-user; the model now declares a compound
 * `{ userId, date }` unique index instead (see src/models/DayActivity.ts),
 * but Mongoose's autoIndex only ever adds newly-declared indexes — it never
 * drops one that's no longer in the schema. On a database that already has
 * the old index, the first time a second user logs activity on a date
 * some other user already has a row for, the upsert throws a duplicate-key
 * error against the stale index. Dropping it is safe and idempotent: once
 * gone, this is a no-op forever after.
 */
async function dropLegacyDayActivityIndex(conn: typeof mongoose): Promise<void> {
  try {
    await conn.connection.collection("dayactivities").dropIndex("date_1");
  } catch (error) {
    if ((error as { codeName?: string }).codeName !== "IndexNotFound") throw error;
  }
}

/**
 * Returns the shared Mongoose connection, creating it on first call. Safe
 * to call from every service function on every request — subsequent calls
 * just await the same cached promise instead of reconnecting.
 */
export function connectToDatabase(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  if (!global.mongooseConnection) {
    global.mongooseConnection = mongoose.connect(MONGODB_URI).then(async (conn) => {
      await dropLegacyDayActivityIndex(conn);
      return conn;
    });
  }

  return global.mongooseConnection;
}
