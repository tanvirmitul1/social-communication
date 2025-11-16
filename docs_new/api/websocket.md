# WebSocket Events

Complete documentation for all WebSocket events in the Social Communication Platform.

## Connection

### Client Connection

To connect to the WebSocket server, use the Socket.IO client:

```javascript
import io from 'socket.io-client';

// Connect with authentication token
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-access-token',
  },
});

// Or connect with headers
const socket = io('http://localhost:3000', {
  extraHeaders: {
    authorization: 'Bearer your-jwt-access-token',
  },
});
```

### Connection Events

#### connect

Emitted when successfully connected to the server.

```javascript
socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);
});
```

#### disconnect

Emitted when disconnected from the server.

```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected from server. Reason:', reason);
});
```

#### error

Emitted when an error occurs during the connection.

```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error.message);
});
```

**Payload**:
```json
{
  "message": "Error description"
}
```

## Message Events

### message:send

Send a message via WebSocket.

**Direction**: Client → Server

**Emit**:
```javascript
socket.emit('message:send', {
  content: 'Hello!',
  type: 'TEXT',
  receiverId: 'user-uuid',  // For direct messages
  groupId: 'group-uuid',    // For group messages
  parentId: 'message-uuid', // For replies
  metadata: {}              // Optional metadata
});
```

**Fields**:
- `content` (string, required): Message content (1-5000 characters)
- `type` (string, optional, default: "TEXT"): Message type (TEXT, IMAGE, FILE, VOICE, VIDEO)
- `receiverId` (string, optional): Target user ID for direct messages
- `groupId` (string, optional): Target group ID for group messages
- `parentId` (string, optional): Parent message ID for threaded replies
- `metadata` (object, optional): Additional metadata

### message:sent

Confirmation that your message was sent (direct messages only).

**Direction**: Server → Client

**Listen**:
```javascript
socket.on('message:sent', (message) => {
  console.log('Message sent:', message);
  // Update UI to show message as sent
});
```

