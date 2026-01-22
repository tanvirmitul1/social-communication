# Profile Preview API

## Overview
Fast, cached endpoint for user profile hover popups in the feed.

## Endpoint
```
GET /api/v1/users/:id/preview
```

## Response (Cached 5 minutes)
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

## Frontend Usage

### 1. On Hover (with debounce)
```typescript
const fetchProfilePreview = async (userId: string) => {
  const res = await fetch(`/api/v1/users/${userId}/preview`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

// Debounce hover by 300ms
let hoverTimeout: NodeJS.Timeout;
onMouseEnter={(userId) => {
  hoverTimeout = setTimeout(() => {
    fetchProfilePreview(userId).then(showPopup);
  }, 300);
}}
onMouseLeave={() => clearTimeout(hoverTimeout)}
```

### 2. Popup Actions

**Send Friend Request:**
```typescript
POST /api/v1/users/friend-requests
Body: { receiverId: "uuid" }
```

**Unfriend:**
```typescript
DELETE /api/v1/users/friend-requests/:friendId
```

**Send Message:**
```typescript
// Navigate to chat or open message modal
router.push(`/messages/${userId}`);
```

## Performance
- **Cache**: 5 minutes in Redis
- **Response time**: ~10-20ms (cached)
- **Query optimization**: Single query with joins
- **No N+1 queries**: Mutual friends calculated in SQL

## Why NOT GraphQL?

✅ **REST is better here:**
- Fixed data structure (no dynamic queries needed)
- Aggressive caching works perfectly
- Simpler implementation
- Lower latency (no query parsing)
- Already have Redis infrastructure

❌ **GraphQL would add:**
- Complexity (schema, resolvers, client setup)
- Caching challenges (query variations)
- Larger bundle size
- No real benefit for fixed data

## Database Query
```sql
-- Single optimized query with all data
SELECT 
  u.id, u.username, u.avatar, u.statusMessage, u.isOnline, u.lastSeen,
  COUNT(DISTINCT followers) as followersCount,
  COUNT(DISTINCT following) as followingCount,
  EXISTS(SELECT 1 FROM FriendRequest WHERE ...) as isFriend,
  (SELECT COUNT(*) FROM mutual friends) as mutualFriendsCount
FROM User u
WHERE u.id = $1
```

## Cache Invalidation
Cache is invalidated when:
- User updates profile → Clear `profile:preview:${userId}:*`
- Friendship changes → Clear both users' preview caches
- TTL expires (5 minutes)
