import type { SessionOptions } from "iron-session";

export type AdminSession = { isAdmin?: boolean; loggedInAt?: number };

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD ?? "fallback-please-change-me-fallback-please-change-me",
  cookieName: "koalafied_admin",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  },
};

export type CustomerSession = {
  customerId?: number;
  email?: string;
  loggedInAt?: number;
};

export const customerSessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD ?? "fallback-please-change-me-fallback-please-change-me",
  cookieName: "koalafied_customer",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 60,
  },
};
