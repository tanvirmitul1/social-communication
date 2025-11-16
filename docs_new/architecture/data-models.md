# Data Models

Complete documentation of the database schema and data models for the Social Communication Platform.

## Database Schema Overview

The platform uses PostgreSQL as the primary database with Prisma ORM for type-safe database access. The schema consists of 16 core models that represent users, messages, groups, calls, and related entities.

### Entity Relationship Diagram

```
┌─────────────┐        ┌─────────────┐
│    User     │◄───────┤   Device    │
└─────────────┘        └─────────────┘
      │                      │
      │                ┌─────┴─────┐
      ▼                ▼           ▼
┌─────────────┐  ┌─────────────┐ ┌─────────────┐
│RefreshToken │  │FriendRequest│ │   Follow    │
└─────────────┘  └─────────────┘ └─────────────┘
      │
      ▼
┌─────────────┐        ┌─────────────┐
│   Group     │◄───────┤GroupMember  │
└─────────────┘        └─────────────┘
      │                      │
      ▼                      ▼
┌─────────────┐        ┌─────────────┐
│  Message    │◄───────┤MessageReact.│
└─────────────┘        └─────────────┘
      │
      ▼
┌─────────────┐        ┌─────────────┐
│    Call     │◄───────┤CallParticip.│
└─────────────┘        └─────────────┘
      │
      ▼
┌─────────────┐        ┌─────────────┐
│BlockedUser  │        │   Report    │
└─────────────┘        └─────────────┘
```

## Core Models

### 1. User Model

The User model represents a registered user of the platform.

