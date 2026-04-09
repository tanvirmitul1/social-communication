/**
 * AdminJS Resource Definitions
 *
 * Configures all Prisma models as AdminJS resources with:
 * - Visible/hidden field control (sensitive fields excluded)
 * - Role-based access control per resource and action
 * - Custom actions (ban, unban, verify, soft-delete, resolve report)
 * - Before/after hooks for audit logging
 * - Filters, sorting, and pagination
 */

import { UserRole, UserStatus, PostStatus, type Prisma } from '@prisma/client';
import type { ResourceWithOptions, ActionContext, ActionResponse, After } from 'adminjs';
import { getModelByName } from '@adminjs/prisma';
import { prisma } from '@config/prisma.js';
import { logger } from '@config/logger.js';
import type { AdminCurrentUser } from './admin.auth.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isSuperAdmin = (ctx: ActionContext) =>
  (ctx.currentAdmin as AdminCurrentUser | undefined)?.role === UserRole.SUPER_ADMIN;

const isAdminOrAbove = (ctx: ActionContext) => {
  const role = (ctx.currentAdmin as AdminCurrentUser | undefined)?.role;
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
};

/** Write an admin action to the activity_log table. Fire-and-forget. */
function auditLog(
  ctx: ActionContext,
  action: string,
  resource: string,
  details: Record<string, unknown>
): void {
  const admin = ctx.currentAdmin as AdminCurrentUser | undefined;
  if (!admin?.id) return;

  prisma.activityLog
    .create({
      data: {
        userId: admin.id,
        action: `ADMIN_${action.toUpperCase()}`,
        resource,
        details: details as Prisma.InputJsonValue,
        ipAddress: (ctx.request as { ip?: string } | undefined)?.ip ?? null,
        userAgent: null,
      },
    })
    .catch((err: unknown) => logger.error({ err }, 'Failed to write admin audit log'));
}

/** Generic after-hook that logs the action. */
const makeAuditHook =
  (action: string, modelName: string): After<ActionResponse> =>
  async (response, _request, context) => {
    auditLog(context, action, modelName, {
      recordId: context.record?.id(),
    });
    return response;
  };

// ---------------------------------------------------------------------------
// Shared navigation groups
// ---------------------------------------------------------------------------
const NAV_USERS = { name: 'Users', icon: 'User' };
const NAV_MESSAGING = { name: 'Messaging', icon: 'Chat' };
const NAV_CONTENT = { name: 'Content', icon: 'Image' };
const NAV_CALLS = { name: 'Calls', icon: 'Phone' };
const NAV_SYSTEM = { name: 'System', icon: 'Settings' };

