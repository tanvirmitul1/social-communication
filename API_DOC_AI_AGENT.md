# AI Agent API Documentation

This document describes the API endpoints for the AI Agent system in the social media application.

## Base URL

All API endpoints are prefixed with `/api/v1/ai-agent` (or the configured API version).

## Authentication

All endpoints require authentication using a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Execute Agent

Execute an AI agent with user input and get a response.

- **Method**: `POST`
- **URL**: `/api/v1/ai-agent/execute`
- **Description**: Sends user input to the AI agent and receives a response. The system maintains conversation context and supports multiple AI providers with fallback.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userInput | string | Yes | The input from the user to send to the AI agent (1-10000 characters) |
| conversationId | string (UUID) | No | Existing conversation ID to continue a conversation. If not provided, a new conversation will be created. |

#### Example Request

```json
{
  "userInput": "Can you help me find friends with similar interests?",
  "conversationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "conversationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "response": "I'd be happy to help you find friends with similar interests. You can search for users based on their interests, join groups related to your hobbies, or use the discovery feature to find people nearby with common interests."
  }
}
```

### Get User Conversations

Retrieve a list of conversations for the authenticated user.

- **Method**: `GET`
- **URL**: `/api/v1/ai-agent/conversations`
- **Description**: Gets a paginated list of conversations for the current user.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number for pagination |
| limit | number | No | 10 | Number of conversations per page (max 100) |

#### Example Request

```
GET /api/v1/ai-agent/conversations?page=1&limit=5
```

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "userId": "user123",
      "title": "Can you help me find friends...",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Conversation History

Retrieve the message history for a specific conversation.

- **Method**: `GET`
- **URL**: `/api/v1/ai-agent/conversations/:conversationId/history`
- **Description**: Gets the message history for a specific conversation.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| conversationId | string (UUID) | The ID of the conversation to retrieve history for |

#### Example Request

```
GET /api/v1/ai-agent/conversations/a1b2c3d4-e5f6-7890-1234-567890abcdef/history
```

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "msg123",
      "conversationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "sender": "user",
      "content": "Can you help me find friends with similar interests?",
      "timestamp": "2023-01-01T00:00:00.000Z",
      "metadata": null
    },
    {
      "id": "msg124",
      "conversationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "sender": "ai",
      "content": "I'd be happy to help you find friends with similar interests...",
      "timestamp": "2023-01-01T00:00:05.000Z",
      "metadata": null
    }
  ]
}
```

## AI Provider Fallback Mechanism

The AI agent system implements a fallback mechanism that tries the following providers in order:

1. **OpenAI**: Uses GPT-3.5 Turbo model if the `OPENAI_API_KEY` is configured
2. **Google AI**: Uses Gemini Pro model if the `GOOGLE_AI_API_KEY` is configured
3. **DeepSeek AI**: Uses DeepSeek Chat model if the `DEEPSEEK_AI_API_KEY` is configured

If the primary provider fails, the system automatically falls back to the next available provider, ensuring continuous service availability.

## Error Handling

Common error responses:

- `400 Bad Request`: Invalid input parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Conversation does not exist or does not belong to the user
- `500 Internal Server Error`: Unexpected server error