```prisma
model User {
  id              String      @id @default(uuid())
  username        String      @unique @db.VarChar(50)
  email           String      @unique @db.VarChar(255)
  passwordHash    String
  avatar          String?     @db.VarChar(500)
  statusMessage   String?     @db.VarChar(255)
  role            UserRole    @default(USER)
  status          UserStatus  @default(ACTIVE)
  isOnline        Boolean     @default(false)
  lastSeen        DateTime    @default(now())
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Relations
  devices         Device[]
  refreshTokens   RefreshToken[]
  sentMessages    Message[]     @relation("SentMessages")
  receivedMessages Message[]     @relation("ReceivedMessages")
  groupMemberships GroupMember[]
  initiatedCalls  Call[]        @relation("InitiatedCalls")
  callParticipants CallParticipant[]
  sentFriendRequests FriendRequest[] @relation("SentFriendRequests")
  receivedFriendRequests FriendRequest[] @relation("ReceivedFriendRequests")
  following       Follow[]      @relation("Following")
  followers       Follow[]      @relation("Followers")
  blockedUsers    BlockedUser[] @relation("BlockedUsers")
  blockedBy       BlockedUser[] @relation("BlockedBy")
  reports         Report[]      @relation("Reports")
  reported        Report[]      @relation("Reported")
  
  // New relations for advanced features
  stories         Story[]
  userProfile     UserProfile?
  posts           Post[]
  meetings        Meeting[]     @relation("MeetingOrganizers")
  meetingParticipations MeetingParticipant[]
  storyViews      StoryView[]
  storyReactions  StoryReaction[]
  postLikes       PostLike[]
  postComments    PostComment[]
  postShares      PostShare[]
  postBookmarks   PostBookmark[]
  postCommentLikes PostCommentLike[]
  achievements    UserAchievement[]
  interests       UserInterest[]
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `username`: Unique username (3-50 characters, alphanumeric and underscores)
- `email`: Unique email address
- `passwordHash`: Argon2 hashed password
- `avatar`: URL to user avatar image
- `statusMessage`: User's status message
- `role`: User role (USER, MODERATOR, ADMIN)
- `status`: Account status (ACTIVE, INACTIVE, SUSPENDED, DELETED)
- `isOnline`: Online presence status
- `lastSeen`: Last seen timestamp
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

### 2. Device Model

The Device model tracks user devices for multi-device session management.

```prisma
model Device {
  id          String   @id @default(uuid())
  userId      String
  deviceId    String   @unique
  userAgent   String?
  ip          String?
  lastActive  DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user        User     @relation(fields: [userId], references: [id])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `userId`: Reference to User
- `deviceId`: Unique device identifier
- `userAgent`: Browser/device user agent string
- `ip`: IP address of device
- `lastActive`: Last activity timestamp
- `createdAt`: Device registration timestamp
- `updatedAt`: Last update timestamp

### 3. RefreshToken Model

The RefreshToken model manages JWT refresh tokens for session persistence.

```prisma
model RefreshToken {
  id          String   @id @default(uuid())
  userId      String
  token       String   @unique
  expiresAt   DateTime
  deviceId    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user        User     @relation(fields: [userId], references: [id])
  device      Device?  @relation(fields: [deviceId], references: [deviceId])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `userId`: Reference to User
- `token`: Unique refresh token
- `expiresAt`: Token expiration timestamp
- `deviceId`: Reference to Device (optional)
- `createdAt`: Token creation timestamp
- `updatedAt`: Last update timestamp

### 4. FriendRequest Model

The FriendRequest model manages friend requests between users.

```prisma
model FriendRequest {
  id          String       @id @default(uuid())
  senderId    String
  receiverId  String
  status      RequestStatus @default(PENDING)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  // Relations
  sender      User         @relation("SentFriendRequests", fields: [senderId], references: [id])
  receiver    User         @relation("ReceivedFriendRequests", fields: [receiverId], references: [id])

  @@unique([senderId, receiverId])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `senderId`: Reference to requesting User
- `receiverId`: Reference to requested User
- `status`: Request status (PENDING, ACCEPTED, REJECTED)
- `createdAt`: Request creation timestamp
- `updatedAt`: Last update timestamp

### 5. Follow Model

The Follow model manages follower/following relationships.

```prisma
model Follow {
  id          String   @id @default(uuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  // Relations
  follower    User     @relation("Following", fields: [followerId], references: [id])
  following   User     @relation("Followers", fields: [followingId], references: [id])

  @@unique([followerId, followingId])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `followerId`: Reference to follower User
- `followingId`: Reference to followed User
- `createdAt`: Follow creation timestamp

### 6. Group Model

The Group model represents chat groups.

```prisma
model Group {
  id          String     @id @default(uuid())
  title       String     @db.VarChar(100)
  description String?    @db.VarChar(500)
  cover       String?    @db.VarChar(500)
  type        GroupType  @default(PRIVATE)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Relations
  members     GroupMember[]
  messages    Message[]
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `title`: Group name (1-100 characters)
- `description`: Group description (max 500 characters)
- `cover`: URL to group cover image
- `type`: Group type (PRIVATE, PUBLIC, SECRET)
- `createdAt`: Group creation timestamp
- `updatedAt`: Last update timestamp

### 7. GroupMember Model

The GroupMember model manages group membership and roles.

```prisma
model GroupMember {
  id        String      @id @default(uuid())
  groupId   String
  userId    String
  role      MemberRole  @default(MEMBER)
  joinedAt  DateTime    @default(now())

  // Relations
  group     Group       @relation(fields: [groupId], references: [id])
  user      User        @relation(fields: [userId], references: [id])

  @@unique([groupId, userId])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `groupId`: Reference to Group
- `userId`: Reference to User
- `role`: Member role (OWNER, ADMIN, MEMBER)
- `joinedAt`: Membership creation timestamp

### 8. Message Model

The Message model represents chat messages.

```prisma
model Message {
  id          String        @id @default(uuid())
  senderId    String
  receiverId  String?
  groupId     String?
  content     String        @db.VarChar(5000)
  type        MessageType   @default(TEXT)
  metadata    Json?
  status      MessageStatus @default(SENT)
  isPinned    Boolean       @default(false)
  parentId    String?
  editedAt    DateTime?
  deletedAt   DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  // Relations
  sender      User          @relation("SentMessages", fields: [senderId], references: [id])
  receiver    User?         @relation("ReceivedMessages", fields: [receiverId], references: [id])
  group       Group?        @relation(fields: [groupId], references: [id])
  parent      Message?      @relation("MessageReplies", fields: [parentId], references: [id])
  replies     Message[]     @relation("MessageReplies")
  reactions   MessageReaction[]
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `senderId`: Reference to sender User
- `receiverId`: Reference to receiver User (for direct messages)
- `groupId`: Reference to Group (for group messages)
- `content`: Message content (1-5000 characters)
- `type`: Message type (TEXT, IMAGE, FILE, VOICE, VIDEO, SYSTEM)
- `metadata`: Additional metadata (JSON)
- `status`: Message status (SENT, DELIVERED, SEEN)
- `isPinned`: Whether message is pinned
- `parentId`: Reference to parent Message (for replies and forwarded messages)
- `editedAt`: Edit timestamp
- `deletedAt`: Delete timestamp
- `createdAt`: Message creation timestamp
- `updatedAt`: Last update timestamp

### 9. MessageReaction Model

The MessageReaction model manages emoji reactions to messages.

```prisma
model MessageReaction {
  id        String   @id @default(uuid())
  messageId String
  userId    String
  emoji     String   @db.VarChar(10)
  createdAt DateTime @default(now())

  // Relations
  message   Message  @relation(fields: [messageId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@unique([messageId, userId, emoji])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `messageId`: Reference to Message
- `userId`: Reference to User
- `emoji`: Emoji character (supports extended emoji set)
- `createdAt`: Reaction creation timestamp

**Enhanced Features**:
- Supports rich emoji set with over 200 emojis
- Provides reaction statistics and analytics
- Allows users to view their own reactions
- Enables reaction-based engagement metrics

### 10. Call Model

The Call model represents audio/video calls.

```prisma
model Call {
  id          String     @id @default(uuid())
  initiatorId String
  groupId     String?
  roomId      String     @unique
  type        CallType   @default(AUDIO)
  status      CallStatus @default(RINGING)
  startedAt   DateTime?
  endedAt     DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Relations
  initiator   User       @relation("InitiatedCalls", fields: [initiatorId], references: [id])
  group       Group?     @relation(fields: [groupId], references: [id])
  participants CallParticipant[]
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `initiatorId`: Reference to initiator User
- `groupId`: Reference to Group (for group calls)
- `roomId`: Unique Jitsi room identifier
- `type`: Call type (AUDIO, VIDEO)
- `status`: Call status (RINGING, ONGOING, ENDED, MISSED, REJECTED, CANCELED)
- `startedAt`: Call start timestamp
- `endedAt`: Call end timestamp
- `createdAt`: Call creation timestamp
- `updatedAt`: Last update timestamp

### 11. CallParticipant Model

The CallParticipant model manages call participants.

```prisma
model CallParticipant {
  id          String   @id @default(uuid())
  callId      String
  userId      String
  joinedAt    DateTime?
  leftAt      DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  call        Call     @relation(fields: [callId], references: [id])
  user        User     @relation(fields: [userId], references: [id])

  @@unique([callId, userId])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `callId`: Reference to Call
- `userId`: Reference to User
- `joinedAt`: Participant join timestamp
- `leftAt`: Participant leave timestamp
- `createdAt`: Participant creation timestamp
- `updatedAt`: Last update timestamp

### 12. BlockedUser Model

The BlockedUser model manages user blocking.

```prisma
model BlockedUser {
  id          String   @id @default(uuid())
  blockerId   String
  blockedId   String
  createdAt   DateTime @default(now())

  // Relations
  blocker     User     @relation("BlockedUsers", fields: [blockerId], references: [id])
  blocked     User     @relation("BlockedBy", fields: [blockedId], references: [id])

  @@unique([blockerId, blockedId])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `blockerId`: Reference to blocking User
- `blockedId`: Reference to blocked User
- `createdAt`: Block creation timestamp

### 13. Report Model

The Report model manages user reporting.

```prisma
model Report {
  id          String      @id @default(uuid())
  reporterId  String
  reportedId  String
  targetType  ReportTarget
  targetId    String
  reason      ReportReason
  description String?
  status      ReportStatus @default(PENDING)
  resolvedAt  DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Relations
  reporter    User        @relation("Reports", fields: [reporterId], references: [id])
  reported    User        @relation("Reported", fields: [reportedId], references: [id])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `reporterId`: Reference to reporting User
- `reportedId`: Reference to reported User
- `targetType`: Type of reported content (USER, MESSAGE, GROUP)
- `targetId`: ID of reported content
- `reason`: Report reason
- `description`: Additional description
- `status`: Report status (PENDING, RESOLVED, DISMISSED)
- `resolvedAt`: Resolution timestamp
- `createdAt`: Report creation timestamp
- `updatedAt`: Last update timestamp

## New Models for Advanced Features

### 14. Story Model

The Story model represents temporary content shared by users.

```prisma
model Story {
  id          String   @id @default(uuid())
  userId      String
  mediaUrl    String
  mediaType   String
  caption     String?
  expiresAt   DateTime
  isArchived  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])
  views       StoryView[]
  reactions   StoryReaction[]
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `userId`: Reference to User who created the story
- `mediaUrl`: URL to story media (image/video)
- `mediaType`: Type of media (image, video)
- `caption`: Optional caption for the story
- `expiresAt`: Expiration timestamp
- `isArchived`: Whether the story is archived
- `createdAt`: Story creation timestamp
- `updatedAt`: Last update timestamp

### 15. StoryView Model

The StoryView model tracks when users view stories.

```prisma
model StoryView {
  id        String   @id @default(uuid())
  storyId   String
  viewerId  String
  viewedAt  DateTime @default(now())

  story     Story    @relation(fields: [storyId], references: [id])
  viewer    User     @relation(fields: [viewerId], references: [id])

  @@unique([storyId, viewerId])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `storyId`: Reference to Story
- `viewerId`: Reference to User who viewed the story
- `viewedAt`: Timestamp when the story was viewed

### 16. StoryReaction Model

The StoryReaction model manages reactions to stories.

```prisma
model StoryReaction {
  id        String   @id @default(uuid())
  storyId   String
  userId    String
  emoji     String
  createdAt DateTime @default(now())

  story     Story    @relation(fields: [storyId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@unique([storyId, userId])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `storyId`: Reference to Story
- `userId`: Reference to User who reacted
- `emoji`: Emoji used for reaction
- `createdAt`: Reaction creation timestamp

### 17. UserProfile Model

The UserProfile model stores extended user profile information.

```prisma
model UserProfile {
  id              String   @id @default(uuid())
  userId          String   @unique
  firstName       String?
  lastName        String?
  bio             String?
  location        String?
  website         String?
  birthDate       DateTime?
  gender          String?
  profileViews    Int      @default(0)
  lastProfileView DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id])
  interests       UserInterest[]
  achievements    UserAchievement[]
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `userId`: Reference to User
- `firstName`: User's first name
- `lastName`: User's last name
- `bio`: User's biography
- `location`: User's location
- `website`: User's website
- `birthDate`: User's birth date
- `gender`: User's gender
- `profileViews`: Number of profile views
- `lastProfileView`: Timestamp of last profile view
- `createdAt`: Profile creation timestamp
- `updatedAt`: Last update timestamp

### 18. UserInterest Model

The UserInterest model tracks user interests for matching and recommendations.

```prisma
model UserInterest {
  id        String   @id @default(uuid())
  userId    String
  interest  String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])

  @@unique([userId, interest])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `userId`: Reference to User
- `interest`: Interest tag
- `createdAt`: Interest creation timestamp

### 19. UserAchievement Model

The UserAchievement model tracks user achievements and milestones.

```prisma
model UserAchievement {
  id          String   @id @default(uuid())
  userId      String
  title       String
  description String?
  earnedAt    DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `userId`: Reference to User
- `title`: Achievement title
- `description`: Achievement description
- `earnedAt`: Timestamp when achievement was earned

### 20. Post Model

The Post model represents user-generated content for the social feed.

```prisma
model Post {
  id          String   @id @default(uuid())
  userId      String
  content     String
  mediaUrls   String[]
  type        PostType @default(TEXT)
  visibility  PostVisibility @default(PUBLIC)
  likesCount  Int      @default(0)
  commentsCount Int     @default(0)
  sharesCount Int      @default(0)
  isPinned    Boolean  @default(false)
  scheduledAt DateTime?
  expiresAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])
  likes       PostLike[]
  comments    PostComment[]
  shares      PostShare[]
  bookmarks   PostBookmark[]
  tags        PostTag[]
  media       PostMedia[]
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `userId`: Reference to User who created the post
- `content`: Post content text
- `mediaUrls`: Array of URLs to attached media
- `type`: Type of post (TEXT, IMAGE, VIDEO, LINK, POLL)
- `visibility`: Visibility setting (PUBLIC, FRIENDS, ONLY_ME, CUSTOM)
- `likesCount`: Number of likes
- `commentsCount`: Number of comments
- `sharesCount`: Number of shares
- `isPinned`: Whether the post is pinned
- `scheduledAt`: Scheduled publication timestamp
- `expiresAt`: Expiration timestamp
- `createdAt`: Post creation timestamp
- `updatedAt`: Last update timestamp

### 21. PostLike Model

The PostLike model tracks likes on posts.

```prisma
model PostLike {
  id        String   @id @default(uuid())
  postId    String
  userId    String
  createdAt DateTime @default(now())

  post      Post     @relation(fields: [postId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@unique([postId, userId])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `postId`: Reference to Post
- `userId`: Reference to User who liked the post
- `createdAt`: Like creation timestamp

### 22. PostComment Model

The PostComment model represents comments on posts.

```prisma
model PostComment {
  id          String   @id @default(uuid())
  postId      String
  userId      String
  content     String
  parentId    String?
  likesCount  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  post        Post     @relation(fields: [postId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  parent      PostComment? @relation("PostCommentReplies", fields: [parentId], references: [id])
  replies     PostComment[] @relation("PostCommentReplies")
  likes       PostCommentLike[]
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `postId`: Reference to Post
- `userId`: Reference to User who commented
- `content`: Comment content
- `parentId`: Reference to parent comment (for threaded replies)
- `likesCount`: Number of likes on the comment
- `createdAt`: Comment creation timestamp
- `updatedAt`: Last update timestamp

### 23. PostCommentLike Model

The PostCommentLike model tracks likes on post comments.

```prisma
model PostCommentLike {
  id        String   @id @default(uuid())
  commentId String
  userId    String
  createdAt DateTime @default(now())

  comment   PostComment @relation(fields: [commentId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@unique([commentId, userId])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `commentId`: Reference to PostComment
- `userId`: Reference to User who liked the comment
- `createdAt`: Like creation timestamp

### 24. PostShare Model

The PostShare model tracks when users share posts.

```prisma
model PostShare {
  id        String   @id @default(uuid())
  postId    String
  userId    String
  createdAt DateTime @default(now())

  post      Post     @relation(fields: [postId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@unique([postId, userId])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `postId`: Reference to Post
- `userId`: Reference to User who shared the post
- `createdAt`: Share creation timestamp

### 25. PostBookmark Model

The PostBookmark model tracks when users bookmark posts.

```prisma
model PostBookmark {
  id        String   @id @default(uuid())
  postId    String
  userId    String
  createdAt DateTime @default(now())

  post      Post     @relation(fields: [postId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@unique([postId, userId])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `postId`: Reference to Post
- `userId`: Reference to User who bookmarked the post
- `createdAt`: Bookmark creation timestamp

### 26. PostTag Model

The PostTag model tracks hashtags in posts.

```prisma
model PostTag {
  id        String   @id @default(uuid())
  postId    String
  tag       String
  createdAt DateTime @default(now())

  post      Post     @relation(fields: [postId], references: [id])

  @@unique([postId, tag])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `postId`: Reference to Post
- `tag`: Hashtag without #
- `createdAt`: Tag creation timestamp

### 27. PostMedia Model

The PostMedia model tracks media attached to posts.

```prisma
model PostMedia {
  id        String   @id @default(uuid())
  postId    String
  url       String
  type      String
  order     Int
  createdAt DateTime @default(now())

  post      Post     @relation(fields: [postId], references: [id])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `postId`: Reference to Post
- `url`: URL to media file
- `type`: Type of media (image, video)
- `order`: Display order
- `createdAt`: Media creation timestamp

### 28. Meeting Model

The Meeting model represents scheduled meetings.

```prisma
model Meeting {
  id          String     @id @default(uuid())
  organizerId String
  title       String
  description String?
  scheduledAt DateTime
  duration    Int
  roomId      String
  status      MeetingStatus @default(SCHEDULED)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  organizer   User       @relation("MeetingOrganizers", fields: [organizerId], references: [id])
  participants MeetingParticipant[]
  agendaItems MeetingAgenda[]
  notes       MeetingNote[]
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `organizerId`: Reference to User who organized the meeting
- `title`: Meeting title
- `description`: Meeting description
- `scheduledAt`: Scheduled start time
- `duration`: Meeting duration in minutes
- `roomId`: Meeting room identifier
- `status`: Meeting status (SCHEDULED, ONGOING, ENDED, CANCELLED)
- `createdAt`: Meeting creation timestamp
- `updatedAt`: Last update timestamp

### 29. MeetingParticipant Model

The MeetingParticipant model tracks meeting participants.

```prisma
model MeetingParticipant {
  id         String   @id @default(uuid())
  meetingId  String
  userId     String
  role       ParticipantRole @default(ATTENDEE)
  joinedAt   DateTime?
  leftAt     DateTime?
  status     ParticipationStatus @default(INVITED)

  meeting    Meeting  @relation(fields: [meetingId], references: [id])
  user       User     @relation(fields: [userId], references: [id])

  @@unique([meetingId, userId])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `meetingId`: Reference to Meeting
- `userId`: Reference to participating User
- `role`: Participant role (ORGANIZER, CO_HOST, ATTENDEE)
- `joinedAt`: Timestamp when participant joined
- `leftAt`: Timestamp when participant left
- `status`: Participation status (INVITED, ACCEPTED, DECLINED, JOINED, LEFT)

### 30. MeetingAgenda Model

The MeetingAgenda model tracks meeting agenda items.

```prisma
model MeetingAgenda {
  id          String   @id @default(uuid())
  meetingId   String
  title       String
  description String?
  order       Int
  duration    Int?
  completedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  meeting     Meeting  @relation(fields: [meetingId], references: [id])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `meetingId`: Reference to Meeting
- `title`: Agenda item title
- `description`: Agenda item description
- `order`: Display order
- `duration`: Expected duration in minutes
- `completedAt`: Timestamp when item was completed
- `createdAt`: Agenda item creation timestamp
- `updatedAt`: Last update timestamp

### 31. MeetingNote Model

The MeetingNote model tracks meeting notes.

```prisma
model MeetingNote {
  id        String   @id @default(uuid())
  meetingId String
  userId    String
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  meeting   Meeting  @relation(fields: [meetingId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `meetingId`: Reference to Meeting
- `userId`: Reference to User who created the note
- `content`: Note content
- `createdAt`: Note creation timestamp
- `updatedAt`: Last update timestamp

## Enumerations

### UserRole

```prisma
enum UserRole {
  USER
  MODERATOR
  ADMIN
}
```

### UserStatus

```prisma
enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  DELETED
}
```

### RequestStatus

```prisma
enum RequestStatus {
  PENDING
  ACCEPTED
  REJECTED
}
```

### GroupType

```prisma
enum GroupType {
  PRIVATE
  PUBLIC
  SECRET
}
```

### MemberRole

```prisma
enum MemberRole {
  OWNER
  ADMIN
  MEMBER
}
```

### MessageType

```prisma
enum MessageType {
  TEXT
  IMAGE
  FILE
  VOICE
  VIDEO
  SYSTEM
}
```

### MessageStatus

```prisma
enum MessageStatus {
  SENT
  DELIVERED
  SEEN
}
```

### CallType

```prisma
enum CallType {
  AUDIO
  VIDEO
}
```

### CallStatus

```prisma
enum CallStatus {
  RINGING
  ONGOING
  ENDED
  MISSED
  REJECTED
  CANCELED
}
```

### ReportTarget

```prisma
enum ReportTarget {
  USER
  MESSAGE
  GROUP
}
```

### ReportReason

```prisma
enum ReportReason {
  SPAM
  HARASSMENT
  INAPPROPRIATE_CONTENT
  IMPERSONATION
  OTHER
}
```

### ReportStatus

```prisma
enum ReportStatus {
  PENDING
  RESOLVED
  DISMISSED
}
```

### PostType

```prisma
enum PostType {
  TEXT
  IMAGE
  VIDEO
  LINK
  POLL
}
```

### PostVisibility

```prisma
enum PostVisibility {
  PUBLIC
  FRIENDS
  ONLY_ME
  CUSTOM
}
```

### MeetingStatus

```prisma
enum MeetingStatus {
  SCHEDULED
  ONGOING
  ENDED
  CANCELLED
}
```

### ParticipantRole

```prisma
enum ParticipantRole {
  ORGANIZER
  CO_HOST
  ATTENDEE
}
```

### ParticipationStatus

```prisma
enum ParticipationStatus {
  INVITED
  ACCEPTED
  DECLINED
  JOINED
  LEFT
}
```

## Indexes and Constraints

### Primary Keys

All models have a primary key `id` field of type UUID.

### Unique Constraints

1. **User**: `username`, `email`
2. **Device**: `deviceId`
3. **RefreshToken**: `token`
4. **FriendRequest**: `[senderId, receiverId]`
5. **Follow**: `[followerId, followingId]`
6. **GroupMember**: `[groupId, userId]`
7. **Call**: `roomId`
8. **MessageReaction**: `[messageId, userId, emoji]`
9. **CallParticipant**: `[callId, userId]`
10. **BlockedUser**: `[blockerId, blockedId]`
11. **StoryView**: `[storyId, viewerId]`
12. **StoryReaction**: `[storyId, userId]`
13. **UserProfile**: `userId`
14. **UserInterest**: `[userId, interest]`
15. **PostLike**: `[postId, userId]`
16. **PostCommentLike**: `[commentId, userId]`
17. **PostShare**: `[postId, userId]`
18. **PostBookmark**: `[postId, userId]`
19. **PostTag**: `[postId, tag]`
20. **MeetingParticipant**: `[meetingId, userId]`

### Indexes

1. **User**: Indexes on `username`, `email`, `createdAt`
2. **Message**: Indexes on `senderId`, `receiverId`, `groupId`, `createdAt`
3. **Group**: Indexes on `title`, `type`, `createdAt`
4. **Call**: Indexes on `initiatorId`, `groupId`, `status`, `createdAt`
5. **MessageReaction**: Indexes on `messageId`, `userId`, `createdAt`
6. **Story**: Indexes on `userId`, `expiresAt`, `createdAt`
7. **Post**: Indexes on `userId`, `createdAt`, `visibility`
8. **PostLike**: Indexes on `postId`, `userId`, `createdAt`
9. **PostComment**: Indexes on `postId`, `userId`, `createdAt`
10. **Meeting**: Indexes on `organizerId`, `scheduledAt`, `status`

## Data Relationships

### One-to-Many Relationships

1. User → Device (one user has many devices)
2. User → RefreshToken (one user has many refresh tokens)
3. User → Message (one user sends many messages)
4. User → GroupMember (one user has many group memberships)
5. User → Call (one user initiates many calls)
6. Group → Message (one group has many messages)
7. Group → GroupMember (one group has many members)
8. Message → MessageReaction (one message has many reactions)
9. Call → CallParticipant (one call has many participants)
10. User → Story (one user creates many stories)
11. Story → StoryView (one story has many views)
12. Story → StoryReaction (one story has many reactions)
13. User → Post (one user creates many posts)
14. Post → PostLike (one post has many likes)
15. Post → PostComment (one post has many comments)
16. PostComment → PostCommentLike (one comment has many likes)
17. Meeting → MeetingParticipant (one meeting has many participants)

### Many-to-Many Relationships

Implemented through junction models:
1. **FriendRequest**: User ↔ User
2. **Follow**: User ↔ User
3. **BlockedUser**: User ↔ User
4. **Report**: User ↔ User
5. **PostShare**: User ↔ Post
6. **PostBookmark**: User ↔ Post

## Data Access Patterns

### User Management

```javascript
// Find user by email
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' }
});

// Create new user
const newUser = await prisma.user.create({
  data: {
    username: 'john_doe',
    email: 'john@example.com',
    passwordHash: hashedPassword
  }
});

// Update user profile
const updatedUser = await prisma.user.update({
  where: { id: userId },
  data: {
    statusMessage: 'Available',
    avatar: 'https://example.com/avatar.jpg'
  }
});
```

### Messaging

```javascript
// Create message
const message = await prisma.message.create({
  data: {
    senderId: senderId,
    receiverId: receiverId,
    content: 'Hello!',
    type: 'TEXT'
  }
});

// Get user's messages
const messages = await prisma.message.findMany({
  where: {
    OR: [
      { senderId: userId },
      { receiverId: userId }
    ]
  },
  orderBy: { createdAt: 'desc' },
  take: 50
});

// Get group messages
const groupMessages = await prisma.message.findMany({
  where: { groupId: groupId },
  orderBy: { createdAt: 'desc' },
  take: 50
});
```

### Group Management

```javascript
// Create group
const group = await prisma.group.create({
  data: {
    title: 'Development Team',
    description: 'Team communication',
    type: 'PRIVATE'
  }
});

// Add member to group
const membership = await prisma.groupMember.create({
  data: {
    groupId: groupId,
    userId: userId,
    role: 'MEMBER'
  }
});

// Get user's groups
const userGroups = await prisma.group.findMany({
  where: {
    members: {
      some: { userId: userId }
    }
  }
});
```

### Call Management

```javascript
// Create call
const call = await prisma.call.create({
  data: {
    initiatorId: userId,
    type: 'VIDEO',
    roomId: 'unique-room-id'
  }
});

// Add participant to call
const participant = await prisma.callParticipant.create({
  data: {
    callId: callId,
    userId: participantId
  }
});

// Get user's call history
const calls = await prisma.call.findMany({
  where: {
    OR: [
      { initiatorId: userId },
      { participants: { some: { userId: userId } } }
    ]
  },
  orderBy: { createdAt: 'desc' },
  take: 50
});
```

### Story Management

```javascript
// Create story
const story = await prisma.story.create({
  data: {
    userId: userId,
    mediaUrl: 'https://example.com/story.jpg',
    mediaType: 'image',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  }
});

// Get user's stories
const stories = await prisma.story.findMany({
  where: {
    userId: userId,
    expiresAt: { gt: new Date() }
  },
  orderBy: { createdAt: 'desc' }
});

// Get friends' stories
const friendsStories = await prisma.story.findMany({
  where: {
    user: {
      OR: [
        { followers: { some: { followerId: userId } } },
        { following: { some: { followingId: userId } } }
      ]
    },
    expiresAt: { gt: new Date() }
  },
  orderBy: { createdAt: 'desc' }
});
```

### Post Management

```javascript
// Create post
const post = await prisma.post.create({
  data: {
    userId: userId,
    content: 'Hello, world!',
    type: 'TEXT',
    visibility: 'PUBLIC'
  }
});

// Get user's feed
const feed = await prisma.post.findMany({
  where: {
    OR: [
      { userId: userId },
      { user: { followers: { some: { followerId: userId } } } }
    ],
    visibility: 'PUBLIC'
  },
  orderBy: { createdAt: 'desc' },
  take: 20
});

// Like post
const like = await prisma.postLike.create({
  data: {
    postId: postId,
    userId: userId
  }
});
```

This enhanced data model provides a comprehensive foundation for an advanced social communication platform, supporting all core features including messaging, groups, calls, social interactions, stories, posts, and meetings.