import { handlers } from "@/auth";

// The credentials provider's authorize() touches MongoDB (see src/auth.ts),
// which depends on the runtime MONGODB_URI env var — matches every other
// DB-touching route handler in this app.
export const dynamic = "force-dynamic";

export const { GET, POST } = handlers;
