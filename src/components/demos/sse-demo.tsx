/**
 * SSE Demo Component
 *
 * Demonstrates Server-Sent Events (SSE) for real-time task updates.
 * Shows connection status, live events, and manual reconnection.
 *
 * Features:
 * - Live connection status indicator
 * - Real-time event stream display
 * - Manual reconnect/disconnect controls
 * - Event history with timestamps
 * - Type-safe event handling
 */

"use client";

import { useState } from "react";
import { formatTime } from "@/lib/utils/date-format";
import { useSSE } from "@/lib/hooks/useSSE";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Task event data structure
 */
interface TaskEvent {
  id?: string;
  title?: string;
  status?: string;
  message?: string;
  timestamp?: number;
  [key: string]: unknown;
}

/**
 * Event log entry
 */
interface EventLogEntry {
  id: string;
  type: string;
  data: TaskEvent;
  timestamp: number;
}

/**
 * SSE Demo Component
 */
export function SSEDemo() {
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);

  // Connect to SSE endpoint
  const {
    isConnected,
    isReconnecting,
    reconnectAttempts,
    reconnect,
    disconnect,
  } = useSSE<TaskEvent>("/api/sse/task-updates", {
    onMessage: (data, event) => {
      // Add to event log
      const logEntry: EventLogEntry = {
        id: crypto.randomUUID(),
        type: event.type || "message",
        data,
        timestamp: Date.now(),
      };
      setEventLog((prev) => [logEntry, ...prev].slice(0, 50)); // Keep last 50 events
    },
    onOpen: () => {
      // Connection events surface in the on-screen event log
    },
    onError: (error) => {
      console.error("[SSE Demo] Error:", error);
    },
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
  });

  /**
   * Clears the event log
   */
  const clearLog = () => {
    setEventLog([]);
  };

  return (
    <div className="space-y-4">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>SSE Connection Status</CardTitle>
            <Badge
              variant={isConnected ? "default" : "secondary"}
              className={
                isConnected
                  ? "bg-success text-success-foreground"
                  : "bg-muted text-muted-foreground"
              }
            >
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Reconnecting:</span>{" "}
              <span className="font-medium">
                {isReconnecting ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Reconnect Attempts:</span>{" "}
              <span className="font-medium">{reconnectAttempts}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Events Received:</span>{" "}
              <span className="font-medium">{eventLog.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Endpoint:</span>{" "}
              <code className="text-xs">/api/sse/task-updates</code>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={reconnect}
              disabled={isConnected && !isReconnecting}
              variant="outline"
            >
              Reconnect
            </Button>
            <Button
              onClick={disconnect}
              disabled={!isConnected}
              variant="outline"
            >
              Disconnect
            </Button>
            <Button onClick={clearLog} variant="outline">
              Clear Log
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Event Log Card */}
      <Card>
        <CardHeader>
          <CardTitle>Live Event Stream</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {eventLog.length === 0 ? (
              <div className="text-muted-foreground flex h-full items-center justify-center">
                No events received yet. Waiting for updates...
              </div>
            ) : (
              <div className="space-y-2">
                {eventLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="border-border bg-card rounded-md border p-3 text-sm"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Badge variant="outline">{entry.type}</Badge>
                      <span className="text-muted-foreground text-xs">
                        {formatTime(new Date(entry.timestamp))}
                      </span>
                    </div>
                    <pre className="overflow-x-auto text-xs">
                      {JSON.stringify(entry.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Usage Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            This demo connects to the <code>/api/sse/task-updates</code>{" "}
            endpoint and displays live events.
          </p>
          <p className="font-medium">To trigger events:</p>
          <ol className="text-muted-foreground list-inside list-decimal space-y-1">
            <li>
              Create, update, or delete tasks in the Task Management section
            </li>
            <li>Events will appear here in real-time as they are broadcast</li>
            <li>
              Try disconnecting and reconnecting to test automatic reconnection
            </li>
          </ol>
          <p className="text-muted-foreground">
            Events are broadcast through an in-memory channel, so all connected
            clients will receive the same updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
