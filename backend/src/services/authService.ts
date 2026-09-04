import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../database/client';
import config from '../config';
import { ConflictError, AuthenticationError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { AuthUser } from '../middleware/auth';

export interface RegisterInput {
  email: string;
  phone?: string;
  password: string;
  role: 'FARMER' | 'BUYER';
  name: string;
  district: string;
  village?: string;
  taluka?: string;
  companyName?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

function generateTokens(user: AuthUser): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
  );
  return { accessToken, refreshToken };
}

export async function registerUser(input: RegisterInput): Promise<LoginResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError('Email already registered');

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.$transaction(async (tx: any) => {
    const newUser = await tx.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: input.role,
      },
    });

    if (input.role === 'FARMER') {
      await tx.farmerProfile.create({
        data: {
          userId: newUser.id,
          name: input.name,
          district: input.district,
          village: input.village,
          taluka: input.taluka,
        },
      });
    } else if (input.role === 'BUYER') {
      await tx.buyerProfile.create({
        data: {
          userId: newUser.id,
          companyName: input.companyName || input.name,
          contactName: input.name,
          district: input.district,
        },
      });
    }

    return newUser;
  });

  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
  const profileName = input.name;

  return {
    ...tokens,
    user: { id: user.id, email: user.email, role: user.role, name: profileName },
  };
}

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      farmerProfile: true,
      buyerProfile: true,
      adminProfile: true,
    },
  });

  if (!user) throw new AuthenticationError('Invalid credentials');
  if (user.status !== 'ACTIVE') throw new AuthenticationError('Account is suspended');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AuthenticationError('Invalid credentials');

  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

  const name =
    user.farmerProfile?.name ||
    user.buyerProfile?.contactName ||
    user.adminProfile?.name ||
    user.email;

  return {
    ...tokens,
    user: { id: user.id, email: user.email, role: user.role, name },
  };
}

export async function refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as AuthUser;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.status !== 'ACTIVE') throw new AuthenticationError('Invalid refresh token');
    return generateTokens({ id: user.id, email: user.email, role: user.role });
  } catch {
    throw new AuthenticationError('Invalid refresh token');
  }
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      farmerProfile: true,
      buyerProfile: true,
      adminProfile: true,
    },
  });
  if (!user) throw new NotFoundError('User');
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AuthenticationError('Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

// In-memory store for password reset tokens (production should use DB/Redis)
const resetTokens = new Map<string, { userId: string; expiresAt: number }>();

export async function forgotPassword(email: string): Promise<{ resetToken: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always respond the same way to avoid email enumeration
  if (!user) return { resetToken: '' };

  const token = crypto.randomBytes(32).toString('hex');
  resetTokens.set(token, { userId: user.id, expiresAt: Date.now() + 15 * 60 * 1000 }); // 15 min

  // In production, send email here. For now return token directly.
  return { resetToken: token };
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const entry = resetTokens.get(token);
  if (!entry || entry.expiresAt < Date.now()) {
    throw new ValidationError('Reset token is invalid or has expired');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: entry.userId }, data: { passwordHash } });
  resetTokens.delete(token);
}
