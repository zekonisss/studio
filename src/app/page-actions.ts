'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { buildDriverHash } from '@/lib/driverHash'; // <--- NAUJAS IMPORTAS

// --- 1. VIEŠA STATISTIKA ---
export async function getPublicReportCount(): Promise<number> {
  if (!adminDb) {
    console.error("Firebase Admin SDK not initialized.");
    return 0;
  }
  try {
    const reportsRef = adminDb.collection('reports');
    const snapshot = await reportsRef.where('status', '==', 'active').count().get();
    return snapshot.data().count;
  } catch (error) {
    console.error("Error fetching public report count:", error);
    return 0;
  }
}

// --- 2. RINKOS AKTYVUMAS (SIDEBAR) ---
export async function getRecentActivity() {
  if (!adminDb) {
    console.error("Klaida gaunant aktyvumą: Firebase Admin SDK neinicijuotas.");
    return [];
  }
  try {
    const snapshot = await adminDb
      .collection("searchLogs")
      .orderBy("timestamp", "desc")
      .limit(5)
      .get();

    // PATAISYMAS ČIA: Pridėtas tipas (doc: any), kad TypeScript nepyktų
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      
      let displayName = "";

      if (data.firstName || data.lastName) {
        displayName = `${data.firstName || ""} ${data.lastName || ""}`.trim();
      } else if (data.searchText) {
        displayName = data.searchText;
      }

      return {
        id: doc.id,
        text: displayName || "Anoniminė patikra",
        time: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error("Klaida gaunant aktyvumą:", error);
    return [];
  }
}

// --- 3. VAIRUOTOJO PAIEŠKOS STATISTIKA (HASH VERSIJA) ---
export async function getDriverSearchStats(
  firstName: string,
  lastName: string
): Promise<{ total: number; recent: number }> {

  if (!adminDb) return { total: 0, recent: 0 };

  // Čia visa magija - naudojame TĄ PAČIĄ funkciją kaip ir įrašyme
  const driverHash = buildDriverHash(firstName, lastName);

  if (driverHash === "_") return { total: 0, recent: 0 };

  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const logsRef = adminDb
      .collection("searchLogs")
      .where("driverHash", "==", driverHash);

    const totalPromise = logsRef.count().get();

    const recentPromise = logsRef
      .where("timestamp", ">=", Timestamp.fromDate(sixtyDaysAgo))
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
  } catch (err: any) {
    console.error("KLAIDA SKAIČIUOJANT STATISTIKĄ:", err);
    // Jei trūksta indekso, terminale pamatysite nuorodą
    return { total: 0, recent: 0 };
  }
}