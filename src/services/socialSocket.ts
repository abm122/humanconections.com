/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalledBall } from '../types/bingo';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text: string;
  type: 'text' | 'reaction' | 'achievement' | 'cheer';
  reactionEmoji?: string;
  achievementTitle?: string;
  timestamp: number;
}

export interface Friend {
  id: string;
  name: string;
  color: string;
  isOnline: boolean;
  statusText?: string;
  lastActive: number;
}

export interface CustomCard {
  id: string;
  title: string;
  theme: string;
  creatorName: string;
  items: string[];
  createdAt: number;
}

export interface RoomParticipant {
  id: string;
  name: string;
  color: string;
}

type EventListener = (payload: unknown) => void;

class SocialSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<EventListener>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pendingMessages: string[] = [];
  private currentUserId: string = '';
  private currentUserName: string = '';
  private currentUserColor: string = '#f59e0b';
  private currentRoomId: string = 'joy-lounge';
  private isConnected: boolean = false;
  private tvWatchEmitter: (() => void) | null = null;

  constructor() {
    // Generate or restore user profile
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('joypulse_user_id');
      const savedName = localStorage.getItem('joypulse_user_name');
      const savedColor = localStorage.getItem('joypulse_user_color');

      this.currentUserId = savedId || `user-${Math.random().toString(36).substring(2, 7)}`;
      this.currentUserName = savedName || `JoySeeker-${this.currentUserId.slice(-3)}`;
      this.currentUserColor = savedColor || ['#f59e0b', '#059669', '#7c3aed', '#0284c7', '#e11d48'][Math.floor(Math.random() * 5)];

      localStorage.setItem('joypulse_user_id', this.currentUserId);
      localStorage.setItem('joypulse_user_name', this.currentUserName);
      localStorage.setItem('joypulse_user_color', this.currentUserColor);
    }
  }

  public getProfile() {
    return {
      id: this.currentUserId,
      name: this.currentUserName,
      color: this.currentUserColor,
      roomId: this.currentRoomId,
    };
  }

  public updateProfile(name: string, color?: string) {
    this.currentUserName = name;
    if (color) this.currentUserColor = color;
    if (typeof window !== 'undefined') {
      localStorage.setItem('joypulse_user_name', this.currentUserName);
      if (color) localStorage.setItem('joypulse_user_color', this.currentUserColor);
    }
    this.send('user:init', {
      id: this.currentUserId,
      name: this.currentUserName,
      color: this.currentUserColor,
      roomId: this.currentRoomId,
    });
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'ws:ping', payload: { ts: Date.now() } }));
        } catch {
          // ignore
        }
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public connect(roomId = 'joy-lounge') {
    this.currentRoomId = roomId;
    if (typeof window === 'undefined') return;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.joinRoom(roomId);
      return;
    }
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const socket = new WebSocket(wsUrl);
      this.ws = socket;

      socket.onopen = () => {
        if (this.ws !== socket) return;
        this.isConnected = true;
        this.startHeartbeat();
        this.emit('connection:change', true);
        if (this.tvWatchEmitter) {
          this.tvWatchEmitter();
        } else {
          socket.send(
            JSON.stringify({
              type: 'user:init',
              payload: {
                id: this.currentUserId,
                name: this.currentUserName,
                color: this.currentUserColor,
                roomId: this.currentRoomId,
              },
            })
          );
          if (this.pendingMessages.length > 0) {
            const queued = [...this.pendingMessages];
            this.pendingMessages = [];
            for (const rawMsg of queued) {
              try {
                if (socket.readyState === WebSocket.OPEN) {
                  socket.send(rawMsg);
                }
              } catch {
                // ignore
              }
            }
          }
          this.emit('connection:open', true);
        }
      };

      socket.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data);
          this.emit(type, payload);
        } catch {
          // ignore
        }
      };

      socket.onclose = () => {
        if (this.ws === socket) {
          this.ws = null;
        }
        this.stopHeartbeat();
        this.isConnected = false;
        this.emit('connection:change', false);
        this.scheduleReconnect();
      };

      socket.onerror = () => {
        this.isConnected = false;
        this.emit('connection:change', false);
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(this.currentRoomId);
    }, 2000);
  }

  public send(type: string, payload: unknown) {
    const serialized = JSON.stringify({ type, payload });
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(serialized);
      return;
    }
    if (type !== 'ws:ping' && type !== 'user:init') {
      if (this.pendingMessages.length >= 50) {
        this.pendingMessages.shift();
      }
      this.pendingMessages.push(serialized);
    }
    if (typeof window !== 'undefined' && (!this.ws || this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING)) {
      this.connect(this.currentRoomId);
    }
  }

  public joinRoom(roomId: string) {
    this.currentRoomId = roomId;
    this.send('room:join', { roomId });
  }

  public connectAsTvViewer(roomId: string, onWatch: () => void) {
    this.currentRoomId = roomId;
    this.tvWatchEmitter = onWatch;
    this.pendingMessages = [];
    if (typeof window === 'undefined') return;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      onWatch();
      return;
    }
    this.connect(roomId);
  }

  public exitTvMode(roomId: string = 'joy-lounge') {
    this.tvWatchEmitter = null;
    this.currentRoomId = roomId;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send('tv:exit', {});
      this.send('user:init', {
        id: this.currentUserId,
        name: this.currentUserName,
        color: this.currentUserColor,
        roomId: this.currentRoomId,
      });
    }
  }

  public sendChatMessage(text: string) {
    this.send('chat:send', { text, type: 'text' });
  }

  public sendReaction(emoji: string) {
    this.send('chat:send', {
      text: emoji,
      type: 'reaction',
      reactionEmoji: emoji,
    });
  }

  public sendCheer(targetName: string) {
    this.send('friend:cheer', { targetName });
  }

  public broadcastAchievement(title: string) {
    this.send('achievement:broadcast', { title });
  }

  public broadcastBallDrawn(ball: CalledBall, hostKey?: string) {
    this.send('caller:ball_drawn', hostKey ? { ball, hostKey } : { ball });
  }

  public createCustomCard(title: string, theme: string, items: string[]) {
    this.send('card:create', { title, theme, items });
  }

  public banUser(targetUserId: string, targetUserName: string) {
    this.send('moderation:ban_user', { targetUserId, targetUserName });
  }

  public muteUser(targetUserId: string) {
    this.send('moderation:mute_user', { targetUserId });
  }

  public unbanUser(targetUserId: string) {
    this.send('moderation:unban_user', { targetUserId });
  }

  public sendHostMessage(text: string) {
    this.send('host:message', { text });
  }

  public replyHostMessage(targetUserId: string, text: string, hostName?: string) {
    this.send('host:reply', { targetUserId, text, hostName });
  }

  public on(event: string, callback: EventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: EventListener) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  private emit(event: string, payload: unknown) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error('Socket callback error', e);
        }
      });
    }
  }

  public getIsConnected() {
    return this.isConnected;
  }
}

export const socialSocket = new SocialSocketService();
