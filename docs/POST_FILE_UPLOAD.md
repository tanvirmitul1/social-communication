# Post File Upload API

## Overview

Create posts with image and video uploads directly through the API.

---

## Endpoints

### 1. Create Post with Files (NEW ✨)

```
POST /api/v1/posts/with-files
Content-Type: multipart/form-data
Authorization: Bearer YOUR_TOKEN
```

#### Request Body (multipart/form-data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | Yes | Post content/caption (1-10000 chars) |
| `privacy` | string | No | PUBLIC, FRIENDS, or PRIVATE (default: PUBLIC) |
| `files` | file[] | No | Images or videos (max 10 files) |
| `mentions` | string | No | JSON array of user IDs `["uuid1","uuid2"]` |

#### File Limits

- **Images**: Max 10MB per file (JPEG, PNG, GIF, WebP)
- **Videos**: Max 50MB per file (MP4, WebM, MOV, AVI)
- **Total**: Max 10 files per post

#### Response

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
        "height": 1080
      },
      {
        "id": "media-uuid-2",
        "type": "VIDEO",
        "url": "https://res.cloudinary.com/.../video.mp4",
        "thumbnail": "https://res.cloudinary.com/.../poster.jpg",
        "width": 1280,
        "height": 720,
        "duration": 30
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### 2. Create Post (JSON Only)

```
POST /api/v1/posts
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN
```

Use this endpoint if you've already uploaded files separately and have URLs.

#### Request Body

```json
{
  "content": "Check out this photo!",
  "privacy": "PUBLIC",
  "media": [
    {
      "type": "IMAGE",
      "url": "https://res.cloudinary.com/.../image.webp",
      "thumbnail": "https://res.cloudinary.com/.../thumb.webp",
      "width": 1920,
      "height": 1080
    }
  ],
  "mentions": ["user-uuid-1", "user-uuid-2"]
}
```

---

## Usage Examples

### Example 1: Create Post with Images (cURL)

```bash
curl -X POST http://localhost:5000/api/v1/posts/with-files \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "content=Beautiful sunset today! 🌅" \
  -F "privacy=PUBLIC" \
  -F "files=@/path/to/photo1.jpg" \
  -F "files=@/path/to/photo2.jpg"
```

### Example 2: Create Post with Video (cURL)

```bash
curl -X POST http://localhost:5000/api/v1/posts/with-files \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "content=Check out this video!" \
  -F "files=@/path/to/video.mp4"
```

### Example 3: Create Post with Mixed Media (cURL)

```bash
curl -X POST http://localhost:5000/api/v1/posts/with-files \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "content=My vacation photos and videos" \
  -F "privacy=FRIENDS" \
  -F "files=@/path/to/photo1.jpg" \
  -F "files=@/path/to/photo2.jpg" \
  -F "files=@/path/to/video.mp4" \
  -F 'mentions=["user-uuid-1","user-uuid-2"]'
```

### Example 4: JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append('content', 'Check out these photos!');
formData.append('privacy', 'PUBLIC');

// Add multiple files
const fileInput = document.querySelector('input[type="file"]');
for (const file of fileInput.files) {
  formData.append('files', file);
}

// Add mentions (optional)
formData.append('mentions', JSON.stringify(['user-uuid-1', 'user-uuid-2']));

const response = await fetch('http://localhost:5000/api/v1/posts/with-files', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log(data);
```

### Example 5: React Component

```tsx
import { useState } from 'react';

function CreatePost() {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('content', content);
    formData.append('privacy', 'PUBLIC');

    // Add all selected files
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:5000/api/v1/posts/with-files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Post created successfully!');
        setContent('');
        setFiles([]);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        required
      />

      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileChange}
        max={10}
      />

      {files.length > 0 && (
        <div>
          <p>Selected files: {files.length}</p>
          <ul>
            {files.map((file, i) => (
              <li key={i}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
            ))}
          </ul>
        </div>
      )}

      <button type="submit" disabled={loading || !content}>
        {loading ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
}
```

### Example 6: Axios

```javascript
import axios from 'axios';

async function createPostWithFiles(content, files, privacy = 'PUBLIC') {
  const formData = new FormData();
  formData.append('content', content);
  formData.append('privacy', privacy);

  files.forEach(file => {
    formData.append('files', file);
  });

  try {
    const response = await axios.post(
      'http://localhost:5000/api/v1/posts/with-files',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

// Usage
const files = [file1, file2, file3];
const result = await createPostWithFiles('Check out these photos!', files);
```

---

## File Processing

### Images
- Automatically converted to WebP format
- Resized to max 1920×1080 (maintains aspect ratio)
- Thumbnail generated at 320×320
- Optimized for web delivery

### Videos
- Stored in original format
- Poster thumbnail generated at 1-second mark
- Optimized for streaming

---

## Error Responses

### 400 Bad Request - No Content
```json
{
  "success": false,
  "message": "Content is required"
}
```

### 400 Bad Request - Invalid File Type
```json
{
  "success": false,
  "message": "Only image and video files are allowed"
}
```

### 400 Bad Request - File Too Large
```json
{
  "success": false,
  "message": "File size exceeds limit"
}
```

### 400 Bad Request - Too Many Files
```json
{
  "success": false,
  "message": "Maximum 10 files allowed per post"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

## Comparison: Two Approaches

### Approach 1: Upload Files with Post (NEW)
```
POST /api/v1/posts/with-files
```
✅ **Pros:**
- Single request
- Simpler frontend code
- Automatic file processing

❌ **Cons:**
- Larger request size
- Longer response time
- No progress tracking per file

### Approach 2: Upload Files First, Then Create Post
```
1. POST /api/v1/upload/image (for each file)
2. POST /api/v1/posts (with URLs)
```
✅ **Pros:**
- Progress tracking per file
- Can retry individual uploads
- Faster post creation

❌ **Cons:**
- Multiple requests
- More complex frontend code
- Need to manage URLs

---

## Best Practices

### 1. Validate Files on Frontend
```javascript
function validateFile(file) {
  const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
  
  if (file.size > maxSize) {
    alert(`File ${file.name} is too large`);
    return false;
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
  if (!allowedTypes.includes(file.type)) {
    alert(`File type ${file.type} is not allowed`);
    return false;
  }
  
  return true;
}
```

### 2. Show Upload Progress
```javascript
const xhr = new XMLHttpRequest();

xhr.upload.addEventListener('progress', (e) => {
  if (e.lengthComputable) {
    const percentComplete = (e.loaded / e.total) * 100;
    console.log(`Upload: ${percentComplete}%`);
  }
});

xhr.open('POST', 'http://localhost:5000/api/v1/posts/with-files');
xhr.setRequestHeader('Authorization', `Bearer ${token}`);
xhr.send(formData);
```

### 3. Compress Images Before Upload
```javascript
async function compressImage(file) {
  // Use a library like browser-image-compression
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };
  
  return await imageCompression(file, options);
}
```

---

## Testing

### Test with Postman

1. Create new POST request
2. URL: `http://localhost:5000/api/v1/posts/with-files`
3. Headers:
   - `Authorization: Bearer YOUR_TOKEN`
4. Body → form-data:
   - `content` (text): "Test post with files"
   - `privacy` (text): "PUBLIC"
   - `files` (file): Select image/video files
5. Send

### Test with cURL

```bash
# Test with image
curl -X POST http://localhost:5000/api/v1/posts/with-files \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "content=Test post" \
  -F "files=@test-image.jpg"

# Test with multiple files
curl -X POST http://localhost:5000/api/v1/posts/with-files \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "content=Multiple files test" \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg" \
  -F "files=@video.mp4"
```

---

## Summary

✅ **New Endpoint**: `POST /api/v1/posts/with-files`  
✅ **Supports**: Images (JPEG, PNG, GIF, WebP) and Videos (MP4, WebM, MOV, AVI)  
✅ **Limits**: Max 10 files, 10MB per image, 50MB per video  
✅ **Auto-Processing**: Images → WebP, Videos → Poster thumbnail  
✅ **Single Request**: Upload files and create post in one call  

🚀 **Ready to use!**
