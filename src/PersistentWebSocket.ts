/**
    @file PersistentWebSocket.ts
    @description Class for establishing and maintaining a WebSocket connection with automatic reconnection functionality.
    @copyright 2022 ChecksumDev
*/

import { WebSocket, ErrorEvent, MessageEvent } from 'ws';

export class PersistentWebSocket {
    public ws: WebSocket | null;
    private url: string;
    private reconnectInterval: number;
    private reconnectDecay: number;
    private reconnectAttempts: number;
    private reconnectTimeout: NodeJS.Timeout | null;
    private shouldReconnect: boolean;
    private onMessageCallback: (event: MessageEvent) => void;
    private classState: unknown;

    constructor(url: string, onMessageCallback: ((event: MessageEvent) => void), classState: unknown, reconnectInterval = 1000, reconnectDecay = 1.5, reconnectAttempts = 15) {
        this.url = url;
        this.reconnectInterval = Math.max(reconnectInterval, 0); // ensure that the interval is a positive value
        this.reconnectDecay = Math.max(reconnectDecay, 1); // ensure that the decay is at least 1
        this.reconnectAttempts = Math.max(reconnectAttempts, 0); // ensure that the number of attempts is a positive value
        this.ws = null;
        this.reconnectTimeout = null;
        this.shouldReconnect = true;

        this.onMessageCallback = onMessageCallback;
        this.classState = classState

        this.connect();
    }

    private connect() {
        // prevent multiple WebSocket connections from being established simultaneously
        if (this.ws !== null && (this.ws.readyState === WebSocket.CLOSING || this.ws.readyState === WebSocket.OPEN)) {
            return;
        }

        try {
            this.ws = new WebSocket(this.url);
        } catch (error) {
            console.error('Error creating WebSocket:', error);
            return;
        }

        this.ws.onopen = () => {
            console.log('WebSocket connection established');
            // reset the reconnect attempts and interval on successful connection
            this.reconnectAttempts = 15;
            this.reconnectInterval = 1000;
            this.reconnectTimeout = null;
        };

        this.ws.onclose = () => {
            console.log('WebSocket connection closed');
            if (this.shouldReconnect && this.reconnectAttempts-- > 0) {
                // increase the reconnect interval for each failed attempt
                this.reconnectInterval *= this.reconnectDecay;
                this.reconnectTimeout = setTimeout(() => this.connect(), this.reconnectInterval);

                console.log(`Reconnecting in ${this.reconnectInterval / 1000} seconds...`);
            }
        };

        this.ws.onerror = (event: ErrorEvent) => {
            console.error('WebSocket error:', event.error);
        };

        this.ws.onmessage = (event: MessageEvent) => {
            this.onMessageCallback.bind(this.classState)(event)
        }
    }

    public close(): void {
        this.shouldReconnect = false;
        if (this.ws) {
            this.ws.close();
        }
    }

    public isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    public stopReconnecting(): void {
        this.shouldReconnect = false;
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }
}