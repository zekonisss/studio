'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Gauna visus prisijungusios įmonės vairuotojų įrašus iš „Firestore“.
 * @param companyName Įmonės pavadinimas, pagal kurį filtruojami įrašai.
 */
export async function getAllMyRecords(companyName: string) {
  if (!adminDb || !companyName) {
    return { success: false, error: 'Serverio konfigūracijos klaida arba nenurodyta įmonė.' };
  }

  try {
    const snapshot = await adminDb
      .collection('reports')
      .where('reporterCompanyName', '==', companyName)
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      return { success: true, data: [] };
    }

    const records = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        fullName: d.fullName || '',
        category: d.category || '',
        comment: d.comment || '',
        status: d.status || '',
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : d.createdAt,
        subjectCompany: d.subjectCompany || '',
      };
    });

    return { success: true, data: records };
  } catch (error: any) {
    console.error('Klaida eksportuojant įrašus:', error);
    return { success: false, error: error.message || 'Nepavyko gauti duomenų iš bazės.' };
  }
}
