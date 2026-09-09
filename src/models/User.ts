import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Mongoose model + DTO for an account. `role` gates the admin-only actions
 * (add/delete pattern, add/delete problem, edit a problem's reference
 * links) — see src/lib/auth-guard.ts. There is no self-service promotion:
 * every new account starts as `"user"`; an admin is created by hand via
 * `scripts/make-admin.ts`.
 */

/** The one place this union is defined — imported everywhere else that needs it (session/JWT types, DTOs, components) instead of re-typing it. */
export type Role = "admin" | "user";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
  },
  { timestamps: true },
);

// Reuse an existing compiled model in dev/HMR instead of recompiling it,
// which would otherwise throw "Cannot overwrite model once compiled".
export const UserModel = mongoose.models.User ?? mongoose.model("User", userSchema);

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

/** Plain, JSON-serializable shape for passing a user across the Server → Client Component boundary. Never includes `passwordHash`. */
export type UserDTO = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

export function toUserDTO(doc: UserDocument): UserDTO {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role as Role,
    createdAt: doc.createdAt.toISOString(),
  };
}