**Payload**:
```json
{
  "id": "uuid",
  "senderId": "uuid",
  "receiverId": "uuid",
  "content": "Hello!",
  "type": "TEXT",
  "status": "SENT",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

### message:received

Receive a new message.

**Direction**: Server → Client

**Listen**:
```javascript
socket.on('message:received', (message) => {
  console.log('New message received:', message);
  // Add message to chat UI
});
```

**Payload**:
```json
{
  "id": "uuid",
  "senderId": "uuid",
  "receiverId": "uuid",
  "groupId": "uuid",
  "content": "Hello!",
  "type": "TEXT",
  "status": "DELIVERED",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

### message:edit

Edit a message.

**Direction**: Both (Client ↔ Server)

**Emit to edit**:
```javascript
socket.emit('message:edit', {
  messageId: 'message-uuid',
  content: 'Updated content',
});
```

**Listen for edits**:
```javascript
socket.on('message:edit', (message) => {
  console.log('Message edited:', message);
  // Update message in UI
});
```

**Payload**:
```json
{
  "id": "uuid",
  "content": "Updated content",
  "editedAt": "2025-01-01T00:00:00.000Z"
}
```

### message:delete

Delete a message.

**Direction**: Both (Client ↔ Server)

**Emit to delete**:
```javascript
socket.emit('message:delete', {
  messageId: 'message-uuid',
});
```

**Listen for deletions**:
```javascript
socket.on('message:delete', (data) => {
  console.log('Message deleted:', data.messageId);
  // Remove message from UI
});
```

**Payload**:
```json
{
  "messageId": "uuid"
}
```

### typing:start

Indicate that user is typing.

**Direction**: Both (Client ↔ Server)

**Emit to start typing**:
```javascript
socket.emit('typing:start', {
  receiverId: 'user-uuid', // For direct messages
  groupId: 'group-uuid',   // For group chats
});
```

**Listen for typing indicators**:
```javascript
socket.on('typing:start', (data) => {
  console.log(`${data.userId} is typing...`);
  // Show typing indicator in UI
});
```

**Payload**:
```json
{
  "userId": "uuid",
  "receiverId": "uuid",
  "groupId": "uuid"
}
```

### typing:stop

Indicate that user stopped typing.

**Direction**: Both (Client ↔ Server)

**Emit to stop typing**:
```javascript
socket.emit('typing:stop', {
  receiverId: 'user-uuid', // For direct messages
  groupId: 'group-uuid',   // For group chats
});
```

**Listen for typing stop**:
```javascript
socket.on('typing:stop', (data) => {
  console.log(`${data.userId} stopped typing`);
  // Hide typing indicator in UI
});
```

**Payload**:
```json
{
  "userId": "uuid",
  "receiverId": "uuid",
  "groupId": "uuid"
}
```

## Call Events

### call:initiate

Initiate a call via WebSocket.

**Direction**: Client → Server

**Emit**:
```javascript
socket.emit('call:initiate', {
  type: 'VIDEO',
  participantIds: ['user-uuid-1', 'user-uuid-2'],
  groupId: 'group-uuid', // Optional, for group calls
});
```

**Listen for confirmation** (initiator receives):
```javascript
socket.on('call:initiate', (data) => {
  console.log('Call initiated:', data.call);
  console.log('Join URL:', data.roomUrl);
  console.log('Token:', data.token);
  // Show call UI with Jitsi integration
});
```

**Payload**:
```json
{
  "call": {
    "id": "uuid",
    "initiatorId": "uuid",
    "roomId": "jitsi-room-id",
    "type": "VIDEO",
    "status": "RINGING",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "roomUrl": "https://meet.jitsi.com/room-name",
  "token": "jwt-token-for-jitsi"
}
```

### call:ringing

Receive incoming call notification.

**Direction**: Server → Client

**Listen**:
```javascript
socket.on('call:ringing', (data) => {
  console.log('Incoming call from:', data.initiatorId);
  console.log('Call details:', data.call);
  // Show incoming call notification UI
});
```

**Payload**:
```json
{
  "call": {
    "id": "uuid",
    "initiatorId": "uuid",
    "type": "VIDEO",
    "status": "RINGING"
  },
  "initiatorId": "uuid"
}
```

### call:answer

Answer an incoming call.

**Direction**: Client → Server

**Emit**:
```javascript
socket.emit('call:answer', {
  callId: 'call-uuid',
});
```

**Listen for call details** (receive Jitsi credentials):
```javascript
socket.on('call:answer', (data) => {
  console.log('Call answered:', data.call);
  console.log('Join URL:', data.roomUrl);
  console.log('Token:', data.token);
  // Join Jitsi meeting
});
```

**Payload**:
```json
{
  "call": {
    "id": "uuid",
    "roomId": "jitsi-room-id",
    "status": "ONGOING"
  },
  "roomUrl": "https://meet.jitsi.com/room-name",
  "token": "jwt-token-for-jitsi"
}
```

### call:participant:join

Notification when a participant joins the call.

**Direction**: Server → Client

**Listen**:
```javascript
socket.on('call:participant:join', (data) => {
  console.log('User joined call:', data.userId);
  // Update call UI to show new participant
});
```

**Payload**:
```json
{
  "callId": "uuid",
  "userId": "uuid"
}
```

### call:reject

Reject an incoming call.

**Direction**: Client → Server

**Emit**:
```javascript
socket.emit('call:reject', {
  callId: 'call-uuid',
});
```

**Listen for rejection notification** (initiator receives):
```javascript
socket.on('call:reject', (data) => {
  console.log('Call rejected by:', data.userId);
  // Update UI to show call was rejected
});
```

**Payload**:
```json
{
  "callId": "uuid",
  "userId": "uuid"
}
```

### call:end

End a call.

**Direction**: Client → Server

**Emit**:
```javascript
socket.emit('call:end', {
  callId: 'call-uuid',
});
```

**Listen for end notification** (all participants receive):
```javascript
socket.on('call:end', (data) => {
  console.log('Call ended:', data.callId);
  // Close call UI
});
```

**Payload**:
```json
{
  "callId": "uuid"
}
```

### call:participant:leave

Leave a call.

**Direction**: Client → Server

**Emit**:
```javascript
socket.emit('call:participant:leave', {
  callId: 'call-uuid',
});
```

**Listen for leave notification** (remaining participants receive):
```javascript
socket.on('call:participant:leave', (data) => {
  console.log('User left call:', data.userId);
  // Update call UI to remove participant
});
```

**Payload**:
```json
{
  "callId": "uuid",
  "userId": "uuid"
}
```

## Presence Events

### user:online

User came online.

**Direction**: Server → Client

**Listen**:
```javascript
socket.on('user:online', (data) => {
  console.log('User is now online:', data.userId);
  // Update user status in UI
});
```

**Payload**:
```json
{
  "userId": "uuid"
}
```

### user:offline

User went offline.

**Direction**: Server → Client

**Listen**:
```javascript
socket.on('user:offline', (data) => {
  console.log('User is now offline:', data.userId);
  // Update user status in UI
});
```

**Payload**:
```json
{
  "userId": "uuid"
}
```

## Room Management

Users are automatically subscribed to rooms:

- **Personal room**: `user:{userId}` - For direct messages and personal notifications
- **Group rooms**: `group:{groupId}` - For group messages (must join explicitly)

### Joining Group Rooms

When a user joins a group, they should join the group's WebSocket room:

```javascript
// Join a group room
socket.emit('room:join', {
  roomId: `group:${groupId}`
});

// Leave a group room
socket.emit('room:leave', {
  roomId: `group:${groupId}`
});
```

### Room Events

#### room:join

Join a room.

**Direction**: Client → Server

**Emit**:
```javascript
socket.emit('room:join', {
  roomId: 'group:uuid'
});
```

#### room:leave

Leave a room.

**Direction**: Client → Server

**Emit**:
```javascript
socket.emit('room:leave', {
  roomId: 'group:uuid'
});
```

## Error Handling

WebSocket errors are emitted through the `error` event:

```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  
  // Handle specific error types
  switch (error.code) {
    case 'UNAUTHORIZED':
      // Redirect to login
      break;
    case 'VALIDATION_ERROR':
      // Show validation error
      break;
    default:
      // Show generic error
      break;
  }
});
```

## Best Practices

### 1. Connection Management

```javascript
// Handle reconnection
socket.on('connect', () => {
  console.log('Reconnected to server');
  // Resubscribe to rooms if needed
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // Handle disconnection gracefully
});
```

### 2. Message Acknowledgements

```javascript
// Send message with acknowledgement
socket.emit('message:send', messageData, (response) => {
  if (response.success) {
    console.log('Message sent successfully');
  } else {
    console.error('Failed to send message:', response.message);
  }
});
```

### 3. Error Handling

```javascript
// Global error handler
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  
  // Show user-friendly error message
  showNotification(`Connection error: ${error.message}`, 'error');
});
```

### 4. Resource Cleanup

```javascript
// Clean up listeners when component unmounts
useEffect(() => {
  const handleNewMessage = (message) => {
    // Handle message
  };
  
  socket.on('message:received', handleNewMessage);
  
  // Cleanup function
  return () => {
    socket.off('message:received', handleNewMessage);
  };
}, []);
```

## Implementation Example

```javascript
import io from 'socket.io-client';

class WebSocketManager {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    this.socket = io('http://localhost:3000', {
      auth: { token },
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Message events
    this.socket.on('message:received', this.handleNewMessage.bind(this));
    this.socket.on('message:edit', this.handleMessageEdit.bind(this));
    this.socket.on('message:delete', this.handleMessageDelete.bind(this));

    // Call events
    this.socket.on('call:ringing', this.handleIncomingCall.bind(this));
    this.socket.on('call:participant:join', this.handleParticipantJoin.bind(this));
    this.socket.on('call:participant:leave', this.handleParticipantLeave.bind(this));
    this.socket.on('call:end', this.handleCallEnd.bind(this));

    // Presence events
    this.socket.on('user:online', this.handleUserOnline.bind(this));
    this.socket.on('user:offline', this.handleUserOffline.bind(this));
  }

  // Message methods
  sendMessage(messageData) {
    this.socket.emit('message:send', messageData);
  }

  editMessage(messageId, content) {
    this.socket.emit('message:edit', { messageId, content });
  }

  deleteMessage(messageId) {
    this.socket.emit('message:delete', { messageId });
  }

  startTyping(target) {
    this.socket.emit('typing:start', target);
  }

  stopTyping(target) {
    this.socket.emit('typing:stop', target);
  }

  // Call methods
  initiateCall(callData) {
    this.socket.emit('call:initiate', callData);
  }

  answerCall(callId) {
    this.socket.emit('call:answer', { callId });
  }

  rejectCall(callId) {
    this.socket.emit('call:reject', { callId });
  }

  endCall(callId) {
    this.socket.emit('call:end', { callId });
  }

  leaveCall(callId) {
    this.socket.emit('call:participant:leave', { callId });
  }

  // Room methods
  joinRoom(roomId) {
    this.socket.emit('room:join', { roomId });
  }

  leaveRoom(roomId) {
    this.socket.emit('room:leave', { roomId });
  }

  // Event handlers
  handleNewMessage(message) {
    // Notify listeners
    this.notifyListeners('message:received', message);
  }

  handleMessageEdit(message) {
    this.notifyListeners('message:edit', message);
  }

  handleMessageDelete(data) {
    this.notifyListeners('message:delete', data);
  }

  handleIncomingCall(data) {
    this.notifyListeners('call:ringing', data);
  }

  handleParticipantJoin(data) {
    this.notifyListeners('call:participant:join', data);
  }

  handleParticipantLeave(data) {
    this.notifyListeners('call:participant:leave', data);
  }

  handleCallEnd(data) {
    this.notifyListeners('call:end', data);
  }

  handleUserOnline(data) {
    this.notifyListeners('user:online', data);
  }

  handleUserOffline(data) {
    this.notifyListeners('user:offline', data);
  }

  // Listener management
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default WebSocketManager;
```