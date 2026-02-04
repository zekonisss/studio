'use server';

import { categorizeReport } from '@/ai/flows/categorize-report-flow';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Report } from '@/types';
import { migrateTagIfNeeded } from '@/lib/utils';


export async function categorizeReportAction(comment: string) {
  return categorizeReport({ comment });
}

export async function addReportWithCreditCheck(
  reportData: Omit<Report, 'id' | 'status' | 'statusUpdatedAt' | 'createdAt' | 'deletedAt'>,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  
  if (!adminDb || !userId) {
    return { success: false, error: "Serverio konfigūracijos klaida." };
  }

  const userRef = adminDb.collection('users').doc(userId);

  try {
    await adminDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error("Vartotojas nerastas.");
      }
      const userData = userDoc.data()!;

      if (userData.paymentStatus === 'trial') {
        const reportCredits = userData.reportCredits || 0;
        if (reportCredits > 0) {
          transaction.update(userRef, { reportCredits: FieldValue.increment(-1) });
        } else {
          throw new Error("out_of_credits");
        }
      } else if (userData.paymentStatus !== 'active' && !userData.isAdmin) {
          throw new Error("inactive_account");
      }

      const newReportRef = adminDb.collection('reports').doc();
      const finalReportData = {
          ...reportData,
          source: 'verified_company', // Set the source for manual entries
          tags: Array.isArray(reportData.tags) ? reportData.tags.map(migrateTagIfNeeded) : [],
          createdAt: Timestamp.now(),
          status: 'active',
          statusUpdatedAt: Timestamp.now(),
      };
      transaction.set(newReportRef, finalReportData);
    });
    
    return { success: true };

  } catch (error: any) {
    console.error("Report creation / credit check transaction error:", error);
    let errorMessage = "Nepavyko sukurti įrašo.";
    if (error.message === 'out_of_credits') {
      errorMessage = 'Jūs išnaudojote nemokamų įrašų limitą.';
    }
    if (error.message === 'inactive_account') {
        errorMessage = 'Jūsų paskyra neaktyvi.';
    }
    return { success: false, error: errorMessage };
  }
}
