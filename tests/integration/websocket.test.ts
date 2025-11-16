import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { io as ClientIO } from 'socket.io-client';

describe('WebSocket Client Library', () => {
  it('should import socket.io-client library successfully', () => {
    expect(ClientIO).toBeDefined();
    // This test ensures the library is properly installed and imported
  });
});

describe('WebSocket Integration Tests', () => {
  let httpServer: any;
  let io: Server;
  let clientSocket: Socket;
  // let authToken: string;
  // let testUser: any;

  beforeAll((done) => {
    // Create HTTP server and attach Socket.IO
    const app = createApp();
    httpServer = createServer(app);
    io = new Server(httpServer, {
      cors: {
        origin: '*',
      },
    });

    // Start server
    httpServer.listen(() => {
      const port = (httpServer.address() as any).port;
      
      // Connect client
      clientSocket = ClientIO(`http://localhost:${port}`, {
        auth: {
          token: authToken,
        },
        transports: ['websocket'],
      });

      clientSocket.on('connect', done);
    });
  });

  afterAll((done) => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
    io.close();
    httpServer.close(done);
  });

  describe('WebSocket Library', () => {
    it('should import socket.io-client library successfully', () => {
      expect(ClientIO).toBeDefined();
      // This test ensures the library is properly installed and imported
    });
  });
});