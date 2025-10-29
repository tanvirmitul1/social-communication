import { injectable } from 'tsyringe';
import { Group, GroupMember, Prisma, GroupMemberRole } from '@prisma/client';
import { BaseRepository } from '@infrastructure/base.repository.js';

@injectable()
export class GroupRepository extends BaseRepository {
  async create(data: Prisma.GroupCreateInput): Promise<Group> {
    return this.db.group.create({
      data,
    });
  }

  async findById(id: string): Promise<Group | null> {
    return this.db.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                isOnline: true,
              },
            },
          },
        },
      },
    });
  }

  async findUserGroups(userId: string, skip: number, take: number): Promise<Group[]> {
    return this.db.group.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
      skip,
      take,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async update(id: string, data: Prisma.GroupUpdateInput): Promise<Group> {
    return this.db.group.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Group> {
    return this.db.group.delete({
      where: { id },
    });
  }

  async addMember(
    groupId: string,
    userId: string,
    role: GroupMemberRole = GroupMemberRole.MEMBER
  ): Promise<GroupMember> {
    return this.db.groupMember.create({
      data: {
        groupId,
        userId,
        role,
      },
    });
  }

  async removeMember(groupId: string, userId: string): Promise<GroupMember> {
    return this.db.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });
  }

  async updateMemberRole(
    groupId: string,
    userId: string,
    role: GroupMemberRole
  ): Promise<GroupMember> {
    return this.db.groupMember.update({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      data: { role },
    });
  }

  async getMember(groupId: string, userId: string): Promise<GroupMember | null> {
    return this.db.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });
  }

  async count(where?: Prisma.GroupWhereInput): Promise<number> {
    return this.db.group.count({ where });
  }
}
