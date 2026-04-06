import { injectable } from 'tsyringe';
import { UserSettings, Prisma } from '@prisma/client';
import { BaseRepository } from '@infrastructure/base.repository.js';

@injectable()
export class UserSettingsRepository extends BaseRepository {
  /** Returns existing settings or creates defaults on first access. */
  async findOrCreate(userId: string): Promise<UserSettings> {
    const existing = await this.db.userSettings.findUnique({ where: { userId } });
    if (existing) return existing;

    return this.db.userSettings.create({ data: { userId } });
  }

  async findByUserId(userId: string): Promise<UserSettings | null> {
    return this.db.userSettings.findUnique({ where: { userId } });
  }

  async upsert(userId: string, data: Prisma.UserSettingsUpdateInput): Promise<UserSettings> {
    return this.db.userSettings.upsert({
      where: { userId },
      create: { userId, ...data } as unknown as Prisma.UserSettingsUncheckedCreateInput,
      update: data,
    });
  }
}
