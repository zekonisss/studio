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
  console.log(`[SERVER] getDriverSearchStats iškviesta su: '${firstName}', '${lastName}'`);
  
  if (!adminDb) {
    console.error('[SERVER] KRITINĖ KLAIDA: adminDb yra null! Patikrinkite .env.local ir serverio paleidimo logus.');
    return { total: 0, recent: 0 };
  }

  const driverHash = buildDriverHash(firstName, lastName);

  if (!driverHash) {
    console.warn(`[SERVER] driverHash yra tuščias. Vardas: '${firstName}', Pavardė: '${lastName}'. Grąžinamas nulis.`);
    return { total: 0, recent: 0 };
  }
  
  console.log(`[SERVER] Sugeneruotas driverHash: '${driverHash}'`);

  try {
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

    const totalCount = totalSnapshot.data().count;
    const recentCount = recentSnapshot.data().count;

    console.log(`[SERVER] DIAGNOSTIKA: Užklausa su hash '${driverHash}' rado ${totalCount} visų laikų ir ${recentCount} naujų dokumentų.`);

    return {
      total: totalCount,
      recent: recentCount,
    };
  } catch (error: any) {
    console.error("\n\n🔴🔴🔴 [SERVER] KRITINĖ KLAIDA VYKDANT UŽKLAUSĄ 🔴🔴🔴");
    console.error("Klaidos pranešimas:", error.message);
    
    if (error.message && error.message.includes("index")) {
        console.error("👇👇👇 TRŪKSTA INDEKSO! SPAUSKITE ŠIĄ NUORODĄ, KAD JĮ SUKURTUMĖTE 👇👇👇");
        console.error(error.message.match(/https:\/\/[^\s]+/)?.[0] || "Nuorodos rasti nepavyko.");
    }
    console.error("🔴🔴🔴🔴🔴🔴\n\n");

    return { total: 0, recent: 0 };
  }
}
