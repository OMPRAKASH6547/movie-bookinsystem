import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }

  return transporter;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  try {
    const info = await getTransporter().sendMail({
      from: process.env.SMTP_FROM || `"CinePass" <noreply@cinepass.app>`,
      ...options,
    });
    logger.info("Email sent", { to: options.to, messageId: info.messageId });
    return true;
  } catch (error) {
    logger.error("Email send failed", {
      error: error instanceof Error ? error.message : "Unknown",
      to: options.to,
    });
    return false;
  }
}
