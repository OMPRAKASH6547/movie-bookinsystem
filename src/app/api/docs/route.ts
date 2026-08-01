import { NextResponse } from "next/server";
import { APP_NAME, API_PREFIX } from "@/constants";

const openApi = {
  openapi: "3.0.3",
  info: {
    title: `${APP_NAME} API`,
    version: "1.0.0",
    description:
      "Production REST API for movie discovery, seat locking, bookings, payments, and admin operations.",
  },
  servers: [{ url: API_PREFIX }],
  tags: [
    { name: "Auth" },
    { name: "Movies" },
    { name: "Bookings" },
    { name: "Payments" },
    { name: "Admin" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Admin"],
        summary: "Health check",
        responses: { "200": { description: "Service healthy" } },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register customer",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string" },
                  phone: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Created" } },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        responses: { "200": { description: "Tokens issued" } },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Rotate refresh token",
        responses: { "200": { description: "New tokens" } },
      },
    },
    "/auth/otp": {
      post: {
        tags: ["Auth"],
        summary: "Send or verify OTP",
        responses: { "200": { description: "OK" } },
      },
    },
    "/movies": {
      get: {
        tags: ["Movies"],
        summary: "List movies",
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "genre", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "Movie list" } },
      },
    },
    "/movies/{slug}": {
      get: {
        tags: ["Movies"],
        summary: "Get movie by slug",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Movie" } },
      },
    },
    "/search": {
      get: {
        tags: ["Movies"],
        summary: "Debounced global search",
        parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Results" } },
      },
    },
    "/bookings/lock": {
      post: {
        tags: ["Bookings"],
        summary: "Lock seats (Redis TTL)",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Locked" } },
      },
    },
    "/bookings": {
      get: {
        tags: ["Bookings"],
        summary: "User bookings",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "List" } },
      },
      post: {
        tags: ["Bookings"],
        summary: "Create booking + payment",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Created" } },
      },
    },
    "/coupons/validate": {
      post: {
        tags: ["Payments"],
        summary: "Validate coupon",
        responses: { "200": { description: "Discount" } },
      },
    },
    "/bookings/checkout": {
      post: {
        tags: ["Bookings", "Payments"],
        summary: "Checkout — PayU redirect or instant confirm with QR",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Confirmed booking or PayU form params" } },
      },
    },
    "/bookings/my": {
      get: {
        tags: ["Bookings"],
        summary: "List my bookings (Mongo + demo tickets)",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Booking list with QR" } },
      },
    },
    "/bookings/{id}/ticket": {
      get: {
        tags: ["Bookings"],
        summary: "Get ticket with QR data URL",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Ticket" } },
      },
    },
    "/bookings/{id}/pdf": {
      get: {
        tags: ["Bookings"],
        summary: "Download PDF ticket (QR embedded)",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "application/pdf" } },
      },
    },
    "/payments/payu/success": {
      post: {
        tags: ["Payments"],
        summary: "PayU success callback",
        responses: { "302": { description: "Redirect to ticket" } },
      },
    },
    "/wallet": {
      get: {
        tags: ["Payments"],
        summary: "Wallet balance + transactions",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Wallet" } },
      },
    },
    "/admin/stats": {
      get: {
        tags: ["Admin"],
        summary: "Dashboard stats",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Stats" } },
      },
    },
  },

  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
};

export async function GET() {
  return NextResponse.json(openApi);
}
