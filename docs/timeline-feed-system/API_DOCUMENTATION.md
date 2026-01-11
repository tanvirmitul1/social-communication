# Timeline/Feed System API Documentation

## For Frontend Developers

This document provides complete API reference for integrating the Timeline/Feed system into your frontend application.

## Base URL

```
Production: https://api.yourdomain.com/api/v1
Development: http://localhost:3000/api/v1
```

## Authentication

All protected endpoints require a JWT access token in the `Authorization` header:

```http
Authorization: Bearer <your_access_token>
```

Get access token from `/api/v1/auth/login` or `/api/v1/auth/register`.

---

## Table of Contents

1. [Posts API](#posts-api)
2. [Comments API](#comments-api)
3. [Reactions API](#reactions-api)
4. [Feed API](#feed-api)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Pagination](#pagination)

---

## Posts API

### Create Post

Create a new post with optional media and mentions.

**Endpoint**: `POST /posts`
**Auth**: Required

**Request Body**:
```json
{
  "content": "Hello world! Check out this amazing photo 📸",
  "privacy": "PUBLIC",
  "media": [
    {
      "type": "IMAGE",
      "url": "https://cdn.example.com/image.jpg",
      "thumbnail": "https://cdn.example.com/image-thumb.jpg",
      "width": 1920,
      "height": 1080
    }
  ],
  "mentions": ["user-uuid-1", "user-uuid-2"]
}
```

**Request Fields**:
- `content` (string, required): Post text (1-10,000 chars)
- `privacy` (enum, optional): `PUBLIC` | `FRIENDS` | `PRIVATE` (default: `PUBLIC`)
- `media` (array, optional): Max 10 media items
  - `type` (enum): `IMAGE` | `VIDEO` | `LINK`
  - `url` (string): Media URL
  - `thumbnail` (string, optional): Thumbnail URL
  - `width` (number, optional): Width in pixels
  - `height` (number, optional): Height in pixels
  - `duration` (number, optional): Video duration in seconds
  - `size` (number, optional): File size in bytes
  - `metadata` (object, optional): Custom metadata
- `mentions` (array, optional): Array of user IDs (max 50)

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": "post-uuid",
    "authorId": "user-uuid",
    "content": "Hello world! Check out this amazing photo 📸",
    "privacy": "PUBLIC",
    "status": "ACTIVE",
    "likesCount": 0,
    "commentsCount": 0,
    "sharesCount": 0,
    "isFlagged": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "editedAt": null,
    "deletedAt": null
  }
}
```

**Frontend Implementation**:
```typescript
async function createPost(data: {
  content: string;
  privacy?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  media?: MediaItem[];
  mentions?: string[];
}) {
  const response = await fetch('/api/v1/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAccessToken()}`
    },
    body: JSON.stringify(data)
  });

  return response.json();
}
```

---

### Get Single Post

Retrieve a post by ID with author details, media, and reaction counts.

**Endpoint**: `GET /posts/:id`
**Auth**: Optional (required for private posts)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "post-uuid",
    "authorId": "user-uuid",
    "content": "Hello world!",
    "privacy": "PUBLIC",
    "status": "ACTIVE",
    "likesCount": 42,
    "commentsCount": 15,
    "sharesCount": 3,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "editedAt": null,
    "deletedAt": null,
    "author": {
      "id": "user-uuid",
      "username": "johndoe",
      "avatar": "https://cdn.example.com/avatar.jpg"
    },
    "media": [
      {
        "id": "media-uuid",
        "type": "IMAGE",
        "url": "https://cdn.example.com/image.jpg",
        "thumbnail": "https://cdn.example.com/thumb.jpg",
        "width": 1920,
        "height": 1080
      }
    ],
    "_count": {
      "reactions": 42,
      "comments": 15,
      "shares": 3
    },
    "userReaction": "LIKE",
    "isSaved": false
  }
}
```

**Special Fields**:
- `userReaction`: Current user's reaction type (`LIKE`, `LOVE`, etc.) or `null`
- `isSaved`: Whether current user bookmarked this post

---

### Update Post

Update post content or privacy (author only).

**Endpoint**: `PATCH /posts/:id`
**Auth**: Required (must be author)

**Request Body**:
```json
{
  "content": "Updated content here",
  "privacy": "FRIENDS"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Post updated successfully",
  "data": {
    "id": "post-uuid",
    "content": "Updated content here",
    "privacy": "FRIENDS",
    "editedAt": "2024-01-15T11:00:00Z",
    ...
  }
}
```

---

### Delete Post

Soft delete a post (author only).

