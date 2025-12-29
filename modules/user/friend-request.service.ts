import { injectable, inject } from 'tsyringe';
import { FriendRequest, FriendRequestStatus, User } from '@prisma/client';
import { FriendRequestRepository } from './friend-request.repository.js';
import { UserRepository } from './user.repository.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../../common/errors.js';

@injectable()
export class FriendRequestService {
  constructor(
    @inject('FriendRequestRepository') private friendRequestRepository: FriendRequestRepository,
    @inject('UserRepository') private userRepository: UserRepository
  ) {}

  /**
   * Send a friend request to another user
   */
  async sendFriendRequest(senderId: string, receiverId: string): Promise<FriendRequest> {
    // Check if users exist
    const sender = await this.userRepository.findById(senderId);
    const receiver = await this.userRepository.findById(receiverId);

    if (!sender || !receiver) {
      throw new NotFoundError('User not found');
    }

    // Cannot send friend request to yourself
    if (senderId === receiverId) {
      throw new ConflictError('Cannot send friend request to yourself');
    }

    // Check if friend request already exists
    const existingRequest = await this.friendRequestRepository.findByUsers(senderId, receiverId);
    if (existingRequest) {
      if (existingRequest.status === FriendRequestStatus.PENDING) {
        throw new ConflictError('Friend request already sent and pending');
      } else if (existingRequest.status === FriendRequestStatus.ACCEPTED) {
        throw new ConflictError('Users are already friends');
      }
    }

    // Check if reverse friend request exists (receiver sent request to sender)
    const reverseRequest = await this.friendRequestRepository.findByUsers(receiverId, senderId);
    if (reverseRequest && reverseRequest.status === FriendRequestStatus.PENDING) {
      // Auto-accept if reverse request exists
      return this.acceptFriendRequest(reverseRequest.id, receiverId);
    }

    // Create friend request
    const friendRequest = await this.friendRequestRepository.create(senderId, receiverId);

    return friendRequest;
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(requestId: string, userId: string): Promise<FriendRequest> {
    const friendRequest = await this.friendRequestRepository.findById(requestId);
    if (!friendRequest) {
      throw new NotFoundError('Friend request not found');
    }

    // Only receiver can accept the request
    if (friendRequest.receiverId !== userId) {
      throw new ForbiddenError('You are not authorized to accept this friend request');
    }

    // Check if already accepted
    if (friendRequest.status === FriendRequestStatus.ACCEPTED) {
      throw new ConflictError('Friend request already accepted');
    }

    // Update status to accepted
    const updatedRequest = await this.friendRequestRepository.updateStatus(
      requestId,
      FriendRequestStatus.ACCEPTED
    );

    // Create follow relationships (both directions)
    await this.friendRequestRepository.createFollow(friendRequest.senderId, friendRequest.receiverId);
    await this.friendRequestRepository.createFollow(friendRequest.receiverId, friendRequest.senderId);

    return updatedRequest;
  }

  /**
   * Reject a friend request
   */
  async rejectFriendRequest(requestId: string, userId: string): Promise<FriendRequest> {
    const friendRequest = await this.friendRequestRepository.findById(requestId);
    if (!friendRequest) {
      throw new NotFoundError('Friend request not found');
    }

    // Only receiver can reject the request
    if (friendRequest.receiverId !== userId) {
      throw new ForbiddenError('You are not authorized to reject this friend request');
    }

    // Check if already rejected
    if (friendRequest.status === FriendRequestStatus.REJECTED) {
      throw new ConflictError('Friend request already rejected');
    }

    // Update status to rejected
    const updatedRequest = await this.friendRequestRepository.updateStatus(
      requestId,
      FriendRequestStatus.REJECTED
    );

    return updatedRequest;
  }

  /**
   * Cancel a friend request (sender can cancel)
   */
  async cancelFriendRequest(requestId: string, userId: string): Promise<FriendRequest> {
    const friendRequest = await this.friendRequestRepository.findById(requestId);
    if (!friendRequest) {
      throw new NotFoundError('Friend request not found');
    }

    // Only sender can cancel the request
    if (friendRequest.senderId !== userId) {
      throw new ForbiddenError('You are not authorized to cancel this friend request');
    }

    // Check if already canceled or accepted
    if (friendRequest.status === FriendRequestStatus.CANCELED) {
      throw new ConflictError('Friend request already canceled');
    }

    if (friendRequest.status === FriendRequestStatus.ACCEPTED) {
      throw new ConflictError('Cannot cancel accepted friend request');
    }

    // Update status to canceled
    const updatedRequest = await this.friendRequestRepository.updateStatus(
      requestId,
      FriendRequestStatus.CANCELED
    );

    return updatedRequest;
  }

  /**
   * Get pending friend requests for a user
   */
  async getPendingFriendRequests(userId: string): Promise<FriendRequest[]> {
    return this.friendRequestRepository.findPendingRequests(userId);
  }

  /**
   * Get friends for a user
   */
  async getFriends(userId: string): Promise<User[]> {
    // Get friends from database
    const friendships = await this.friendRequestRepository.findAcceptedFriendships(userId);

    // Extract friend users (excluding the current user)
    const friends = friendships.map(fr =>
      fr.senderId === userId ? fr.receiver : fr.sender
    );

    return friends;
  }

  /**
   * Remove a friend (unfriend)
   */
  async removeFriend(userId: string, friendId: string): Promise<void> {
    // Find accepted friend request
    const friendRequest = await this.friendRequestRepository.findAcceptedFriendshipBetweenUsers(userId, friendId);

    if (!friendRequest) {
      throw new ConflictError('Users are not friends');
    }

    // Delete the friend request
    await this.friendRequestRepository.delete(friendRequest.id);

    // Remove follow relationships
    try {
      await this.friendRequestRepository.deleteFollow(userId, friendId);
    } catch (_error) {
      // Ignore if follow relationship doesn't exist
    }

    try {
      await this.friendRequestRepository.deleteFollow(friendId, userId);
    } catch (_error) {
      // Ignore if follow relationship doesn't exist
    }
  }
}