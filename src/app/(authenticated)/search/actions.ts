'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { buildDriverHash, normalizeName } from '@/lib/driverHash';

export async function logSearchActivity({
  firstName,
  lastName,
  userId,
}: {
  firstName: string;
  lastName: string;
  userId: string;
}) {
  if (!adminDb || !userId) return;

  const driverHash = buildDriverHash(firstName, lastName);

  // Don't log if both names are empty after normalization
  if (!driverHash) return;

  await adminDb.collection('searchLogs').add({
    userId: userId,
    driverHash: driverHash,
    // Also save the normalized names for potential display in history
    firstName: normalizeName(firstName),
    lastName: normalizeName(lastName),
    timestamp: Timestamp.now(),
  });
}

export async function getDriverSearchStats(
  firstName: string,
  lastName: string
): Promise<{ total: number; recent: number }> {
  // Let's add a log right at the beginning to be sure it's called.
  console.log(`\n\n--- [SERVER ACTION] getDriverSearchStats CALLED with: '${firstName}', '${lastName}' ---\n\n`);
  
  if (!adminDb) {
    console.error("🔴 ADMIN DB NOT INITIALIZED! Check .env.local and restart the server.");
    // Return a non-zero number to see if it reaches the UI, to differentiate from a successful zero.
    return { total: -1, recent: -1 };
  }

  const driverHash = buildDriverHash(firstName, lastName);

  if (!driverHash) {
    console.warn("🟡 driverHash is empty. Returning 0.");
    return { total: 0, recent: 0 };
  }
  
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const logsRef = adminDb.collection('searchLogs');

  const totalPromise = logsRef
    .where('driverHash', '==', driverHash)
    .count()
    .get();
  
  const recentPromise = logsRef
    .where('driverHash', '==', driverHash)
    .where('timestamp', '>=', Timestamp.fromDate(sixtyDaysAgo))
    .count()
    .get();
  
  const [totalSnapshot, recentSnapshot] = await Promise.all([
    totalPromise,
    recentPromise,
  ]);

  const total = totalSnapshot.data().count;
  const recent = recentSnapshot.data().count;
  
  console.log(`\n\n--- [SERVER ACTION] getDriverSearchStats RESULT for '${driverHash}': Total=${total}, Recent=${recent} ---\n\n`);

  return {
      total,
      recent
  };
}
