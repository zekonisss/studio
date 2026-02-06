'use server';

import { adminDb } from '@/lib/firebase-admin';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';

export async function handleSuccessfulLogin(userId: string): Promise<{ success: boolean; token?: string; error?: string }> {
    if (!adminDb) {
        return { success: false, error: 'Serverio konfigūracijos klaida.' };
    }

    const headersList = headers();
    const ipAddress = headersList.get('x-forwarded-for') || 'Nenustatyta';
    const userAgent = headersList.get('user-agent') || 'Nenustatyta';

    const newSessionToken = crypto.randomUUID();

    const userRef = adminDb.collection('users').doc(userId);
    const loginLogRef = adminDb.collection('loginLogs').doc();

    try {
        const batch = adminDb.batch();

        // 1. Update user's session token
        batch.update(userRef, {
            currentSessionToken: newSessionToken,
        });

        // 2. Add entry to login log
        batch.set(loginLogRef, {
            userId,
            ipAddress,
            userAgent,
            timestamp: Timestamp.now(),
        });

        await batch.commit();

        return { success: true, token: newSessionToken };

    } catch (error: any) {
        console.error("Server-side login handling error:", error);
        return { success: false, error: 'Nepavyko atnaujinti sesijos duomenų.' };
    }
}
