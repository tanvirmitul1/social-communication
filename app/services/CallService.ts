import { injectable, inject } from 'tsyringe';
import { Call, CallType, CallStatus } from '@prisma/client';
import { CallRepository } from '@repositories/CallRepository.js';
import { JitsiService } from './JitsiService.js';
import { CacheService } from './CacheService.js';
import { NotFoundError, ForbiddenError } from '@errors/index.js';
import { CONSTANTS } from '@constants/index.js';
import { Helpers } from '@utils/index.js';

interface InitiateCallData {
  initiatorId: string;
  type: CallType;
  participantIds: string[];
  groupId?: string;
}

@injectable()
export class CallService {
  constructor(
    @inject('CallRepository') private callRepository: CallRepository,
    @inject('JitsiService') private jitsiService: JitsiService,
    @inject('CacheService') private cacheService: CacheService
  ) {}

  async initiateCall(data: InitiateCallData): Promise<{
    call: Call;
    roomUrl: string;
    token: string;
  }> {
    // Generate room ID
    const roomId = this.jitsiService.generateRoomId();

    // Create call
    const call = await this.callRepository.create({
      initiator: { connect: { id: data.initiatorId } },
      roomId,
      type: data.type,
      status: CallStatus.RINGING,
      ...(data.groupId && { groupId: data.groupId }),
    });

    // Add participants
    for (const participantId of data.participantIds) {
      await this.callRepository.addParticipant(call.id, participantId);
    }

    // Store active call in cache
    await this.cacheService.setWithExpiry(
      CONSTANTS.REDIS_KEYS.ACTIVE_CALL(call.id),
      { status: CallStatus.RINGING, participantIds: data.participantIds },
      7200 // 2 hours
    );

    // Generate Jitsi token (initiator is moderator)
    const token = this.jitsiService.generateJitsiToken({
      userId: data.initiatorId,
      userName: 'User', // Should fetch from user service
      roomName: roomId,
      isModerator: true,
    });

    const roomUrl = this.jitsiService.getRoomUrl(roomId, token);

    return { call, roomUrl, token };
  }

  async joinCall(
    callId: string,
    userId: string
  ): Promise<{
    call: Call;
    roomUrl: string;
    token: string;
  }> {
    const call = await this.getCallById(callId);

    // Check if user is a participant
    const isParticipant = call.participants.some((p) => p.userId === userId);
    if (!isParticipant && call.initiatorId !== userId) {
      throw new ForbiddenError('You are not invited to this call');
    }

    // Update participant join time
    await this.callRepository.addParticipant(callId, userId);

    // Update call status
    if (call.status === CallStatus.RINGING) {
      await this.callRepository.updateStatus(callId, CallStatus.ONGOING);
    }

    // Generate Jitsi token
    const token = this.jitsiService.generateJitsiToken({
      userId,
      userName: 'User', // Should fetch from user service
      roomName: call.roomId,
      isModerator: call.initiatorId === userId,
    });

    const roomUrl = this.jitsiService.getRoomUrl(call.roomId, token);

    return { call, roomUrl, token };
  }

  async endCall(callId: string, userId: string): Promise<Call> {
    const call = await this.getCallById(callId);

    // Only initiator can end the call
    if (call.initiatorId !== userId) {
      throw new ForbiddenError('Only the call initiator can end the call');
    }

    const updatedCall = await this.callRepository.update(callId, {
      status: CallStatus.ENDED,
      endedAt: new Date(),
    });

    // Remove from cache
    await this.cacheService.delete(CONSTANTS.REDIS_KEYS.ACTIVE_CALL(callId));

    return updatedCall;
  }

  async leaveCall(callId: string, userId: string): Promise<void> {
    await this.callRepository.removeParticipant(callId, userId);
  }

  async rejectCall(callId: string, userId: string): Promise<Call> {
    const call = await this.getCallById(callId);

    // Check if user is a participant
    const isParticipant = call.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenError('You are not invited to this call');
    }

    return await this.callRepository.updateStatus(callId, CallStatus.REJECTED);
  }

  async getCallById(id: string): Promise<Call> {
    const call = await this.callRepository.findById(id);
    if (!call) {
      throw new NotFoundError('Call not found');
    }
    return call;
  }

  async getUserCalls(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    calls: Call[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { skip, take } = Helpers.paginate(page, limit);
    const calls = await this.callRepository.findUserCalls(userId, skip, take);
    const total = await this.callRepository.count({
      OR: [{ initiatorId: userId }, { participants: { some: { userId } } }],
    });

    return { calls, total, page, limit };
  }
}
