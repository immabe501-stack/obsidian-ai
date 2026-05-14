import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getBalance } from "@/lib/balance";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      employeeNo: true,
      email: true,
      name: true,
      role: true,
      department: true,
      jobTitle: true,
      hireDate: true,
      manager: { select: { id: true, name: true, email: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const balance = await getBalance(user.id);

  return NextResponse.json({ user, balance });
}
