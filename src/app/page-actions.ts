'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// --- 1. ESAMA FUNKCIJA (PALIEKAME NIEKO NEKEITĘ) ---
export async function getPublicReportCount(): Promise<number> {
  if (!adminDb) {
    console.error("Firebase Admin SDK not initialized.");
    return 0;
  }
  try {
    const reportsRef = adminDb.collection('reports');
    // Viešame puslapyje skaičiuojame tik aktyvius įrašus
    const snapshot = await reportsRef.where('status', '==', 'active').count().get();
    return snapshot.data().count;
  } catch (error) {
    console.error("Error fetching public report count:", error);
    return 0; // Grąžiname 0 klaidos atveju
  }
}

// --- 2. ESAMA FUNKCIJA (PALIEKAME) ---
export async function getRecentActivity() {
  if (!adminDb) {
    console.error("Klaida gaunant aktyvumą: Firebase Admin SDK neinicijuotas.");
    return [];
  }
  try {
    const snapshot = await adminDb
      .collection("searchLogs") // Naudojame tavo tikrąją kolekciją
      .orderBy("timestamp", "desc")
      .limit(5)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Išmanus vardo sukonstravimas
      let displayName = "";

      if (data.firstName || data.lastName) {
        // Jei yra naujas formatas, sujungiam juos
        displayName = `${data.firstName || ""} ${data.lastName || ""}`.trim();
      } else if (data.searchText) {
        // Jei tai senas įrašas su searchText
        displayName = data.searchText;
      }

      return {
        id: doc.id,
        // Jei vis tiek tuščia, rašome "Anoniminė patikra"
        text: displayName || "Anoniminė patikra",
        time: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error("Klaida gaunant aktyvumą:", error);
    return [];
  }
}

// --- 3. NAUJA FUNKCIJA (PRIDEDAME) ---
export async function getDriverSearchStats(firstName: string, lastName: string): Promise<{ total: number; recent: number }> {
    if (!adminDb) {
        console.error("Admin DB not initialized, cannot get stats.");
        return { total: 0, recent: 0 };
    }
    try {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const sixtyDaysAgoTimestamp = Timestamp.fromDate(sixtyDaysAgo);

        const logsRef = adminDb.collection('searchLogs');
        
        // Base query for the specific driver
        const driverQuery = logsRef
            .where("firstName", "==", firstName)
            .where("lastName", "==", lastName);

        // Query for total searches
        const totalPromise = driverQuery.count().get();
        
        // Query for recent searches (last 60 days)
        const recentPromise = driverQuery
            .where("timestamp", ">=", sixtyDaysAgoTimestamp)
            .count()
            .get();

        const [totalSnapshot, recentSnapshot] = await Promise.all([totalPromise, recentPromise]);
        
        return {
            total: totalSnapshot.data().count,
            recent: recentSnapshot.data().count
        };
    } catch (error) {
        console.error(`Error fetching search stats for ${firstName} ${lastName}:`, error);
        // This might fail due to missing index, but we shouldn't crash the app
        return { total: 0, recent: 0 };
    }
}
