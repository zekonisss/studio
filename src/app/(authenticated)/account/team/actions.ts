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

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/join?token=${token}`;
    const emailHtml = `
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
        <tr>
          <td align="center" style="padding: 20px;">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; max-width: 600px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);">
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 30px 40px 20px 40px;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:middle; margin-bottom: 20px;">
                    <tr>
                      <td style="padding-right: 8px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="10" cy="7" r="4"></circle>
                            <path d="M10.3 15H7a4 4 0 0 0-4 4v2"></path>
                            <circle cx="17" cy="17" r="3"></circle>
                            <path d="m21 21-1.9-1.9"></path>
                        </svg>
                      </td>
                      <td>
                          <span style="font-size: 24px; font-weight: 700; font-style: italic; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                              DriverCheck
                          </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 0 40px;">
                  <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin-top: 0;">Sveiki!</h2>
                  <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                    Jūs buvote pakviestas prisijungti prie komandos <strong>${companyName}</strong>.
                  </p>
                  <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                    Spustelėkite žemiau esantį mygtuką, kad užbaigtumėte registraciją.
                  </p>
                </td>
              </tr>
              <!-- Button -->
              <tr>
                <td align="center" style="padding: 30px 40px;">
                  <a href="${inviteLink}" target="_blank" style="background-color: #2563EB; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                    Užbaigti registraciją
                  </a>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td align="center" style="padding: 20px 40px 30px 40px; border-top: 1px solid #e5e7eb;">
                  <p style="font-size: 12px; color: #6b7280; margin: 0;">
                    Jei ne jūs inicijavote šį veiksmą, ignoruokite šį laišką.
                  </p>
                  <p style="font-size: 12px; color: #6b7280; margin: 10px 0 0;">
                    © ${new Date().getFullYear()} DriverCheck
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    `;
    
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // PRIVALOMA naudoti šį testuojant
      to: email,
      subject: `Kvietimas prisijungti prie ${companyName}`,
      html: emailHtml
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
