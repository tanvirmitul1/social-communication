# Timeline/Feed System - Implementation Guide

## Quick Start

This guide helps you integrate the Timeline/Feed system into your existing platform.

## Prerequisites

- Existing social communication backend running
- PostgreSQL 16+
- Redis 7+
- Node.js 20+
- Docker (for development)

---

## Step 1: Database Migration

Run Prisma migrations to create new tables:

```bash
# Generate Prisma client with new schemas
pnpm prisma:generate

# Run migration (creates all timeline tables)
pnpm prisma:migrate

# Optional: Seed test data
pnpm prisma:seed
```

**Tables Created**:
- `posts`
- `post_media`
- `post_reactions`
- `comments`
- `comment_reactions`
- `saved_posts`
- `post_mentions`
- `comment_mentions`
- `post_shares`
- `feed_cache`

---

## Step 2: Verify API Endpoints

Start the development server:

```bash
# Using Docker (recommended)
pnpm docker:dev:up

# OR local development
pnpm dev
```

Test endpoints:
- **Swagger Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health
- **Test Post Creation**: `POST http://localhost:3000/api/v1/posts`

---

## Step 3: Frontend Integration

### Install Dependencies

```bash
npm install axios socket.io-client react-infinite-scroll-component
```

### Create API Client

```typescript
// src/api/timeline.ts
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const timelineAPI = {
  // Posts
  createPost: (data) => api.post('/posts', data),
  getPost: (id) => api.get(`/posts/${id}`),
  updatePost: (id, data) => api.patch(`/posts/${id}`, data),
  deletePost: (id) => api.delete(`/posts/${id}`),
  getUserPosts: (userId, params) => api.get(`/users/${userId}/posts`, { params }),
  getFeed: (params) => api.get('/posts/feed', { params }),

  // Reactions
  reactToPost: (id, type) => api.post(`/posts/${id}/react`, { type }),
  unreactToPost: (id) => api.delete(`/posts/${id}/react`),
  getPostReactions: (id, params) => api.get(`/posts/${id}/reactions`, { params }),

  // Comments
  createComment: (postId, data) => api.post(`/posts/${postId}/comments`, data),
  updateComment: (postId, id, data) => api.patch(`/posts/${postId}/comments/${id}`, data),
  deleteComment: (postId, id) => api.delete(`/posts/${postId}/comments/${id}`),
  getComments: (postId, params) => api.get(`/posts/${postId}/comments`, { params }),
  getReplies: (postId, commentId, params) =>
    api.get(`/posts/${postId}/comments/${commentId}/replies`, { params }),

  // Save/Share
  savePost: (id) => api.post(`/posts/${id}/save`),
  unsavePost: (id) => api.delete(`/posts/${id}/save`),
  getSavedPosts: (params) => api.get('/posts/saved', { params }),
  sharePost: (id, data) => api.post(`/posts/${id}/share`, data),

  // Moderation
  reportPost: (id, reason) => api.post(`/posts/${id}/report`, { reason })
};
```

### Example React Components

#### Feed Component

```typescript
// src/components/Feed.tsx
import React, { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { timelineAPI } from '../api/timeline';

export function Feed({ type = 'following' }) {
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  async function loadPosts() {
    if (loading) return;

    setLoading(true);
    try {
      const { data } = await timelineAPI.getFeed({
        type,
        cursor,
        limit: 20
      });

      setPosts(prev => cursor ? [...prev, ...data.posts] : data.posts);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, [type]);

  return (
    <div className="feed">
      <InfiniteScroll
        dataLength={posts.length}
        next={loadPosts}
        hasMore={hasMore}
        loader={<LoadingSpinner />}
        endMessage={<p>No more posts</p>}
      >
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </InfiniteScroll>
    </div>
  );
}
```

#### Post Card Component

