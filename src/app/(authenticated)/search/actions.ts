'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

interface LogSearchData {
  query: string;
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

  const clean = (str: string) => str?.trim().charAt(0).toUpperCase() + str?.trim().slice(1).toLowerCase() || "";

  try {
    const { query, userId } = data;
    const nameParts = query.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");
    
    const cleanFirst = clean(firstName);
    const cleanLast = clean(lastName);

    // If both names are empty after cleaning, don't log it.
    if (!cleanFirst && !cleanLast) {
        return;
    }

    const driverHash = `${cleanFirst.toLowerCase()}_${cleanLast.toLowerCase()}`;

    await adminDb.collection('searchLogs').add({
      driverHash,
      firstName: cleanFirst,
      lastName: cleanLast,
      searchText: `${cleanFirst} ${cleanLast}`.trim(),
      companyId: userId,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error logging search activity:", error);
    // Don't re-throw, as this is a "fire-and-forget" action
  }
}
