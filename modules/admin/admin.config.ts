/**
 * AdminJS Configuration
 *
 * Builds the AdminJS instance with:
 * - Branding and UI customisation
 * - Dashboard with live stats
 * - All resource definitions
 * - Locale settings
 */

import AdminJS, { type AdminJSOptions } from 'adminjs';
import { Database, Resource } from '@adminjs/prisma';
import { prisma } from '@config/prisma.js';
import { logger } from '@config/logger.js';
import { adminResources } from './admin.resources.js';

// Register the Prisma adapter once (idempotent)
AdminJS.registerAdapter({ Database, Resource });

// ---------------------------------------------------------------------------
// Dashboard handler — returns stats rendered by the default dashboard
// ---------------------------------------------------------------------------
async function buildDashboardData(): Promise<Record<string, number>> {
  try {
    const [users, messages, reports, posts, calls] = await Promise.all([
      prisma.user.count(),
      prisma.message.count({ where: { deletedAt: null } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.post.count({ where: { deletedAt: null } }),
      prisma.call.count(),
    ]);

    return { users, messages, pendingReports: reports, posts, calls };
  } catch (err) {
    logger.error({ err }, 'AdminJS dashboard stats error');
    return {};
  }
}

// ---------------------------------------------------------------------------
// AdminJS options
// ---------------------------------------------------------------------------
export function createAdminConfig(): AdminJSOptions {
  return {
    rootPath: '/admin',
    loginPath: '/admin/login',
    logoutPath: '/admin/logout',

    databases: [],
    resources: adminResources,

    branding: {
      companyName: 'SocialComm Admin',
      logo: false,            // Set to URL string when you have a logo asset
      favicon: '',
      withMadeWithLove: false,
      theme: {
        colors: {
          primary100: '#4F46E5',
          primary80: '#6366F1',
          primary60: '#818CF8',
          primary40: '#A5B4FC',
          primary20: '#C7D2FE',
          love: '#E11D48',
          filterBg: '#F3F4F6',
          accent: '#4F46E5',
          hoverBg: '#EEF2FF',
          border: '#E5E7EB',
          inputBorder: '#D1D5DB',
          filterBorder: '#D1D5DB',
          bg: '#FAFAFA',
          white: '#FFFFFF',
          grey100: '#111827',
          grey80: '#374151',
          grey60: '#6B7280',
          grey40: '#9CA3AF',
          grey20: '#E5E7EB',
          grey: '#F9FAFB',
          errorLight: '#FEE2E2',
          error: '#EF4444',
          successLight: '#DCFCE7',
          success: '#22C55E',
        },
      },
    },

    dashboard: {
      handler: buildDashboardData,
    },

    locale: {
      language: 'en',
      availableLanguages: ['en'],
      translations: {
        en: {
          actions: {
            banUser: 'Ban',
            unbanUser: 'Unban',
            verifyUser: 'Verify',
            softDeleteMessage: 'Soft Delete',
            removePost: 'Remove Post',
            flagPost: 'Flag',
            removeComment: 'Remove',
            resolveReport: 'Resolve',
            dismissReport: 'Dismiss',
          },
          buttons: {
            save: 'Save',
            confirmActionYes: 'Yes, proceed',
            confirmActionNo: 'Cancel',
          },
        },
      },
    },
  };
}
