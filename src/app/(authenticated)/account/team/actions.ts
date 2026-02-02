'use server';

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { resend } from "@/lib/resend";
import { InviteEmailTemplate } from "@/components/emails/invite-template";

// --- 1. PAKVIETIMO KŪRIMO FUNKCIJA (GRĄŽINTA) ---
export async function createInvitation(email: string, companyId: string, companyName: string) {
  try {
    // Sugeneruojame unikalų tokeną
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Galioja 7 dienas

    // Įrašome į Firestore
    await adminDb.collection('invitations').add({
      email,
      companyId,
      companyName,
      token,
      status: 'pending',
      createdAt: new Date(),
      expiresAt
    });

    // Sugeneruojame nuorodą
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const link = `${baseUrl}/join?token=${token}`;
    
    // --- Send email using Resend ---
    await resend.emails.send({
        from: 'Drivercheck <onboarding@resend.dev>',
        to: email,
        subject: `You have been invited to join ${companyName}`,
        react: InviteEmailTemplate({ 
            inviteLink: link, 
            companyName: companyName,
            inviterName: "A team member"
        }),
    });


    revalidatePath('/authenticated/account/team');
    return { success: true, link };

  } catch (error: any) {
    console.error("Error creating invitation:", error);
    return { success: false, error: error.message };
  }
}

// --- 2. ROLĖS KEITIMO FUNKCIJA ---
export async function updateMemberRole(targetUserId: string, newRole: 'admin' | 'member') {
  try {
    console.log(`🔄 Updating role for ${targetUserId} to ${newRole}`);

    // Atnaujiname Firestore
    await adminDb.collection('users').doc(targetUserId).update({
      role: newRole
    });

    // Pabandome atnaujinti ir Auth claims (nebūtina, bet saugiau)
    try {
        await adminAuth.setCustomUserClaims(targetUserId, { role: newRole });
    } catch (e) {
        console.warn("Custom claims update skipped.");
    }

    revalidatePath('/authenticated/account/team');
    return { success: true };

  } catch (error: any) {
    console.error("Klaida keičiant rolę:", error);
    return { success: false, error: error.message };
  }
}

// --- 3. VARTOTOJO TRYNIMO FUNKCIJA ---
export async function deleteTeamMember(userId: string) {
  try {
    // Ištriname iš Auth (kad nebegalėtų prisijungti)
    await adminAuth.deleteUser(userId);
    // Ištriname iš Firestore (kad neberodytų sąraše)
    await adminDb.collection('users').doc(userId).delete();
    
    revalidatePath('/authenticated/account/team');
    return { success: true };
  } catch (error: any) {
    console.error("Error removing member:", error);
    return { success: false, error: error.message };
  }
}