```typescript
// src/components/PostCard.tsx
import React, { useState } from 'react';
import { timelineAPI } from '../api/timeline';

const REACTION_EMOJIS = {
  LIKE: '👍',
  LOVE: '❤️',
  HAHA: '😂',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😠'
};

export function PostCard({ post }) {
  const [localPost, setLocalPost] = useState(post);
  const [showComments, setShowComments] = useState(false);

  async function handleReaction(type) {
    const previousReaction = localPost.userReaction;

    // Optimistic update
    setLocalPost(prev => ({
      ...prev,
      userReaction: type,
      likesCount: previousReaction ? prev.likesCount : prev.likesCount + 1
    }));

    try {
      await timelineAPI.reactToPost(post.id, type);
    } catch (error) {
      // Rollback on error
      setLocalPost(prev => ({
        ...prev,
        userReaction: previousReaction,
        likesCount: prev.likesCount - 1
      }));
      console.error('Failed to react:', error);
    }
  }

  async function handleUnreact() {
    const previousReaction = localPost.userReaction;

    setLocalPost(prev => ({
      ...prev,
      userReaction: null,
      likesCount: prev.likesCount - 1
    }));

    try {
      await timelineAPI.unreactToPost(post.id);
    } catch (error) {
      setLocalPost(prev => ({
        ...prev,
        userReaction: previousReaction,
        likesCount: prev.likesCount + 1
      }));
    }
  }

  return (
    <div className="post-card">
      {/* Author */}
      <div className="post-author">
        <img src={localPost.author.avatar} alt={localPost.author.username} />
        <span>{localPost.author.username}</span>
        <span className="post-time">{formatTime(localPost.createdAt)}</span>
      </div>

      {/* Content */}
      <div className="post-content">
        <p>{localPost.content}</p>
        {localPost.editedAt && <span className="edited">(edited)</span>}
      </div>

      {/* Media */}
      {localPost.media?.map(media => (
        <img key={media.id} src={media.url} alt="Post media" />
      ))}

      {/* Stats */}
      <div className="post-stats">
        <span>{localPost.likesCount} reactions</span>
        <span>{localPost.commentsCount} comments</span>
        <span>{localPost.sharesCount} shares</span>
      </div>

      {/* Actions */}
      <div className="post-actions">
        {/* Reaction Picker */}
        <div className="reaction-picker">
          {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
            <button
              key={type}
              onClick={() => handleReaction(type)}
              className={localPost.userReaction === type ? 'active' : ''}
            >
              {emoji}
            </button>
          ))}
          {localPost.userReaction && (
            <button onClick={handleUnreact}>Remove</button>
          )}
        </div>

        <button onClick={() => setShowComments(!showComments)}>
          Comment
        </button>

        <button onClick={() => sharePost(post.id)}>
          Share
        </button>
      </div>

      {/* Comments */}
      {showComments && <CommentSection postId={post.id} />}
    </div>
  );
}
```

#### Comment Section Component

```typescript
// src/components/CommentSection.tsx
import React, { useState, useEffect } from 'react';
import { timelineAPI } from '../api/timeline';

export function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    setLoading(true);
    try {
      const { data } = await timelineAPI.getComments(postId, { limit: 20 });
      setComments(data.comments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const { data } = await timelineAPI.createComment(postId, {
        content: newComment
      });

      setComments(prev => [data, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  }

  return (
    <div className="comment-section">
      {/* Comment Input */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
        />
        <button type="submit">Post</button>
      </form>

      {/* Comments List */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="comments-list">
          {comments.map(comment => (
            <CommentCard key={comment.id} comment={comment} postId={postId} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentCard({ comment, postId }) {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);

  async function loadReplies() {
    const { data } = await timelineAPI.getReplies(postId, comment.id, { limit: 10 });
    setReplies(data.comments);
    setShowReplies(true);
  }

  return (
    <div className="comment-card">
      <div className="comment-author">
        <img src={comment.author.avatar} alt={comment.author.username} />
        <span>{comment.author.username}</span>
      </div>

      <div className="comment-content">{comment.content}</div>

      <div className="comment-actions">
        <button>Like ({comment.likesCount})</button>
        <button>Reply</button>
        {comment.repliesCount > 0 && (
          <button onClick={loadReplies}>
            {showReplies ? 'Hide' : 'View'} {comment.repliesCount} replies
          </button>
        )}
      </div>

      {/* Nested Replies */}
      {showReplies && (
        <div className="comment-replies">
          {replies.map(reply => (
            <CommentCard key={reply.id} comment={reply} postId={postId} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Step 4: Real-time Updates (Optional)

### Setup Socket.IO Client

```typescript
// src/socket/timeline.ts
import io from 'socket.io-client';

const token = localStorage.getItem('accessToken');

export const socket = io(process.env.REACT_APP_API_URL, {
  auth: { token }
});

