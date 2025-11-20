# Real-time Features Guide

This guide covers the real-time communication features in the Barq App Boilerplate, including Server-Sent Events (SSE) and Partykit (WebSocket).

## Table of Contents

- [Overview](#overview)
- [SSE vs Partykit: When to Use What](#sse-vs-partykit-when-to-use-what)
- [Server-Sent Events (SSE)](#server-sent-events-sse)
- [Partykit (WebSocket)](#partykit-websocket)
- [Integration Examples](#integration-examples)
- [Performance Considerations](#performance-considerations)
- [Troubleshooting](#troubleshooting)

## Overview

The boilerplate provides two real-time communication strategies:

1. **Server-Sent Events (SSE)**: One-way server-to-client streaming
2. **Partykit (WebSocket)**: Bi-directional real-time communication

Both follow Clean Architecture principles with:

- Core interfaces in `src/core/services/`
- Infrastructure implementations in `src/infrastructure/services/`
- Dependency injection for testability
- Type-safe message handling

## SSE vs Partykit: When to Use What

### Use SSE When:

- ✅ One-way communication (server → client)
- ✅ Real-time notifications
- ✅ Progress updates
- ✅ Live data feeds
- ✅ Simpler implementation needed
- ✅ Automatic reconnection is critical
- ✅ HTTP/2 multiplexing is available

**Examples**: Task completion notifications, build progress, price updates

### Use Partykit When:

- ✅ Bi-directional communication needed
- ✅ Multi-user collaboration
- ✅ Chat or messaging
- ✅ Cursor positions / presence
- ✅ Live editing
- ✅ Complex state synchronization
- ✅ Game-like interactions

**Examples**: Collaborative task editing, real-time chat, live cursors

### Performance Comparison

| Feature              | SSE                              | Partykit                        |
| -------------------- | -------------------------------- | ------------------------------- |
| **Connections**      | HTTP (text/event-stream)         | WebSocket                       |
| **Direction**        | Server → Client                  | Bi-directional                  |
| **Protocol**         | HTTP/1.1 or HTTP/2               | WebSocket                       |
| **Reconnection**     | Automatic (EventSource)          | Manual (but handled by hook)    |
| **Message Overhead** | Higher (HTTP headers)            | Lower (WebSocket frames)        |
| **Browser Support**  | Excellent (IE/Edge: polyfill)    | Excellent (all modern browsers) |
| **Scaling**          | Vertical (connection per client) | Horizontal (Partykit rooms)     |

## Server-Sent Events (SSE)

### Architecture

```
┌─────────────────────────────────────────────────────┐
│ Client (Browser)                                    │
│  ├─ useSSE Hook                                     │
│  └─ EventSource API                                 │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP GET
                      │ text/event-stream
                      ▼
┌─────────────────────────────────────────────────────┐
│ Next.js API Route                                   │
│  ├─ /api/sse/task-updates/route.ts                 │
│  └─ createStream()                                  │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ SSE Service (DI Container)                          │
│  ├─ ISSEService interface                           │
│  ├─ SSEService implementation                       │
│  ├─ Channel-based broadcasting                      │
│  └─ In-memory event buffering                       │
└─────────────────────────────────────────────────────┘
```

### Setting Up SSE

#### 1. Create an API Route

```typescript
// src/app/api/sse/my-updates/route.ts
import { NextRequest } from "next/server";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ISSEService, SSEEvent } from "@/core/services";

export async function GET(request: NextRequest) {
  const container = getContainer();
  const sseService = container.get<ISSEService>(DI_TOKENS.ISSEService);

  const channel = request.nextUrl.searchParams.get("channel") || "default";

  async function* eventStream() {
    yield {
      event: "connected",
      data: { message: "Connected to stream" },
    } as SSEEvent;

    for await (const event of sseService.subscribe(channel)) {
      yield event;
    }
  }

  const stream = sseService.createStream(eventStream(), {
    keepAlive: 15000,
    retryInterval: 3000,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
```

#### 2. Use the Hook in Your Component

```typescript
"use client";

import { useSSE } from "@/lib/hooks/useSSE";

function MyComponent() {
  const { data, error, isConnected } = useSSE<MyDataType>(
    "/api/sse/my-updates",
    {
      onMessage: (data) => {
        console.log("Received:", data);
      },
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
    }
  );

  return (
    <div>
      <div>Status: {isConnected ? "Connected" : "Disconnected"}</div>
      {data && <div>Latest: {JSON.stringify(data)}</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

#### 3. Broadcasting Events

Use the `BroadcastTaskEventUseCase` or broadcast directly:

```typescript
// In a use case or controller
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ISSEService } from "@/core/services";

const container = getContainer();
const sseService = container.get<ISSEService>(DI_TOKENS.ISSEService);

await sseService.broadcastEvent("my-channel", {
  event: "data:updated",
  data: { id: "123", value: "new value" },
  id: crypto.randomUUID(),
});
```

### SSE Message Format

SSE messages follow this format:

```
id: unique-event-id
event: event-type
data: {"key": "value"}
retry: 3000

```

The SSE service automatically formats messages correctly.

## Partykit (WebSocket)

### Architecture

```
┌─────────────────────────────────────────────────────┐
│ Client (Browser)                                    │
│  ├─ usePartykit Hook                                │
│  └─ PartySocket Client                              │
└─────────────────────┬───────────────────────────────┘
                      │ WebSocket
                      │ ws://host/party/room
                      ▼
┌─────────────────────────────────────────────────────┐
│ Partykit Server                                     │
│  ├─ partykit/server.ts (main)                       │
│  ├─ partykit/servers/task-collaboration.ts          │
│  └─ partykit/servers/presence.ts                    │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ Partykit Service (DI Container)                     │
│  ├─ IRealtimeService interface                      │
│  ├─ PartykitService implementation                  │
│  └─ Connection pooling                              │
└─────────────────────────────────────────────────────┘
```

### Setting Up Partykit

#### 1. Start Partykit Server

```bash
# Development
npm run partykit:dev

# This starts Partykit on localhost:1999
```

#### 2. Use the Hook in Your Component

```typescript
"use client";

import { usePartykit } from "@/lib/hooks/usePartykit";
import type { RealtimeMessage } from "@/lib/hooks/usePartykit";

function CollaborativeComponent() {
  const { send, participants, isConnected } = usePartykit({
    room: "task-123",
    party: "task-collaboration",
    participant: {
      id: "user-456",
      name: "John Doe",
      metadata: { color: "#3b82f6" },
    },
    onMessage: (message: RealtimeMessage) => {
      console.log("Received:", message);
    },
  });

  const handleUpdate = () => {
    send({
      type: "task:update",
      payload: { status: "completed" },
    });
  };

  return (
    <div>
      <div>Connected: {isConnected ? "Yes" : "No"}</div>
      <div>Participants: {participants.length}</div>
      <button onClick={handleUpdate}>Send Update</button>
    </div>
  );
}
```

#### 3. Create Custom Party Servers

Create specialized servers for different use cases:

```typescript
// partykit/servers/my-feature.ts
import type * as Party from "partykit/server";

export default class MyFeatureServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`Connection ${conn.id} joined`);
  }

  async onMessage(message: string, sender: Party.Connection) {
    // Broadcast to all
    this.room.broadcast(message);
  }

  async onClose(conn: Party.Connection) {
    console.log(`Connection ${conn.id} left`);
  }
}

MyFeatureServer satisfies Party.Worker;
```

Register in `partykit.json`:

```json
{
  "parties": {
    "my-feature": "partykit/servers/my-feature.ts"
  }
}
```

### Partykit Message Format

Messages are JSON objects:

```typescript
{
  type: "message-type",
  payload: { /* your data */ },
  senderId?: "connection-id",
  timestamp?: 1234567890
}
```

## Integration Examples

### Example 1: Task Updates with SSE

```typescript
// In your task controller (after creating a task)
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { BroadcastTaskEventUseCase } from "@/core/use-cases/realtime/broadcast-task-event.use-case";

const container = getContainer();
const broadcastTaskEvent = container.get<BroadcastTaskEventUseCase>(
  DI_TOKENS.BroadcastTaskEventUseCase,
);

// After successful task creation
await broadcastTaskEvent.broadcastCreated(task);
```

### Example 2: Collaborative Task Editing with Partykit

```typescript
"use client";

function TaskEditor({ taskId }: { taskId: string }) {
  const [taskData, setTaskData] = useState<Task>();

  const { send, participants } = usePartykit({
    room: `task-${taskId}`,
    party: "task-collaboration",
    participant: {
      id: currentUserId,
      name: currentUserName,
    },
    onMessage: (message) => {
      if (message.type === "task:update") {
        setTaskData(message.payload as Task);
      }
    },
  });

  const handleFieldUpdate = (field: string, value: unknown) => {
    // Broadcast to other users
    send({
      type: "field:update",
      payload: { field, value },
    });

    // Update locally
    setTaskData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <div>Editing with {participants.length - 1} others</div>
      {/* Your form fields */}
    </div>
  );
}
```

### Example 3: Presence Tracking

```typescript
"use client";

function PresenceIndicator({ roomId }: { roomId: string }) {
  const { participants, updatePresence } = usePartykit({
    room: roomId,
    party: "presence",
    participant: {
      id: currentUserId,
      name: currentUserName,
      avatar: currentUserAvatar,
    },
  });

  // Update presence every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      updatePresence({ metadata: { lastActive: Date.now() } });
    }, 30000);

    return () => clearInterval(interval);
  }, [updatePresence]);

  return (
    <div>
      {participants.map((p) => (
        <Avatar key={p.id} name={p.name} avatar={p.avatar} />
      ))}
    </div>
  );
}
```

## Performance Considerations

### SSE Performance

**Connection Limits**:

- Browsers limit 6 concurrent SSE connections per domain (HTTP/1.1)
- HTTP/2 removes this limit (multiplexing)
- Consider using a single SSE connection for multiple channels

**Memory Usage**:

- Each connection maintains a buffer (default: 100 events)
- Monitor `sseService.getSubscriberCount(channel)` for scaling

**Optimization Tips**:

```typescript
// Use a single connection with channel filtering
const { data } = useSSE("/api/sse/updates", {
  onMessage: (data, event) => {
    // Filter by event type
    if (event.type === "task:created") {
      // Handle task creation
    }
  },
});
```

### Partykit Performance

**Room Scaling**:

- Each room is a separate Partykit instance
- Rooms scale horizontally
- Limit participants per room (recommended: <100)

**Message Size**:

- Keep messages small (<1KB recommended)
- Use compression for large payloads
- Consider debouncing frequent updates

**Connection Management**:

```typescript
// Debounce cursor updates
const debouncedUpdateCursor = debounce((x, y) => {
  send({ type: "cursor:move", payload: { x, y } });
}, 100);
```

### General Best Practices

1. **Graceful Degradation**: Handle disconnections gracefully
2. **Reconnection Strategy**: Exponential backoff for reconnections
3. **Error Handling**: Always handle errors in message handlers
4. **Cleanup**: Always cleanup on component unmount
5. **Type Safety**: Use TypeScript generics for message typing

## Troubleshooting

### SSE Issues

**Problem: Connection keeps dropping**

- Check firewall/proxy settings (some block text/event-stream)
- Increase keep-alive interval
- Verify server timeout settings

**Problem: Events not received**

- Check channel names match
- Verify event is being broadcast
- Check browser console for errors

**Problem: Memory leak**

- Ensure proper cleanup in `useEffect`
- Check event buffer size
- Monitor subscriber count

### Partykit Issues

**Problem: Cannot connect to Partykit**

- Verify Partykit is running: `npm run partykit:dev`
- Check host configuration (default: localhost:1999)
- Verify room/party names are correct

**Problem: Messages not syncing**

- Check message format (must be valid JSON)
- Verify all clients are in the same room
- Check Partykit server logs

**Problem: Too many connections**

- Limit participants per room
- Use presence server for lightweight tracking
- Consider connection pooling

### Debugging

Enable debug logging:

```typescript
// SSE Debug
const { data, error } = useSSE("/api/sse/updates", {
  onOpen: () => console.log("[SSE] Connected"),
  onMessage: (data) => console.log("[SSE] Message:", data),
  onError: (error) => console.error("[SSE] Error:", error),
  onClose: () => console.log("[SSE] Closed"),
});

// Partykit Debug
const { send, isConnected } = usePartykit({
  room: "debug-room",
  onOpen: () => console.log("[Partykit] Connected"),
  onMessage: (msg) => console.log("[Partykit] Message:", msg),
  onError: (err) => console.error("[Partykit] Error:", err),
  onClose: () => console.log("[Partykit] Closed"),
});
```

## Next Steps

- See [SSE Demo Component](../../src/components/demos/sse-demo.tsx) for a working example
- See [Partykit Demo Component](../../src/components/demos/partykit-demo.tsx) for a working example
- Review [Architecture Documentation](../ARCHITECTURE.md) for system design
- Check [Developer Guide](../DEVELOPER_GUIDE.md) for general development patterns

## Resources

- [Server-Sent Events MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Partykit Documentation](https://docs.partykit.io/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
