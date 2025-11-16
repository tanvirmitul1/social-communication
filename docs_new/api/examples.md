# API Usage Examples

Complete examples for using the Social Communication API with different programming languages and frameworks.

## Authentication Examples

### Register New User

**cURL**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**JavaScript (Fetch)**:
```javascript
async function registerUser() {
  try {
    const response = await fetch('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'john_doe',
        email: 'john@example.com',
        password: 'SecurePass123'
      }),
    });

    const data = await response.json();
    console.log('Registration result:', data);
    return data;
  } catch (error) {
    console.error('Registration failed:', error);
  }
}
```

**JavaScript (Axios)**:
```javascript
import axios from 'axios';

async function registerUser() {
  try {
    const response = await axios.post('http://localhost:3000/api/v1/auth/register', {
      username: 'john_doe',
      email: 'john@example.com',
      password: 'SecurePass123'
    });

    console.log('Registration result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error.response?.data || error.message);
  }
}
```

### Login

**cURL**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**JavaScript (Fetch)**:
```javascript
async function loginUser() {
  try {
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'john@example.com',
        password: 'SecurePass123'
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      // Store tokens securely
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      console.log('Login successful');
    }
    
    return data;
  } catch (error) {
    console.error('Login failed:', error);
  }
}
```

### Refresh Token

**cURL**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'
```

**JavaScript (Fetch)**:
```javascript
async function refreshToken() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    const response = await fetch('http://localhost:3000/api/v1/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: refreshToken
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      // Update tokens
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      console.log('Token refreshed');
    }
    
    return data;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Redirect to login
    window.location.href = '/login';
  }
}
```

## User Management Examples

### Get User Profile

**cURL**:
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer your-access-token"
```

**JavaScript (Fetch)**:
```javascript
async function getUserProfile() {
  try {
    const accessToken = localStorage.getItem('accessToken');
    
    const response = await fetch('http://localhost:3000/api/v1/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    console.log('User profile:', data);
    return data;
  } catch (error) {
    console.error('Failed to get profile:', error);
  }
}
```

### Update User Profile

**cURL**:
```bash
curl -X PATCH http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "statusMessage": "Busy coding!",
    "avatar": "https://example.com/avatar.jpg"
  }'
```

**JavaScript (Fetch)**:
```javascript
async function updateUserProfile(updates) {
  try {
    const accessToken = localStorage.getItem('accessToken');
    
    const response = await fetch('http://localhost:3000/api/v1/users/me', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    console.log('Profile updated:', data);
    return data;
  } catch (error) {
    console.error('Failed to update profile:', error);
  }
}

// Usage
updateUserProfile({
  statusMessage: 'Busy coding!',
  avatar: 'https://example.com/avatar.jpg'
});
```

### Search Users

**cURL**:
```bash
curl -X GET "http://localhost:3000/api/v1/users?query=john&page=1&limit=20" \
  -H "Authorization: Bearer your-access-token"
```

**JavaScript (Fetch)**:
```javascript
async function searchUsers(query, page = 1, limit = 20) {
  try {
    const accessToken = localStorage.getItem('accessToken');
    
    const response = await fetch(
      `http://localhost:3000/api/v1/users?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();
    console.log('Search results:', data);
    return data;
  } catch (error) {
    console.error('Search failed:', error);
  }
}

// Usage
searchUsers('john', 1, 20);
```

## Messaging Examples

### Send Direct Message

**cURL**:
```bash
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello! How are you?",
    "type": "TEXT",
    "receiverId": "recipient-user-id"
  }'
```

**JavaScript (Fetch)**:
```javascript
async function sendDirectMessage(content, receiverId) {
  try {
    const accessToken = localStorage.getItem('accessToken');
    
    const response = await fetch('http://localhost:3000/api/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content,
        type: 'TEXT',
        receiverId: receiverId
      }),
    });

    const data = await response.json();
    console.log('Message sent:', data);
    return data;
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}

// Usage
sendDirectMessage('Hello! How are you?', 'recipient-user-id');
```

### Send Group Message

**cURL**:
```bash
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello team!",
    "type": "TEXT",
    "groupId": "group-uuid"
  }'
```

**JavaScript (Fetch)**:
```javascript
async function sendGroupMessage(content, groupId) {
  try {
    const accessToken = localStorage.getItem('accessToken');
    
    const response = await fetch('http://localhost:3000/api/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content,
        type: 'TEXT',
        groupId: groupId
      }),
    });

    const data = await response.json();
    console.log('Group message sent:', data);
    return data;
  } catch (error) {
    console.error('Failed to send group message:', error);
  }
}

// Usage
sendGroupMessage('Hello team!', 'group-uuid');
```

### Get Direct Messages

**cURL**:
```bash
curl -X GET "http://localhost:3000/api/v1/messages/direct/other-user-id?page=1&limit=20" \
  -H "Authorization: Bearer your-access-token"
