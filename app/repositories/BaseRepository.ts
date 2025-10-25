import { prisma } from '@config/database.js';

export abstract class BaseRepository {
  protected db = prisma;
}
