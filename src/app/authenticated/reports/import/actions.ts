'use server';

// Svarbu: naudojame adminDb iš tavo sukurto failo
import { adminDb } from '../../../../lib/firebase-admin'; // Patikrink, ar kelias iki tavo failo teisingas
import { FieldValue } from 'firebase-admin/firestore';

export async function importAllReports(reports: any[], adminUid: string, adminCompanyName: string) {
  if (!adminUid) {
    return { success: false, error: 'Autentifikacijos klaida: nenurodytas administratoriaus ID.' };
  }

  try {
    // Firestore leidžia tik 500 operacijų viename batch
    const chunkSize = 450; 
    
    for (let i = 0; i < reports.length; i += chunkSize) {
      const batch = adminDb.batch(); // Naudojame adminDb batch'ą
      const chunk = reports.slice(i, i + chunkSize);

      chunk.forEach((report) => {
        // Admin SDK nereikia collection() funkcijos, rašome tiesiai
        const docRef = adminDb.collection("reports").doc();
        
        batch.set(docRef, {
          fullName: report.fullName || 'Nežinomas',
          comment: report.comment || '',
          reporterId: adminUid,
          reporterCompanyName: adminCompanyName,
          category: report.aiCategory || 'other_category',
          tags: report.aiTags || [],
          createdAt: FieldValue.serverTimestamp(), // Naudojame Admin SDK serverTimestamp
          status: 'active',
          statusUpdatedAt: FieldValue.serverTimestamp(),
          subjectCompany: report.company || '' 
        });
      });

      await batch.commit(); // Išsaugome batch'ą
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Firestore batch error:", error);
    // Jei gauni klaidą, vadinasi problema vis dar Service Account teisėse Google Cloud konsolėje
    return { success: false, error: error.message || "Nepavyko išsaugoti įrašų." };
  }
}