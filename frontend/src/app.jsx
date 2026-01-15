import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';
const DEFAULT_ROOMS = ['general', 'random'];

export default function App() {
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [username, setUsername] = useState(() => 'user' + Math.floor(Math.random()*1000));
  const [typingUsers, setTypingUsers] = useState({});
  const messagesRef = useRef();

  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);

    s.on('connect', () => {
      s.emit('join_room', room);
    });

    s.on('message_created', (msg) => {
      setMessages((m) => [...m, msg]);
      scrollToBottom();
    });

    s.on('typing', ({ socketId, author }) => {
      setTypingUsers((t) => ({ ...t, [socketId]: author }));
    });

    s.on('stop_typing', ({ socketId }) => {
      setTypingUsers((t) => {
        const copy = { ...t };
        delete copy[socketId];
        return copy;
      });
    });

    return () => {
      s.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_room', room);
    // fetch recent messages from REST
    fetch(`${SOCKET_URL}/rooms/${room}/messages`)
      .then(r => r.json())
      .then(data => setMessages(data || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, socket]);

  function sendMessage() {
    if (!text.trim()) return;
    socket.emit('send_message', { room, author: username, content: text.trim() });
    setText('');
    socket.emit('stop_typing', { room, author: username });
  }

  let typingTimeout = useRef(null);
  function onChangeText(e) {
    setText(e.target.value);
    if (!socket) return;
    socket.emit('typing', { room, author: username });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stop_typing', { room, author: username });
    }, 800);
  }

  function scrollToBottom() {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Rooms</h2>
        {DEFAULT_ROOMS.map(r => (
          <button
            key={r}
            className={r === room ? 'active' : ''}
            onClick={() => setRoom(r)}
          >
            #{r}
          </button>
        ))}
        <div className="username">
          <label>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} />
        </div>
      </aside>

      <main className="chat">
        <header>
          <h3>#{room}</h3>
        </header>

        <div className="messages" ref={messagesRef}>
          {messages.map(m => (
            <div className="message" key={m.id}>
              <div className="meta">
                <span className="author">{m.author}</span>
                <span className="time">{new Date(m.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="content">{m.content}</div>
            </div>
          ))}
        </div>

        <div className="typing">
          {Object.values(typingUsers).length > 0 && (
            <em>{Object.values(typingUsers).join(', ')} typing...</em>
          )}
        </div>

        <div className="composer">
          <input
            placeholder="Type a message..."
            value={text}
            onChange={onChangeText}
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </main>
    </div>
  );
}
