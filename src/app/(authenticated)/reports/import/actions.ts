'use server';

import { adminDb } from '@/lib/firebase-admin';
import { detailedReportCategories } from '@/lib/constants';
import { Timestamp } from 'firebase-admin/firestore';
import { getCategoryNameForDisplay } from '@/lib/utils';
import { categorizeReport } from '@/ai/flows/categorize-report-flow';
import { translationsMaster } from '@/lib/translations-master';

// PAGRINDINĖ TAISYKLĖ: Tik 'async function' gali būti eksportuojamos šiame faile.
// Visi pagalbiniai kintamieji turi būti funkcijų viduje arba kituose failuose.

export async function categorizeReportAction(comment: string) {
  return categorizeReport({ comment });
}

export async function importAllReports(
  reports: any[],
  adminUid: string,
  adminCompanyName: string
) {
  if (!adminUid || !adminDb) {
    return {
      success: false,
      error: 'Serverio konfigūracijos klaida (Admin SDK nepasiekiamas).',
    };
  }

  try {
    const chunkSize = 450;
    let totalImported = 0;

    for (let i = 0; i < reports.length; i += chunkSize) {
      const batch = adminDb.batch();
      const chunk = reports.slice(i, i + chunkSize);

      chunk.forEach((report) => {
        const docRef = adminDb.collection('reports').doc();

        batch.set(docRef, {
          fullName: report.fullName || 'Nežinomas',
          comment: report.comment || '',
          reporterId: adminUid,
          reporterCompanyName: adminCompanyName,
          category: report.aiCategory || 'other_category',
          tags: report.aiTags || [],
          createdAt: report.createdAt ? Timestamp.fromDate(new Date(report.createdAt)) : Timestamp.now(),
          status: 'active',
          statusUpdatedAt: Timestamp.now(),
          subjectCompany: report.company || '',
        });
      });

      await batch.commit();
      totalImported += chunk.length;
    }

    return { success: true, importedCount: totalImported };
  } catch (error: any) {
    console.error('Firestore batch error:', error);
    return {
      success: false,
      error: error.message || 'Nepavyko išsaugoti įrašų.',
    };
  }
}

export async function getAllReportsForExport(companyName: string) {
  if (!adminDb) return [];

  const snapshot = await adminDb
    .collection('reports')
    .where('reporterCompanyName', '==', companyName)
    .orderBy('createdAt', 'desc')
    .get();

  if (snapshot.empty) {
    return [];
  }

  // PATAISYMAS: Sukurta teisinga server-side vertimo funkcija
  const tForServer = (key: string): string => {
    const translationsForKey = translationsMaster[key];
    if (!translationsForKey) {
      return key;
    }
    // Eksportui naudojame lietuvišką vertimą kaip numatytąjį
    return translationsForKey['lt'] ?? key;
  };

  return snapshot.docs.map((doc) => {
    const d = doc.data();
    
    let createdAtString = '';
    if (d.createdAt && typeof d.createdAt.toDate === 'function') {
        createdAtString = d.createdAt.toDate().toLocaleString('lt-LT');
    }

    return {
      'Vairuotojas': d.fullName,
      'Susijusi Įmonė': d.subjectCompany || '',
      'Komentaras': d.comment,
      'Kategorija': getCategoryNameForDisplay(d.category, tForServer as any),
      'Žymos': (d.tags || []).join(', '),
      'Pateikimo Data': createdAtString,
      'Dokumento ID': doc.id,
    };
  });
}
