/**
 * Admin Panel Authentication
 *
 * Authenticates admin users against the existing users table.
 * Only ADMIN and SUPER_ADMIN roles can access the panel.
 * Uses argon2 for secure password verification.
 */

import argon2 from 'argon2';
import { UserRole, UserStatus } from '@prisma/client';
import { prisma } from '@config/prisma.js';
import { logger } from '@config/logger.js';
import type { CurrentAdmin } from 'adminjs';

// Extend AdminJS CurrentAdmin with our custom fields
export interface AdminCurrentUser extends CurrentAdmin {
  id: string;
  role: UserRole;
  username: string;
}

const ADMIN_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

/**
 * Dummy hash used for constant-time comparison to prevent user enumeration.
 * argon2id format: $argon2id$v=19$m=65536,t=3,p=4$<salt>$<hash>
 */
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$RdescudvJCsgt3ub+b+dWRWJTmaaJObG';

export async function authenticateAdmin(
  email: string,
  password: string
): Promise<AdminCurrentUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        role: true,
        status: true,
      },
    });

    // Always run argon2 to prevent timing-based user enumeration
    if (!user) {
      await argon2.verify(DUMMY_HASH, password).catch(() => false);
      logger.warn({ email }, 'Admin login: user not found');
      return null;
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);

    if (!ADMIN_ROLES.includes(user.role)) {
      logger.warn({ email, role: user.role }, 'Admin login: insufficient role');
      return null;
    }

    if (user.status !== UserStatus.ACTIVE) {
      logger.warn({ email, status: user.status }, 'Admin login: account not active');
      return null;
    }

    if (!isPasswordValid) {
      logger.warn({ email }, 'Admin login: invalid password');
      return null;
    }

    logger.info({ email, role: user.role, userId: user.id }, 'Admin authenticated');

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      title: user.role === UserRole.SUPER_ADMIN ? 'Super Admin' : 'Admin',
    };
  } catch (error) {
    logger.error({ error, email }, 'Admin authentication error');
    return null;
  }
}
