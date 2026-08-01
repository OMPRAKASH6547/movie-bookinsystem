/**
 * Socket.io bootstrap for real-time seat locks & notifications.
 * Attach from a custom Node server or serverless-compatible adapter.
 *
 * Usage (custom server):
 *   import { createServer } from "http";
 *   import { initSocket } from "@/lib/socket/server";
 *   const httpServer = createServer(app);
 *   initSocket(httpServer);
 */

import type { Server as HttpServer } from "http";

type SeatEvent = {
  showId: string;
  seatIds: string[];
  userId: string;
  action: "lock" | "unlock" | "booked";
};

let io: import("socket.io").Server | null = null;

export function initSocket(httpServer: HttpServer) {
  // Dynamic import keeps Next edge bundles clean when unused
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Server } = require("socket.io") as typeof import("socket.io");

  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "*",
      credentials: true,
    },
    path: "/api/socket",
  });

  io.on("connection", (socket) => {
    socket.on("join:show", (showId: string) => {
      socket.join(`show:${showId}`);
    });

    socket.on("leave:show", (showId: string) => {
      socket.leave(`show:${showId}`);
    });

    socket.on("seat:event", (event: SeatEvent) => {
      socket.to(`show:${event.showId}`).emit("seat:update", event);
    });
  });

  return io;
}

export function emitSeatUpdate(event: SeatEvent) {
  io?.to(`show:${event.showId}`).emit("seat:update", event);
}

export function getIO() {
  return io;
}
