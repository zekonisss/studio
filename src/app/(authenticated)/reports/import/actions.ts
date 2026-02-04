

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
  targetCompanyName: string,
  source: 'verified_company' | 'external_web'
) {
  console.log(`Receiving records: ${records.length}, Source: ${source}, Target: ${targetCompanyName}`);

  if (!adminUid || !adminDb || !adminAuth) {
    return { success: false, error: 'Serverio konfigūracijos klaida.' };
  }
  if (source === 'verified_company' && !targetCompanyName?.trim()) {
    return { success: false, error: 'Pasirinkus "Patvirtinta įmonė", pavadinimas yra privalomas.' };
  }

  try {
    const usersRef = adminDb.collection('users');
    let reportOwnerId: string;
    let finalCompanyName: string;

    if (source === 'verified_company') {
      const companyQuery = await usersRef.where('companyName', '==', targetCompanyName).where('role', '==', 'owner').limit(1).get();
       if (companyQuery.empty) {
            return { success: false, error: `Įmonė '${targetCompanyName}' nerasta. Patikrinkite pavadinimą.` };
       } else {
            const companyOwner = companyQuery.docs[0];
            reportOwnerId = companyOwner.id;
            finalCompanyName = companyOwner.data().companyName;
            console.log(`Found existing company '${finalCompanyName}' with owner ID ${reportOwnerId}`);
       }
    } else { // For 'external_web'
        finalCompanyName = targetCompanyName; // Usually 'DriverCheck (Viešas šaltinis)'
        const adminUser = await adminAuth.getUser(adminUid);
        reportOwnerId = adminUser.uid;
        console.log(`Using admin user ID ${reportOwnerId} for public source import.`);
    }

    const validRecords = records.filter(r => r.status === 'completed' && r.aiResult?.isValid);
    console.log(`Found ${validRecords.length} valid records to process.`);

    if (validRecords.length === 0) {
      return { success: true, created: 0, updated: 0 };
    }

    // Server-side deduplication
    const incomingFingerprints = validRecords.map(record => {
      return `${normalizeName(record.fullName)}|${new Date(record.createdAt).toISOString().split('T')[0]}`;
    });

    const existingFingerprints = new Set<string>();
    if (incomingFingerprints.length > 0) {
        // Chunk fingerprints because 'in' query has a limit of 30 items
        const fingerprintChunks = [];
        for (let i = 0; i < incomingFingerprints.length; i += 30) {
            fingerprintChunks.push(incomingFingerprints.slice(i, i + 30));
        }

        for (const chunk of fingerprintChunks) {
            if (chunk.length === 0) continue;
            const q = adminDb.collection('reports').where('fingerprint', 'in', chunk);
            const snapshot = await q.get();
            snapshot.forEach(doc => {
                const data = doc.data();
                // FIX: Only consider a record a duplicate if it's active or pending deletion.
                // Records marked as 'deleted' can be re-imported.
                if (data.fingerprint && (data.status === 'active' || data.status === 'pending_delete')) {
                    existingFingerprints.add(data.fingerprint);
                }
            });
        }
        console.log(`Found ${existingFingerprints.size} existing (active) fingerprints in the database.`);
    }


    const chunkSize = 450;
    let createdCount = 0;
    let updatedCount = 0; // Represents skipped duplicates

    for (let i = 0; i < validRecords.length; i += chunkSize) {
      const batch = adminDb.batch();
      const chunk = validRecords.slice(i, i + chunkSize);

      chunk.forEach((record) => {
        const fingerprint = `${normalizeName(record.fullName)}|${new Date(record.createdAt).toISOString().split('T')[0]}`;
        
        if (existingFingerprints.has(fingerprint)) {
            console.log('Skipping DB duplicate (active or pending):', fingerprint);
            updatedCount++;
            return;
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
          source: source,
          matchQuality: record.aiResult!.birthYear ? 'high' : 'low',
          fingerprint: fingerprint,
        });

        createdCount++;
      });

      await batch.commit();
      console.log(`Committed a chunk of ${chunk.length} records. Created in this chunk: ${createdCount}, Skipped: ${updatedCount}`);
    }

    return { success: true, created: createdCount, updated: updatedCount };

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
