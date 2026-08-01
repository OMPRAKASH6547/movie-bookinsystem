import { nanoid } from "nanoid";
import { userRepository } from "@/repositories/user.repository";
import { hashPassword, comparePassword, generateOTP } from "@/lib/auth/password";
import { createAuthTokens, rotateRefreshToken, revokeSession } from "@/lib/auth/jwt";
import { cache } from "@/lib/redis/client";
import { sendEmail } from "@/lib/email/mailer";
import {
  welcomeEmail,
  otpEmail,
  resetPasswordEmail,
} from "@/lib/email/templates";
import { Wallet } from "@/models/Wallet";
import { AuditLog } from "@/models/AuditLog";
import { ROLES } from "@/constants/roles";
import { ROLE_PERMISSIONS } from "@/constants/roles";
import { TOKEN_CONFIG } from "@/constants";
import type { RegisterInput, LoginInput } from "@/lib/validators/auth";
import type { AuthUser } from "@/types";

function toAuthUser(user: {
  _id: { toString(): string };
  email: string;
  name: string;
  role: AuthUser["role"];
  avatar?: string;
  isEmailVerified: boolean;
}): AuthUser {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    isEmailVerified: user.isEmailVerified,
    permissions: ROLE_PERMISSIONS[user.role] || [],
  };
}

export class AuthService {
  async register(input: RegisterInput, ip?: string) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new Error("Email already registered");
    }

    const password = await hashPassword(input.password);
    const referralCode = nanoid(8).toUpperCase();
    const emailVerifyToken = nanoid(32);

    const user = await userRepository.create({
      name: input.name,
      email: input.email.toLowerCase(),
      password,
      phone: input.phone,
      role: ROLES.CUSTOMER,
      provider: "credentials",
      referralCode,
      emailVerifyToken,
    });

    await Wallet.create({ userId: user._id, balance: 100 });

    const tokens = await createAuthTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const email = welcomeEmail(user.name);
    await sendEmail({ to: user.email, ...email });

    await AuditLog.create({
      userId: user._id,
      action: "REGISTER",
      resource: "User",
      resourceId: user._id.toString(),
      ipAddress: ip,
    });

    return { user: toAuthUser(user), ...tokens };
  }

  async login(input: LoginInput, ip?: string) {
    const user = await userRepository.findByEmail(input.email, true);
    if (!user || !user.password) {
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    const valid = await comparePassword(input.password, user.password);
    if (!valid) {
      throw new Error("Invalid email or password");
    }

    await userRepository.updateLastLogin(user._id.toString());

    const tokens = await createAuthTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      tenantId: user.tenantId?.toString(),
    });

    await AuditLog.create({
      userId: user._id,
      action: "LOGIN",
      resource: "User",
      resourceId: user._id.toString(),
      ipAddress: ip,
    });

    return { user: toAuthUser(user), ...tokens };
  }

  async guestLogin(data: { name: string; email: string; phone?: string }) {
    let user = await userRepository.findByEmail(data.email);

    if (!user) {
      user = await userRepository.create({
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        role: ROLES.GUEST,
        provider: "guest",
        referralCode: nanoid(8).toUpperCase(),
      });
      await Wallet.create({ userId: user._id, balance: 0 });
    }

    const tokens = await createAuthTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { user: toAuthUser(user), ...tokens };
  }

  async sendOTP(phone: string) {
    const otp = generateOTP();
    await cache.set(`otp:${phone}`, otp, TOKEN_CONFIG.OTP_EXPIRY_MINUTES * 60);

    // In production, integrate SMS gateway. Log for development.
    const emailContent = otpEmail(otp);
    console.info(`[OTP] ${phone}: ${otp}`);

    return { message: "OTP sent successfully", expiresIn: TOKEN_CONFIG.OTP_EXPIRY_MINUTES * 60, ...(process.env.NODE_ENV !== "production" ? { debugOtp: otp } : {}), emailPreview: emailContent.subject };
  }

  async verifyOTP(phone: string, otp: string) {
    const stored = await cache.get(`otp:${phone}`);
    if (!stored || stored !== otp) {
      throw new Error("Invalid or expired OTP");
    }

    await cache.del(`otp:${phone}`);

    let user = await userRepository.findOne({ phone });
    if (!user) {
      user = await userRepository.create({
        name: `User ${phone.slice(-4)}`,
        email: `${phone.replace(/\+/g, "")}@otp.cinepass.app`,
        phone,
        role: ROLES.CUSTOMER,
        provider: "credentials",
        isPhoneVerified: true,
        referralCode: nanoid(8).toUpperCase(),
      });
      await Wallet.create({ userId: user._id, balance: 50 });
    } else {
      await userRepository.updateById(user._id.toString(), { isPhoneVerified: true });
    }

    const tokens = await createAuthTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { user: toAuthUser(user), ...tokens };
  }

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return { message: "If the email exists, a reset link has been sent" };
    }

    const token = nanoid(48);
    await userRepository.updateById(user._id.toString(), {
      resetPasswordToken: token,
      resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
    });

    const content = resetPasswordEmail(token);
    await sendEmail({ to: user.email, ...content });

    return {
      message: "If the email exists, a reset link has been sent",
      ...(process.env.NODE_ENV !== "production" ? { debugToken: token } : {}),
    };
  }

  async resetPassword(token: string, password: string) {
    const user = await userRepository.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    const hashed = await hashPassword(password);
    await userRepository.updateById(user._id.toString(), {
      password: hashed,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
    });

    return { message: "Password reset successful" };
  }

  async refresh(refreshToken: string) {
    const tokens = await rotateRefreshToken(refreshToken);
    if (!tokens) {
      throw new Error("Invalid refresh token");
    }
    return tokens;
  }

  async logout(sessionId: string) {
    await revokeSession(sessionId);
    return { message: "Logged out successfully" };
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("User not found");
    return toAuthUser(user);
  }
}

export const authService = new AuthService();
