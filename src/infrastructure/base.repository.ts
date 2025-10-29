import { prisma } from '@config/prisma.js';

export abstract class BaseRepository {
  protected db = prisma;
}