```

**JavaScript (Fetch)**:
```javascript
async function getDirectMessages(otherUserId, page = 1, limit = 20) {
  try {
    const accessToken = localStorage.getItem('accessToken');
    
    const response = await fetch(
      `http://localhost:3000/api/v1/messages/direct/${otherUserId}?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();
    console.log('Direct messages:', data);
    return data;
  } catch (error) {
    console.error('Failed to get direct messages:', error);
  }
}

// Usage
getDirectMessages('other-user-id', 1, 20);
```

### Edit Message

**cURL**:
```bash
curl -X PATCH http://localhost:3000/api/v1/messages/message-id \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated message content"
  }'
```

**JavaScript (Fetch)**:
```javascript
async function editMessage(messageId, newContent) {
  try {
    const accessToken = localStorage.getItem('accessToken');
    
    const response = await fetch(`http://localhost:3000/api/v1/messages/${messageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: newContent
      }),
    });

    const data = await response.json();
    console.log('Message edited:', data);
    return data;
  } catch (error) {
    console.error('Failed to edit message:', error);
  }
}

// Usage
editMessage('message-id', 'Updated message content');
```

### Delete Message

**cURL**:
```bash
curl -X DELETE http://localhost:3000/api/v1/messages/message-id \
  -H "Authorization: Bearer your-access-token"
```

**JavaScript (Fetch)**:
```javascript
async function deleteMessage(messageId) {
  try {
    const accessToken = localStorage.getItem('accessToken');
    
    const response = await fetch(`http://localhost:3000/api/v1/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    console.log('Message deleted:', data);
    return data;
  } catch (error) {
    console.error('Failed to delete message:', error);
  }
}

// Usage
deleteMessage('message-id');
```

## Group Management Examples

### Create Group

**cURL**:
```bash
curl -X POST http://localhost:3000/api/v1/groups \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Development Team",
    "description": "Team communication channel",
    "type": "PRIVATE"
  }'
```

**JavaScript (Fetch)**:
```javascript
async function createGroup(title, description, type) {
  try {
    const accessToken = localStorage.getItem('accessToken');
    
    const response = await fetch('http://localhost:3000/api/v1/groups', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        description: description,
        type: type
      }),
    });

    const data = await response.json();
    console.log('Group created:', data);
    return data;
  } catch (error) {
    console.error('Failed to create group:', error);
  }
}

// Usage
createGroup('Development Team', 'Team communication channel', 'PRIVATE');
```

### Add Group Member

**cURL**:
```bash
curl -X POST http://localhost:3000/api/v1/groups/group-id/members \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "role": "MEMBER"
  }'
```

**JavaScript (Fetch)**:
```javascript
async function addGroupMember(groupId, userId, role) {
  try {
    const accessToken = localStorage.getItem('accessToken');
    
    const response = await fetch(`http://localhost:3000/api/v1/groups/${groupId}/members`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        role: role
      }),
    });

    const data = await response.json();
    console.log('Member added:', data);
    return data;
  } catch (error) {
    console.error('Failed to add member:', error);
  }
}

// Usage
addGroupMember('group-id', 'user-uuid', 'MEMBER');
```

### Leave Group

**cURL**:
```bash
curl -X POST http://localhost:3000/api/v1/groups/group-id/leave \
  -H "Authorization: Bearer your-access-token"
```

**JavaScript (Fetch)**:
```javascript
async function leaveGroup(groupId) {
  try {
    const accessToken = localStorage.getItem('accessToken');
    
    const response = await fetch(`http://localhost:3000/api/v1/groups/${groupId}/leave`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    console.log('Left group:', data);
    return data;
  } catch (error) {
    console.error('Failed to leave group:', error);
  }
}

// Usage
leaveGroup('group-id');
```

## Call Examples

### Initiate Call

**cURL**:
```bash
curl -X POST http://localhost:3000/api/v1/calls \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "VIDEO",
    "participantIds": ["user-id-1", "user-id-2"]
  }'
```

**JavaScript (Fetch)**:
```javascript
async function initiateCall(type, participantIds) {
  try {
    const accessToken = localStorage.getItem('accessToken');
    
    const response = await fetch('http://localhost:3000/api/v1/calls', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: type,
        participantIds: participantIds
      }),
    });

    const data = await response.json();
    console.log('Call initiated:', data);
    return data;
  } catch (error) {
    console.error('Failed to initiate call:', error);
  }
}

// Usage
initiateCall('VIDEO', ['user-id-1', 'user-id-2']);
```

### Join Call

**cURL**:
```bash
curl -X POST http://localhost:3000/api/v1/calls/call-id/join \
  -H "Authorization: Bearer your-access-token"
