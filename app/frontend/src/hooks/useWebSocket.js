import { useState, useEffect, useCallback, useRef } from 'react';
import API_URL from '../config/api';

const WS_URL = API_URL.replace('http', 'ws') + '/ws';

export const useWebSocket = (symbols = []) => {
    const [lastTicker, setLastTicker] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    const connect = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        console.log(`>>> Connecting to WebSocket: ${WS_URL}`);
        const socket = new WebSocket(WS_URL);

        socket.onopen = () => {
            console.log('>>> WebSocket Connected');
            setIsConnected(true);
            if (symbols.length > 0) {
                socket.send(JSON.stringify({ type: 'subscribe', symbols }));
            }
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'ticker') {
                setLastTicker(message.data);
            }
        };

        socket.onclose = () => {
            console.log('>>> WebSocket Disconnected. Reconnecting...');
            setIsConnected(false);
            reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        socket.onerror = (error) => {
            console.error('>>> WebSocket Error:', error);
            socket.close();
        };

        socketRef.current = socket;
    }, [symbols]);

    useEffect(() => {
        connect();
        return () => {
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            if (socketRef.current) socketRef.current.close();
        };
    }, [connect]);

    const subscribe = useCallback((newSymbols) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: 'subscribe', symbols: newSymbols }));
        }
    }, []);

    return { lastTicker, isConnected, subscribe };
};
