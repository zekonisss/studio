'use server';

import { adminDb } from '@/lib/firebase-admin';

export async function getPublicReportCount(): Promise<number> {
  if (!adminDb) {
    console.error("Firebase Admin SDK not initialized.");
    return 0;
  }
  try {
    const reportsRef = adminDb.collection('reports');
    // We only want to count active reports.
    const snapshot = await reportsRef.where('status', '==', 'active').get();
    return snapshot.size;
  } catch (error) {
    console.error("Error fetching public report count:", error);
    return 0; // Return 0 on error
  }
}
