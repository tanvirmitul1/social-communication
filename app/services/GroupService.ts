import { injectable, inject } from 'tsyringe';
import { Group, GroupType, GroupMemberRole } from '@prisma/client';
import { GroupRepository } from '@repositories/GroupRepository.js';
import { NotFoundError, ForbiddenError } from '@errors/index.js';
import { Helpers } from '@utils/index.js';

interface CreateGroupData {
  title: string;
  description?: string;
  cover?: string;
  type?: GroupType;
  creatorId: string;
}

@injectable()
export class GroupService {
  constructor(@inject('GroupRepository') private groupRepository: GroupRepository) {}

  async createGroup(data: CreateGroupData): Promise<Group> {
    // Create group
    const group = await this.groupRepository.create({
      title: data.title,
      description: data.description,
      cover: data.cover,
      type: data.type || GroupType.PRIVATE,
    });

    // Add creator as owner
    await this.groupRepository.addMember(group.id, data.creatorId, GroupMemberRole.OWNER);

    return await this.getGroupById(group.id);
  }

  async getGroupById(id: string): Promise<Group> {
    const group = await this.groupRepository.findById(id);
    if (!group) {
      throw new NotFoundError('Group not found');
    }
    return group;
  }

  async getUserGroups(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    groups: Group[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { skip, take } = Helpers.paginate(page, limit);
    const groups = await this.groupRepository.findUserGroups(userId, skip, take);
    const total = await this.groupRepository.count({
      members: {
        some: {
          userId,
        },
      },
    });

    return { groups, total, page, limit };
  }

  async updateGroup(groupId: string, userId: string, data: Partial<Group>): Promise<Group> {
    await this.checkGroupPermission(groupId, userId, [
      GroupMemberRole.OWNER,
      GroupMemberRole.ADMIN,
    ]);

    return await this.groupRepository.update(groupId, data);
  }

  async deleteGroup(groupId: string, userId: string): Promise<Group> {
    await this.checkGroupPermission(groupId, userId, [GroupMemberRole.OWNER]);

    return await this.groupRepository.delete(groupId);
  }

  async addMember(
    groupId: string,
    userId: string,
    targetUserId: string,
    role: GroupMemberRole = GroupMemberRole.MEMBER
  ): Promise<void> {
    await this.checkGroupPermission(groupId, userId, [
      GroupMemberRole.OWNER,
      GroupMemberRole.ADMIN,
    ]);

    await this.groupRepository.addMember(groupId, targetUserId, role);
  }

  async removeMember(groupId: string, userId: string, targetUserId: string): Promise<void> {
    await this.checkGroupPermission(groupId, userId, [
      GroupMemberRole.OWNER,
      GroupMemberRole.ADMIN,
    ]);

    // Owner cannot be removed
    const targetMember = await this.groupRepository.getMember(groupId, targetUserId);
    if (targetMember?.role === GroupMemberRole.OWNER) {
      throw new ForbiddenError('Cannot remove group owner');
    }

    await this.groupRepository.removeMember(groupId, targetUserId);
  }

  async updateMemberRole(
    groupId: string,
    userId: string,
    targetUserId: string,
    role: GroupMemberRole
  ): Promise<void> {
    await this.checkGroupPermission(groupId, userId, [GroupMemberRole.OWNER]);

    await this.groupRepository.updateMemberRole(groupId, targetUserId, role);
  }

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const member = await this.groupRepository.getMember(groupId, userId);

    if (member?.role === GroupMemberRole.OWNER) {
      throw new ForbiddenError('Owner cannot leave the group. Transfer ownership first.');
    }

    await this.groupRepository.removeMember(groupId, userId);
  }

  private async checkGroupPermission(
    groupId: string,
    userId: string,
    allowedRoles: GroupMemberRole[]
  ): Promise<void> {
    const member = await this.groupRepository.getMember(groupId, userId);

    if (!member) {
      throw new ForbiddenError('You are not a member of this group');
    }

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
  }
}
