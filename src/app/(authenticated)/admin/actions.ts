'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { resend } from '@/lib/resend';
import { WelcomeEmailTemplate } from '@/components/emails/welcome-email';
import type { UserProfile } from '@/types';
import { Timestamp } from 'firebase-admin/firestore';

export async function changeUserStatus(adminUserId: string, targetUserId: string, newStatus: UserProfile['paymentStatus']) {
    if (!adminDb) {
        return { success: false, error: 'Serverio konfigūracijos klaida.' };
    }

    const adminUserRef = adminDb.collection('users').doc(adminUserId);
    const targetUserRef = adminDb.collection('users').doc(targetUserId);

    try {
        const adminUserDoc = await adminUserRef.get();
        const targetUserDoc = await targetUserRef.get();

        if (!adminUserDoc.exists || !adminUserDoc.data()?.isAdmin) {
            return { success: false, error: 'Neturite administratoriaus teisių.' };
        }
        if (!targetUserDoc.exists) {
            return { success: false, error: 'Vartotojas nerastas.' };
        }

        const targetUserData = targetUserDoc.data() as UserProfile;
        const oldStatus = targetUserData.paymentStatus;
        
        if (oldStatus === newStatus) {
            return { success: true, message: 'Būsena nepasikeitė.' }; 
        }

        const updates: { [key: string]: any } = { paymentStatus: newStatus };
        let shouldSendEmail = false;

        if ((newStatus === 'active' || newStatus === 'trial') && (oldStatus === 'pending_verification' || oldStatus === 'inactive')) {
            updates.accountActivatedAt = Timestamp.now();
            shouldSendEmail = true;

            if (newStatus === 'trial') {
                updates.searchCredits = 3;
                updates.reportCredits = 1;
            }
        }
        
        await targetUserRef.update(updates);

        await adminDb.collection('auditLogs').add({
            adminId: adminUserId,
            adminName: adminUserDoc.data()?.contactPerson || 'Sistemos Admin',
            actionKey: 'user.status.changed',
            details: { 
                userId: targetUserId,
                userEmail: targetUserData.email,
                companyName: targetUserData.companyName,
                oldStatus: oldStatus,
                newStatus: newStatus
            },
            timestamp: Timestamp.now()
        });

        if (shouldSendEmail) {
            await resend.emails.send({
                from: 'DriverCheck <onboarding@resend.dev>',
                to: targetUserData.email,
                subject: 'Jūsų paskyra patvirtinta! 🚀',
                react: WelcomeEmailTemplate({
                    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`
                })
            });
        }

        return { success: true };

    } catch (error: any) {
        console.error("Error changing user status:", error);
        return { success: false, error: error.message || 'Nepavyko pakeisti vartotojo būsenos.' };
    }
}
