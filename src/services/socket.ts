// Socket.IO client - Currently disabled for production
// Uncomment and install socket.io-client when chat feature is ready
// import { io, Socket } from 'socket.io-client';

// Socket.IO server URL
const SOCKET_URL = 'https://yann-care.vercel.app';

class SocketService {
  private socket: any = null;
  private userId: string | null = null;

  connect(userId: string) {
    // Chat functionality disabled - will be implemented in future release
    console.log('⚠️ Socket connection disabled - Chat feature coming soon');
    return;
    
    /* Disabled for production - enable when socket.io-client is installed
    if (this.socket?.connected) {
      return;
    }

    this.userId = userId;
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      console.log('📡 Connected to:', SOCKET_URL);
      this.socket?.emit('user:online', { userId });
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('❌ Socket connection error:', error.message);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
    */
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  // Join a conversation room
  joinConversation(conversationId: string) {
    this.socket?.emit('conversation:join', { conversationId });
  }

  // Leave a conversation room
  leaveConversation(conversationId: string) {
    this.socket?.emit('conversation:leave', { conversationId });
  }

  // Send a message
  sendMessage(conversationId: string, message: string, recipientId: string) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit(
        'message:send',
        { conversationId, message, recipientId },
        (response: any) => {
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error || 'Failed to send message'));
          }
        }
      );
    });
  }

  // Listen for new messages
  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('message:new', callback);
  }

  // Listen for typing indicators
  onTyping(callback: (data: { conversationId: string; userId: string; isTyping: boolean }) => void) {
    this.socket?.on('user:typing', callback);
  }

  // Emit typing indicator
  emitTyping(conversationId: string, isTyping: boolean) {
    this.socket?.emit('user:typing', { conversationId, isTyping });
  }

  // Listen for user online status
  onUserStatusChange(callback: (data: { userId: string; online: boolean }) => void) {
    this.socket?.on('user:status', callback);
  }

  // Mark messages as read
  markAsRead(conversationId: string, messageIds: string[]) {
    this.socket?.emit('messages:read', { conversationId, messageIds });
  }

  // Remove event listeners
  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  // Check connection status
  isConnected(): boolean {
    return false; // Chat disabled
  }

  // Get socket instance
  getSocket(): any {
    return this.socket;
  }
}

export const socketService = new SocketService();
