import { injectable } from 'tsyringe';
import { Story, Prisma } from '@prisma/client';
import { BaseRepository } from '@infrastructure/base.repository.js';

@injectable()
export class StoryRepository extends BaseRepository {
  async create(data: Prisma.StoryCreateInput): Promise<Story> {
    return this.db.story.create({ data });
  }

  async findById(id: string): Promise<Story | null> {
    return this.db.story.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        views: {
          select: {
            viewer: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        reactions: true,
      },
    });
  }

  async findUserStories(userId: string): Promise<Story[]> {
    return this.db.story.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFriendsStories(currentUserId: string): Promise<Story[]> {
    return this.db.story.findMany({
      where: {
        user: {
          OR: [
            { followers: { some: { followerId: currentUserId } } },
            { following: { some: { followingId: currentUserId } } },
          ],
        },
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string): Promise<Story> {
    return this.db.story.delete({ where: { id } });
  }

  async addView(storyId: string, viewerId: string): Promise<void> {
    await this.db.storyView.upsert({
      where: {
        storyId_viewerId: {
          storyId,
          viewerId,
        },
      },
      update: {},
      create: {
        storyId,
        viewerId,
      },
    });
  }

  async addReaction(storyId: string, userId: string, emoji: string): Promise<void> {
    await this.db.storyReaction.create({
      data: {
        storyId,
        userId,
        emoji,
      },
    });
  }

  async removeReaction(storyId: string, userId: string, emoji: string): Promise<void> {
    await this.db.storyReaction.deleteMany({
      where: {
        storyId,
        userId,
        emoji,
      },
    });
  }

  async count(where: Prisma.StoryWhereInput): Promise<number> {
    return this.db.story.count({ where });
  }
}