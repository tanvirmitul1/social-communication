import 'reflect-metadata';
import { container } from 'tsyringe';

// Import repositories
import { UserRepository } from '@modules/user/user.repository.js';
import { MessageRepository } from '@modules/message/message.repository.js';
import { GroupRepository } from '@modules/group/group.repository.js';
import { CallRepository } from '@modules/call/call.repository.js';
import { FriendRequestRepository } from '@modules/user/friend-request.repository.js';

// Import services
import { AuthService } from '@modules/auth/auth.service.js';
import { UserService } from '@modules/user/user.service.js';
import { MessageService } from '@modules/message/message.service.js';
import { GroupService } from '@modules/group/group.service.js';
import { CallService } from '@modules/call/call.service.js';
import { CacheService } from '@infrastructure/cache.service.js';
import { JitsiService } from '@infrastructure/jitsi.service.js';
import { FriendRequestService } from '@modules/user/friend-request.service.js';

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
container.registerSingleton('FriendRequestService', FriendRequestService);

export { container };