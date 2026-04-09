# ✅ Post File Upload Feature - Complete

## 🎉 New Endpoint Added!

```
POST /api/v1/posts/with-files
```

Upload images and videos directly when creating a post!

---

## 🚀 Quick Test

### Using cURL

```bash
# Create post with image
curl -X POST http://localhost:5000/api/v1/posts/with-files \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "content=Check out this photo!" \
  -F "files=@/path/to/image.jpg"

# Create post with multiple files
curl -X POST http://localhost:5000/api/v1/posts/with-files \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "content=My vacation photos!" \
  -F "privacy=PUBLIC" \
  -F "files=@photo1.jpg" \
  -F "files=@photo2.jpg" \
  -F "files=@video.mp4"
```

### Using Postman

1. **Method**: POST
2. **URL**: `http://localhost:5000/api/v1/posts/with-files`
3. **Headers**:
   - `Authorization: Bearer YOUR_TOKEN`
4. **Body** → form-data:
   - `content` (text): "Test post with files"
   - `privacy` (text): "PUBLIC"
   - `files` (file): Select your images/videos
5. **Send**

---

## 📋 Request Format

### Form Data Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | text | ✅ Yes | Post content (1-10000 chars) |
| `privacy` | text | ❌ No | PUBLIC, FRIENDS, or PRIVATE |
| `files` | file[] | ❌ No | Images or videos (max 10) |
| `mentions` | text | ❌ No | JSON array: `["uuid1","uuid2"]` |

### File Limits

- **Images**: Max 10MB (JPEG, PNG, GIF, WebP)
- **Videos**: Max 50MB (MP4, WebM, MOV, AVI)
- **Total**: Max 10 files per post

---

## 💻 Frontend Example

### React Component

```tsx
function CreatePost() {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('content', content);
    formData.append('privacy', 'PUBLIC');

    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch('http://localhost:5000/api/v1/posts/with-files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
      />

      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={(e) => setFiles(Array.from(e.target.files || []))}
      />

      <button type="submit">Create Post</button>
    </form>
  );
}
```

### JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append('content', 'Check out these photos!');
formData.append('privacy', 'PUBLIC');

// Add files
const fileInput = document.querySelector('input[type="file"]');
for (const file of fileInput.files) {
  formData.append('files', file);
}

const response = await fetch('http://localhost:5000/api/v1/posts/with-files', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
```

---

## 📤 Response Example

```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": "post-uuid",
    "content": "Check out these photos!",
    "privacy": "PUBLIC",
    "author": {
      "id": "user-uuid",
      "username": "alice",
      "avatar": "https://..."
    },
    "media": [
      {
        "id": "media-uuid",
        "type": "IMAGE",
        "url": "https://res.cloudinary.com/.../image.webp",
        "thumbnail": "https://res.cloudinary.com/.../thumb.webp",
        "width": 1920,
        "height": 1080,
        "size": 524288
      },
      {
        "id": "media-uuid-2",
        "type": "VIDEO",
        "url": "https://res.cloudinary.com/.../video.mp4",
        "thumbnail": "https://res.cloudinary.com/.../poster.jpg",
        "width": 1280,
        "height": 720,
        "duration": 30,
        "size": 5242880
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "_count": {
      "reactions": 0,
      "comments": 0,
      "shares": 0
    }
  }
}
```

---

## 🔄 Two Ways to Create Posts

### Option 1: Upload Files with Post (NEW ✨)

```
POST /api/v1/posts/with-files
```

**Single request** - Upload files and create post together

✅ Simpler  
✅ Faster  
✅ Less code  

### Option 2: Upload Files First, Then Create Post

```
1. POST /api/v1/upload/image (for each file)
2. POST /api/v1/posts (with URLs)
```

**Two-step process** - Upload files separately, then create post

✅ Progress tracking  
✅ Retry individual uploads  
✅ More control  

---

## ⚙️ What Happens Behind the Scenes

1. **Files received** → Multer processes multipart/form-data
2. **Files uploaded** → Cloudinary stores and optimizes
3. **Images** → Converted to WebP, thumbnail generated
4. **Videos** → Poster thumbnail generated
5. **Post created** → Saved to database with media URLs
6. **Response sent** → Post data with media info

---

## 🛡️ Error Handling

### No Content
```json
{
  "success": false,
  "message": "Content is required"
}
```

### Invalid File Type
```json
{
  "success": false,
  "message": "Only image and video files are allowed"
}
```

### File Too Large
```json
{
  "success": false,
  "message": "File size exceeds limit"
}
```

### Too Many Files
```json
{
  "success": false,
  "message": "Maximum 10 files allowed per post"
}
```

---

## 📁 Files Modified

1. ✅ `modules/post/post.controller.ts` - Added `createPostWithFiles` method
2. ✅ `modules/post/post.routes.ts` - Added `/with-files` route with multer
3. ✅ `docs/POST_FILE_UPLOAD.md` - Complete documentation

---

## 🎯 Summary

✅ **New Endpoint**: `POST /api/v1/posts/with-files`  
✅ **Supports**: Images (JPEG, PNG, GIF, WebP) + Videos (MP4, WebM, MOV, AVI)  
✅ **Limits**: Max 10 files, 10MB per image, 50MB per video  
✅ **Auto-Processing**: Images → WebP, Videos → Poster  
✅ **Single Request**: Upload + Create in one call  
✅ **Documentation**: Complete guide in `docs/POST_FILE_UPLOAD.md`  

🚀 **Ready to use!**

---

## 📚 Full Documentation

See `docs/POST_FILE_UPLOAD.md` for:
- Complete API reference
- Frontend examples (React, Vue, Vanilla JS)
- Error handling
- Best practices
- Testing guide
