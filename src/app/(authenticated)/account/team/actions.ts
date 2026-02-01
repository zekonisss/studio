'use server';

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import crypto from 'crypto';

// 1. GET TEAM MEMBERS
export async function getTeamMembers(ownerId: string) {
  try {
    // Find the company owned by this user
    const companySnapshot = await adminDb.collection('companies')
      .where('ownerId', '==', ownerId)
      .limit(1)
      .get();

    if (companySnapshot.empty) {
        // User has no company (Solo user)
        return { success: true, members: [], companyId: null, plan: 'solo' };
    }

    const companyDoc = companySnapshot.docs[0];
    const companyId = companyDoc.id;
    const companyData = companyDoc.data();

    // Find all users belonging to this company
    const usersSnapshot = await adminDb.collection('users')
      .where('companyId', '==', companyId)
      .get();

    const members = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      fullName: doc.data().fullName || 'Nenurodyta',
      role: doc.data().role,
      joinedAt: doc.data().createdAt?.toDate() || new Date(),
      status: doc.data().status || 'active'
    }));

    return { 
        success: true, 
        members, 
        companyId, 
        companyName: companyData.name,
        maxSeats: companyData.maxSeats || 1,
        usedSeats: members.length 
    };

  } catch (error) {
    console.error("Error fetching team:", error);
    return { success: false, error: "Failed to fetch team members." };
  }
}

// 2. INVITE MEMBER
export async function inviteTeamMember(ownerId: string, email: string) {
    try {
        const companySnapshot = await adminDb.collection('companies')
            .where('ownerId', '==', ownerId)
            .limit(1)
            .get();

        if (companySnapshot.empty) {
            return { success: false, error: "Jūs neturite sukūręs įmonės paskyros." };
        }
        
        const companyDoc = companySnapshot.docs[0];
        const companyId = companyDoc.id;
        
        // Check Limits
        const currentSeats = (await adminDb.collection('users').where('companyId', '==', companyId).get()).size;
        const maxSeats = companyDoc.data().maxSeats || 1;

        if (currentSeats >= maxSeats) {
             return { success: false, error: "Pasiektas vartotojų limitas. Padidinkite planą." };
        }

        // Generate Token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); 

        // Save Invitation
        await adminDb.collection('invitations').add({
            companyId,
            companyName: companyDoc.data().name,
            inviterId: ownerId,
            email: email.toLowerCase(),
            token,
            status: 'pending',
            createdAt: Timestamp.now(),
            expiresAt: Timestamp.fromDate(expiresAt)
        });

        // Return link for testing (Email integration comes later)
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/join?token=${token}`;

        return { success: true, message: "Pakvietimas sukurtas", inviteLink };

    } catch (error) {
        console.error("Invite error:", error);
        return { success: false, error: "Serverio klaida." };
    }
}

// 3. REMOVE MEMBER (Strict)
export async function removeTeamMember(ownerId: string, memberId: string) {
    try {
        if (ownerId === memberId) return { success: false, error: "Negalima pašalinti savęs." };

        // Verify Ownership
        const companySnapshot = await adminDb.collection('companies')
            .where('ownerId', '==', ownerId)
            .limit(1)
            .get();

        if (companySnapshot.empty) return { success: false, error: "Neturite teisių." };

        const companyId = companySnapshot.docs[0].id;
        const memberRef = adminDb.collection('users').doc(memberId);
        const memberDoc = await memberRef.get();

        if (!memberDoc.exists || memberDoc.data()?.companyId !== companyId) {
             return { success: false, error: "Vartotojas nerastas komandoje." };
        }

        // A) Update Database
        await memberRef.update({
            companyId: null,
            role: 'suspended',
            updatedAt: Timestamp.now()
        });

        // B) Disable in Auth (Prevent Login)
        try {
            await adminAuth.updateUser(memberId, { disabled: true });
        } catch (authError) {
            console.error("Auth disable error:", authError);
        }

        return { success: true, message: "Narys pašalintas." };

    } catch (error) {
        console.error("Remove error:", error);
        return { success: false, error: "Klaida šalinant narį." };
    }
}
