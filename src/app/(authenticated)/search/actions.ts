'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { buildDriverHash, normalizeName } from '@/lib/driverHash';

export async function logSearchActivity({
  firstName,
  lastName,
  userId,
}: {
  firstName: string;
  lastName: string;
  userId: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!adminDb || !userId) {
    return { success: false, error: "Serverio konfigūracijos klaida." };
  }

  const driverHash = buildDriverHash(firstName, lastName);
  if (!driverHash) return { success: true }; // Don't log empty searches

  const userRef = adminDb.collection('users').doc(userId);
  const searchLogRef = adminDb.collection('searchLogs').doc();

  try {
    await adminDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error("Vartotojas nerastas.");
      }
      const userData = userDoc.data()!;

      if (userData.paymentStatus === 'trial') {
        if (userData.searchCredits > 0) {
          transaction.update(userRef, { searchCredits: FieldValue.increment(-1) });
        } else {
          throw new Error("out_of_credits");
        }
      }
      
      transaction.set(searchLogRef, {
        userId: userId,
        driverHash: driverHash,
        firstName: normalizeName(firstName),
        lastName: normalizeName(lastName),
        timestamp: Timestamp.now(),
      });
    });
    return { success: true };
  } catch (error: any) {
    console.error("Search log/credit transaction error:", error.message);
    if (error.message === 'out_of_credits') {
      return { success: false, error: 'out_of_credits' };
    }
    return { success: false, error: "Nepavyko užfiksuoti paieškos." };
  }
}


export async function getDriverSearchStats(
  firstName: string,
  lastName: string
): Promise<{ total: number; recent: number }> {
  
  if (!adminDb) {
    console.error("🔴 ADMIN DB NOT INITIALIZED! Check .env.local and restart the server.");
    return { total: 0, recent: 0 };
  }

  const driverHash = buildDriverHash(firstName, lastName);

  if (!driverHash) {
    console.warn("🟡 driverHash is empty. Returning 0.");
    return { total: 0, recent: 0 };
  }
  
  const logsRef = adminDb.collection('searchLogs');
  const query = logsRef.where('driverHash', '==', driverHash).orderBy('timestamp', 'desc');
  
  try {
    const snapshot = await query.get();

    if (snapshot.empty) {
        return { total: 0, recent: 0 };
    }

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const totalUniqueUserIds = new Set<string>();
    const recentUniqueUserIds = new Set<string>();

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId && data.timestamp) {
            const userId = data.userId;
            const timestamp = data.timestamp.toDate();

            totalUniqueUserIds.add(userId);

            if (timestamp >= sixtyDaysAgo) {
                recentUniqueUserIds.add(userId);
            }
        }
    });
    
    const total = totalUniqueUserIds.size;
    const recent = recentUniqueUserIds.size;

    return { total, recent };
  } catch (error) {
      console.error("Klaida gaunant vairuotojo statistiką:", error);
      return { total: 0, recent: 0 };
  }
}
