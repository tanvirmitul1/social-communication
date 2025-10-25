import 'reflect-metadata';
import { container } from 'tsyringe';

// Import repositories
import { UserRepository } from '@repositories/UserRepository.js';
import { MessageRepository } from '@repositories/MessageRepository.js';
import { GroupRepository } from '@repositories/GroupRepository.js';
import { CallRepository } from '@repositories/CallRepository.js';
import { FriendRequestRepository } from '@repositories/FriendRequestRepository.js';

// Import services
import { AuthService } from '@services/AuthService.js';
import { UserService } from '@services/UserService.js';
import { MessageService } from '@services/MessageService.js';
import { GroupService } from '@services/GroupService.js';
import { CallService } from '@services/CallService.js';
import { CacheService } from '@services/CacheService.js';
import { JitsiService } from '@services/JitsiService.js';

// Register repositories
container.registerSingleton('UserRepository', UserRepository);
container.registerSingleton('MessageRepository', MessageRepository);
container.registerSingleton('GroupRepository', GroupRepository);
container.registerSingleton('CallRepository', CallRepository);
container.registerSingleton('FriendRequestRepository', FriendRequestRepository);

// Register services
container.registerSingleton('AuthService', AuthService);
container.registerSingleton('UserService', UserService);
container.registerSingleton('MessageService', MessageService);
container.registerSingleton('GroupService', GroupService);
container.registerSingleton('CallService', CallService);
container.registerSingleton('CacheService', CacheService);
container.registerSingleton('JitsiService', JitsiService);

export { container };