**Endpoint**: `DELETE /posts/:id`
**Auth**: Required (must be author)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Post deleted successfully",
  "data": null
}
```

---

### Get User Posts

Get all posts by a specific user (respects privacy settings).

**Endpoint**: `GET /users/:userId/posts`
**Auth**: Optional (required for non-public posts)

**Query Parameters**:
- `cursor` (string, optional): Last post ID from previous page
- `limit` (number, optional): Posts per page (1-50, default: 20)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "posts": [
      { /* Post object with author, media, counts */ },
      ...
    ],
    "nextCursor": "post-uuid-20",
    "hasMore": true
  }
}
```

**Frontend Implementation (Infinite Scroll)**:
```typescript
async function loadUserPosts(userId: string, cursor?: string) {
  const params = new URLSearchParams({
    limit: '20',
    ...(cursor && { cursor })
  });

  const response = await fetch(`/api/v1/users/${userId}/posts?${params}`);
  const { data } = await response.json();

  return data; // { posts, nextCursor, hasMore }
}

// In your component:
const [posts, setPosts] = useState([]);
const [cursor, setCursor] = useState(null);

async function loadMore() {
  const data = await loadUserPosts(userId, cursor);
  setPosts(prev => [...prev, ...data.posts]);
  setCursor(data.nextCursor);
}
```

---

## Feed API

### Get Personalized Feed

Get user's personalized feed (following, discover, or trending).

**Endpoint**: `GET /posts/feed`
**Auth**: Required

**Query Parameters**:
- `type` (enum, optional): `following` | `discover` | `trending` (default: `following`)
- `cursor` (string, optional): Last post ID from previous page
- `limit` (number, optional): Posts per page (1-50, default: 20)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "posts": [
      { /* Full post object with author, media, counts, userReaction, isSaved */ },
      ...
    ],
    "nextCursor": "post-uuid-20",
    "hasMore": true
  }
}
```

**Feed Types**:
- **following**: Posts from users you follow (fast, cached)
- **discover**: Public posts from all users (explore new content)
- **trending**: Most popular posts in last 24 hours

**Frontend Implementation**:
```typescript
async function loadFeed(type: 'following' | 'discover' | 'trending', cursor?: string) {
  const params = new URLSearchParams({
    type,
    limit: '20',
    ...(cursor && { cursor })
  });

  const response = await fetch(`/api/v1/posts/feed?${params}`, {
    headers: { 'Authorization': `Bearer ${getAccessToken()}` }
  });

  return response.json();
}
```

---

## Comments API

### Create Comment

Add a comment to a post (or reply to another comment).

**Endpoint**: `POST /posts/:postId/comments`
**Auth**: Required

**Request Body**:
```json
{
  "content": "Great post! 🎉",
  "parentId": "comment-uuid-if-reply",
  "mentions": ["user-uuid-1"]
}
```

**Request Fields**:
- `content` (string, required): Comment text (1-5,000 chars)
- `parentId` (string, optional): Parent comment ID for nested replies
- `mentions` (array, optional): User IDs (max 20)

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Comment created successfully",
  "data": {
    "id": "comment-uuid",
    "postId": "post-uuid",
    "authorId": "user-uuid",
    "parentId": null,
    "content": "Great post! 🎉",
    "likesCount": 0,
    "repliesCount": 0,
    "createdAt": "2024-01-15T10:35:00Z",
    "updatedAt": "2024-01-15T10:35:00Z",
    "editedAt": null,
    "deletedAt": null
  }
}
```

---

### Get Post Comments

Get top-level comments for a post.

**Endpoint**: `GET /posts/:postId/comments`
**Auth**: Optional

**Query Parameters**:
- `cursor` (string, optional): Last comment ID
- `limit` (number, optional): 1-100, default: 20

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment-uuid",
        "postId": "post-uuid",
        "authorId": "user-uuid",
        "parentId": null,
        "content": "Great post!",
        "likesCount": 5,
        "repliesCount": 2,
        "createdAt": "2024-01-15T10:35:00Z",
        "author": {
          "id": "user-uuid",
          "username": "janedoe",
          "avatar": "https://cdn.example.com/avatar.jpg"
        },
        "_count": {
          "reactions": 5,
          "replies": 2
        },
        "userReaction": null
      },
      ...
    ],
    "nextCursor": "comment-uuid-20",
    "hasMore": true
  }
}
```

---

### Get Comment Replies

Get nested replies to a specific comment.

**Endpoint**: `GET /posts/:postId/comments/:commentId/replies`
**Auth**: Optional

**Query Parameters**: Same as Get Post Comments

**Response**: Same structure as Get Post Comments

**Frontend Implementation (Nested Comments)**:
```typescript
// Component structure:
// Post
//   ├─ Comment 1
//   │   ├─ Reply 1.1
//   │   └─ Reply 1.2
//   └─ Comment 2

