'use server';

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { Resend } from 'resend'; // Importuojame Resend

// Inicializuojame Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// --- 1. PAKVIETIMO KŪRIMO FUNKCIJA ---
export async function createInvitation(email: string, companyId: string, companyName: string) {
  try {
    console.log("🚀 Pradedamas pakvietimas vartotojui:", email);

    // 1. Patikriname API raktą
    if (!process.env.RESEND_API_KEY) {
        throw new Error("Nėra RESEND_API_KEY .env.local faile!");
    }

    // 2. Sugeneruojame unikalų tokeną
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 3. Įrašome į Firestore
    await adminDb.collection('invitations').add({
      email,
      companyId,
      companyName,
      token,
      status: 'pending',
      createdAt: new Date(),
      expiresAt
    });

    // 4. Siunčiame laišką per Resend
    console.log("📧 Bandome siųsti laišką per Resend...");
    
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // PRIVALOMA naudoti šį testuojant
      to: email,
      subject: `Kvietimas prisijungti prie ${companyName}`,
      html: `
        <h1>Sveiki!</h1>
        <p>Jūs buvote pakviestas prisijungti prie įmonės <strong>${companyName}</strong> sistemoje Drivercheck.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/join?token=${token}">Spauskite čia, kad prisijungtumėte</a></p>
      `
    });

    if (error) {
      console.error("❌ Resend Klaida:", error);
      // Grąžiname klaidą, kad UI nesulūžtų
      return { success: false, error: error.message }; 
    }

    console.log("✅ Laiškas išsiųstas! ID:", data?.id);
    revalidatePath('/authenticated/account/team');
    return { success: true };

  } catch (error: any) {
    console.error("❌ Kritinė Serverio Klaida:", error);
    // Čia yra svarbiausia dalis - grąžiname objektą, o ne undefined!
    return { success: false, error: error.message || "Nežinoma serverio klaida" };
  }
}

// --- Kitos funkcijos (paliekame kaip buvo) ---
export async function updateMemberRole(targetUserId: string, newRole: 'admin' | 'member') {
  try {
    await adminDb.collection('users').doc(targetUserId).update({ role: newRole });
    revalidatePath('/authenticated/account/team');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTeamMember(userId: string) {
  try {
    await adminAuth.deleteUser(userId);
    await adminDb.collection('users').doc(userId).delete();
    revalidatePath('/authenticated/account/team');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}