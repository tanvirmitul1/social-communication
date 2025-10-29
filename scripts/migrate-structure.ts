/**
 * Automated Project Structure Migration Script
 *
 * This script migrates the project from the current structure to a modular architecture
 *
 * Usage: tsx scripts/migrate-structure.ts
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

interface FileMapping {
  from: string;
  to: string;
  transform?: (content: string) => string;
}

// Color console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// File mappings from old structure to new structure
const fileMappings: FileMapping[] = [
  // Config files
  { from: 'app/config/env.ts', to: 'src/config/env.ts' },
  { from: 'app/config/redis.ts', to: 'src/config/redis.ts' },
  { from: 'app/config/database.ts', to: 'src/config/prisma.ts' },
  { from: 'app/config/swagger.ts', to: 'src/config/swagger.ts' },
  { from: 'app/config/container.ts', to: 'src/application/container.ts' },
  { from: 'core/logger/index.ts', to: 'src/config/logger.ts' },

  // Common files
  { from: 'core/constants/index.ts', to: 'src/common/constants.ts' },
  { from: 'core/utils/helpers.ts', to: 'src/common/utils.ts' },
  { from: 'core/utils/responseHandler.ts', to: 'src/common/response.ts' },

  // Middlewares
  { from: 'core/utils/asyncHandler.ts', to: 'src/middlewares/async-handler.ts' },
  { from: 'app/middlewares/auth.middleware.ts', to: 'src/middlewares/auth-guard.ts' },
  { from: 'app/middlewares/error.middleware.ts', to: 'src/middlewares/error-handler.ts' },
  { from: 'app/middlewares/validation.middleware.ts', to: 'src/middlewares/validation.ts' },
  { from: 'app/middlewares/rateLimit.middleware.ts', to: 'src/config/rate-limiter.ts' },

  // Infrastructure
  { from: 'app/services/CacheService.ts', to: 'src/infrastructure/cache.service.ts' },
  { from: 'app/services/JitsiService.ts', to: 'src/infrastructure/jitsi.service.ts' },
  { from: 'app/sockets/SocketManager.ts', to: 'src/infrastructure/socket.manager.ts' },
  { from: 'app/repositories/BaseRepository.ts', to: 'src/infrastructure/base.repository.ts' },

  // Auth module
  { from: 'app/controllers/AuthController.ts', to: 'src/modules/auth/auth.controller.ts' },
  { from: 'app/services/AuthService.ts', to: 'src/modules/auth/auth.service.ts' },
  { from: 'app/routes/auth.routes.ts', to: 'src/modules/auth/auth.routes.ts' },
  { from: 'core/validations/authValidation.ts', to: 'src/modules/auth/auth.validation.ts' },

  // User module
  { from: 'app/controllers/UserController.ts', to: 'src/modules/user/user.controller.ts' },
  { from: 'app/services/UserService.ts', to: 'src/modules/user/user.service.ts' },
  { from: 'app/repositories/UserRepository.ts', to: 'src/modules/user/user.repository.ts' },
  { from: 'app/routes/user.routes.ts', to: 'src/modules/user/user.routes.ts' },

  // Message module
  { from: 'app/controllers/MessageController.ts', to: 'src/modules/message/message.controller.ts' },
  { from: 'app/services/MessageService.ts', to: 'src/modules/message/message.service.ts' },
  { from: 'app/repositories/MessageRepository.ts', to: 'src/modules/message/message.repository.ts' },
  { from: 'app/routes/message.routes.ts', to: 'src/modules/message/message.routes.ts' },
  { from: 'app/sockets/ChatSocketHandler.ts', to: 'src/modules/message/message.gateway.ts' },
  { from: 'core/validations/messageValidation.ts', to: 'src/modules/message/message.validation.ts' },

  // Group module
  { from: 'app/controllers/GroupController.ts', to: 'src/modules/group/group.controller.ts' },
  { from: 'app/services/GroupService.ts', to: 'src/modules/group/group.service.ts' },
  { from: 'app/repositories/GroupRepository.ts', to: 'src/modules/group/group.repository.ts' },
  { from: 'app/routes/group.routes.ts', to: 'src/modules/group/group.routes.ts' },
  { from: 'core/validations/groupValidation.ts', to: 'src/modules/group/group.validation.ts' },

  // Call module
  { from: 'app/controllers/CallController.ts', to: 'src/modules/call/call.controller.ts' },
  { from: 'app/services/CallService.ts', to: 'src/modules/call/call.service.ts' },
  { from: 'app/repositories/CallRepository.ts', to: 'src/modules/call/call.repository.ts' },
  { from: 'app/routes/call.routes.ts', to: 'src/modules/call/call.routes.ts' },
  { from: 'app/sockets/CallSocketHandler.ts', to: 'src/modules/call/call.gateway.ts' },

  // Health module
  { from: 'app/controllers/HealthController.ts', to: 'src/modules/health/health.controller.ts' },

  // Other repositories
  { from: 'app/repositories/FriendRequestRepository.ts', to: 'src/modules/user/friend-request.repository.ts' },
];

// Import path replacements
const importReplacements: Array<[RegExp, string]> = [
  // Config
  [/@config\/database/g, '@config/prisma'],
  [/@config\/container/g, '@application/container'],

  // Common
  [/@logger\//g, '@config/logger'],
  [/from ['"]@logger['"]/g, "from '@config/logger'"],
  [/@errors\//g, '@common/errors'],
  [/from ['"]@errors['"]/g, "from '@common/errors'"],
  [/@constants\//g, '@common/constants'],
  [/from ['"]@constants['"]/g, "from '@common/constants'"],
  [/@utils\/responseHandler/g, '@common/response'],
  [/@utils\/helpers/g, '@common/utils'],
  [/@utils\/asyncHandler/g, '@middlewares/async-handler'],
  [/@utils\//g, '@common/'],
  [/from ['"]@utils['"]/g, "from '@common/utils'"],

  // Middlewares
  [/@middlewares\/auth\.middleware/g, '@middlewares/auth-guard'],
  [/@middlewares\/error\.middleware/g, '@middlewares/error-handler'],
  [/@middlewares\/validation\.middleware/g, '@middlewares/validation'],
  [/@middlewares\/rateLimit\.middleware/g, '@config/rate-limiter'],

  // Controllers -> Modules
  [/@controllers\/AuthController/g, '@modules/auth/auth.controller'],
  [/@controllers\/UserController/g, '@modules/user/user.controller'],
  [/@controllers\/MessageController/g, '@modules/message/message.controller'],
  [/@controllers\/GroupController/g, '@modules/group/group.controller'],
  [/@controllers\/CallController/g, '@modules/call/call.controller'],
  [/@controllers\/HealthController/g, '@modules/health/health.controller'],

  // Services -> Modules or Infrastructure
  [/@services\/AuthService/g, '@modules/auth/auth.service'],
  [/@services\/UserService/g, '@modules/user/user.service'],
  [/@services\/MessageService/g, '@modules/message/message.service'],
  [/@services\/GroupService/g, '@modules/group/group.service'],
  [/@services\/CallService/g, '@modules/call/call.service'],
  [/@services\/CacheService/g, '@infrastructure/cache.service'],
  [/@services\/JitsiService/g, '@infrastructure/jitsi.service'],

  // Repositories -> Modules or Infrastructure
  [/@repositories\/BaseRepository/g, '@infrastructure/base.repository'],
  [/@repositories\/UserRepository/g, '@modules/user/user.repository'],
  [/@repositories\/MessageRepository/g, '@modules/message/message.repository'],
  [/@repositories\/GroupRepository/g, '@modules/group/group.repository'],
  [/@repositories\/CallRepository/g, '@modules/call/call.repository'],
  [/@repositories\/FriendRequestRepository/g, '@modules/user/friend-request.repository'],

  // Routes -> Modules
  [/@routes\/auth\.routes/g, '@modules/auth/auth.routes'],
  [/@routes\/user\.routes/g, '@modules/user/user.routes'],
  [/@routes\/message\.routes/g, '@modules/message/message.routes'],
  [/@routes\/group\.routes/g, '@modules/group/group.routes'],
  [/@routes\/call\.routes/g, '@modules/call/call.routes'],

  // Validations -> Modules
  [/@validations\/authValidation/g, '@modules/auth/auth.validation'],
  [/@validations\/messageValidation/g, '@modules/message/message.validation'],
  [/@validations\/groupValidation/g, '@modules/group/group.validation'],
  [/from ['"]@validations['"]/g, "from '@modules/auth/auth.validation'"], // fallback

  // Sockets -> Infrastructure or Modules
  [/@sockets\/SocketManager/g, '@infrastructure/socket.manager'],
  [/@sockets\/ChatSocketHandler/g, '@modules/message/message.gateway'],
  [/@sockets\/CallSocketHandler/g, '@modules/call/call.gateway'],
  [/from ['"]@sockets['"]/g, "from '@infrastructure/socket.manager'"],
];

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyFile(from: string, to: string) {
  const sourcePath = path.join(ROOT_DIR, from);
  const destPath = path.join(ROOT_DIR, to);

  if (!(await fileExists(sourcePath))) {
    log(`⚠️  Source file not found: ${from}`, 'yellow');
    return;
  }

  await ensureDir(path.dirname(destPath));
  await fs.copyFile(sourcePath, destPath);
  log(`✓ Copied: ${from} → ${to}`, 'green');
}

function updateImports(content: string): string {
  let updated = content;

  for (const [pattern, replacement] of importReplacements) {
    updated = updated.replace(pattern, replacement);
  }

  return updated;
}

async function updateFileImports(filePath: string) {
  const fullPath = path.join(ROOT_DIR, filePath);

  if (!(await fileExists(fullPath))) {
    return;
  }

  const content = await fs.readFile(fullPath, 'utf-8');
  const updated = updateImports(content);

  if (content !== updated) {
    await fs.writeFile(fullPath, updated, 'utf-8');
    log(`✓ Updated imports in: ${filePath}`, 'blue');
  }
}

async function createErrorsFile() {
  const errorsContent = `/**
 * Common Error Classes
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}
`;

  const filePath = path.join(ROOT_DIR, 'src/common/errors.ts');
  await fs.writeFile(filePath, errorsContent, 'utf-8');
  log('✓ Created: src/common/errors.ts', 'green');
}

async function createCommonTypesFile() {
  const typesContent = `/**
 * Common TypeScript Types and Interfaces
 */

