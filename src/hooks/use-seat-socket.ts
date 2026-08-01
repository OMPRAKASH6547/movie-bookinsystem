"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

type SeatUpdate = {
  showId: string;
  seatIds: string[];
  userId: string;
  action: "lock" | "unlock" | "booked";
};

export function useSeatSocket(
  showId: string | null,
  onUpdate: (event: SeatUpdate) => void
) {
  const socketRef = useRef<Socket | null>(null);
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    if (!showId || process.env.NEXT_PUBLIC_SOCKET_URL === "off") return;

    const url = process.env.NEXT_PUBLIC_SOCKET_URL || undefined;
    const socket = io(url || "", {
      path: "/api/socket",
      autoConnect: Boolean(url),
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    if (url) {
      socket.connect();
      socket.emit("join:show", showId);
      socket.on("seat:update", (event: SeatUpdate) => {
        if (event.showId === showId) callbackRef.current(event);
      });
    }

    return () => {
      socket.emit("leave:show", showId);
      socket.disconnect();
    };
  }, [showId]);

  return socketRef;
}
