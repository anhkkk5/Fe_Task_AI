# TaskMind AI — Frontend

> Giao diện quản lý công việc thông minh với AI scheduling, real-time chat và calendar tương tự Google Calendar.

## Tech Stack

| Layer      | Technology                               |
| ---------- | ---------------------------------------- |
| Framework  | React 19 + TypeScript                    |
| Build      | Vite                                     |
| UI Library | Ant Design 6 + Ant Design Icons          |
| State      | Redux Toolkit + React-Redux              |
| Routing    | React Router 7                           |
| Real-time  | Socket.IO Client                         |
| Auth       | Google OAuth (@react-oauth/google)       |
| Markdown   | react-markdown + remark-gfm + rehype-raw |

## Features

### 📋 Task Management

- CRUD tasks với priority, deadline, status
- AI task breakdown — chia nhỏ task lớn thành subtasks
- AI auto-scheduling — xếp lịch tối ưu dựa trên năng suất cá nhân
- Smart reschedule — đề xuất slot thay thế khi conflict
- Drag & drop tasks trên calendar

### 📅 Calendar (Google Calendar-style)

- Week view với time grid, current time indicator
- Click-to-create events trực tiếp trên grid
- 2 loại: **Sự kiện** (thời gian + khách + meeting link + vị trí) và **Việc cần làm** (deadline)
- Meeting link: Google login → tạo Google Meet, regular login → paste Zoom/Teams/Meet
- Guest management cho mọi loại đăng nhập
- Half-hour gridlines, today column highlight, adaptive event cards

### 💬 Real-time Messenger

- Chat cá nhân và nhóm
- Typing indicator, online presence
- File/image upload (Cloudinary)
- Message reactions, edit, delete
- Floating chat windows + fullscreen messenger

### 🤖 AI Chat

- Streaming chat với Groq (LLaMA)
- Conversation history
- Markdown rendering với code highlighting

### 👥 Teams

- Tạo nhóm, mời thành viên qua email
- Team tasks với comments
- Role-based permissions

### 🔔 Notifications

- Real-time notifications qua Socket.IO
- Email reminders cho deadline

## Project Structure

```
src/
├── pages/
│   ├── Calendar/      # Week view calendar + event creation
│   ├── Tasks/         # Task list + AI features
│   ├── Chat/          # AI chat page
│   ├── Messenger/     # Fullscreen messenger
│   ├── Teams/         # Team management
│   ├── Profile/       # User profile + habits
│   ├── Notifications/ # Notification center
│   ├── Login/         # Login (email + Google)
│   ├── Register/      # Registration with OTP
│   └── Guide/         # User guide
├── components/
│   ├── Messenger/     # Chat windows, popups
│   ├── GuestManager/  # Event guest management
│   ├── AITaskScheduler/   # AI scheduling UI
│   ├── SmartRescheduleModal/ # Reschedule suggestions
│   ├── AIBreakdownButton/   # Task breakdown UI
│   └── Chatbot/       # AI chat components
├── contexts/          # MessengerContext (Socket.IO)
├── services/          # API calls, Google services
├── store/             # Redux store + auth slice
├── layouts/           # Main layout, sidebar
└── routes/            # Route definitions
```

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
# → http://localhost:5173

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

## Environment

Create `.env` at project root:

```env
VITE_API_URL=http://localhost:3002
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Related

- **Backend**: [AI-powered-task-management](../../../KhoaNode/AI-powered-task-management) — Node.js + Express + MongoDB
