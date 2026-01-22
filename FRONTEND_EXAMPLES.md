# Frontend Integration Examples

## React Component Example

### ProfilePreviewPopup.tsx
```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProfilePreview {
  id: string;
  username: string;
  avatar: string;
  statusMessage: string;
  isOnline: boolean;
  followersCount: number;
  followingCount: number;
  isFriend: boolean;
  hasPendingRequest: boolean;
  hasSentRequest: boolean;
  mutualFriendsCount: number;
}

interface Props {
  userId: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export const ProfilePreviewPopup = ({ userId, position, onClose }: Props) => {
  const [preview, setPreview] = useState<ProfilePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPreview();
  }, [userId]);

  const fetchPreview = async () => {
    try {
      const res = await fetch(`/api/v1/users/${userId}/preview`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setPreview(data.data);
    } catch (error) {
      console.error('Failed to fetch preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    await fetch('/api/v1/users/friend-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ receiverId: userId })
    });
    fetchPreview(); // Refresh
  };

  const unfriend = async () => {
    await fetch(`/api/v1/users/friend-requests/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    fetchPreview(); // Refresh
  };

  const sendMessage = () => {
    navigate(`/messages/${userId}`);
    onClose();
  };

  if (loading) {
    return (
      <div className="popup" style={{ top: position.y, left: position.x }}>
        Loading...
      </div>
    );
  }

  if (!preview) return null;

  return (
    <div className="popup" style={{ top: position.y, left: position.x }}>
      <div className="popup-header">
        <img src={preview.avatar} alt={preview.username} />
        <div>
          <h3>{preview.username}</h3>
          <span className={preview.isOnline ? 'online' : 'offline'}>
            {preview.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <p className="status">{preview.statusMessage}</p>

      <div className="stats">
        <div>
          <strong>{preview.followersCount}</strong>
          <span>Followers</span>
        </div>
        <div>
          <strong>{preview.followingCount}</strong>
          <span>Following</span>
        </div>
        <div>
          <strong>{preview.mutualFriendsCount}</strong>
          <span>Mutual</span>
        </div>
      </div>

      <div className="actions">
        {preview.isFriend ? (
          <>
            <button onClick={sendMessage} className="primary">Message</button>
            <button onClick={unfriend} className="secondary">Unfriend</button>
          </>
        ) : preview.hasPendingRequest ? (
          <>
            <button onClick={() => {/* Accept logic */}} className="primary">Accept</button>
            <button onClick={() => {/* Reject logic */}} className="secondary">Reject</button>
          </>
        ) : preview.hasSentRequest ? (
          <button disabled className="disabled">Request Sent</button>
        ) : (
          <>
            <button onClick={sendFriendRequest} className="primary">Add Friend</button>
            <button onClick={sendMessage} className="secondary">Message</button>
          </>
        )}
      </div>
    </div>
  );
};
```

### UserAvatar.tsx (with hover)
```typescript
import { useState, useRef } from 'react';
import { ProfilePreviewPopup } from './ProfilePreviewPopup';

interface Props {
  userId: string;
  username: string;
  avatar: string;
}

