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
 * Returns the shared Mongoose connection, creating it on first call. Safe
 * to call from every service function on every request — subsequent calls
 * just await the same cached promise instead of reconnecting.
 */
export function connectToDatabase(): Promise<typeof mongoose> {
    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI environment variable is not set");
    }

    if (!global.mongooseConnection) {
        global.mongooseConnection = mongoose.connect(MONGODB_URI);
    }

    return global.mongooseConnection;
}