async function loadReplies(postId: string, commentId: string) {
  const response = await fetch(
    `/api/v1/posts/${postId}/comments/${commentId}/replies?limit=10`
  );
  const { data } = await response.json();
  return data.comments;
}
```

---

### Update Comment

Edit comment content (author only).

**Endpoint**: `PATCH /posts/:postId/comments/:id`
**Auth**: Required (must be author)

**Request Body**:
```json
{
  "content": "Updated comment text"
}
```

---

### Delete Comment

Soft delete a comment (author only). Nested replies are also deleted.

**Endpoint**: `DELETE /posts/:postId/comments/:id`
**Auth**: Required (must be author)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Comment deleted successfully",
  "data": null
}
```

---

## Reactions API

### React to Post

Add or change reaction to a post (idempotent).

**Endpoint**: `POST /posts/:id/react`
**Auth**: Required

**Request Body**:
```json
{
  "type": "LOVE"
}
```

**Reaction Types**:
- `LIKE` 👍
- `LOVE` ❤️
- `HAHA` 😂
- `WOW` 😮
- `SAD` 😢
- `ANGRY` 😠

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Reaction added successfully",
  "data": {
    "id": "reaction-uuid",
    "postId": "post-uuid",
    "userId": "user-uuid",
    "type": "LOVE",
    "createdAt": "2024-01-15T10:40:00Z"
  }
}
```

**Idempotent Behavior**:
- Calling with same `type`: No change, returns existing reaction
- Calling with different `type`: Updates reaction type
- Like count incremented only on first reaction

---

### Remove Reaction from Post

**Endpoint**: `DELETE /posts/:id/react`
**Auth**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Reaction removed successfully",
  "data": null
}
```

---

### Get Post Reactions

Get users who reacted to a post (optionally filtered by type).

**Endpoint**: `GET /posts/:id/reactions`
**Auth**: Optional

**Query Parameters**:
- `type` (enum, optional): Filter by reaction type
- `cursor` (string, optional)
- `limit` (number, optional): 1-100, default: 50

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "reactions": [
      {
        "id": "reaction-uuid",
        "postId": "post-uuid",
        "userId": "user-uuid",
        "type": "LOVE",
        "createdAt": "2024-01-15T10:40:00Z",
        "user": {
          "id": "user-uuid",
          "username": "johndoe",
          "avatar": "https://cdn.example.com/avatar.jpg"
        }
      },
      ...
    ],
    "nextCursor": "reaction-uuid-50",
    "hasMore": true
  }
}
```

**Frontend Implementation (Reaction Picker)**:
```typescript
const reactionEmojis = {
  LIKE: '👍',
  LOVE: '❤️',
  HAHA: '😂',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😠'
};

async function reactToPost(postId: string, type: ReactionType) {
  await fetch(`/api/v1/posts/${postId}/react`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAccessToken()}`
    },
    body: JSON.stringify({ type })
  });
}

async function unreactToPost(postId: string) {
  await fetch(`/api/v1/posts/${postId}/react`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getAccessToken()}` }
  });
}
```

---

### React to Comment

Same as post reactions, but for comments.

**Endpoint**: `POST /posts/:postId/comments/:id/react`
**Auth**: Required

**Endpoint**: `DELETE /posts/:postId/comments/:id/react`
**Auth**: Required

**Endpoint**: `GET /posts/:postId/comments/:id/reactions`
**Auth**: Optional

---

## Additional Features

### Save Post (Bookmark)

**Endpoint**: `POST /posts/:id/save`
**Auth**: Required

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Post saved successfully",
  "data": {
    "id": "saved-uuid",
    "userId": "user-uuid",
    "postId": "post-uuid",
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

---

### Unsave Post

**Endpoint**: `DELETE /posts/:id/save`
**Auth**: Required

---

### Get Saved Posts

**Endpoint**: `GET /posts/saved`
**Auth**: Required

**Query Parameters**: `cursor`, `limit`

**Response**: Same structure as feed response (with posts array)

---

### Share Post

**Endpoint**: `POST /posts/:id/share`
**Auth**: Required

**Request Body**:
```json
{
  "caption": "Check this out!",
  "groupId": "group-uuid-optional"
}
```

---

### Report Post

**Endpoint**: `POST /posts/:id/report`
**Auth**: Required

**Request Body**:
```json
{
  "reason": "This post contains spam/harassment/inappropriate content (min 10 chars)"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Post reported successfully",
  "data": null
}
```

---

## Data Models

### Post Object

```typescript
interface Post {
  id: string;
  authorId: string;
  content: string;
  privacy: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  status: 'ACTIVE' | 'ARCHIVED' | 'FLAGGED' | 'REMOVED';
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isFlagged: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string;
  editedAt: string | null;
  deletedAt: string | null;

  // Relations (when included)
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
  media: MediaItem[];
  _count: {
    reactions: number;
    comments: number;
    shares: number;
  };

