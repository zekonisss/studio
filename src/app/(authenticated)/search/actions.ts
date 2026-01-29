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
  if (!adminDb) return { total: 0, recent: 0 };

  const driverHash = buildDriverHash(firstName, lastName);

  if (!driverHash) return { total: 0, recent: 0 };

  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const logsRef = adminDb.collection('searchLogs');

    // DIAGNOSTIC: Use get() and log size to check if the query finds anything
    const totalPromise = logsRef
      .where('driverHash', '==', driverHash)
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

    // DIAGNOSTIC LOG
    console.log(`>>> DIAGNOSTIKA: Užklausa su hash '${driverHash}' rado ${totalSnapshot.size} dokumentų.`);

    return {
      total: totalSnapshot.size,
      recent: recentSnapshot.data().count,
    };
} catch (error: any) {
    // PAKEITIMAS: Išryškiname klaidą
    console.log("\n\n🔴🔴🔴 KRITINĖ KLAIDA - SKAITYKITE ČIA 🔴🔴🔴");
    console.log("Klaidos pranešimas:", error.message);
    
    // Jei tai indekso klaida, ji bus čia:
    if (error.message && error.message.includes("index")) {
        console.log("👇👇👇 SPAUSKITE ŠIĄ NUORODĄ, KAD SUKURTUMĖTE INDEKSĄ 👇👇👇");
        // Ištraukiame nuorodą iš klaidos teksto (ji ten visada yra)
        console.log(error.message.match(/https:\/\/[^\s]+/)?.[0]);
    }
    console.log("🔴🔴🔴🔴🔴🔴\n\n");

    return { total: 0, recent: 0 };
}
}
