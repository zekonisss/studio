'use server';

import { categorizeReport } from '@/ai/flows/categorize-report-flow';
import { addReport as addReportToDb } from '@/lib/storage';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Report } from '@/types';


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
        if (userData.reportCredits > 0) {
          transaction.update(userRef, { reportCredits: FieldValue.increment(-1) });
        } else {
          throw new Error("out_of_credits");
        }
      } else if (userData.paymentStatus !== 'active') {
          throw new Error("inactive_account");
      }
    });

    // If transaction is successful, add the report
    await addReportToDb(reportData);

    return { success: true };

  } catch (error: any) {
    console.error("Report creation / credit check transaction error:", error.message);
    if (error.message === 'out_of_credits') {
      return { success: false, error: 'Jūs išnaudojote nemokamų įrašų limitą.' };
    }
    if (error.message === 'inactive_account') {
        return { success: false, error: 'Jūsų paskyra neaktyvi.' };
    }
    return { success: false, error: "Nepavyko sukurti įrašo." };
  }
}
