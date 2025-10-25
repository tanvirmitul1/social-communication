import { injectable, inject } from 'tsyringe';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { User } from '@prisma/client';
import { UserRepository } from '@repositories/UserRepository.js';
import { CacheService } from './CacheService.js';
import { config } from '@config/env.js';
import { UnauthorizedError, ConflictError, ValidationError } from '@errors/index.js';
import { CONSTANTS } from '@constants/index.js';
import ms from 'ms';

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

@injectable()
export class AuthService {
  constructor(
    @inject('UserRepository') private userRepository: UserRepository,
    @inject('CacheService') private cacheService: CacheService
  ) {}

  async register(username: string, email: string, password: string): Promise<User> {
    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const existingUsername = await this.userRepository.findByUsername(username);
    if (existingUsername) {
      throw new ConflictError('Username already taken');
    }

    // Hash password
    const passwordHash = await argon2.hash(password);

    // Create user
    const user = await this.userRepository.create({
      username,
      email,
      passwordHash,
    });

    return user;
  }

  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateAuthTokens(user);

    // Update last seen
    await this.userRepository.updateOnlineStatus(user.id, true);

    return { user, tokens };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    // Revoke refresh token
    await this.userRepository.revokeRefreshToken(refreshToken);

    // Update online status
    await this.userRepository.updateOnlineStatus(userId, false);
  }

  async logoutAll(userId: string): Promise<void> {
    // Revoke all user tokens
    await this.userRepository.revokeAllUserTokens(userId);

    // Update online status
    await this.userRepository.updateOnlineStatus(userId, false);
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as TokenPayload;

      // Check if token exists and is not revoked
      const tokenRecord = await this.userRepository.findRefreshToken(refreshToken);
      if (!tokenRecord || tokenRecord.revokedAt) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Check if token is expired
      if (tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedError('Refresh token expired');
      }

      // Generate new tokens
      const tokens = await this.generateAuthTokens(tokenRecord.user);

      // Revoke old refresh token
      await this.userRepository.revokeRefreshToken(refreshToken);

      return tokens;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      throw error;
    }
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.cacheService.exists(
        CONSTANTS.REDIS_KEYS.BLACKLISTED_TOKEN(token)
      );
      if (isBlacklisted) {
        throw new UnauthorizedError('Token has been revoked');
      }

      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      throw error;
    }
  }

  private async generateAuthTokens(user: User): Promise<AuthTokens> {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate access token
    const accessToken = jwt.sign(payload, config.JWT_ACCESS_SECRET, {
      expiresIn: config.JWT_ACCESS_EXPIRATION,
    });

    // Generate refresh token
    const refreshToken = jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRATION,
    });

    // Store refresh token
    const expiresIn = ms(config.JWT_REFRESH_EXPIRATION);
    const expiresAt = new Date(Date.now() + expiresIn);
    await this.userRepository.createRefreshToken(user.id, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresIn: config.JWT_ACCESS_EXPIRATION,
    };
  }

  async blacklistToken(token: string): Promise<void> {
    const decoded = jwt.decode(token) as TokenPayload & { exp: number };
    if (decoded && decoded.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.cacheService.setWithExpiry(
          CONSTANTS.REDIS_KEYS.BLACKLISTED_TOKEN(token),
          true,
          ttl
        );
      }
    }
  }
}
