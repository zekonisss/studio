'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Gauna visus prisijungusios įmonės vairuotojų įrašus iš „Firestore“.
 * Bando rasti įrašus pagal reporterId (tiksliausia) arba reporterCompanyName.
 */
export async function getAllMyRecords(userId: string, companyName: string) {
  if (!adminDb) {
    return { success: false, error: 'Serverio konfigūracijos klaida.' };
  }

  if (!userId && !companyName) {
    return { success: false, error: 'Nenurodytas vartotojas arba įmonė.' };
  }

  try {
    // 1. Bandome gauti visus įmonės įrašus pagal pavadinimą
    let snapshot = await adminDb
      .collection('reports')
      .where('reporterCompanyName', '==', companyName)
      .get();

    // 2. Jei pagal įmonę nieko neradome, bandome pagal konkretų vartotoją (pateikėją)
    if (snapshot.empty && userId) {
      console.log(`[Export] No records found for company "${companyName}", trying by userId "${userId}"`);
      snapshot = await adminDb
        .collection('reports')
        .where('reporterId', '==', userId)
        .get();
    }

    if (snapshot.empty) {
      console.log(`[Export] Still no records found for user ${userId} / company ${companyName}`);
      return { success: true, data: [] };
    }

    const records = snapshot.docs.map((doc) => {
      const d = doc.data();
      
      // Saugi datos konversija
      let createdAtStr = '';
      if (d.createdAt instanceof Timestamp) {
        createdAtStr = d.createdAt.toDate().toISOString();
      } else if (d.createdAt && typeof d.createdAt === 'string') {
        createdAtStr = d.createdAt;
      } else {
        createdAtStr = new Date().toISOString();
      }

      return {
        id: doc.id,
        fullName: d.fullName || '',
        category: d.category || '',
        comment: d.comment || '',
        status: d.status || '',
        createdAt: createdAtStr,
        subjectCompany: d.subjectCompany || '',
      };
    });

    // Rūšiuojame atmintyje pagal datą (naujausi viršuje)
    records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { success: true, data: records };
  } catch (error: any) {
    console.error('Klaida eksportuojant įrašus:', error);
    return { success: false, error: error.message || 'Nepavyko gauti duomenų iš bazės.' };
  }
}
