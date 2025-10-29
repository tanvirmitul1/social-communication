import { Server, Socket } from 'socket.io';
import { container } from '@application/container.js';
import { CallService } from '@modules/call/call.service.js';
import { CONSTANTS } from '@common/constants.js';
import { logger } from '@config/logger.js';
import { Prisma } from '@prisma/client';

type CallWithParticipants = Prisma.CallGetPayload<{
  include: {
    participants: true;
  };
}>;

export class CallSocketHandler {
  private callService: CallService;

  constructor(private io: Server) {
    this.callService = container.resolve('CallService');
  }

  setupEventHandlers(socket: Socket) {
    const userId = socket.data.user.id;

    // Call initiation
    socket.on(CONSTANTS.SOCKET_EVENTS.CALL_INITIATE, async (data) => {
      try {
        const { call, roomUrl, token } = await this.callService.initiateCall({
          initiatorId: userId,
          type: data.type,
          participantIds: data.participantIds,
          groupId: data.groupId,
        });

        // Notify all participants
        data.participantIds.forEach((participantId: string) => {
          this.io.to(`user:${participantId}`).emit(CONSTANTS.SOCKET_EVENTS.CALL_RINGING, {
            call,
            initiatorId: userId,
          });
        });

        socket.emit(CONSTANTS.SOCKET_EVENTS.CALL_INITIATE, { call, roomUrl, token });
      } catch (error) {
        logger.error({ error }, 'Error initiating call');
        socket.emit(CONSTANTS.SOCKET_EVENTS.ERROR, { message: 'Failed to initiate call' });
      }
    });

    // Call answer
    socket.on(CONSTANTS.SOCKET_EVENTS.CALL_ANSWER, async (data) => {
      try {
        const { call, roomUrl, token } = await this.callService.joinCall(data.callId, userId);
        const callWithParticipants = call as CallWithParticipants;

        socket.emit(CONSTANTS.SOCKET_EVENTS.CALL_ANSWER, { call, roomUrl, token });

        // Notify initiator and other participants
        this.io
          .to(`user:${callWithParticipants.initiatorId}`)
          .emit(CONSTANTS.SOCKET_EVENTS.CALL_PARTICIPANT_JOIN, {
            callId: callWithParticipants.id,
            userId,
          });

        callWithParticipants.participants.forEach((participant) => {
          if (participant.userId !== userId) {
            this.io
              .to(`user:${participant.userId}`)
              .emit(CONSTANTS.SOCKET_EVENTS.CALL_PARTICIPANT_JOIN, {
                callId: call.id,
                userId,
              });
          }
        });
      } catch (error) {
        logger.error({ error }, 'Error answering call');
        socket.emit(CONSTANTS.SOCKET_EVENTS.ERROR, { message: 'Failed to answer call' });
      }
    });

    // Call reject
    socket.on(CONSTANTS.SOCKET_EVENTS.CALL_REJECT, async (data) => {
      try {
        const call = await this.callService.rejectCall(data.callId, userId);

        // Notify initiator
        this.io.to(`user:${call.initiatorId}`).emit(CONSTANTS.SOCKET_EVENTS.CALL_REJECT, {
          callId: call.id,
          userId,
        });
      } catch (error) {
        logger.error({ error }, 'Error rejecting call');
        socket.emit(CONSTANTS.SOCKET_EVENTS.ERROR, { message: 'Failed to reject call' });
      }
    });

    // Call end
    socket.on(CONSTANTS.SOCKET_EVENTS.CALL_END, async (data) => {
      try {
        const call = await this.callService.endCall(data.callId, userId);
        const callWithParticipants = call as CallWithParticipants;

        // Notify all participants
        callWithParticipants.participants.forEach((participant) => {
          this.io.to(`user:${participant.userId}`).emit(CONSTANTS.SOCKET_EVENTS.CALL_END, {
            callId: call.id,
          });
        });
      } catch (error) {
        logger.error({ error }, 'Error ending call');
        socket.emit(CONSTANTS.SOCKET_EVENTS.ERROR, { message: 'Failed to end call' });
      }
    });

    // Participant leave
    socket.on(CONSTANTS.SOCKET_EVENTS.CALL_PARTICIPANT_LEAVE, async (data) => {
      try {
        await this.callService.leaveCall(data.callId, userId);

        const call = await this.callService.getCallById(data.callId);

        // Notify remaining participants
        this.io
          .to(`user:${call.initiatorId}`)
          .emit(CONSTANTS.SOCKET_EVENTS.CALL_PARTICIPANT_LEAVE, {
            callId: call.id,
            userId,
          });

        call.participants.forEach((participant) => {
          if (participant.userId !== userId) {
            this.io
              .to(`user:${participant.userId}`)
              .emit(CONSTANTS.SOCKET_EVENTS.CALL_PARTICIPANT_LEAVE, {
                callId: call.id,
                userId,
              });
          }
        });
      } catch (error) {
        logger.error({ error }, 'Error leaving call');
        socket.emit(CONSTANTS.SOCKET_EVENTS.ERROR, { message: 'Failed to leave call' });
      }
    });
  }
}
