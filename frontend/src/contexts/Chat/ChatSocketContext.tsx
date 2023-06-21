import React, { createContext, useEffect, useState } from "react";
import { useCurrentUser } from "../../hooks/Hooks";
import { io } from "socket.io-client";

export const ChatSocketContext: React.Context<any> = createContext(null);

export function SocketProvider({ children }: any) {
    const {
        token
    }: any = useCurrentUser();
    const [socket, setSocket]: any = useState();

    useEffect(() => {
        let s = io(`${process.env.REACT_APP_BACK}/chat`, {
            transports: ['websocket'],
            extraHeaders: {
                'Authorization': `Bearer ${token}`
            }
        });

        setSocket(s);

        return (() => {
            s.disconnect();
        })
    }, [])

    return (
        <ChatSocketContext.Provider value={{ socket }}>
            {children}
        </ChatSocketContext.Provider>
    )
}