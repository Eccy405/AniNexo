import { Server } from 'socket.io';

class SocketService {
  private io: Server | null = null;

  init(io: Server) {
    this.io = io;
  }

  emitToUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  emitToRoom(room: string, event: string, data: any) {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }

  getIO() {
    return this.io;
  }
}

export const socketService = new SocketService();
