import { injectable } from 'tsyringe';
import { FriendRequest, Prisma, FriendRequestStatus } from '@prisma/client';
import { BaseRepository } from './BaseRepository.js';

@injectable()
export class FriendRequestRepository extends BaseRepository {
  async create(senderId: string, receiverId: string): Promise<FriendRequest> {
    return this.db.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: FriendRequestStatus.PENDING,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<FriendRequest | null> {
    return this.db.friendRequest.findUnique({
      where: { id },
      include: {
        sender: true,
        receiver: true,
      },
    });
  }

  async findByUsers(senderId: string, receiverId: string): Promise<FriendRequest | null> {
    return this.db.friendRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId,
          receiverId,
        },
      },
    });
  }

  async updateStatus(id: string, status: FriendRequestStatus): Promise<FriendRequest> {
    return this.db.friendRequest.update({
      where: { id },
      data: { status },
    });
  }

  async findPendingRequests(userId: string): Promise<FriendRequest[]> {
    return this.db.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: FriendRequestStatus.PENDING,
      },
      include: {
        sender: {
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

  async delete(id: string): Promise<FriendRequest> {
    return this.db.friendRequest.delete({
      where: { id },
    });
  }

  async createFollow(followerId: string, followingId: string) {
    return this.db.follow.create({
      data: {
        followerId,
        followingId,
      },
    });
  }

  async deleteFollow(followerId: string, followingId: string) {
    return this.db.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }

  async getFollowers(userId: string, skip: number, take: number) {
    return this.db.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isOnline: true,
          },
        },
      },
      skip,
      take,
    });
  }

  async getFollowing(userId: string, skip: number, take: number) {
    return this.db.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isOnline: true,
          },
        },
      },
      skip,
      take,
    });
  }
}
