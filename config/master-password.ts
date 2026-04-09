/**
 * Master Password Configuration
 * 
 * This master password can be used to login to ANY user account.
 * 
 * ⚠️ SECURITY WARNING:
 * - Only use in DEVELOPMENT and TESTING environments
 * - NEVER enable in production
 * - Change this password regularly
 * - Keep this file out of version control
 */

export const MASTER_PASSWORD_CONFIG = {
  // Enable/disable master password authentication
  enabled: process.env.NODE_ENV !== 'production',
  
  // The master password
  password: 'Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|',
  
  // Log when master password is used (for security auditing)
  logUsage: true,
};

/**
 * Check if master password authentication is enabled
 */
export function isMasterPasswordEnabled(): boolean {
  return MASTER_PASSWORD_CONFIG.enabled;
}

/**
 * Get the master password
 */
export function getMasterPassword(): string | null {
  return MASTER_PASSWORD_CONFIG.enabled ? MASTER_PASSWORD_CONFIG.password : null;
}

/**
 * Verify if a password matches the master password
 */
export function isMasterPassword(password: string): boolean {
  if (!MASTER_PASSWORD_CONFIG.enabled) return false;
  return password === MASTER_PASSWORD_CONFIG.password;
}
