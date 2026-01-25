import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, role, companyName, companyCode, vatCode, phoneNumber } = body;

    if (!email || !password) {
      return NextResponse.json({ message: "El. paštas ir slaptažodis privalomi" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "Vartotojas jau egzistuoja" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Sukuriame vartotoją su visais papildomais laukais
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || "CARRIER", // ČIA IŠSAUGOME PARTNER ARBA CARRIER
        companyName,
        companyCode,
        vatCode,
        phoneNumber,
        paymentStatus: "PENDING",
      },
    });

    return NextResponse.json({ message: "Sėkmingai sukurta", userId: user.id }, { status: 201 });
  } catch (error: any) {
    console.error("Registracijos klaida:", error);
    return NextResponse.json({ message: "Serverio klaida: " + error.message }, { status: 500 });
  }
}