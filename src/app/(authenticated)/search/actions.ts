'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

interface LogSearchData {
  query: string;
  birthDate?: string;
  userId: string;
}

export async function logSearchActivity(data: LogSearchData) {
  if (!adminDb) {
    console.error("Admin DB not initialized, skipping search log.");
    return;
  }
  if (!data.userId) {
    console.error("User ID is missing, skipping search log.");
    return;
  }

  try {
    const { query, birthDate, userId } = data;
    const nameParts = query.trim().toLowerCase().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const driverHash = birthDate 
      ? `${firstName}_${lastName}_${birthDate}` 
      : `${firstName}_${lastName}`;

    const originalNameParts = query.trim().split(/\s+/);
    const originalFirstName = originalNameParts[0] || "";
    const originalLastName = originalNameParts.slice(1).join(" ") || "";

    await adminDb.collection('search_logs').add({
      driverHash,
      firstName: originalFirstName,
      lastName: originalLastName,
      birthDate: birthDate || null,
      companyId: userId,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error logging search activity:", error);
    // Don't re-throw, as this is a "fire-and-forget" action
  }
}