// Listen for events
socket.on('post:created', (post) => {
  // Add to feed (if from followed user)
  console.log('New post:', post);
});

socket.on('comment:created', ({ postId, comment }) => {
  // Update comment count
  console.log('New comment on post:', postId);
});

socket.on('reaction:added', ({ postId, reaction }) => {
  // Update reaction count
  console.log('New reaction:', reaction);
});
```

### Integrate in Component

```typescript
useEffect(() => {
  socket.on('post:created', (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  });

  return () => {
    socket.off('post:created');
  };
}, []);
```

---

## Step 5: Testing

### Manual Testing

1. **Create Post**: Use Postman or Swagger UI
2. **Verify Feed**: Check if post appears in feed
3. **Add Reaction**: Click reaction button
4. **Add Comment**: Test nested comments
5. **Check Caching**: Verify Redis cache hit/miss

### Automated Testing

```typescript
// Example Jest/Vitest test
import { timelineAPI } from './api/timeline';

describe('Timeline API', () => {
  it('should create a post', async () => {
    const post = await timelineAPI.createPost({
      content: 'Test post',
      privacy: 'PUBLIC'
    });

    expect(post.data.id).toBeDefined();
    expect(post.data.content).toBe('Test post');
  });

  it('should get feed', async () => {
    const feed = await timelineAPI.getFeed({ type: 'following', limit: 20 });

    expect(feed.data.posts).toBeInstanceOf(Array);
    expect(feed.data.hasMore).toBeDefined();
  });
});
```

---

## Step 6: Production Deployment

### Environment Variables

Add to `.env.production`:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/social_comm?schema=public
REDIS_HOST=prod-redis.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Increase cache TTL for production
CACHE_TTL_POST=3600
CACHE_TTL_FEED=300
```

### Database Optimization

```sql
-- Create indexes (if not auto-created by Prisma)
CREATE INDEX CONCURRENTLY idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_feed_cache_retrieval ON feed_cache(user_id, score DESC, created_at DESC);

-- Analyze tables
ANALYZE posts;
ANALYZE comments;
ANALYZE feed_cache;
```

### Cron Jobs

Setup background jobs for:

1. **Feed Cache Cleanup** (Daily)
```bash
0 2 * * * node scripts/cleanup-feed-cache.js
```

2. **Cache Warming** (Every hour)
```bash
0 * * * * node scripts/warm-feed-cache.js
```

### Monitoring

Setup alerts for:
- Feed load time > 500ms
- Post creation time > 1s
- Redis cache hit ratio < 80%
- Database slow queries > 100ms

---

## Step 7: Performance Tuning

### Database Connection Pool

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 50
}
```

### Redis Configuration

```bash
# redis.conf
maxmemory 4gb
maxmemory-policy allkeys-lru
```

### CDN Integration

Upload media to CDN before creating post:

```typescript
async function uploadMedia(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://cdn.example.com/upload', {
    method: 'POST',
    body: formData
  });

  return response.json(); // { url, thumbnail }
}

// Then create post with CDN URL
await timelineAPI.createPost({
  content: 'Check this out!',
  media: [
    {
      type: 'IMAGE',
      url: cdnUrl,
      thumbnail: cdnThumbnail
    }
  ]
});
```

---

## Troubleshooting

### Issue: Feed not loading

**Solution**: Check Redis connection, verify `feed_cache` table has entries

```bash
# Check Redis
docker exec -it social-comm-redis redis-cli
> KEYS feed:*

# Check database
psql -d social_communication
> SELECT COUNT(*) FROM feed_cache;
```

### Issue: Slow feed queries

**Solution**: Verify indexes exist

```sql
SELECT * FROM pg_indexes WHERE tablename = 'posts';
```

### Issue: Duplicate reactions

**Solution**: Verify unique constraint exists

```sql
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'post_reactions' AND constraint_type = 'UNIQUE';
```

---

## Support

- **Swagger Docs**: http://localhost:3000/api/docs
- **Architecture**: See `ARCHITECTURE.md`
- **API Reference**: See `API_DOCUMENTATION.md`

---

## Next Steps

1. Implement notification system for reactions/comments
2. Add hashtag support
3. Implement advanced search/filtering
4. Add analytics dashboard
5. Implement content moderation ML models

---

## License

MIT
