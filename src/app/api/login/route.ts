import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ message: "Neteisingi duomenys" }, { status: 401 });
    }

    // 🔥 SIUNČIAME VISKĄ, KO REIKIA FRONTENDUI
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,           // Adminas/Vartotojas
      paymentStatus: user.paymentStatus // active/pending
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: "Serverio klaida" }, { status: 500 });
  }
}