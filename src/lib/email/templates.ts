import { APP_NAME, APP_URL } from "@/constants";

export function welcomeEmail(name: string) {
  return {
    subject: `Welcome to ${APP_NAME}!`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0D10;color:#F5F5F5;padding:40px;border-radius:12px">
        <h1 style="color:#E11D48;margin:0 0 16px">${APP_NAME}</h1>
        <h2 style="margin:0 0 12px">Welcome, ${name}!</h2>
        <p style="color:#A1A1AA;line-height:1.6">Your account is ready. Discover trending movies and book seats in seconds.</p>
        <a href="${APP_URL}/movies" style="display:inline-block;margin-top:24px;background:#E11D48;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Browse Movies</a>
      </div>
    `,
  };
}

export function otpEmail(otp: string) {
  return {
    subject: `${APP_NAME} verification code`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0D10;color:#F5F5F5;padding:40px;border-radius:12px">
        <h1 style="color:#E11D48">${APP_NAME}</h1>
        <p>Your verification code is:</p>
        <div style="font-size:36px;letter-spacing:8px;font-weight:700;margin:24px 0;color:#FBBF24">${otp}</div>
        <p style="color:#A1A1AA">This code expires in 10 minutes. Never share it with anyone.</p>
      </div>
    `,
  };
}

export function bookingConfirmationEmail(data: {
  name: string;
  movieTitle: string;
  theatre: string;
  date: string;
  time: string;
  seats: string;
  bookingNumber: string;
  amount: string;
  qrUrl?: string;
}) {
  return {
    subject: `Booking confirmed — ${data.movieTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0D10;color:#F5F5F5;padding:40px;border-radius:12px">
        <h1 style="color:#E11D48;margin:0 0 8px">${APP_NAME}</h1>
        <h2 style="color:#22C55E;margin:0 0 24px">Booking Confirmed ✓</h2>
        <p>Hi ${data.name},</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0">
          <tr><td style="padding:8px 0;color:#A1A1AA">Movie</td><td style="padding:8px 0;text-align:right;font-weight:600">${data.movieTitle}</td></tr>
          <tr><td style="padding:8px 0;color:#A1A1AA">Theatre</td><td style="padding:8px 0;text-align:right">${data.theatre}</td></tr>
          <tr><td style="padding:8px 0;color:#A1A1AA">Date & Time</td><td style="padding:8px 0;text-align:right">${data.date} · ${data.time}</td></tr>
          <tr><td style="padding:8px 0;color:#A1A1AA">Seats</td><td style="padding:8px 0;text-align:right">${data.seats}</td></tr>
          <tr><td style="padding:8px 0;color:#A1A1AA">Booking ID</td><td style="padding:8px 0;text-align:right;font-family:monospace">${data.bookingNumber}</td></tr>
          <tr><td style="padding:8px 0;color:#A1A1AA">Amount Paid</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#FBBF24">${data.amount}</td></tr>
        </table>
        <a href="${APP_URL}/bookings" style="display:inline-block;background:#E11D48;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">View Ticket</a>
      </div>
    `,
  };
}

export function resetPasswordEmail(token: string) {
  const link = `${APP_URL}/reset-password?token=${token}`;
  return {
    subject: `Reset your ${APP_NAME} password`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0D10;color:#F5F5F5;padding:40px;border-radius:12px">
        <h1 style="color:#E11D48">${APP_NAME}</h1>
        <p>Click below to reset your password. This link expires in 1 hour.</p>
        <a href="${link}" style="display:inline-block;margin-top:24px;background:#E11D48;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
      </div>
    `,
  };
}
