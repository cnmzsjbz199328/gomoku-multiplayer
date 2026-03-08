import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string) || 'http://localhost:5000';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * 初始化连接
   */
  public connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket'],
      });

      this.socket.on('connect', () => console.log('WebSocket Connected'));
      this.socket.on('disconnect', () => console.log('WebSocket Disconnected'));
    }
    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public emit(event: string, data?: any): void {
    this.socket?.emit(event, data);
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  public off(event: string): void {
    this.socket?.off(event);
  }
}

export default SocketService.getInstance();
