import { io, type Socket } from "socket.io-client";
import type { RestClient } from "../rest/RestClient.js";
import type {
  ClientEventArgs,
  ClientEventName,
  ClientToServerEvents,
  ServerEventHandler,
  ServerEventName,
  ServerToClientEvents,
} from "./events.js";

export interface GatewayOptions {
  url?: string;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelayMs?: number;
  reconnectionDelayMaxMs?: number;
  timeoutMs?: number;
  transports?: string[];
}

export type KarotterSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export class Gateway {
  private socket: KarotterSocket | null = null;

  constructor(
    private readonly rest: RestClient,
    private readonly options: GatewayOptions = {},
  ) {}

  connect(): KarotterSocket {
    if (this.socket) return this.socket;
    const url = this.options.url ?? this.rest.baseUrl;
    const token = this.rest.auth.accessToken;
    this.socket = io(url, {
      auth: token ? { token } : {},
      withCredentials: true,
      transports: this.options.transports ?? ["websocket"],
      reconnection: this.options.reconnection ?? true,
      reconnectionAttempts:
        this.options.reconnectionAttempts ?? Number.POSITIVE_INFINITY,
      reconnectionDelay: this.options.reconnectionDelayMs ?? 1000,
      reconnectionDelayMax: this.options.reconnectionDelayMaxMs ?? 8000,
      timeout: this.options.timeoutMs ?? 20000,
    }) as KarotterSocket;
    return this.socket;
  }

  reconnect(): KarotterSocket {
    this.disconnect();
    return this.connect();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<T extends ServerEventName>(event: T, listener: ServerEventHandler<T>): this {
    this.connect().on(event, listener as never);
    return this;
  }

  once<T extends ServerEventName>(event: T, listener: ServerEventHandler<T>): this {
    this.connect().once(event, listener as never);
    return this;
  }

  off<T extends ServerEventName>(event: T, listener?: ServerEventHandler<T>): this {
    if (!this.socket) return this;
    if (listener) this.socket.off(event, listener as never);
    else this.socket.removeAllListeners(event);
    return this;
  }

  emit<T extends ClientEventName>(event: T, ...args: ClientEventArgs<T>): this {
    const socket = this.connect();
    const emitFn = socket.emit.bind(socket) as (
      name: T,
      ...eventArgs: ClientEventArgs<T>
    ) => void;
    emitFn(event, ...args);
    return this;
  }

  get current(): KarotterSocket | null {
    return this.socket;
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }
}
