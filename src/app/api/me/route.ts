import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
// Pastaba: Realiame projekte čia tikrintum slapukus (cookies) arba JWT
// Kol kas darome paprastą versiją, kurią vėliau galėsi saugoti per cookies

const prisma = new PrismaClient();

export async function GET() {
  // Šiuo metu Next.js nežino "kas aš", jei nenaudojame cookies.
  // Jei dar neturi įsidiegęs Next-Auth, laikinai grąžiname klaidą, 
  // kad use-auth bent jau žinotų, jog reikia rodyti loginą.
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}