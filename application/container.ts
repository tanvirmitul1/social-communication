import 'reflect-metadata';
import { container } from 'tsyringe';

// Import repositories
import { UserRepository } from '@modules/user/user.repository.js';
import { MessageRepository } from '@modules/message/message.repository.js';
import { GroupRepository } from '@modules/group/group.repository.js';
import { CallRepository } from '@modules/call/call.repository.js';
import { FriendRequestRepository } from '@modules/user/friend-request.repository.js';
import { PostRepository } from '@modules/post/post.repository.js';
import { CommentRepository } from '@modules/comment/comment.repository.js';
import { AIConversationRepository } from '@modules/ai-agent/ai-conversation.repository.js';
import { AIChatMessageRepository } from '@modules/ai-agent/ai-chat-message.repository.js';
import { NotificationRepository } from '@modules/notification/notification.repository.js';
import { BlockRepository } from '@modules/user/block.repository.js';
import { UserSettingsRepository } from '@modules/user/user-settings.repository.js';

// Import services
import { AuthService } from '@modules/auth/auth.service.js';
import { UserService } from '@modules/user/user.service.js';
import { MessageService } from '@modules/message/message.service.js';
import { GroupService } from '@modules/group/group.service.js';
import { CallService } from '@modules/call/call.service.js';
import { CacheService } from '@infrastructure/cache.service.js';
import { JitsiService } from '@infrastructure/jitsi.service.js';
import { FriendRequestService } from '@modules/user/friend-request.service.js';
import { PostService } from '@modules/post/post.service.js';
import { CommentService } from '@modules/comment/comment.service.js';
import { AIAgentService } from '@modules/ai-agent/ai-agent.service.js';
import { NotificationService } from '@modules/notification/notification.service.js';
import { BlockService } from '@modules/user/block.service.js';
import { UserSettingsService } from '@modules/user/user-settings.service.js';
import { UploadService } from '@infrastructure/upload.service.js';
import { PushNotificationService } from '@infrastructure/push-notification.service.js';

// Register repositories
container.registerSingleton('UserRepository', UserRepository);
container.registerSingleton('MessageRepository', MessageRepository);
container.registerSingleton('GroupRepository', GroupRepository);
container.registerSingleton('CallRepository', CallRepository);
container.registerSingleton('FriendRequestRepository', FriendRequestRepository);
container.registerSingleton('PostRepository', PostRepository);
container.registerSingleton('CommentRepository', CommentRepository);
container.registerSingleton('AIConversationRepository', AIConversationRepository);
container.registerSingleton('AIChatMessageRepository', AIChatMessageRepository);
container.registerSingleton('NotificationRepository', NotificationRepository);
container.registerSingleton('BlockRepository', BlockRepository);
container.registerSingleton('UserSettingsRepository', UserSettingsRepository);

// Register services
container.registerSingleton('AuthService', AuthService);
container.registerSingleton('UserService', UserService);
container.registerSingleton('MessageService', MessageService);
container.registerSingleton('GroupService', GroupService);
container.registerSingleton('CallService', CallService);
container.registerSingleton('CacheService', CacheService);
container.registerSingleton('JitsiService', JitsiService);
container.registerSingleton('FriendRequestService', FriendRequestService);
container.registerSingleton('PostService', PostService);
container.registerSingleton('CommentService', CommentService);
container.registerSingleton('AIAgentService', AIAgentService);
container.registerSingleton('NotificationService', NotificationService);
container.registerSingleton('BlockService', BlockService);
container.registerSingleton('UserSettingsService', UserSettingsService);
container.registerSingleton('UploadService', UploadService);
container.registerSingleton('PushNotificationService', PushNotificationService);

export { container };