import { injectable } from 'tsyringe';
import jwt from 'jsonwebtoken';
import { config } from '@config/env.js';
import { nanoid } from 'nanoid';

interface JitsiTokenPayload {
  context: {
    user: {
      id: string;
      name: string;
      avatar?: string;
      email?: string;
    };
  };
  room: string;
  moderator?: boolean;
}

interface JitsiRoomConfig {
  userId: string;
  userName: string;
  userAvatar?: string;
  userEmail?: string;
  roomName: string;
  isModerator?: boolean;
}

@injectable()
export class JitsiService {
  generateRoomId(): string {
    return `${config.JITSI_ROOM_PREFIX}${nanoid(12)}`;
  }

  generateJitsiToken(roomConfig: JitsiRoomConfig): string {
    if (!config.JITSI_APP_SECRET || !config.JITSI_APP_ID) {
      throw new Error('Jitsi credentials not configured');
    }

    const payload: JitsiTokenPayload = {
      context: {
        user: {
          id: roomConfig.userId,
          name: roomConfig.userName,
          avatar: roomConfig.userAvatar,
          email: roomConfig.userEmail,
        },
      },
      room: roomConfig.roomName,
      moderator: roomConfig.isModerator || false,
    };

    const token = jwt.sign(payload, config.JITSI_APP_SECRET, {
      algorithm: 'HS256',
      issuer: config.JITSI_APP_ID,
      audience: config.JITSI_APP_ID,
      subject: config.JITSI_DOMAIN,
      expiresIn: '2h',
    });

    return token;
  }

  getRoomUrl(roomId: string, token: string): string {
    return `https://${config.JITSI_DOMAIN}/${roomId}?jwt=${token}`;
  }

  validateRoomId(roomId: string): boolean {
    return roomId.startsWith(config.JITSI_ROOM_PREFIX);
  }
}
