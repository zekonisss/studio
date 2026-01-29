'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

interface LogSearchData {
  firstName: string;
  lastName: string;
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

  // Robust cleaning function that handles trim and capitalization safely.
  const cleanAndCapitalize = (str: string) => {
    const trimmed = str?.trim() || '';
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  try {
    const { firstName, lastName, userId } = data;
    
    const cleanFirst = cleanAndCapitalize(firstName);
    const cleanLast = cleanAndCapitalize(lastName);

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
      userId: userId,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error logging search activity:", error);
    // Don't re-throw, as this is a "fire-and-forget" action
  }
}
