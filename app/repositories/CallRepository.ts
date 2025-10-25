import { injectable } from 'tsyringe';
import { Call, CallParticipant, Prisma, CallStatus } from '@prisma/client';
import { BaseRepository } from './BaseRepository.js';

@injectable()
export class CallRepository extends BaseRepository {
  async create(data: Prisma.CallCreateInput): Promise<Call> {
    return this.db.call.create({
      data,
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<Call | null> {
    return this.db.call.findUnique({
      where: { id },
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        participants: {
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
    });
  }

  async findByRoomId(roomId: string): Promise<Call | null> {
    return this.db.call.findUnique({
      where: { roomId },
      include: {
        initiator: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.CallUpdateInput): Promise<Call> {
    return this.db.call.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: CallStatus): Promise<Call> {
    return this.db.call.update({
      where: { id },
      data: { status },
    });
  }

  async addParticipant(callId: string, userId: string): Promise<CallParticipant> {
    return this.db.callParticipant.create({
      data: {
        callId,
        userId,
        joinedAt: new Date(),
      },
    });
  }

  async removeParticipant(callId: string, userId: string): Promise<CallParticipant> {
    return this.db.callParticipant.update({
      where: {
        callId_userId: {
          callId,
          userId,
        },
      },
      data: {
        leftAt: new Date(),
      },
    });
  }

  async findUserCalls(userId: string, skip: number, take: number): Promise<Call[]> {
    return this.db.call.findMany({
      where: {
        OR: [
          { initiatorId: userId },
          {
            participants: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        participants: {
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
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async count(where?: Prisma.CallWhereInput): Promise<number> {
    return this.db.call.count({ where });
  }
}
