'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { MerchOrder, MerchOrderFirestore } from '@/types';

// Helper to process Firestore documents
const processDoc = (doc: any): MerchOrder => {
    const data = doc.data();
    const processedData: { [key: string]: any } = { id: doc.id };
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            if (value && typeof value.toDate === 'function') {
                processedData[key] = value.toDate().toISOString();
            } else {
                processedData[key] = value;
            }
        }
    }
    return processedData as MerchOrder;
}

export async function getMerchOrders(): Promise<MerchOrder[]> {
    if (!adminDb) {
        console.error("Firebase Admin SDK not initialized.");
        return [];
    }
    const snapshot = await adminDb.collection('merch_orders').orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => processDoc(doc));
}

export async function markOrderAsSent(orderId: string): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) {
        return { success: false, error: 'Serverio konfigūracijos klaida.' };
    }
    if (!orderId) {
        return { success: false, error: 'Trūksta užsakymo ID.' };
    }
    try {
        const orderRef = adminDb.collection('merch_orders').doc(orderId);
        await orderRef.update({
            status: 'SENT',
            sentAt: Timestamp.now()
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error marking order as sent:", error);
        return { success: false, error: error.message || 'Nepavyko atnaujinti užsakymo būsenos.' };
    }
}
