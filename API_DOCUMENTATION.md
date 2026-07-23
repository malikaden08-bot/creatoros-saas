# CreatorOS SaaS REST API Specifications (OpenAPI 3.0)

Welcome to the official REST API reference for **CreatorOS**. All endpoints require Bearer Token authorization (`Authorization: Bearer <API_KEY>`) and return standard JSON payloads.

---

## 🔐 1. Authentication & Users API

### `POST /api/v1/auth/login`
Authenticate user session with email and password.
- **Request Body**:
  ```json
  {
    "email": "user@creatoros.ai",
    "password": "SecurePassword123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": { "id": "usr-1", "name": "Alex Rivera", "role": "SuperAdmin" }
  }
  ```

---

## 🤖 2. AI Studio Generation API

### `POST /api/v1/ai/generate-script`
Generate high-converting video script using OpenAI GPT-4o.
- **Request Body**:
  ```json
  {
    "prompt": "5 AI Automation tools for video editors",
    "tone": "engaging",
    "durationSeconds": 60
  }
  ```

### `POST /api/v1/ai/text-to-video`
Submit text prompt to Runway Gen-3 text-to-video pipeline.

---

## ⚡ 3. Visual Workflows API (n8n Engine)

### `POST /api/v1/workflows/execute`
Trigger automated n8n execution pipeline.
- **Request Body**:
  ```json
  {
    "workflowId": "wf-auto-yt-tiktok",
    "inputParams": { "videoUrl": "https://s3.amazonaws.com/raw.mp4" }
  }
  ```

---

## 📱 4. Social Publisher API

### `POST /api/v1/publisher/schedule`
Schedule social post to multiple connected networks.
- **Request Body**:
  ```json
  {
    "platforms": ["instagram", "tiktok", "youtube"],
    "caption": "5 AI Automation tools for creators! #CreatorOS",
    "scheduledTime": "2026-07-25T09:00:00Z"
  }
  ```

---

## 📈 5. Performance Analytics API

### `GET /api/v1/analytics/overview`
Retrieve aggregate reach, engagement, MRR revenue, and watch time.

---

## 🛒 6. Marketplace API

### `POST /api/v1/marketplace/install`
Install a template, AI agent, or LUT preset into workspace.
