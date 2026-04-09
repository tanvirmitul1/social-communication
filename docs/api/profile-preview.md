# Profile Preview API

Fast, cached endpoint powering user profile hover popups in the feed.

---

## Endpoint

```
GET /api/v1/users/:id/preview
Authorization: Bearer <token>
```

## Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "john_doe",
    "avatar": "https://...",
    "statusMessage": "Hey there!",
    "isOnline": true,
    "lastSeen": "2024-01-01T00:00:00Z",
    "followersCount": 150,
    "followingCount": 200,
    "isFriend": false,
    "hasPendingRequest": false,
    "hasSentRequest": true,
    "mutualFriendsCount": 5
  }
}
```

**Cache:** 5-minute Redis cache per viewer+target pair. Response time: ~10-20ms cached, ~50-100ms uncached.

---

## Frontend Integration

### Fetch on hover (debounced)

```typescript
const fetchProfilePreview = async (userId: string) => {
  const res = await fetch(`/api/v1/users/${userId}/preview`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

// Debounce by 300ms to avoid unnecessary requests
let hoverTimeout: NodeJS.Timeout;

onMouseEnter={(userId) => {
  hoverTimeout = setTimeout(() => {
    fetchProfilePreview(userId).then(setPreview);
  }, 300);
}}
onMouseLeave={() => {
  clearTimeout(hoverTimeout);
  setPreview(null);
}}
```

### Popup button logic

```typescript
const { isFriend, hasPendingRequest, hasSentRequest } = preview;

if (isFriend) {
  // [Message] [Unfriend]
} else if (hasPendingRequest) {
  // [Accept] [Reject]
} else if (hasSentRequest) {
  // [Request Sent] (disabled)
} else {
  // [Add Friend] [Message]
}
```

### Action endpoints

| Action | Request |
| --- | --- |
| Send friend request | `POST /api/v1/users/friend-requests` `{ receiverId }` |
| Accept request | `POST /api/v1/users/friend-requests/:id/accept` |
| Reject request | `POST /api/v1/users/friend-requests/:id/reject` |
| Unfriend | `DELETE /api/v1/users/friend-requests/:friendId` |
| Message | Navigate to `/messages/:userId` |

---

## Implementation Notes

**Cache key:** `profile:preview:${targetUserId}:${viewerId}`

**Cache invalidation:** On profile update or friendship change, clear both users' preview caches.

**Single optimized SQL query** — no N+1 issues, mutual friends calculated in SQL:

```sql
SELECT
  u.id, u.username, u.avatar, u.statusMessage, u.isOnline, u.lastSeen,
  COUNT(DISTINCT followers) as followersCount,
  COUNT(DISTINCT following) as followingCount,
  EXISTS(
    SELECT 1 FROM FriendRequest
    WHERE (senderId = $viewerId AND receiverId = $targetUserId)
       OR (senderId = $targetUserId AND receiverId = $viewerId)
    AND status = 'ACCEPTED'
  ) as isFriend,
  (
    SELECT COUNT(DISTINCT f2.followingId)
    FROM Follow f1 INNER JOIN Follow f2 ON f1.followingId = f2.followerId
    WHERE f1.followerId = $viewerId AND f2.followingId = $targetUserId
  ) as mutualFriendsCount
FROM User u WHERE u.id = $targetUserId
```

**Files:** `user.repository.ts` (`getProfilePreview`), `user.service.ts` (caching), `user.controller.ts`, `user.routes.ts`.
