'use server';

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import crypto from 'crypto';
import { resend } from '@/lib/resend';
import { InviteEmailTemplate } from '@/components/emails/invite-template';

// --- HELPER FUNCTIONS ---
const getUser = async (userId: string) => {
    if (!adminDb) return null;
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    return userDoc.exists ? userDoc.data() : null;
};

const getCompany = async (companyId: string) => {
    if (!adminDb) return null;
    const companyRef = adminDb.collection('companies').doc(companyId);
    const companyDoc = await companyRef.get();
    return companyDoc.exists ? { id: companyDoc.id, ...companyDoc.data() } : null;
};

// 1. GET TEAM MEMBERS
export async function getTeamMembers(userId: string) {
  try {
    if (!adminDb) throw new Error("Serverio konfigūracijos klaida.");
    
    const user = await getUser(userId);
    if (!user || !user.companyId) {
        // User is not part of any company
        return { success: true, members: [], companyId: null, plan: 'solo' };
    }

    const company = await getCompany(user.companyId);
    if (!company) {
        // Data inconsistency: user has a companyId but company doesn't exist
        return { success: false, error: "Susijusi įmonė nerasta." };
    }

    // Find all users belonging to this company
    const usersSnapshot = await adminDb.collection('users')
      .where('companyId', '==', user.companyId)
      .get();

    const members = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      fullName: doc.data().fullName || 'Nenurodyta',
      role: doc.data().role,
      joinedAt: doc.data().createdAt?.toDate() || new Date(),
      status: doc.data().paymentStatus || 'active'
    }));

    return { 
        success: true, 
        members, 
        companyId: company.id, 
        companyName: company.name,
        maxSeats: company.maxSeats || 1,
        usedSeats: members.length 
    };

  } catch (error) {
    console.error("Error fetching team:", error);
    return { success: false, error: "Serverio klaida gaunant komandos duomenis." };
  }
}

// 2. INVITE MEMBER
export async function inviteTeamMember(inviterId: string, email: string) {
    try {
        if (!adminDb) throw new Error("Serverio konfigūracijos klaida.");

        const inviter = await getUser(inviterId);
        if (!inviter || !inviter.companyId) {
            return { success: false, error: "Jūs nepriklausote jokiai įmonei." };
        }
        
        if (inviter.role !== 'owner' && inviter.role !== 'admin' && !inviter.isAdmin) {
            return { success: false, error: "Neturite teisių kviesti naujų narių." };
        }
        
        const company = await getCompany(inviter.companyId);
        if (!company) {
             return { success: false, error: "Jūsų įmonė nerasta sistemoje." };
        }
        
        // Check Limits
        const currentSeats = (await adminDb.collection('users').where('companyId', '==', inviter.companyId).get()).size;
        const maxSeats = company.maxSeats || 1;

        if (currentSeats >= maxSeats) {
             return { success: false, error: "Pasiektas vartotojų limitas. Padidinkite planą." };
        }

        // Generate Token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); 

        // Save Invitation
        await adminDb.collection('invitations').add({
            companyId: inviter.companyId,
            companyName: company.name,
            inviterId: inviterId,
            email: email.toLowerCase(),
            token,
            role: 'member', // Default role for new invites
            status: 'pending',
            createdAt: Timestamp.now(),
            expiresAt: Timestamp.fromDate(expiresAt)
        });

        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/join?token=${token}`;

        // --- Send email using Resend ---
        await resend.emails.send({
            from: 'Drivercheck <onboarding@resend.dev>',
            to: email,
            subject: `You have been invited to join ${company.name}`,
            react: InviteEmailTemplate({ 
                inviteLink, 
                companyName: company.name as string,
                inviterName: inviter.fullName || 'A team member'
            }),
        });

        return { success: true, message: "Pakvietimas išsiųstas." };

    } catch (error: any) {
        console.error("Invite error:", error);
        if (error.name === 'ResendError') {
             return { success: false, error: `Klaida siunčiant el. laišką: ${error.message}` };
        }
        return { success: false, error: "Serverio klaida." };
    }
}

// 3. REMOVE MEMBER (Strict)
export async function removeTeamMember(removerId: string, memberId: string) {
    try {
        if (!adminDb || !adminAuth) throw new Error("Serverio konfigūracijos klaida.");
        if (removerId === memberId) return { success: false, error: "Negalima pašalinti savęs." };

        const remover = await getUser(removerId);
        if (!remover || !remover.companyId) {
            return { success: false, error: "Jūs nepriklausote jokiai įmonei." };
        }
        
        if (remover.role !== 'owner' && remover.role !== 'admin' && !remover.isAdmin) {
            return { success: false, error: "Neturite teisių šalinti narių." };
        }
        
        const memberRef = adminDb.collection('users').doc(memberId);
        const memberDoc = await memberRef.get();
        const memberData = memberDoc.data();

        if (!memberDoc.exists || !memberData) {
             return { success: false, error: "Šalinamas vartotojas nerastas." };
        }

        if (memberData.companyId !== remover.companyId) {
            return { success: false, error: "Vartotojas nepriklauso jūsų komandai." };
        }

        if (memberData.role === 'owner') {
             return { success: false, error: "Negalima pašalinti įmonės savininko." };
        }

        // A) Update Database: Dissociate from company and suspend role
        await memberRef.update({
            companyId: null,
            role: 'suspended',
            paymentStatus: 'inactive',
            updatedAt: Timestamp.now()
        });

        // B) Disable in Auth (Prevent Login)
        try {
            await adminAuth.updateUser(memberId, { disabled: true });
        } catch (authError) {
            console.error("Auth disable error:", authError);
            // Don't fail the whole operation if this part fails, but log it
        }

        return { success: true, message: "Narys pašalintas ir jo paskyra suspenduota." };

    } catch (error) {
        console.error("Remove error:", error);
        return { success: false, error: "Klaida šalinant narį." };
    }
}


// 4. UPDATE MEMBER ROLE
export async function updateMemberRole(updaterId: string, memberId: string, newRole: 'admin' | 'member') {
    try {
        if (!adminDb) throw new Error("Serverio konfigūracijos klaida.");
        if (updaterId === memberId) {
            return { success: false, error: "Negalima keisti savo rolės." };
        }

        const updater = await getUser(updaterId);
        if (!updater || !updater.companyId) {
            return { success: false, error: "Jūs nepriklausote jokiai įmonei." };
        }
        
        if (updater.role !== 'owner' && updater.role !== 'admin' && !updater.isAdmin) {
            return { success: false, error: "Neturite teisių keisti roles." };
        }
        
        const memberRef = adminDb.collection('users').doc(memberId);
        const memberDoc = await memberRef.get();
        const memberData = memberDoc.data();

        if (!memberDoc.exists || !memberData) {
             return { success: false, error: "Narys nerastas." };
        }

        if (memberData.companyId !== updater.companyId) {
            return { success: false, error: "Vartotojas nepriklauso jūsų komandai." };
        }

        if (memberData.role === 'owner') {
             return { success: false, error: "Negalima pakeisti įmonės savininko rolės." };
        }

        if (newRole !== 'admin' && newRole !== 'member') {
            return { success: false, error: "Neteisinga rolė." };
        }

        await memberRef.update({
            role: newRole,
            updatedAt: Timestamp.now()
        });

        return { success: true, message: `Vartotojo rolė sėkmingai pakeista į ${newRole}.` };

    } catch (error) {
        console.error("Update role error:", error);
        return { success: false, error: "Klaida keičiant rolę." };
    }
}
