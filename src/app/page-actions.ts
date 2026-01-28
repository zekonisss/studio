'use server';

import { adminDb } from '@/lib/firebase-admin';

// --- 1. ESAMA FUNKCIJA (PALIEKAME NIEKO NEKEITĘ) ---
export async function getPublicReportCount(): Promise<number> {
  if (!adminDb) {
    console.error("Firebase Admin SDK not initialized.");
    return 0;
  }
  try {
    const reportsRef = adminDb.collection('reports');
    // Viešame puslapyje skaičiuojame tik aktyvius įrašus
    const snapshot = await reportsRef.where('status', '==', 'active').get();
    return snapshot.size;
  } catch (error) {
    console.error("Error fetching public report count:", error);
    return 0; // Grąžiname 0 klaidos atveju
  }
}

// --- 2. NAUJA FUNKCIJA (PRIDEDAME APAČIOJE) ---
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