export const UserAvatar = ({ userId, username, avatar }: Props) => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const hoverTimeout = useRef<NodeJS.Timeout>();

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupPosition({
      x: rect.right + 10,
      y: rect.top
    });

    // Debounce by 300ms
    hoverTimeout.current = setTimeout(() => {
      setShowPopup(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    // Delay closing to allow moving to popup
    setTimeout(() => setShowPopup(false), 200);
  };

  return (
    <>
      <div
        className="user-avatar"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img src={avatar} alt={username} />
        <span>{username}</span>
      </div>

      {showPopup && (
        <ProfilePreviewPopup
          userId={userId}
          position={popupPosition}
          onClose={() => setShowPopup(false)}
        />
      )}
    </>
  );
};
```

### FeedPost.tsx (usage)
```typescript
import { UserAvatar } from './UserAvatar';

export const FeedPost = ({ post }) => {
  return (
    <div className="feed-post">
      <div className="post-header">
        <UserAvatar
          userId={post.author.id}
          username={post.author.username}
          avatar={post.author.avatar}
        />
        <span className="timestamp">{post.createdAt}</span>
      </div>

      <div className="post-content">
        {post.content}
      </div>

      {/* Rest of post */}
    </div>
  );
};
```

---

## CSS Styling

```css
.popup {
  position: fixed;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 20px;
  z-index: 1000;
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.popup-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.popup-header img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.popup-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.online {
  color: #10b981;
  font-size: 12px;
}

.offline {
  color: #6b7280;
  font-size: 12px;
}

.status {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 16px;
}

.stats {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
}

.stats div {
  text-align: center;
}

.stats strong {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.stats span {
  font-size: 12px;
  color: #6b7280;
}

.actions {
  display: flex;
  gap: 8px;
}

.actions button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.actions button.primary {
  background: #3b82f6;
  color: white;
}

.actions button.primary:hover {
  background: #2563eb;
}

.actions button.secondary {
  background: #f3f4f6;
  color: #374151;
}

.actions button.secondary:hover {
  background: #e5e7eb;
}

.actions button.disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.user-avatar {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-avatar:hover {
  background: #f3f4f6;
}

.user-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}
```

---

## Vue.js Example

```vue
<template>
  <div>
    <div
      class="user-avatar"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <img :src="avatar" :alt="username" />
      <span>{{ username }}</span>
    </div>

    <div
      v-if="showPopup && preview"
      class="popup"
      :style="{ top: popupPosition.y + 'px', left: popupPosition.x + 'px' }"
    >
      <div class="popup-header">
        <img :src="preview.avatar" :alt="preview.username" />
        <div>
          <h3>{{ preview.username }}</h3>
          <span :class="preview.isOnline ? 'online' : 'offline'">
            {{ preview.isOnline ? 'Online' : 'Offline' }}
          </span>
        </div>
      </div>

      <p class="status">{{ preview.statusMessage }}</p>

      <div class="stats">
        <div>
          <strong>{{ preview.followersCount }}</strong>
          <span>Followers</span>
        </div>
        <div>
          <strong>{{ preview.followingCount }}</strong>
          <span>Following</span>
        </div>
        <div>
          <strong>{{ preview.mutualFriendsCount }}</strong>
          <span>Mutual</span>
        </div>
      </div>

      <div class="actions">
        <template v-if="preview.isFriend">
          <button @click="sendMessage" class="primary">Message</button>
          <button @click="unfriend" class="secondary">Unfriend</button>
        </template>
        <template v-else-if="preview.hasPendingRequest">
          <button @click="acceptRequest" class="primary">Accept</button>
          <button @click="rejectRequest" class="secondary">Reject</button>
        </template>
        <template v-else-if="preview.hasSentRequest">
          <button disabled class="disabled">Request Sent</button>
        </template>
        <template v-else>
          <button @click="sendFriendRequest" class="primary">Add Friend</button>
          <button @click="sendMessage" class="secondary">Message</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  userId: string;
  username: string;
  avatar: string;
}>();

const router = useRouter();
const showPopup = ref(false);
const preview = ref(null);
const popupPosition = ref({ x: 0, y: 0 });
let hoverTimeout: NodeJS.Timeout;

const handleMouseEnter = (e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  popupPosition.value = {
    x: rect.right + 10,
    y: rect.top
  };

  hoverTimeout = setTimeout(async () => {
    const res = await fetch(`/api/v1/users/${props.userId}/preview`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    preview.value = data.data;
    showPopup.value = true;
  }, 300);
};

const handleMouseLeave = () => {
  clearTimeout(hoverTimeout);
  setTimeout(() => {
    showPopup.value = false;
  }, 200);
};

const sendFriendRequest = async () => {
  await fetch('/api/v1/users/friend-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ receiverId: props.userId })
  });
  // Refresh preview
};

const sendMessage = () => {
  router.push(`/messages/${props.userId}`);
};
</script>
```

---

## API Client (Axios)

```typescript
// api/users.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});

export const userApi = {
  getProfilePreview: (userId: string) =>
    api.get(`/users/${userId}/preview`),

  sendFriendRequest: (receiverId: string) =>
    api.post('/users/friend-requests', { receiverId }),

  acceptFriendRequest: (requestId: string) =>
    api.post(`/users/friend-requests/${requestId}/accept`),

  rejectFriendRequest: (requestId: string) =>
    api.post(`/users/friend-requests/${requestId}/reject`),

  unfriend: (friendId: string) =>
    api.delete(`/users/friend-requests/${friendId}`),

  sendMessage: (receiverId: string, content: string) =>
    api.post('/messages', { receiverId, content })
};
```

---

## React Query Hook

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from './api/users';

export const useProfilePreview = (userId: string) => {
  return useQuery({
    queryKey: ['profilePreview', userId],
    queryFn: () => userApi.getProfilePreview(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes (matches backend cache)
  });
};

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (receiverId: string) => userApi.sendFriendRequest(receiverId),
    onSuccess: (_, receiverId) => {
      // Invalidate preview cache
      queryClient.invalidateQueries(['profilePreview', receiverId]);
    },
  });
};

export const useUnfriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendId: string) => userApi.unfriend(friendId),
    onSuccess: (_, friendId) => {
      queryClient.invalidateQueries(['profilePreview', friendId]);
    },
  });
};
```

---

## Testing

```typescript
// ProfilePreviewPopup.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfilePreviewPopup } from './ProfilePreviewPopup';

describe('ProfilePreviewPopup', () => {
  it('shows friend actions when users are friends', async () => {
    // Mock API response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          data: {
            id: '1',
            username: 'john',
            isFriend: true,
            hasPendingRequest: false,
            hasSentRequest: false,
          }
        })
      })
    );

    render(<ProfilePreviewPopup userId="1" position={{ x: 0, y: 0 }} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Message')).toBeInTheDocument();
      expect(screen.getByText('Unfriend')).toBeInTheDocument();
    });
  });

  it('shows add friend button when not friends', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          data: {
            id: '1',
            username: 'john',
            isFriend: false,
            hasPendingRequest: false,
            hasSentRequest: false,
          }
        })
      })
    );

    render(<ProfilePreviewPopup userId="1" position={{ x: 0, y: 0 }} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Add Friend')).toBeInTheDocument();
    });
  });
});
```

---

## Performance Tips

1. **Debounce hover**: Wait 300ms before fetching
2. **Cache responses**: Use React Query or SWR
3. **Prefetch on mount**: Load common users in background
4. **Lazy load popup**: Code-split the component
5. **Optimize images**: Use WebP format for avatars

```typescript
// Prefetch common users
useEffect(() => {
  const commonUserIds = ['user1', 'user2', 'user3'];
  commonUserIds.forEach(id => {
    queryClient.prefetchQuery(['profilePreview', id], () =>
      userApi.getProfilePreview(id)
    );
  });
}, []);
```
