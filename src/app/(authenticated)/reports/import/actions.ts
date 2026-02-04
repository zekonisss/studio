
'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { getCategoryNameForDisplay } from '@/lib/utils';
import { translationsMaster } from '@/lib/translations-master';
import crypto from 'crypto';
import type { ClientParsedRecord } from './page';
import { normalizeName } from '@/lib/driverHash';


export async function importAllReports(
  records: ClientParsedRecord[],
  adminUid: string,
  targetCompanyName: string
) {
  if (!adminUid || !adminDb || !adminAuth) {
    return { success: false, error: 'Serverio konfigūracijos klaida.' };
  }
  if (!targetCompanyName?.trim()) {
    return { success: false, error: 'Įmonės pavadinimas yra privalomas.' };
  }

  try {
    const usersRef = adminDb.collection('users');
    const companyQuery = await usersRef.where('companyName', '==', targetCompanyName).where('role', '==', 'owner').limit(1).get();
    
    let reportOwnerId: string;
    let finalCompanyName: string;

    if (companyQuery.empty) {
        const dummyEmail = `placeholder-${Date.now()}@drivercheck.lt`;
        const newAuthUser = await adminAuth.createUser({
            email: dummyEmail,
            password: crypto.randomBytes(20).toString('hex'),
            disabled: true,
        });
        reportOwnerId = newAuthUser.uid;
        finalCompanyName = targetCompanyName;

        const companyData = {
            name: finalCompanyName,
            ownerId: reportOwnerId,
            plan: 'imported',
            subscriptionStatus: 'inactive',
            createdAt: Timestamp.now(),
        };
        const newCompanyRef = await adminDb.collection('companies').add(companyData);

        const userData = {
            email: dummyEmail,
            companyId: newCompanyRef.id,
            companyName: finalCompanyName,
            contactPerson: `${finalCompanyName} (Importuota)`,
            role: 'owner',
            paymentStatus: 'inactive',
            isAdmin: false,
            createdAt: Timestamp.now(),
            registeredAt: Timestamp.now(),
        };
        await usersRef.doc(reportOwnerId).set(userData);

    } else {
        const companyOwner = companyQuery.docs[0];
        reportOwnerId = companyOwner.id;
        finalCompanyName = companyOwner.data().companyName;
    }

    const validRecords = records.filter(r => r.status === 'completed' && r.aiResult?.isValid);

    if (validRecords.length === 0) {
      return { success: true, importedCount: 0 };
    }

    // Server-side deduplication
    const incomingFingerprints = validRecords.map(record => {
      return `${normalizeName(record.fullName)}|${new Date(record.createdAt).toISOString().split('T')[0]}`;
    });

    const existingFingerprints = new Set<string>();
    if (incomingFingerprints.length > 0) {
        const q = adminDb.collection('reports').where('fingerprint', 'in', incomingFingerprints);
        const snapshot = await q.get();
        snapshot.forEach(doc => {
            if (doc.data().fingerprint) {
                existingFingerprints.add(doc.data().fingerprint);
            }
        });
    }

    const chunkSize = 450;
    let totalImported = 0;

    for (let i = 0; i < validRecords.length; i += chunkSize) {
      const batch = adminDb.batch();
      const chunk = validRecords.slice(i, i + chunkSize);

      chunk.forEach((record) => {
        const fingerprint = `${normalizeName(record.fullName)}|${new Date(record.createdAt).toISOString().split('T')[0]}`;
        
        if (existingFingerprints.has(fingerprint)) {
            return; // Skip duplicate
        }

        const docRef = adminDb.collection('reports').doc();
        
        batch.set(docRef, {
          fullName: record.fullName,
          comment: record.aiResult!.sanitizedText,
          birthYear: record.aiResult!.birthYear ? parseInt(record.aiResult!.birthYear, 10) : null,
          reporterId: reportOwnerId,
          reporterCompanyName: finalCompanyName,
          category: record.aiResult!.categoryId || 'other_category',
          tags: record.aiResult!.suggestedTags || [],
          createdAt: record.createdAt ? Timestamp.fromDate(new Date(record.createdAt)) : Timestamp.now(),
          status: 'active',
          statusUpdatedAt: Timestamp.now(),
          subjectCompany: record.company || '',
          // New fields
          source: 'external_web',
          matchQuality: record.aiResult!.birthYear ? 'high' : 'low',
          fingerprint: fingerprint,
        });

        totalImported++;
      });

      await batch.commit();
    }

    return { success: true, importedCount: totalImported };

  } catch (error: any) {
    console.error('Firestore batch error:', error);
    return { success: false, error: error.message || 'Nepavyko išsaugoti įrašų.' };
  }
}

export async function getAllReportsForExport(companyName: string) {
  if (!adminDb) return [];

  const snapshot = await adminDb
    .collection('reports')
    .where('reporterCompanyName', '==', companyName)
    .orderBy('createdAt', 'desc')
    .get();

  if (snapshot.empty) return [];

  const tForServer = (key: string): string => {
    const translationsForKey = translationsMaster[key];
    if (!translationsForKey) return key;
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