// ---------------------------------------------------------------------------
// USER RESOURCE
// ---------------------------------------------------------------------------
const userResource: ResourceWithOptions = {
  resource: { model: getModelByName('User'), client: prisma },
  options: {
    navigation: NAV_USERS,
    sort: { sortBy: 'createdAt', direction: 'desc' },

    properties: {
      passwordHash: { isVisible: false },
      twoFactorSecret: { isVisible: false },
      id: { isVisible: { list: true, show: true, edit: false, filter: true } },
      email: { isVisible: true },
      username: { isVisible: true },
      role: {
        isVisible: true,
        availableValues: [
          { value: UserRole.USER, label: 'User' },
          { value: UserRole.MODERATOR, label: 'Moderator' },
          { value: UserRole.ADMIN, label: 'Admin' },
          { value: UserRole.SUPER_ADMIN, label: 'Super Admin' },
        ],
      },
      status: {
        isVisible: true,
        availableValues: [
          { value: UserStatus.ACTIVE, label: 'Active' },
          { value: UserStatus.INACTIVE, label: 'Inactive' },
          { value: UserStatus.SUSPENDED, label: 'Suspended' },
          { value: UserStatus.DELETED, label: 'Deleted' },
        ],
      },
      avatar: { isVisible: { list: false, show: true, edit: true, filter: false } },
      statusMessage: { isVisible: { list: false, show: true, edit: true, filter: false } },
      isOnline: { isVisible: { list: true, show: true, edit: false, filter: true } },
      twoFactorEnabled: { isVisible: { list: false, show: true, edit: false, filter: false } },
      lastSeen: { isVisible: { list: false, show: true, edit: false, filter: false } },
      createdAt: { isVisible: { list: true, show: true, edit: false, filter: true } },
      updatedAt: { isVisible: { list: false, show: true, edit: false, filter: false } },
    },

    listProperties: ['username', 'email', 'role', 'status', 'isOnline', 'createdAt'],
    filterProperties: ['username', 'email', 'role', 'status', 'isOnline', 'createdAt'],
    editProperties: ['username', 'email', 'avatar', 'statusMessage', 'role', 'status'],
    showProperties: [
      'id',
      'username',
      'email',
      'role',
      'status',
      'isOnline',
      'lastSeen',
      'twoFactorEnabled',
      'avatar',
      'statusMessage',
      'createdAt',
      'updatedAt',
    ],

    actions: {
      // Restrict create/edit/delete to ADMIN+
      new: {
        isAccessible: isAdminOrAbove,
        after: makeAuditHook('CREATE', 'User'),
      },
      edit: {
        isAccessible: (ctx) => {
          if (!isAdminOrAbove(ctx)) return false;
          const targetRole = ctx.record?.param('role') as UserRole | undefined;
          // Only SUPER_ADMIN can edit ADMIN or SUPER_ADMIN records
          if (
            targetRole === UserRole.ADMIN ||
            targetRole === UserRole.SUPER_ADMIN
          ) {
            return isSuperAdmin(ctx);
          }
          return true;
        },
        after: makeAuditHook('EDIT', 'User'),
      },
      delete: { isAccessible: isSuperAdmin, after: makeAuditHook('DELETE', 'User') },
      list: { isAccessible: isAdminOrAbove },
      show: { isAccessible: isAdminOrAbove },
      bulkDelete: { isAccessible: isSuperAdmin },

      // Custom: Ban user
      banUser: {
        actionType: 'record',
        icon: 'Ban',
        isVisible: (ctx) => {
          const status = ctx.record?.param('status');
          return isAdminOrAbove(ctx) && status !== UserStatus.SUSPENDED;
        },
        isAccessible: isAdminOrAbove,
        handler: async (_req, _res, ctx) => {
          const { record } = ctx;
          if (!record) throw new Error('Record not found');

          const targetRole = record.param('role') as UserRole;
          if (
            (targetRole === UserRole.ADMIN || targetRole === UserRole.SUPER_ADMIN) &&
            !isSuperAdmin(ctx)
          ) {
            return {
              record: record.toJSON(ctx.currentAdmin),
              notice: { message: 'Only Super Admins can ban Admin accounts.', type: 'error' },
            };
          }

          await prisma.user.update({
            where: { id: record.id() as string },
            data: { status: UserStatus.SUSPENDED },
          });

          auditLog(ctx, 'BAN_USER', 'User', { targetUserId: record.id(), reason: 'Admin action' });

          return {
            record: record.toJSON(ctx.currentAdmin),
            notice: { message: 'User banned successfully.', type: 'success' },
          };
        },
      },

      // Custom: Unban user
      unbanUser: {
        actionType: 'record',
        icon: 'Checkmark',
        isVisible: (ctx) => {
          const status = ctx.record?.param('status');
          return isAdminOrAbove(ctx) && status === UserStatus.SUSPENDED;
        },
        isAccessible: isAdminOrAbove,
        handler: async (_req, _res, ctx) => {
          const { record } = ctx;
          if (!record) throw new Error('Record not found');

          await prisma.user.update({
            where: { id: record.id() as string },
            data: { status: UserStatus.ACTIVE },
          });

          auditLog(ctx, 'UNBAN_USER', 'User', { targetUserId: record.id() });

          return {
            record: record.toJSON(ctx.currentAdmin),
            notice: { message: 'User unbanned successfully.', type: 'success' },
          };
        },
      },

      // Custom: Verify user (set status to ACTIVE if INACTIVE)
      verifyUser: {
        actionType: 'record',
        icon: 'CheckmarkCircle',
        isVisible: (ctx) => {
          const status = ctx.record?.param('status');
          return isAdminOrAbove(ctx) && status === UserStatus.INACTIVE;
        },
        isAccessible: isAdminOrAbove,
        handler: async (_req, _res, ctx) => {
          const { record } = ctx;
          if (!record) throw new Error('Record not found');

          await prisma.user.update({
            where: { id: record.id() as string },
            data: { status: UserStatus.ACTIVE },
          });

          auditLog(ctx, 'VERIFY_USER', 'User', { targetUserId: record.id() });

          return {
            record: record.toJSON(ctx.currentAdmin),
            notice: { message: 'User verified and activated.', type: 'success' },
          };
        },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// MESSAGE RESOURCE
// ---------------------------------------------------------------------------
const messageResource: ResourceWithOptions = {
  resource: { model: getModelByName('Message'), client: prisma },
  options: {
    navigation: NAV_MESSAGING,
    sort: { sortBy: 'createdAt', direction: 'desc' },

    listProperties: ['content', 'type', 'status', 'isPinned', 'createdAt'],
    filterProperties: ['senderId', 'groupId', 'receiverId', 'type', 'status', 'createdAt', 'deletedAt'],
    showProperties: [
      'id', 'senderId', 'groupId', 'receiverId', 'content',
      'type', 'status', 'isPinned', 'parentId', 'editedAt',
      'deletedAt', 'createdAt', 'updatedAt',
    ],
    editProperties: ['content', 'status', 'isPinned'],

    properties: {
      content: { type: 'textarea' },
      metadata: { isVisible: { list: false, show: true, edit: false, filter: false } },
    },

    actions: {
      new: { isAccessible: () => false }, // Messages created via API only
      edit: { isAccessible: isAdminOrAbove, after: makeAuditHook('EDIT', 'Message') },
      list: { isAccessible: isAdminOrAbove },
      show: { isAccessible: isAdminOrAbove },
      delete: { isAccessible: isSuperAdmin, after: makeAuditHook('DELETE', 'Message') },
      bulkDelete: { isAccessible: isSuperAdmin },

      // Custom: Soft delete message
      softDeleteMessage: {
        actionType: 'record',
        icon: 'Trash',
        isVisible: (ctx) => isAdminOrAbove(ctx) && !ctx.record?.param('deletedAt'),
        isAccessible: isAdminOrAbove,
        handler: async (_req, _res, ctx) => {
          const { record } = ctx;
          if (!record) throw new Error('Record not found');

          await prisma.message.update({
            where: { id: record.id() as string },
            data: { deletedAt: new Date(), content: '[Message removed by admin]' },
          });

          auditLog(ctx, 'SOFT_DELETE_MESSAGE', 'Message', { messageId: record.id() });

          return {
            record: record.toJSON(ctx.currentAdmin),
            notice: { message: 'Message soft deleted.', type: 'success' },
          };
        },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// REPORT RESOURCE
// ---------------------------------------------------------------------------
const reportResource: ResourceWithOptions = {
  resource: { model: getModelByName('Report'), client: prisma },
  options: {
    navigation: NAV_SYSTEM,
    sort: { sortBy: 'createdAt', direction: 'desc' },

    listProperties: ['reporterId', 'reportedId', 'status', 'createdAt'],
    filterProperties: ['reporterId', 'reportedId', 'status', 'createdAt'],
    showProperties: ['id', 'reporterId', 'reportedId', 'reason', 'status', 'createdAt', 'updatedAt'],
    editProperties: ['status'],

    properties: {
      reason: { type: 'textarea' },
      status: {
        availableValues: [
          { value: 'PENDING', label: 'Pending' },
          { value: 'REVIEWED', label: 'Reviewed' },
          { value: 'RESOLVED', label: 'Resolved' },
          { value: 'DISMISSED', label: 'Dismissed' },
        ],
      },
    },

    actions: {
      new: { isAccessible: () => false },
      edit: { isAccessible: isAdminOrAbove, after: makeAuditHook('EDIT', 'Report') },
      delete: { isAccessible: isSuperAdmin, after: makeAuditHook('DELETE', 'Report') },
      list: { isAccessible: isAdminOrAbove },
      show: { isAccessible: isAdminOrAbove },
      bulkDelete: { isAccessible: () => false },

      resolveReport: {
        actionType: 'record',
        icon: 'Checkmark',
        isVisible: (ctx) => {
          const status = ctx.record?.param('status') as string;
          return isAdminOrAbove(ctx) && status === 'PENDING';
        },
        isAccessible: isAdminOrAbove,
        handler: async (_req, _res, ctx) => {
          const { record } = ctx;
          if (!record) throw new Error('Record not found');

          await prisma.report.update({
            where: { id: record.id() as string },
            data: { status: 'RESOLVED' },
          });

          auditLog(ctx, 'RESOLVE_REPORT', 'Report', { reportId: record.id() });

          return {
            record: record.toJSON(ctx.currentAdmin),
            notice: { message: 'Report resolved.', type: 'success' },
          };
        },
      },

      dismissReport: {
        actionType: 'record',
        icon: 'Close',
        isVisible: (ctx) => {
          const status = ctx.record?.param('status') as string;
          return isAdminOrAbove(ctx) && status === 'PENDING';
        },
        isAccessible: isAdminOrAbove,
        handler: async (_req, _res, ctx) => {
          const { record } = ctx;
          if (!record) throw new Error('Record not found');

          await prisma.report.update({
            where: { id: record.id() as string },
            data: { status: 'DISMISSED' },
          });

          auditLog(ctx, 'DISMISS_REPORT', 'Report', { reportId: record.id() });

          return {
            record: record.toJSON(ctx.currentAdmin),
            notice: { message: 'Report dismissed.', type: 'success' },
          };
        },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// GROUP RESOURCE
// ---------------------------------------------------------------------------
const groupResource: ResourceWithOptions = {
  resource: { model: getModelByName('Group'), client: prisma },
  options: {
    navigation: NAV_MESSAGING,
    sort: { sortBy: 'createdAt', direction: 'desc' },

    listProperties: ['title', 'type', 'createdAt'],
    filterProperties: ['title', 'type', 'createdAt'],
    showProperties: ['id', 'title', 'description', 'type', 'cover', 'createdAt', 'updatedAt'],
    editProperties: ['title', 'description', 'type'],

    actions: {
      new: { isAccessible: () => false },
      edit: { isAccessible: isSuperAdmin, after: makeAuditHook('EDIT', 'Group') },
      delete: { isAccessible: isSuperAdmin, after: makeAuditHook('DELETE', 'Group') },
      list: { isAccessible: isAdminOrAbove },
      show: { isAccessible: isAdminOrAbove },
      bulkDelete: { isAccessible: () => false },
    },
  },
};

// ---------------------------------------------------------------------------
// POST RESOURCE (content moderation)
// ---------------------------------------------------------------------------
const postResource: ResourceWithOptions = {
  resource: { model: getModelByName('Post'), client: prisma },
  options: {
    navigation: NAV_CONTENT,
    sort: { sortBy: 'createdAt', direction: 'desc' },

    listProperties: ['authorId', 'status', 'privacy', 'isFlagged', 'likesCount', 'createdAt'],
    filterProperties: ['authorId', 'status', 'privacy', 'isFlagged', 'createdAt'],
    showProperties: [
      'id', 'authorId', 'content', 'privacy', 'status', 'isFlagged',
      'flaggedReason', 'moderatedAt', 'moderatedBy', 'likesCount',
      'commentsCount', 'sharesCount', 'createdAt', 'updatedAt',
    ],
    editProperties: ['status', 'isFlagged', 'flaggedReason'],

    properties: {
      content: { type: 'textarea' },
      status: {
        availableValues: [
          { value: PostStatus.ACTIVE, label: 'Active' },
          { value: PostStatus.ARCHIVED, label: 'Archived' },
          { value: PostStatus.FLAGGED, label: 'Flagged' },
          { value: PostStatus.REMOVED, label: 'Removed' },
        ],
      },
    },

    actions: {
      new: { isAccessible: () => false },
      edit: { isAccessible: isAdminOrAbove, after: makeAuditHook('EDIT', 'Post') },
      delete: { isAccessible: isSuperAdmin, after: makeAuditHook('DELETE', 'Post') },
      list: { isAccessible: isAdminOrAbove },
      show: { isAccessible: isAdminOrAbove },
      bulkDelete: { isAccessible: () => false },

      // Custom: Soft delete post
      removePost: {
        actionType: 'record',
        icon: 'Trash',
        isVisible: (ctx) =>
          isAdminOrAbove(ctx) &&
          ctx.record?.param('status') !== PostStatus.REMOVED,
        isAccessible: isAdminOrAbove,
        handler: async (_req, _res, ctx) => {
          const { record } = ctx;
          if (!record) throw new Error('Record not found');

          const admin = ctx.currentAdmin as AdminCurrentUser;
          await prisma.post.update({
            where: { id: record.id() as string },
            data: {
              status: PostStatus.REMOVED,
              deletedAt: new Date(),
              moderatedAt: new Date(),
              moderatedBy: admin.id,
            },
          });

          auditLog(ctx, 'REMOVE_POST', 'Post', { postId: record.id() });

          return {
            record: record.toJSON(ctx.currentAdmin),
            notice: { message: 'Post removed.', type: 'success' },
          };
        },
      },

      // Custom: Flag post for review
      flagPost: {
        actionType: 'record',
        icon: 'Flag',
        isVisible: (ctx) =>
          isAdminOrAbove(ctx) && !ctx.record?.param('isFlagged'),
        isAccessible: isAdminOrAbove,
        handler: async (_req, _res, ctx) => {
          const { record } = ctx;
          if (!record) throw new Error('Record not found');

          await prisma.post.update({
            where: { id: record.id() as string },
            data: { isFlagged: true, status: PostStatus.FLAGGED },
          });

          auditLog(ctx, 'FLAG_POST', 'Post', { postId: record.id() });

          return {
            record: record.toJSON(ctx.currentAdmin),
            notice: { message: 'Post flagged for review.', type: 'success' },
          };
        },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// COMMENT RESOURCE
// ---------------------------------------------------------------------------
const commentResource: ResourceWithOptions = {
  resource: { model: getModelByName('Comment'), client: prisma },
  options: {
    navigation: NAV_CONTENT,
    sort: { sortBy: 'createdAt', direction: 'desc' },

    listProperties: ['postId', 'authorId', 'isFlagged', 'createdAt'],
    filterProperties: ['postId', 'authorId', 'isFlagged', 'createdAt'],
    showProperties: [
      'id', 'postId', 'authorId', 'parentId', 'content',
      'isFlagged', 'flaggedReason', 'likesCount', 'repliesCount',
      'deletedAt', 'createdAt',
    ],
    editProperties: ['isFlagged', 'flaggedReason'],

    properties: { content: { type: 'textarea' } },

    actions: {
      new: { isAccessible: () => false },
      edit: { isAccessible: isAdminOrAbove, after: makeAuditHook('EDIT', 'Comment') },
      delete: { isAccessible: isSuperAdmin, after: makeAuditHook('DELETE', 'Comment') },
      list: { isAccessible: isAdminOrAbove },
      show: { isAccessible: isAdminOrAbove },
      bulkDelete: { isAccessible: () => false },

      // Custom: Soft delete comment
      removeComment: {
        actionType: 'record',
        icon: 'Trash',
        isVisible: (ctx) => isAdminOrAbove(ctx) && !ctx.record?.param('deletedAt'),
        isAccessible: isAdminOrAbove,
        handler: async (_req, _res, ctx) => {
          const { record } = ctx;
          if (!record) throw new Error('Record not found');

          await prisma.comment.update({
            where: { id: record.id() as string },
            data: { deletedAt: new Date(), content: '[Comment removed by admin]' },
          });

          auditLog(ctx, 'REMOVE_COMMENT', 'Comment', { commentId: record.id() });

          return {
            record: record.toJSON(ctx.currentAdmin),
            notice: { message: 'Comment removed.', type: 'success' },
          };
        },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// CALL RESOURCE
// ---------------------------------------------------------------------------
const callResource: ResourceWithOptions = {
  resource: { model: getModelByName('Call'), client: prisma },
  options: {
    navigation: NAV_CALLS,
    sort: { sortBy: 'createdAt', direction: 'desc' },

    listProperties: ['initiatorId', 'type', 'status', 'startedAt', 'endedAt'],
    filterProperties: ['initiatorId', 'type', 'status', 'createdAt'],
    showProperties: [
      'id', 'initiatorId', 'groupId', 'roomId', 'type', 'status',
      'startedAt', 'endedAt', 'createdAt', 'updatedAt',
    ],
    editProperties: [],

    actions: {
      new: { isAccessible: () => false },
      edit: { isAccessible: () => false },
      delete: { isAccessible: isSuperAdmin, after: makeAuditHook('DELETE', 'Call') },
      list: { isAccessible: isAdminOrAbove },
      show: { isAccessible: isAdminOrAbove },
      bulkDelete: { isAccessible: () => false },
    },
  },
};

// ---------------------------------------------------------------------------
// NOTIFICATION RESOURCE (read-only)
// ---------------------------------------------------------------------------
const notificationResource: ResourceWithOptions = {
  resource: { model: getModelByName('Notification'), client: prisma },
  options: {
    navigation: NAV_SYSTEM,
    sort: { sortBy: 'createdAt', direction: 'desc' },

    listProperties: ['userId', 'type', 'title', 'isRead', 'createdAt'],
    filterProperties: ['userId', 'type', 'isRead', 'createdAt'],
    showProperties: ['id', 'userId', 'type', 'title', 'message', 'isRead', 'createdAt'],
    editProperties: [],

    actions: {
      new: { isAccessible: () => false },
      edit: { isAccessible: () => false },
      delete: { isAccessible: isSuperAdmin },
      list: { isAccessible: isAdminOrAbove },
      show: { isAccessible: isAdminOrAbove },
      bulkDelete: { isAccessible: () => false },
    },
  },
};

// ---------------------------------------------------------------------------
// ACTIVITY LOG RESOURCE (read-only audit trail)
// ---------------------------------------------------------------------------
const activityLogResource: ResourceWithOptions = {
  resource: { model: getModelByName('ActivityLog'), client: prisma },
  options: {
    navigation: NAV_SYSTEM,
    sort: { sortBy: 'createdAt', direction: 'desc' },

    listProperties: ['userId', 'action', 'resource', 'ipAddress', 'createdAt'],
    filterProperties: ['userId', 'action', 'resource', 'createdAt'],
    showProperties: ['id', 'userId', 'action', 'resource', 'details', 'ipAddress', 'userAgent', 'createdAt'],
    editProperties: [],

    actions: {
      new: { isAccessible: () => false },
      edit: { isAccessible: () => false },
      delete: { isAccessible: () => false },
      bulkDelete: { isAccessible: () => false },
      list: { isAccessible: isAdminOrAbove },
      show: { isAccessible: isAdminOrAbove },
    },
  },
};

// ---------------------------------------------------------------------------
// FRIEND REQUEST RESOURCE
// ---------------------------------------------------------------------------
const friendRequestResource: ResourceWithOptions = {
  resource: { model: getModelByName('FriendRequest'), client: prisma },
  options: {
    navigation: NAV_USERS,
    sort: { sortBy: 'createdAt', direction: 'desc' },

    listProperties: ['senderId', 'receiverId', 'status', 'createdAt'],
    filterProperties: ['senderId', 'receiverId', 'status', 'createdAt'],
    showProperties: ['id', 'senderId', 'receiverId', 'status', 'createdAt', 'updatedAt'],
    editProperties: [],

    actions: {
      new: { isAccessible: () => false },
      edit: { isAccessible: () => false },
      delete: { isAccessible: isSuperAdmin },
      list: { isAccessible: isAdminOrAbove },
      show: { isAccessible: isAdminOrAbove },
      bulkDelete: { isAccessible: () => false },
    },
  },
};

// ---------------------------------------------------------------------------
// Exported resources list
// ---------------------------------------------------------------------------
export const adminResources: ResourceWithOptions[] = [
  userResource,
  messageResource,
  reportResource,
  groupResource,
  postResource,
  commentResource,
  callResource,
  notificationResource,
  activityLogResource,
  friendRequestResource,
];
