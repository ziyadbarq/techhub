/**
 * Partykit Demo Component
 *
 * Demonstrates real-time WebSocket communication using Partykit.
 * Shows multi-user collaboration with participant tracking and messaging.
 *
 * Features:
 * - Live participant list
 * - Real-time message broadcasting
 * - Presence updates
 * - Connection status
 * - Type-safe messaging
 */

"use client";

import { useState } from "react";
import { formatTime } from "@/lib/utils/date-format";
import { usePartykit } from "@/lib/hooks/usePartykit";
import type { Participant } from "@/lib/hooks/usePartykit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
// Avatar component not yet created, using div placeholder
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/**
 * Chat message structure
 */
interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

/**
 * Partykit Demo Component
 */
export function PartykitDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [userName, setUserName] = useState(() => {
    // Generate random user name
    return `User ${Math.floor(Math.random() * 1000)}`;
  });

  // Generate random color for this user
  const [userColor] = useState(() => {
    const colors = [
      "#ef4444",
      "#f59e0b",
      "#10b981",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  });

  // Connect to Partykit
  const { send, participants, isConnected, error } = usePartykit<ChatMessage>({
    room: "demo-room",
    party: "main",
    participant: {
      id: crypto.randomUUID(),
      name: userName,
      metadata: { color: userColor },
    },
    onMessage: (message) => {
      // Handle different message types
      if (message.type === "chat:message") {
        const chatMessage = message.payload as ChatMessage;
        setMessages((prev) => [...prev, chatMessage]);
      }
    },
  });

  /**
   * Sends a chat message
   */
  const sendMessage = () => {
    if (!inputValue.trim() || !isConnected) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      senderId: participants[0]?.id || "unknown",
      senderName: userName,
      text: inputValue.trim(),
      timestamp: Date.now(),
    };

    send({
      type: "chat:message",
      payload: message,
    });

    // Add to local messages immediately
    setMessages((prev) => [...prev, message]);

    // Clear input
    setInputValue("");
  };

  /**
   * Handles Enter key press
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Clears message history
   */
  const clearMessages = () => {
    setMessages([]);
  };

  /**
   * Gets participant color
   */
  const getParticipantColor = (participant: Participant) => {
    return (participant.metadata?.color as string) || "#64748b";
  };

  return (
    <div className="space-y-4">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Partykit Connection</CardTitle>
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
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: userColor }}
            >
              {userName[0]}
            </div>
            <div className="flex-1">
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name"
                className="max-w-xs"
              />
            </div>
          </div>

          {/* Connection Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Room:</span>{" "}
              <code className="text-xs">demo-room</code>
            </div>
            <div>
              <span className="text-muted-foreground">Party:</span>{" "}
              <code className="text-xs">main</code>
            </div>
            <div>
              <span className="text-muted-foreground">Participants:</span>{" "}
              <span className="font-medium">{participants.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Messages:</span>{" "}
              <span className="font-medium">{messages.length}</span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="border-destructive bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
              Error: {error.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participants Card */}
      <Card>
        <CardHeader>
          <CardTitle>Participants ({participants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {participants.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                No participants yet
              </div>
            ) : (
              participants.map((participant) => (
                <div
                  key={participant.id}
                  className="border-border bg-card flex items-center gap-2 rounded-md border px-3 py-2"
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: getParticipantColor(participant),
                    }}
                  />
                  <span className="text-sm font-medium">
                    {participant.name || "Anonymous"}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chat Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Real-time Chat</CardTitle>
            <Button onClick={clearMessages} variant="outline" size="sm">
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages */}
          <ScrollArea className="border-border h-[300px] rounded-md border p-4">
            {messages.length === 0 ? (
              <div className="text-muted-foreground flex h-full items-center justify-center">
                No messages yet. Start chatting!
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold">
                        {message.senderName}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatTime(new Date(message.timestamp))}
                      </span>
                    </div>
                    <div className="text-sm">{message.text}</div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isConnected ? "Type a message..." : "Connecting to room..."
              }
              disabled={!isConnected}
            />
            <Button
              onClick={sendMessage}
              disabled={!isConnected || !inputValue.trim()}
            >
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>This demo uses Partykit for real-time WebSocket communication.</p>
          <p className="font-medium">To test real-time features:</p>
          <ol className="text-muted-foreground list-inside list-decimal space-y-1">
            <li>Open this page in multiple browser tabs or windows</li>
            <li>Each tab will appear as a separate participant in the room</li>
            <li>
              Send messages from any tab and see them appear instantly in all
              tabs
            </li>
            <li>Close a tab and watch the participant count update</li>
          </ol>
          <p className="text-muted-foreground">
            This demonstrates bi-directional communication, unlike SSE which is
            one-way.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
