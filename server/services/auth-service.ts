import jwt from 'jsonwebtoken';
import { UserRepository, UserWithoutPassword } from '../repositories/user-repository.js';
import { RefreshTokenRepository } from '../repositories/refresh-token-repository.js';

// JWT expires in 15 minutes
const JWT_EXPIRY = '15m';

// Get secrets from environment
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
};

export interface JwtPayload {
  userId: number;
  email: string;
}

export interface LoginResult {
  user: UserWithoutPassword;
  accessToken: string;
  refreshToken: string;
}

export const AuthService = {
  /**
   * Authenticate user with email and password
   */
  async login(email: string, password: string): Promise<LoginResult | null> {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    const isValid = await UserRepository.verifyPassword(user, password);
    if (!isValid) {
      return null;
    }

    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = await RefreshTokenRepository.create(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      accessToken,
      refreshToken,
    };
  },

  /**
   * Logout user by invalidating refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    await RefreshTokenRepository.delete(refreshToken);
  },

  /**
   * Refresh access token using refresh token
   */
  async refresh(refreshToken: string): Promise<{ accessToken: string; user: UserWithoutPassword } | null> {
    const tokenRecord = await RefreshTokenRepository.findValid(refreshToken);
    if (!tokenRecord) {
      return null;
    }

    const user = await UserRepository.findById(tokenRecord.user_id);
    if (!user) {
      return null;
    }

    const accessToken = this.generateAccessToken(user.id, user.email);

    return { accessToken, user };
  },

  /**
   * Generate JWT access token
   */
  generateAccessToken(userId: number, email: string): string {
    const payload: JwtPayload = { userId, email };
    return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRY });
  },

  /**
   * Verify and decode JWT access token
   */
  verifyAccessToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, getJwtSecret()) as JwtPayload;
    } catch {
      return null;
    }
  },

  /**
   * Change user password (requires current password verification)
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      return false;
    }

    // Get full user with password hash
    const fullUser = await UserRepository.findByEmail(user.email);
    if (!fullUser) {
      return false;
    }

    const isValid = await UserRepository.verifyPassword(fullUser, currentPassword);
    if (!isValid) {
      return false;
    }

    await UserRepository.updatePassword(userId, newPassword);
    
    // Invalidate all existing refresh tokens for security
    await RefreshTokenRepository.deleteAllForUser(userId);

    return true;
  },
};
