import { injectable, inject } from 'tsyringe';
import { UserSettings } from '@prisma/client';
import { UserSettingsRepository } from './user-settings.repository.js';
import { CacheService } from '@infrastructure/cache.service.js';
import { CONSTANTS } from '@common/constants.js';

export type UpdateSettingsData = Partial<
  Pick<
    UserSettings,
    | 'notifyMessages'
    | 'notifyMentions'
    | 'notifyReactions'
    | 'notifyFriendRequests'
    | 'notifyCalls'
    | 'showOnlineStatus'
    | 'allowFriendRequests'
    | 'theme'
    | 'language'
  >
>;

@injectable()
export class UserSettingsService {
  constructor(
    @inject('UserSettingsRepository') private settingsRepository: UserSettingsRepository,
    @inject('CacheService') private cacheService: CacheService
  ) {}

  async getSettings(userId: string): Promise<UserSettings> {
    const cacheKey = CONSTANTS.REDIS_KEYS.USER_SETTINGS(userId);
    const cached = await this.cacheService.get<UserSettings>(cacheKey);
    if (cached) return cached;

    const settings = await this.settingsRepository.findOrCreate(userId);
    await this.cacheService.setWithExpiry(cacheKey, settings, CONSTANTS.CACHE_TTL.USER_SETTINGS);
    return settings;
  }

  async updateSettings(userId: string, data: UpdateSettingsData): Promise<UserSettings> {
    const settings = await this.settingsRepository.upsert(userId, data);
    await this.cacheService.delete(CONSTANTS.REDIS_KEYS.USER_SETTINGS(userId));
    return settings;
  }

  /**
   * Quick check used by NotificationService to decide whether to send a
   * specific type of notification to a user.
   */
  async shouldNotify(
    userId: string,
    type: 'messages' | 'mentions' | 'reactions' | 'friendRequests' | 'calls'
  ): Promise<boolean> {
    const settings = await this.getSettings(userId);
    const map: Record<string, boolean> = {
      messages: settings.notifyMessages,
      mentions: settings.notifyMentions,
      reactions: settings.notifyReactions,
      friendRequests: settings.notifyFriendRequests,
      calls: settings.notifyCalls,
    };
    return map[type] ?? true;
  }
}
