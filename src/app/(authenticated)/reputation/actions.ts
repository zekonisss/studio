'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

interface MerchOrderData {
  recipient: string;
  companyName: string;
  address: string;
  phone: string;
  comment?: string;
  userId: string;
}

export async function submitMerchOrder(data: MerchOrderData) {
  if (!adminDb) {
    return { success: false, error: 'Serverio konfigūracijos klaida.' };
  }

  if (!data.recipient || !data.companyName || !data.address || !data.phone || !data.userId) {
    return { success: false, error: 'Trūksta būtinų duomenų.' };
  }

  try {
    await adminDb.collection('merch_orders').add({
      ...data,
      status: 'PENDING',
      createdAt: Timestamp.now(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error submitting merch order:", error);
    return { success: false, error: 'Nepavyko išsiųsti užsakymo. Bandykite vėliau.' };
  }
}
