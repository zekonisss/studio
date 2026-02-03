'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { detailedReportCategories } from '@/lib/constants';
import { Timestamp } from 'firebase-admin/firestore';
import { getCategoryNameForDisplay } from '@/lib/utils';
import { categorizeReport } from '@/ai/flows/categorize-report-flow';
import { translationsMaster } from '@/lib/translations-master';
import crypto from 'crypto';


// PAGRINDINĖ TAISYKLĖ: Tik 'async function' gali būti eksportuojamos šiame faile.
// Visi pagalbiniai kintamieji turi būti funkcijų viduje arba kituose failuose.

export async function categorizeReportAction(comment: string) {
  return categorizeReport({ comment });
}

export async function importAllReports(
  reports: any[],
  adminUid: string,
  targetCompanyName: string
) {
  if (!adminUid || !adminDb || !adminAuth) {
    return {
      success: false,
      error: 'Serverio konfigūracijos klaida (Admin SDK nepasiekiamas).',
    };
  }
   if (!targetCompanyName?.trim()) {
      return { success: false, error: 'Įmonės pavadinimas yra privalomas.' };
  }


  try {
    // Step 1: Find or create the target company and its owner
    const companiesRef = adminDb.collection('companies');
    const companyQuery = await companiesRef.where('name', '==', targetCompanyName).limit(1).get();
    
    let reportOwnerId: string;
    
    if (companyQuery.empty) {
        // Company doesn't exist, create a new one with a placeholder owner
        const dummyEmail = `placeholder-${Date.now()}@drivercheck.lt`;
        const newAuthUser = await adminAuth.createUser({
            email: dummyEmail,
            password: crypto.randomBytes(20).toString('hex'),
            disabled: true, // This account should not be used for login
        });
        reportOwnerId = newAuthUser.uid;

        const companyData = {
            name: targetCompanyName,
            ownerId: reportOwnerId,
            plan: 'imported',
            subscriptionStatus: 'inactive',
            createdAt: Timestamp.now(),
        };
        const newCompanyRef = await companiesRef.add(companyData);

        const userData = {
            email: dummyEmail,
            companyId: newCompanyRef.id,
            companyName: targetCompanyName,
            fullName: `${targetCompanyName} (Imported)`,
            contactPerson: `${targetCompanyName} (Imported)`,
            role: 'owner',
            paymentStatus: 'inactive',
            isAdmin: false,
            createdAt: Timestamp.now(),
            registeredAt: Timestamp.now(),
        };
        await adminDb.collection('users').doc(reportOwnerId).set(userData);

    } else {
        // Company exists, use its owner
        reportOwnerId = companyQuery.docs[0].data().ownerId;
    }

    // Step 2: Batch import the reports
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
          reporterId: reportOwnerId,
          reporterCompanyName: targetCompanyName,
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
