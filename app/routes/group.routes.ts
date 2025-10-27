import { Router } from 'express';
import { container } from '@config/container.js';
import { GroupController } from '@controllers/GroupController.js';
import { authenticate } from '@middlewares/auth.middleware.js';
import { validate } from '@middlewares/validation.middleware.js';
import { createGroupSchema, updateGroupSchema, addGroupMemberSchema } from '@validations/index.js';

const router: Router = Router();
const groupController = container.resolve(GroupController);

router.use(authenticate);

router.post('/', validate(createGroupSchema), groupController.createGroup);
router.get('/', groupController.getUserGroups);
router.get('/:id', groupController.getGroup);
router.patch('/:id', validate(updateGroupSchema), groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);
router.post('/:id/members', validate(addGroupMemberSchema), groupController.addMember);
router.delete('/:id/members/:userId', groupController.removeMember);
router.post('/:id/leave', groupController.leaveGroup);

export { router as groupRoutes };
