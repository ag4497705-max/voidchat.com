# Socket.IO Chat Demo

Minimal chat demo with:
- Backend: Express + Socket.IO (port 3000)
- Frontend: Vite + React (port 5173)

Run locally:

1. Backend
   - cd backend
   - npm install
   - npm start
   - Backend will run on http://localhost:3000

2. Frontend
   - cd frontend
   - npm install
   - npm run dev
   - Frontend will run on http://localhost:5173

Usage:
- Open http://localhost:5173 in two browser windows/tabs.
- Choose a room (General / Random), type messages and see them appear in both windows in real-time.
- Typing indicator is displayed when the other user is typing.

Notes:
- This demo stores messages in memory — restarting the backend clears history.
- For production, add persistence (Postgres), authentication, and a Redis adapter for scaling Socket.IO.
