
---

## 📁 `server/README.md` — Backend (Node.js + MongoDB + Redis + WebSocket)

```markdown
# ⚙️ Social Feed App – Backend (Node.js + MongoDB + Redis + WebSocket)

This is the backend API and real-time socket server for the Infinite Scroll Social Feed application.

---

## 🚀 Features

### 🔐 User Authentication
- JWT-based login/signup
- Roles: `celebrity` and `public`
- Mock login supported

### 📝 Posts
- Celebrity: Create post (text + optional image)
- Follower feed and celebrity feed with pagination
- Infinite scrolling support with `/posts?page=x`

### 👥 Follow System
- Public users can follow/unfollow celebrities
- Posts from followed celebrities appear in real-time

### 🔔 Real-Time Notifications
- When celebrity posts, their followers are notified in real-time
- Implemented using:
  - Socket.IO
  - Redis Pub/Sub (for scaling WebSocket notifications across instances)

---

## 🖥 Tech Stack

- Node.js + Express
- MongoDB (Mongoose)
- Redis
- Socket.IO
- JSON Web Tokens (JWT)
- Multer (image upload)
- dotenv

---

## ⚙️ Setup Instructions

### 1. Navigate to backend folder

```bash
cd server



2. Install dependencies
bash
Copy
Edit
npm install

3. Create .env file
env
Copy
Edit
PORT=5000
MONGO_URI=mongodb://localhost:27017/social-app
JWT_SECRET=supersecretjwtkey
JWT_EXPIRES_IN=1d


# Optional email or upload configs
UPLOAD_DIR=uploads

▶️ Run the Backend
bash
Copy
Edit
npm start
