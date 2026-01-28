'use server';

import { adminDb } from '@/lib/firebase-admin';

export async function getPublicReportCount(): Promise<number> {
  if (!adminDb) {
    console.error("Firebase Admin SDK not initialized.");
    return 0;
  }
  try {
    const reportsRef = adminDb.collection('reports');
    // We only want to count active reports.
    const snapshot = await reportsRef.where('status', '==', 'active').get();
    return snapshot.size;
  } catch (error) {
    console.error("Error fetching public report count:", error);
    return 0; // Return 0 on error
  }
}

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

    return snapshot.docs.map(doc => {
      const data = doc.data();
      
      // JOKIO MASKAVIMO: Imame tiksliai tai, kas įrašyta į 'searchText'
      // Jei nori, gali pridėti .toUpperCase(), kad visi vardai būtų DIDŽIOSIOMIS
      const fullName = data.searchText || "Nežinomas"; 

      return {
        id: doc.id,
        text: fullName, // Grąžiname pilną "Jonas Kukulis"
        time: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error("Klaida gaunant aktyvumą:", error);
    return [];
  }
}
