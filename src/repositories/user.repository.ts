import { BaseRepository } from "./base.repository";
import { User, IUser } from "@/models/User";

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = this.model.findOne({ email: email.toLowerCase() });
    if (includePassword) query.select("+password");
    return query.exec();
  }

  async findByReferralCode(code: string): Promise<IUser | null> {
    return this.findOne({ referralCode: code });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.updateById(id, { lastLoginAt: new Date() });
  }
}

export const userRepository = new UserRepository();