  // Viewer-specific fields (when authenticated)
  userReaction: ReactionType | null;
  isSaved: boolean;
}
```

### Comment Object

```typescript
interface Comment {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  likesCount: number;
  repliesCount: number;
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  deletedAt: string | null;

  // Relations
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
  _count: {
    reactions: number;
    replies: number;
  };

  // Viewer-specific
  userReaction: ReactionType | null;
}
```

---

## Error Handling

All errors follow this structure:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "errors": [ /* Validation errors */ ]
}
```

### Common Error Codes

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Invalid request data |
| 401 | UNAUTHORIZED | Missing or invalid auth token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_SERVER_ERROR | Server error |

**Frontend Error Handling**:
```typescript
async function apiCall(url: string, options: RequestInit) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    // Handle network errors, auth errors, etc.
    console.error('API Error:', error);
    throw error;
  }
}
```

---

## Pagination

### Cursor-Based Pagination

**Why Cursor over Offset?**
- Consistent results even when new posts are added
- Better performance (no OFFSET overhead)
- Scales to millions of records

**How It Works**:
1. First request: Omit `cursor` parameter
2. Response includes `nextCursor` and `hasMore`
3. Next request: Include `cursor=<nextCursor>`
4. Repeat until `hasMore = false`

**Frontend Implementation**:
```typescript
function useFeed(type: FeedType) {
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const { data } = await loadFeed(type, cursor);
      setPosts(prev => [...prev, ...data.posts]);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
    }
  }

  return { posts, loadMore, hasMore, loading };
}
```

---

## Rate Limiting

**Limits**:
- **Authenticated**: 1000 requests/hour per user
- **Unauthenticated**: 100 requests/hour per IP

**Headers** (included in response):
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1705320000
```

**Frontend Handling**:
```typescript
if (response.status === 429) {
  const resetTime = response.headers.get('X-RateLimit-Reset');
  const retryAfter = new Date(parseInt(resetTime) * 1000);
  console.log(`Rate limited. Retry after: ${retryAfter}`);
}
```

---

## WebSocket Events (Real-time Updates)

Connect to WebSocket for real-time updates:

```typescript
import io from 'socket.io-client';

const socket = io('https://api.yourdomain.com', {
  auth: { token: getAccessToken() }
});

// Listen for new posts from followed users
socket.on('post:created', (post) => {
  // Add to feed
});

// Listen for new comments on your posts
socket.on('comment:created', ({ postId, comment }) => {
  // Update comment count
});

// Listen for reactions on your posts
socket.on('reaction:added', ({ postId, reaction }) => {
  // Update reaction count
});
```

**Note**: WebSocket events are optional. Polling feed endpoint every 30-60 seconds is also acceptable.

---

## Best Practices

### 1. Optimistic UI Updates

Update UI immediately, rollback on error:

```typescript
async function likePost(postId: string) {
  // Optimistic update
  setPosts(posts.map(p =>
    p.id === postId
      ? { ...p, likesCount: p.likesCount + 1, userReaction: 'LIKE' }
      : p
  ));

  try {
    await reactToPost(postId, 'LIKE');
  } catch (error) {
    // Rollback on error
    setPosts(posts.map(p =>
      p.id === postId
        ? { ...p, likesCount: p.likesCount - 1, userReaction: null }
        : p
    ));
    toast.error('Failed to like post');
  }
}
```

### 2. Debounce Search/Filters

```typescript
import { debounce } from 'lodash';

const debouncedSearch = debounce(async (query) => {
  // Search API call
}, 300);
```

### 3. Cache Images

Use CDN URLs with cache headers, implement lazy loading.

### 4. Handle Deleted Content

```typescript
if (post.deletedAt) {
  return <div className="deleted">This post has been deleted</div>;
}
```

---

## Example: Complete Feed Component

```typescript
import React, { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

function FeedComponent() {
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  async function loadFeed() {
    const params = new URLSearchParams({
      type: 'following',
      limit: '20',
      ...(cursor && { cursor })
    });

    const response = await fetch(`/api/v1/posts/feed?${params}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    const { data } = await response.json();
    setPosts(prev => [...prev, ...data.posts]);
    setCursor(data.nextCursor);
    setHasMore(data.hasMore);
  }

  useEffect(() => {
    loadFeed();
  }, []);

  return (
    <InfiniteScroll
      dataLength={posts.length}
      next={loadFeed}
      hasMore={hasMore}
      loader={<div>Loading...</div>}
    >
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </InfiniteScroll>
  );
}
```

---

## Support

- **Swagger Docs**: http://localhost:3000/api/docs
- **API Issues**: Contact backend team
- **Feature Requests**: Submit via JIRA

---

## Changelog

- **v1.0.0** (2024-01-15): Initial release
  - Posts CRUD
  - Comments with nested replies
  - Reactions (6 types)
  - Personalized feeds (3 types)
  - Save/Share/Report features
