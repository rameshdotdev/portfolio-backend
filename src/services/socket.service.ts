// services/socket.service.ts
import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { env } from "../config/env.js";

export interface SocketPayload<T = any> {
  event: string;
  data: T;
}

class SocketService {
  private io?: Server;

  init(server: HTTPServer) {
    this.io = new Server(server, {
      cors: {
        origin: env.FRONTEND_URL,
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket: Socket) => {
      console.log("🟢 Socket connected:", socket.id);

      socket.on("ping", () => {
        socket.emit("pong", Date.now());
      });

      socket.on("join-room", (roomId: string) => {
        socket.join(roomId);
        socket.emit("joined-room", roomId);
      });

      socket.on("disconnect", () => {
        console.log("🔴 Socket disconnected:", socket.id);
      });
    });
  }
  emit(event: string, payload: any) {
    this.io?.emit(event, payload);
  }
  emitToSocket(socketId: string, event: string, data: any) {
    this.io?.to(socketId).emit(event, data);
  }

  emitToRoom(room: string, event: string, data: any) {
    this.io?.to(room).emit(event, data);
  }

  broadcast(event: string, data: any) {
    this.io?.emit(event, data);
  }

  getIO() {
    if (!this.io) {
      throw new Error("Socket.io not initialized");
    }
    return this.io;
  }
}

export const socketService = new SocketService();