import { Request } from 'express';
import { User } from '@prisma/client';

// Extend Express Request with user
export interface AuthRequest extends Request {
  user?: User;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
`;

  const filePath = path.join(ROOT_DIR, 'src/common/types.ts');
  await fs.writeFile(filePath, typesContent, 'utf-8');
  log('✓ Created: src/common/types.ts', 'green');
}

async function main() {
  log('\n🚀 Starting Project Structure Migration\n', 'blue');

  try {
    // Step 1: Create directory structure
    log('Step 1: Creating directory structure...', 'yellow');
    const dirs = [
      'src/application',
      'src/config',
      'src/modules/auth',
      'src/modules/user',
      'src/modules/message',
      'src/modules/group',
      'src/modules/call',
      'src/modules/health',
      'src/common',
      'src/infrastructure',
      'src/middlewares',
    ];

    for (const dir of dirs) {
      await ensureDir(path.join(ROOT_DIR, dir));
    }
    log('✓ Directory structure created\n', 'green');

    // Step 2: Copy files
    log('Step 2: Copying files to new locations...', 'yellow');
    for (const mapping of fileMappings) {
      await copyFile(mapping.from, mapping.to);
    }
    log('✓ Files copied\n', 'green');

    // Step 3: Create common files
    log('Step 3: Creating common files...', 'yellow');
    await createErrorsFile();
    await createCommonTypesFile();
    log('✓ Common files created\n', 'green');

    // Step 4: Update imports in all new files
    log('Step 4: Updating import paths...', 'yellow');
    const allNewFiles = fileMappings.map(m => m.to);
    allNewFiles.push('src/common/errors.ts', 'src/common/types.ts');

    for (const file of allNewFiles) {
      await updateFileImports(file);
    }
    log('✓ Import paths updated\n', 'green');

    log('\n✅ Migration completed successfully!\n', 'green');
    log('Next steps:', 'yellow');
    log('1. Update tsconfig.json path aliases', 'reset');
    log('2. Create src/main.ts entry point', 'reset');
    log('3. Create src/application/app.ts and server.ts', 'reset');
    log('4. Run: pnpm build', 'reset');
    log('5. Fix any remaining import issues', 'reset');
    log('6. Delete old app/ and core/ directories', 'reset');
    log('7. Commit changes\n', 'reset');

  } catch (error) {
    log('\n❌ Migration failed!', 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