```

**JavaScript (Fetch)**:
```javascript
async function joinCall(callId) {
  try {
    const accessToken = localStorage.getItem('accessToken');
    
    const response = await fetch(`http://localhost:3000/api/v1/calls/${callId}/join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    console.log('Joined call:', data);
    return data;
  } catch (error) {
    console.error('Failed to join call:', error);
  }
}

// Usage
joinCall('call-id');
```

## WebSocket Examples

### Connect to WebSocket

**JavaScript (Socket.IO)**:
```javascript
import io from 'socket.io-client';

class ChatClient {
  constructor() {
    this.socket = null;
    this.accessToken = localStorage.getItem('accessToken');
  }

  connect() {
    this.socket = io('http://localhost:3000', {
      auth: {
        token: this.accessToken,
      },
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('message:received', (message) => {
      console.log('New message:', message);
      this.handleNewMessage(message);
    });

    this.socket.on('call:ringing', (data) => {
      console.log('Incoming call:', data);
      this.handleIncomingCall(data);
    });
  }

  sendMessage(content, receiverId) {
    this.socket.emit('message:send', {
      content: content,
      type: 'TEXT',
      receiverId: receiverId,
    });
  }

  startTyping(receiverId) {
    this.socket.emit('typing:start', {
      receiverId: receiverId,
    });
  }

  stopTyping(receiverId) {
    this.socket.emit('typing:stop', {
      receiverId: receiverId,
    });
  }

  handleNewMessage(message) {
    // Update UI with new message
    console.log('Displaying new message:', message);
  }

  handleIncomingCall(data) {
    // Show incoming call notification
    console.log('Showing incoming call:', data);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Usage
const chatClient = new ChatClient();
chatClient.connect();

// Send a message
chatClient.sendMessage('Hello!', 'recipient-id');

// Indicate typing
chatClient.startTyping('recipient-id');

// Stop typing indicator
setTimeout(() => {
  chatClient.stopTyping('recipient-id');
}, 2000);
```

## Complete Integration Example (React)

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

const SocialCommunicationApp = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [user, setUser] = useState(null);

  // Initialize connection
  useEffect(() => {
    const initConnection = async () => {
      // Get user profile
      const userProfile = await getUserProfile();
      setUser(userProfile.data);

      // Connect to WebSocket
      const newSocket = io('http://localhost:3000', {
        auth: { token: localStorage.getItem('accessToken') }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
      });

      newSocket.on('message:received', (message) => {
        setMessages(prev => [...prev, message]);
      });

      newSocket.on('typing:start', (data) => {
        setTypingUsers(prev => [...prev, data.userId]);
      });

      newSocket.on('typing:stop', (data) => {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      });

      setSocket(newSocket);

      // Load initial messages
      loadMessages();
    };

    initConnection();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const getUserProfile = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to get profile:', error);
      return null;
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/messages/direct/some-user-id?page=1&limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await response.json();
      setMessages(data.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = useCallback(() => {
    if (newMessage.trim() && socket) {
      socket.emit('message:send', {
        content: newMessage,
        receiverId: 'recipient-id',
        type: 'TEXT'
      });
      setNewMessage('');
    }
  }, [newMessage, socket]);

  const handleTyping = useCallback(() => {
    if (socket) {
      socket.emit('typing:start', { receiverId: 'recipient-id' });
      
      // Stop typing after 1 second of inactivity
      const typingTimeout = setTimeout(() => {
        socket.emit('typing:stop', { receiverId: 'recipient-id' });
      }, 1000);

      return () => clearTimeout(typingTimeout);
    }
  }, [socket]);

  return (
    <div className="chat-app">
      <div className="chat-header">
        <h2>Social Communication</h2>
        {user && <span>Welcome, {user.username}!</span>}
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className="message">
            <strong>{msg.senderId}:</strong> {msg.content}
          </div>
        ))}
        
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.join(', ')} is typing...
          </div>
        )}
      </div>

      <div className="message-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default SocialCommunicationApp;
```

## Error Handling Examples

### JavaScript Error Handling

```javascript
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new APIError(data.message, response.status, data.code);
      }

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError(
        'Network error occurred',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  async login(email, password) {
    try {
      const data = await this.request('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Store tokens
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);

      return data;
    } catch (error) {
      console.error('Login failed:', error.message);
      throw error;
    }
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      const data = await this.request('/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      // Update tokens
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);

      return data;
    } catch (error) {
      console.error('Token refresh failed:', error.message);
      // Clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      throw error;
    }
  }
}

class APIError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

// Usage
const apiClient = new APIClient('http://localhost:3000');

apiClient.login('user@example.com', 'password')
  .then(data => console.log('Login successful:', data))
  .catch(error => {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        alert('Please check your input');
        break;
      case 'UNAUTHORIZED':
        alert('Invalid credentials');
        break;
      default:
        alert('Login failed. Please try again.');
    }
  });
```

These examples provide a comprehensive guide for implementing the Social Communication API in various scenarios and programming languages.