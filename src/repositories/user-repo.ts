import { UserModel, IUser } from "../models/user-schema";

export const UserRepo = {
  async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email: email.toLowerCase().trim() }).exec();
  },

  async findByUserId(userId: string): Promise<IUser | null> {
    return UserModel.findOne({ userId }).exec();
  },

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return UserModel.findOne({ googleId }).exec();
  },

  async createUser(data: Partial<IUser>): Promise<IUser> {
    const user = new UserModel(data);
    return user.save();
  },
};
