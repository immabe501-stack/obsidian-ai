import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import type { Role } from "@prisma/client";

export type SessionData = {
  userId?: string;
  role?: Role;
  name?: string;
};

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "leave_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireUser() {
  const session = await getSession();
  if (!session.userId) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return session;
}

export async function requireRole(...roles: Role[]) {
  const session = await requireUser();
  if (!session.role || !roles.includes(session.role)) {
    throw new Response("Forbidden", { status: 403 });
  }
  return session;
}
