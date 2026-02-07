import Peer, { DataConnection } from 'peerjs';

export type GameMessage = 
  | { type: 'sync'; state: GameState }
  | { type: 'shot'; strikerX: number; velocityX: number; velocityY: number }
  | { type: 'ready' }
  | { type: 'turn-end'; nextPlayer: 'white' | 'black' }
  | { type: 'piece-pocketed'; pieceIndex: number }
  | { type: 'striker-reset'; x: number; y: number };

export interface GameState {
  pieces: { x: number; y: number; type: string; pocketed: boolean }[];
  currentPlayer: 'white' | 'black';
  whiteScore: number;
  blackScore: number;
  queenPocketed: boolean;
  queenCovered: boolean;
}

type MessageHandler = (message: GameMessage) => void;
type ConnectionHandler = () => void;

export class NetworkManager {
  private static instance: NetworkManager;
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private isHost = false;
  private gameId = '';
  private messageHandlers: MessageHandler[] = [];
  private connectHandlers: ConnectionHandler[] = [];
  private disconnectHandlers: ConnectionHandler[] = [];
  private ready = false;

  private constructor() {}

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  isConnected(): boolean {
    return this.connection !== null && this.connection.open;
  }

  isHostPlayer(): boolean {
    return this.isHost;
  }

  getGameId(): string {
    return this.gameId;
  }

  isReady(): boolean {
    return this.ready;
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  onConnect(handler: ConnectionHandler): void {
    this.connectHandlers.push(handler);
  }

  onDisconnect(handler: ConnectionHandler): void {
    this.disconnectHandlers.push(handler);
  }

  removeAllListeners(): void {
    this.messageHandlers = [];
    this.connectHandlers = [];
    this.disconnectHandlers = [];
  }

  send(message: GameMessage): void {
    if (this.connection && this.connection.open) {
      this.connection.send(message);
    }
  }

  async createGame(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Generate a short game ID
      this.gameId = this.generateGameId();
      this.isHost = true;
      
      this.peer = new Peer(`carrom-${this.gameId}`, {
        debug: 0,
      });

      this.peer.on('open', (id) => {
        console.log('Host peer opened:', id);
        this.ready = true;
        resolve(this.gameId);
      });

      this.peer.on('connection', (conn) => {
        console.log('Guest connected');
        this.connection = conn;
        this.setupConnection();
      });

      this.peer.on('error', (err) => {
        console.error('Peer error:', err);
        if (err.type === 'unavailable-id') {
          // ID already taken, generate new one
          this.gameId = this.generateGameId();
          this.peer?.destroy();
          this.createGame().then(resolve).catch(reject);
        } else {
          reject(err);
        }
      });
    });
  }

  async joinGame(gameId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.gameId = gameId.toUpperCase();
      this.isHost = false;

      this.peer = new Peer({
        debug: 0,
      });

      this.peer.on('open', () => {
        console.log('Guest peer opened, connecting to host...');
        
        const conn = this.peer!.connect(`carrom-${this.gameId}`, {
          reliable: true,
        });

        conn.on('open', () => {
          console.log('Connected to host');
          this.connection = conn;
          this.ready = true;
          this.setupConnection();
          resolve();
        });

        conn.on('error', (err) => {
          console.error('Connection error:', err);
          reject(err);
        });

        // Timeout for connection
        setTimeout(() => {
          if (!this.connection) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      });

      this.peer.on('error', (err) => {
        console.error('Peer error:', err);
        reject(err);
      });
    });
  }

  private setupConnection(): void {
    if (!this.connection) return;

    this.connection.on('data', (data) => {
      const message = data as GameMessage;
      this.messageHandlers.forEach(handler => handler(message));
    });

    this.connection.on('close', () => {
      console.log('Connection closed');
      this.disconnectHandlers.forEach(handler => handler());
    });

    this.connection.on('error', (err) => {
      console.error('Connection error:', err);
    });

    // Notify connection handlers
    this.connectHandlers.forEach(handler => handler());
  }

  disconnect(): void {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.ready = false;
    this.gameId = '';
    this.isHost = false;
  }

  private generateGameId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  getShareableLink(): string {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?join=${this.gameId}`;
  }
}
