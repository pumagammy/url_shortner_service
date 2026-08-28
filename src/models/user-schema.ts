import mongoose, { Schema } from "mongoose";

export type AuthProvider = "local" | "google";

export interface IUser extends Document {
  userId: string;
  email: string;
  passwordHash?: string | null;
  name?: string;
  googleId?: string | null;
  authProvider: AuthProvider;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new mongoose.Schema<IUser>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `usr_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", UserSchema);
