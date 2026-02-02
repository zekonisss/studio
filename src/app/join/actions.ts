'use server';

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

interface InvitationDetails {
    companyName: string;
    email: string;
}

// 1. VERIFY INVITATION
export async function verifyInvitation(token: string): Promise<{ success: boolean; data?: InvitationDetails; error?: string }> {
    try {
        if (!adminDb || !adminAuth) throw new Error("Serverio konfigūracijos klaida.");

        const invSnapshot = await adminDb.collection('invitations')
            .where('token', '==', token)
            .limit(1)
            .get();
        
        const invDoc = !invSnapshot.empty ? invSnapshot.docs[0] : null;

        if (!invDoc) {
            return { success: false, error: "Pakvietimas nerastas arba nebegalioja." };
        }

        const invData = invDoc.data();

        if (invData.status !== 'pending') {
            return { success: false, error: "Pakvietimas jau buvo panaudotas." };
        }

        if (invData.expiresAt.toDate() < new Date()) {
             await invDoc.ref.update({ status: 'expired' });
             return { success: false, error: "Pakvietimo galiojimo laikas baigėsi." };
        }

        // Check if user already exists
        try {
            await adminAuth.getUserByEmail(invData.email);
            return { success: false, error: "Vartotojas su šiuo el. paštu jau egzistuoja sistemoje." };
        } catch (error: any) {
            if (error.code !== 'auth/user-not-found') {
                console.error("Verify Error (during user check):", error);
                throw error; // Re-throw unexpected errors
            }
            // User does not exist, which is what we want. Continue.
        }


        return { success: true, data: { companyName: invData.companyName, email: invData.email } };

    } catch (error) {
        console.error("Verify Error:", error);
        return { success: false, error: "Serverio klaida tikrinant pakvietimą." };
    }
}

// 2. ACCEPT INVITATION
export async function acceptInvitation(token: string, fullName: string, password: string): Promise<{ success: boolean; error?: string }> {

    if (!password || typeof password !== 'string' || password.length < 6) {
        return { success: false, error: "Slaptažodis turi būti bent 6 simbolių ilgio." };
    }

    try {
        if (!adminDb || !adminAuth) throw new Error("Serverio konfigūracijos klaida.");

         const invSnapshot = await adminDb.collection('invitations')
            .where('token', '==', token)
            .where('status', '==', 'pending')
            .limit(1)
            .get();
        
        if (invSnapshot.empty) {
            return { success: false, error: "Pakvietimas nerastas arba nebegalioja." };
        }

        const invDoc = invSnapshot.docs[0];
        const invData = invDoc.data();

        if (invData.expiresAt.toDate() < new Date()) {
             return { success: false, error: "Pakvietimo galiojimo laikas baigėsi." };
        }

        // --- Create User Flow ---
        // 1. Create Auth user
        const userRecord = await adminAuth.createUser({
            email: invData.email,
            password: password,
            displayName: fullName,
            disabled: false,
        });

        // 2. Create Firestore user document
        await adminDb.collection('users').doc(userRecord.uid).set({
            email: invData.email,
            fullName: fullName,
            contactPerson: fullName,
            companyId: invData.companyId,
            companyName: invData.companyName,
            role: invData.role || 'member',
            
            paymentStatus: 'active', // Inherits active status from company
            subscriptionType: 'paid', // Inherits from company
            isAdmin: false,
            createdAt: Timestamp.now(),
            registeredAt: Timestamp.now(),
            accountActivatedAt: Timestamp.now(),
        });

        // 3. Mark invitation as accepted
        await invDoc.ref.update({
            status: 'accepted',
            acceptedAt: Timestamp.now(),
            acceptedByUserId: userRecord.uid
        });

        return { success: true };

    } catch (error: any) {
        console.error("Accept Invitation - Critical Error:", error);
        if (error.code === 'auth/email-already-exists') {
            return { success: false, error: "Vartotojas su šiuo el. paštu jau egzistuoja." };
        }
        return { success: false, error: "Nepavyko priimti pakvietimo. Bandykite vėliau." };
    }
}
