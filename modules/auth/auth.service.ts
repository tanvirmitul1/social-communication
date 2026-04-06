import { injectable, inject } from 'tsyringe';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { generateSecret, generateURI, verify as otpVerify } from 'otplib';
import QRCode from 'qrcode';
import { User } from '@prisma/client';
import { UserRepository } from '@modules/user/user.repository.js';
import { CacheService } from '@infrastructure/cache.service.js';
import { config } from '@config/env.js';
import { UnauthorizedError, ConflictError, ForbiddenError } from '@common/errors.js';
import { CONSTANTS } from '@common/constants.js';
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

type LoginResult =
  | { requiresTwoFactor: false; user: User; tokens: AuthTokens }
  | { requiresTwoFactor: true; user: User; twoFactorToken: string };

interface TwoFactorSetupResult {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

@injectable()
export class AuthService {
  constructor(
    @inject('UserRepository') private userRepository: UserRepository,
    @inject('CacheService') private cacheService: CacheService
  ) {}

  async register(username: string, email: string, password: string): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) throw new ConflictError('Email already registered');

    const existingUsername = await this.userRepository.findByUsername(username);
    if (existingUsername) throw new ConflictError('Username already taken');

    const passwordHash = await argon2.hash(password);
    return this.userRepository.create({ username, email, passwordHash });
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) throw new UnauthorizedError('Invalid credentials');

    await this.userRepository.updateOnlineStatus(user.id, true);

    // 2FA gate: return a short-lived temp token instead of full auth tokens
    if (user.twoFactorEnabled) {
      const twoFactorToken = jwt.sign(
        { id: user.id, purpose: '2fa' },
        config.JWT_ACCESS_SECRET,
        { expiresIn: '5m' }
      );
      return { requiresTwoFactor: true, user, twoFactorToken };
    }

    const tokens = await this.generateAuthTokens(user);
    return { requiresTwoFactor: false, user, tokens };
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) await this.userRepository.revokeRefreshToken(refreshToken);
    await this.userRepository.updateOnlineStatus(userId, false);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.userRepository.revokeAllUserTokens(userId);
    await this.userRepository.updateOnlineStatus(userId, false);
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as TokenPayload;

      const tokenRecord = await this.userRepository.findRefreshToken(refreshToken);
      if (!tokenRecord || tokenRecord.revokedAt) throw new UnauthorizedError('Invalid refresh token');
      if (tokenRecord.expiresAt < new Date()) throw new UnauthorizedError('Refresh token expired');

      const tokens = await this.generateAuthTokens(tokenRecord.user);
      await this.userRepository.revokeRefreshToken(refreshToken);
      return tokens;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) throw new UnauthorizedError('Invalid refresh token');
      throw error;
    }
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const isBlacklisted = await this.cacheService.exists(
        CONSTANTS.REDIS_KEYS.BLACKLISTED_TOKEN(token)
      );
      if (isBlacklisted) throw new UnauthorizedError('Token has been revoked');

      return jwt.verify(token, config.JWT_ACCESS_SECRET) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) throw new UnauthorizedError('Invalid token');
      if (error instanceof jwt.TokenExpiredError) throw new UnauthorizedError('Token expired');
      throw error;
    }
  }

  async blacklistToken(token: string): Promise<void> {
    const decoded = jwt.decode(token) as TokenPayload & { exp: number };
    if (decoded?.exp) {
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

  // ============================================================================
  // TWO-FACTOR AUTHENTICATION
  // ============================================================================

  /**
   * Step 1 — generate a new TOTP secret and return the QR code data URL.
   * The secret is saved immediately to DB (but 2FA is not enabled yet).
   * The user must call `enable2FA` with a valid code to activate.
   */
  async setup2FA(userId: string): Promise<TwoFactorSetupResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthorizedError('User not found');

    const secret = generateSecret();
    const otpauthUrl = generateURI({ issuer: 'SocialComm', label: user.email, secret });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Store the pending secret (twoFactorEnabled stays false until confirmed)
    await this.userRepository.update(userId, { twoFactorSecret: secret });

    return { secret, otpauthUrl, qrCodeDataUrl };
  }

  /** Step 2 — verify a TOTP code and activate 2FA on the account. */
  async enable2FA(userId: string, token: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthorizedError('User not found');
    if (user.twoFactorEnabled) throw new ConflictError('2FA is already enabled');
    if (!user.twoFactorSecret) throw new ForbiddenError('Run 2FA setup first');

    const result = await otpVerify({ token, secret: user.twoFactorSecret });
    if (!result.valid) throw new UnauthorizedError('Invalid 2FA code');

    await this.userRepository.update(userId, { twoFactorEnabled: true });
  }

  /** Disable 2FA — requires current password + valid TOTP code for safety. */
  async disable2FA(userId: string, password: string, token: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthorizedError('User not found');
    if (!user.twoFactorEnabled) throw new ConflictError('2FA is not enabled');

    if (!(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedError('Invalid password');
    }
    if (!user.twoFactorSecret) throw new UnauthorizedError('Invalid 2FA code');
    const verifyResult = await otpVerify({ token, secret: user.twoFactorSecret });
    if (!verifyResult.valid) throw new UnauthorizedError('Invalid 2FA code');

    await this.userRepository.update(userId, { twoFactorEnabled: false, twoFactorSecret: null });
  }

  /**
   * Final login step for 2FA-protected accounts.
   * Validates the short-lived temp token + TOTP code → returns full auth tokens.
   */
  async verifyTwoFactorLogin(twoFactorToken: string, code: string): Promise<{ user: User; tokens: AuthTokens }> {
    let payload: { id: string; purpose: string };
    try {
      payload = jwt.verify(twoFactorToken, config.JWT_ACCESS_SECRET) as { id: string; purpose: string };
    } catch {
      throw new UnauthorizedError('Invalid or expired 2FA token');
    }

    if (payload.purpose !== '2fa') throw new UnauthorizedError('Invalid token purpose');

    const user = await this.userRepository.findById(payload.id);
    if (!user) throw new UnauthorizedError('User not found');
    if (!user.twoFactorSecret) throw new ForbiddenError('2FA is not configured for this account');

    const verifyResult = await otpVerify({ token: code, secret: user.twoFactorSecret });
    if (!verifyResult.valid) throw new UnauthorizedError('Invalid 2FA code');

    const tokens = await this.generateAuthTokens(user);
    return { user, tokens };
  }

  // ============================================================================
  // PRIVATE
  // ============================================================================

  private async generateAuthTokens(user: User): Promise<AuthTokens> {
    const payload: TokenPayload = { id: user.id, email: user.email, role: user.role };

    // @ts-expect-error - envsafe type incompatibility with jsonwebtoken
    const accessToken = jwt.sign(payload, config.JWT_ACCESS_SECRET, {
      expiresIn: config.JWT_ACCESS_EXPIRATION,
    });

    // @ts-expect-error - envsafe type incompatibility with jsonwebtoken
    const refreshToken = jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRATION,
    });

    // @ts-expect-error - envsafe type incompatibility with ms
    const expiresIn = ms(config.JWT_REFRESH_EXPIRATION);
    const expiresAt = new Date(Date.now() + expiresIn);
    await this.userRepository.createRefreshToken(user.id, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresIn: config.JWT_ACCESS_EXPIRATION as string,
    };
  }
}
