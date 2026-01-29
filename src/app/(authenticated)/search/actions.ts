// src/app/page-actions.ts
'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function getDriverSearchStats(
  firstName: string,
  lastName: string
): Promise<{ total: number; recent: number }> {
  if (!adminDb) {
    console.error("Admin DB not initialized");
    return { total: 0, recent: 0 };
  }

  const normalize = (str: string) =>
    (str || '').trim().toLowerCase();

  const cleanFirst = normalize(firstName);
  const cleanLast = normalize(lastName);

  if (!cleanFirst && !cleanLast) {
    return { total: 0, recent: 0 };
  }

  const driverHash = `${cleanFirst}_${cleanLast}`;

  try {
    const logsRef = adminDb
      .collection('searchLogs')
      .where('driverHash', '==', driverHash);

    // total count
    const totalPromise = logsRef.count().get();

    // last 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sixtyDaysAgoTimestamp = Timestamp.fromDate(sixtyDaysAgo);

    const recentPromise = logsRef
      .where('timestamp', '>=', sixtyDaysAgoTimestamp)
      .count()
      .get();

    const [totalSnap, recentSnap] = await Promise.all([
      totalPromise,
      recentPromise,
    ]);

    return {
      total: totalSnap.data().count,
      recent: recentSnap.data().count,
    };
  } catch (err) {
    console.error('Error fetching driver search stats:', err);
    return { total: 0, recent: 0 };
  }
}
